import crypto from "crypto";
import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import twilio from "twilio";
import webPush from "web-push";
import {
  createTelephonyConfig,
  createTelephonyService,
  createVoiceAlertTwiml,
  validateTwilioWebhook,
} from "./telephony.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 5000);
const DEFAULT_ALLOWED_ORIGINS = [
  "https://knight.danangtoiiu.live",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const sendPushSecret = process.env.SEND_PUSH_SECRET || "";
const subscriptionsFile = process.env.PUSH_SUBSCRIPTIONS_FILE || path.join(__dirname, "push-subscriptions.json");
const vapidKeysFile = process.env.VAPID_KEYS_FILE || path.join(__dirname, "vapid-keys.local.json");

let clients = [];
let lastAuditCount = 0;
let lastState = "";
let autoTriggerTimer = null;
let alertTriggered = false;
let subscriptions = new Map();
let currentIncident = null;
let incidentSequence = 0;
let mockVoiceStatusTimer = null;

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgBlue: "\x1b[44m",
};

function loadVapidKeys() {
  const configuredPublicKey = process.env.VAPID_PUBLIC_KEY;
  const configuredPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (configuredPublicKey && configuredPrivateKey) {
    return {
      source: "environment",
      publicKey: configuredPublicKey,
      privateKey: configuredPrivateKey,
    };
  }

  if (fs.existsSync(vapidKeysFile)) {
    try {
      const keys = JSON.parse(fs.readFileSync(vapidKeysFile, "utf8"));
      if (keys.publicKey && keys.privateKey) {
        return {
          source: "local file",
          publicKey: keys.publicKey,
          privateKey: keys.privateKey,
        };
      }
    } catch (error) {
      logSystem(`Could not read local VAPID keys: ${error.message}`);
    }
  }

  const keys = webPush.generateVAPIDKeys();
  fs.writeFileSync(vapidKeysFile, JSON.stringify(keys, null, 2), "utf8");

  return {
    source: "generated local file",
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };
}

const vapidKeys = loadVapidKeys();
const vapidPublicKey = vapidKeys.publicKey;
const vapidPrivateKey = vapidKeys.privateKey;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:knight-demo@example.com";

webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

let telephonyConfig;
let telephonyService;

try {
  telephonyConfig = createTelephonyConfig(process.env);
  const twilioClient =
    telephonyConfig.mode === "live" ? twilio(telephonyConfig.accountSid, telephonyConfig.authToken) : null;
  telephonyService = createTelephonyService(telephonyConfig, { client: twilioClient, log: logSystem });
} catch (error) {
  logSystem(`Live telephony disabled: ${error.message}`);
  telephonyConfig = createTelephonyConfig({
    TELEPHONY_MODE: "mock",
    HIGH_RISK_CALL_DELAY_MS: process.env.HIGH_RISK_CALL_DELAY_MS,
  });
  telephonyService = createTelephonyService(telephonyConfig, { log: logSystem });
}

function logSystem(msg) {
  console.log(`${COLORS.gray}[SYSTEM] ${msg}${COLORS.reset}`);
}

function logAlert(msg) {
  console.log(`${COLORS.red}${COLORS.bold}[ALERT] ${msg}${COLORS.reset}`);
}

function logObserve(actor, label, reason, policy) {
  const policyStr = policy ? ` [${policy}]` : "";
  console.log(`${COLORS.cyan}[OBSERVE]${policyStr} ${actor}: ${label} -> ${COLORS.gray}${reason}${COLORS.reset}`);
}

function logReason(actor, label, reason, policy) {
  const policyStr = policy ? ` [${policy}]` : "";
  console.log(`${COLORS.yellow}[REASON]${policyStr} ${actor}: ${label} -> ${COLORS.gray}${reason}${COLORS.reset}`);
}

function logAct(actor, label, reason, policy) {
  const policyStr = policy ? ` [${policy}]` : "";
  console.log(`${COLORS.green}[ACT]${policyStr} ${actor}: ${label} -> ${COLORS.gray}${reason}${COLORS.reset}`);
}

function broadcast(data) {
  const payload = JSON.stringify(data);
  clients.forEach((res) => {
    res.write(`data: ${payload}\n\n`);
  });
}

function isValidSubscription(subscription) {
  return Boolean(
    subscription &&
      typeof subscription.endpoint === "string" &&
      subscription.endpoint.length > 0 &&
      subscription.keys &&
      typeof subscription.keys.auth === "string" &&
      typeof subscription.keys.p256dh === "string",
  );
}

function loadSubscriptions() {
  if (!fs.existsSync(subscriptionsFile)) {
    return;
  }

  try {
    const raw = fs.readFileSync(subscriptionsFile, "utf8");
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed) ? parsed : Object.values(parsed);

    subscriptions = new Map();
    entries.forEach((subscription) => {
      if (isValidSubscription(subscription)) {
        subscriptions.set(subscription.endpoint, subscription);
      }
    });
  } catch (error) {
    logSystem(`Could not load push subscriptions: ${error.message}`);
  }
}

function saveSubscriptions() {
  try {
    const tmpFile = `${subscriptionsFile}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify([...subscriptions.values()], null, 2), "utf8");
    fs.renameSync(tmpFile, subscriptionsFile);
  } catch (error) {
    logSystem(`Could not save push subscriptions: ${error.message}`);
  }
}

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

function resolveCorsOrigin(req) {
  const origin = req.headers.origin;

  if (!origin) {
    return allowedOrigins[0] || "*";
  }

  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
    return origin;
  }

  return "";
}

function applyCors(req, res) {
  const corsOrigin = resolveCorsOrigin(req);

  if (!corsOrigin) {
    return false;
  }

  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Vary", "Origin");
  return true;
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function sendXml(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "text/xml; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(data);
}

function readText(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
      if (Buffer.byteLength(body) > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function readJson(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
      if (Buffer.byteLength(body) > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

async function readForm(req) {
  const body = await readText(req, 64 * 1024);
  const params = new URLSearchParams(body);
  return Object.fromEntries(params.entries());
}

function tokenMatches(authorizationHeader) {
  if (!sendPushSecret) {
    return false;
  }

  const expected = `Bearer ${sendPushSecret}`;
  const actualBuffer = Buffer.from(authorizationHeader || "");
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

async function sendPushToAll(alert = {}) {
  const title = alert.title || "CANH BAO KHAN TU KNIGHT";
  const body = alert.message || alert.body || "Phat hien giao dich bat thuong. The so da duoc tam khoa.";
  const navigateUrl = alert.url || "/?alert=1";
  const payload = JSON.stringify({
    title,
    body,
    url: navigateUrl,
    tag: "knight-critical-alert",
    icon: "/knight-shield.svg",
    badge: "/knight-shield.svg",
  });

  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const [endpoint, subscription] of subscriptions) {
    try {
      await webPush.sendNotification(subscription, payload, {
        TTL: 60,
        urgency: "high",
        topic: "knight-alert",
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      const statusCode = Number(error?.statusCode || error?.status || 0);

      if (statusCode === 404 || statusCode === 410) {
        subscriptions.delete(endpoint);
        removed += 1;
      } else {
        logSystem(
          `Push send failed: status=${statusCode || "unknown"} message=${error.message || error} body=${error.body || ""}`,
        );
      }
    }
  }

  if (removed > 0) {
    saveSubscriptions();
  }

  if (subscriptions.size === 0) {
    logSystem("No push subscriptions yet. Open the PWA on iPhone and enable Push first.");
  } else {
    logSystem(`Push result: sent=${sent}, failed=${failed}, removed=${removed}`);
  }

  return {
    total: subscriptions.size + removed,
    sent,
    failed,
    removed,
  };
}

function createIncidentId() {
  incidentSequence += 1;
  return `INC-${Date.now()}-${incidentSequence}`;
}

function clearIncidentTimer(incident) {
  if (incident?.callTimer) {
    clearTimeout(incident.callTimer);
    incident.callTimer = null;
  }

  if (mockVoiceStatusTimer) {
    clearTimeout(mockVoiceStatusTimer);
    mockVoiceStatusTimer = null;
  }
}

function broadcastIncidentEvents(incidentId, events) {
  broadcast({ type: "trigger", incidentId, events });
}

async function placeIncidentVoiceCall(incidentId) {
  const incident = currentIncident;

  if (!incident || incident.id !== incidentId || incident.cancelled) {
    return;
  }

  clearIncidentTimer(incident);

  try {
    const result = await telephonyService.placeVoiceAlertCall({ incidentId });
    incident.callSid = result.sid;
    incident.callPlaced = true;
    logSystem(`Voice alert placed: mode=${result.mode}, sid=${result.sid}, to=${result.toMasked}`);
    broadcastIncidentEvents(incidentId, ["CUSTOMER_RESPONSE_TIMEOUT", "VOICE_CALL_PLACED"]);

    if (telephonyConfig.mode === "mock") {
      mockVoiceStatusTimer = setTimeout(() => {
        logSystem(`Mock telephony: auto no-answer for incident ${incidentId}.`);
        void handleIncidentVoiceStatus(incidentId, "no-answer");
      }, 3000);
    }
  } catch (error) {
    logSystem(`Voice alert failed for incident ${incidentId}: ${error.message || error}`);
  }
}

async function startHighRiskIncident(source = "manual") {
  if (alertTriggered && currentIncident && !currentIncident.cancelled) {
    logSystem("Risk alert was already triggered. Press R to reset before sending again.");
    return {
      started: false,
      incidentId: currentIncident.id,
      reason: "already_running",
    };
  }

  if (autoTriggerTimer) {
    clearTimeout(autoTriggerTimer);
    autoTriggerTimer = null;
  }

  const incident = {
    id: createIncidentId(),
    source,
    cancelled: false,
    callTimer: null,
    callPlaced: false,
    callAnswered: false,
    noAnswerHandled: false,
    callSid: "",
  };

  currentIncident = incident;
  alertTriggered = true;

  logAlert("Triggering high-risk incident: Web Push now, voice call fallback after delay, SMS only on no-answer.");
  broadcastIncidentEvents(incident.id, ["RISK_EVENT_RECEIVED", "AUTO_SUSPEND_ALLOWED", "PUSH_SENT"]);
  const pushResult = await sendPushToAll();

  incident.callTimer = setTimeout(() => {
    void placeIncidentVoiceCall(incident.id);
  }, telephonyConfig.callDelayMs);

  logSystem(`Voice fallback scheduled in ${telephonyConfig.callDelayMs}ms for incident ${incident.id}.`);

  return {
    started: true,
    incidentId: incident.id,
    callDelayMs: telephonyConfig.callDelayMs,
    telephonyMode: telephonyConfig.mode,
    push: pushResult,
  };
}

function triggerAlert() {
  void startHighRiskIncident("terminal");
}

function cancelCurrentIncident(reason = "customer_response") {
  if (!currentIncident || currentIncident.cancelled) {
    return { cancelled: false, reason: "no_active_incident" };
  }

  clearIncidentTimer(currentIncident);
  currentIncident.cancelled = true;
  currentIncident.cancelReason = reason;
  logSystem(`Cancelled pending incident escalation: incident=${currentIncident.id}, reason=${reason}`);

  return {
    cancelled: true,
    incidentId: currentIncident.id,
    reason,
  };
}

async function handleIncidentVoiceStatus(incidentId, callStatus) {
  const incident = currentIncident;

  if (!incidentId || !incident || incident.id !== incidentId || incident.cancelled) {
    return { ignored: true, reason: "incident_not_active" };
  }

  if (telephonyService.isAnsweredStatus(callStatus)) {
    if (!incident.callAnswered) {
      incident.callAnswered = true;
      broadcastIncidentEvents(incidentId, ["VOICE_CALL_ANSWERED"]);
    }
    return { ignored: true, answered: true };
  }

  if (!telephonyService.isNoAnswerStatus(callStatus)) {
    return { ignored: true, reason: "status_not_terminal_no_answer" };
  }

  if (incident.noAnswerHandled) {
    return { ignored: true, reason: "duplicate_no_answer" };
  }

  incident.noAnswerHandled = true;
  const result = await telephonyService.handleVoiceStatus({ incidentId, callStatus });

  if (result.smsSent) {
    broadcastIncidentEvents(incidentId, ["VOICE_CALL_NO_ANSWER", "SMS_SENT", "ESCALATE_FRAUD_OPS", "KEEP_CARD_SUSPENDED"]);
  }

  return result;
}

function triggerReset() {
  alertTriggered = false;
  lastAuditCount = 0;
  lastState = "";
  if (currentIncident) {
    clearIncidentTimer(currentIncident);
    currentIncident = null;
  }
  if (autoTriggerTimer) {
    clearTimeout(autoTriggerTimer);
    autoTriggerTimer = null;
  }
  logSystem("Sending reset signal to connected app clients...");
  broadcast({ type: "trigger", events: ["RESET_SCENARIO"] });
}

loadSubscriptions();

const server = http.createServer(async (req, res) => {
  if (!applyCors(req, res)) {
    sendJson(res, 403, { error: "Origin not allowed" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || "/", "http://localhost");

  if (requestUrl.pathname === "/health" && req.method === "GET") {
    sendJson(res, 200, {
      status: "ok",
      subscriptions: subscriptions.size,
    });
    return;
  }

  if (requestUrl.pathname === "/api/lan-ip" && req.method === "GET") {
    sendJson(res, 200, { ip: getLanIp() });
    return;
  }

  if (requestUrl.pathname === "/api/push/public-key" && req.method === "GET") {
    sendJson(res, 200, { publicKey: vapidPublicKey });
    return;
  }

  if (requestUrl.pathname === "/api/push/subscribe" && req.method === "POST") {
    try {
      const subscription = await readJson(req);

      if (!isValidSubscription(subscription)) {
        sendJson(res, 400, { error: "Invalid push subscription" });
        return;
      }

      subscriptions.set(subscription.endpoint, subscription);
      saveSubscriptions();
      logSystem(`Saved push subscription. Total subscriptions: ${subscriptions.size}`);
      sendJson(res, 200, { success: true, total: subscriptions.size });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Invalid request" });
    }
    return;
  }

  if (requestUrl.pathname === "/api/push/unsubscribe" && req.method === "POST") {
    try {
      const payload = await readJson(req);
      const endpoint = typeof payload.endpoint === "string" ? payload.endpoint : "";

      if (!endpoint) {
        sendJson(res, 400, { error: "Missing subscription endpoint" });
        return;
      }

      const deleted = subscriptions.delete(endpoint);
      if (deleted) {
        saveSubscriptions();
      }
      logSystem(`Removed push subscription: ${deleted ? "yes" : "not found"}. Total subscriptions: ${subscriptions.size}`);
      sendJson(res, 200, { success: true, deleted, total: subscriptions.size });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Invalid request" });
    }
    return;
  }

  if (requestUrl.pathname === "/api/incidents/high-risk" && req.method === "POST") {
    if (!sendPushSecret) {
      sendJson(res, 503, { error: "SEND_PUSH_SECRET is not configured" });
      return;
    }

    if (!tokenMatches(req.headers.authorization)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const result = await startHighRiskIncident("api");
      sendJson(res, 200, { success: true, ...result });
    } catch (error) {
      sendJson(res, 500, { error: error.message || "Could not start incident" });
    }
    return;
  }

  if (requestUrl.pathname === "/api/incidents/current/cancel" && req.method === "POST") {
    try {
      const payload = await readJson(req);
      const reason = typeof payload.reason === "string" && payload.reason ? payload.reason : "customer_response";
      const result = cancelCurrentIncident(reason);
      sendJson(res, 200, { success: true, ...result });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Invalid request" });
    }
    return;
  }

  if (requestUrl.pathname === "/api/push/send" && req.method === "POST") {
    if (!sendPushSecret) {
      sendJson(res, 503, { error: "SEND_PUSH_SECRET is not configured" });
      return;
    }

    if (!tokenMatches(req.headers.authorization)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const payload = await readJson(req);
      const result = await sendPushToAll(payload);
      sendJson(res, 200, { success: true, ...result });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Invalid request" });
    }
    return;
  }

  if (requestUrl.pathname === "/api/twilio/voice-alert" && (req.method === "POST" || req.method === "GET")) {
    sendXml(res, 200, createVoiceAlertTwiml());
    return;
  }

  if (requestUrl.pathname === "/api/twilio/voice-status" && req.method === "POST") {
    try {
      const params = await readForm(req);
      const incidentId = requestUrl.searchParams.get("incidentId") || params.incidentId || "";
      const callbackUrl = `${telephonyConfig.webhookBaseUrl}${requestUrl.pathname}${requestUrl.search}`;
      const signature = String(req.headers["x-twilio-signature"] || "");

      if (
        telephonyConfig.mode === "live" &&
        !validateTwilioWebhook({
          authToken: telephonyConfig.authToken,
          signature,
          url: callbackUrl,
          params,
          validateRequest: twilio.validateRequest,
        })
      ) {
        sendJson(res, 403, { error: "Invalid Twilio signature" });
        return;
      }

      const result = await handleIncidentVoiceStatus(incidentId, params.CallStatus || params.CallStatusCallbackEvent);
      sendJson(res, 200, { success: true, ...result });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Invalid Twilio callback" });
    }
    return;
  }

  if (requestUrl.pathname === "/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
    clients.push(res);
    logSystem(`Mobile app connected. Clients: ${clients.length}`);

    lastAuditCount = 0;
    lastState = "";

    if (!alertTriggered && clients.length === 1) {
      logSystem("Auto-triggering risk alert after 2.5 seconds...");
      autoTriggerTimer = setTimeout(() => {
        logSystem("Auto-trigger timeout reached.");
        triggerAlert();
      }, 2500);
    }

    req.on("close", () => {
      clients = clients.filter((client) => client !== res);
      logSystem(`Mobile app disconnected. Clients: ${clients.length}`);
      if (clients.length === 0) {
        alertTriggered = false;
        if (autoTriggerTimer) {
          clearTimeout(autoTriggerTimer);
          autoTriggerTimer = null;
        }
      }
    });
    return;
  }

  if (requestUrl.pathname === "/api/report-state" && req.method === "POST") {
    try {
      const payload = await readJson(req);
      const { currentState, auditEvents } = payload;

      if (currentState !== lastState) {
        console.log(`${COLORS.gray}[STATE] UI state:${COLORS.reset} ${COLORS.bold}${currentState}${COLORS.reset}`);
        lastState = currentState;
      }

      if (auditEvents && auditEvents.length > lastAuditCount) {
        const newEvents = auditEvents.slice(lastAuditCount);
        newEvents.forEach((evt) => {
          if (evt.phase === "OBSERVE") {
            logObserve(evt.actor, evt.label || evt.action, evt.reason, evt.policyLevel);
          } else if (evt.phase === "REASON") {
            logReason(evt.actor, evt.label || evt.action, evt.reason, evt.policyLevel);
          } else if (evt.phase === "ACT") {
            logAct(evt.actor, evt.label || evt.action, evt.reason, evt.policyLevel);
          }
        });
        lastAuditCount = auditEvents.length;
      }

      if (currentState === "idle_monitoring") {
        lastAuditCount = 0;
        alertTriggered = false;
      }

      sendJson(res, 200, { status: "ok" });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Invalid JSON" });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.clear();
  console.log(`\n${COLORS.bgBlue}============================================================${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}       CO-OPBANK KNIGHT SECURITY ENGINE - ACTIVE SHIELD     ${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}============================================================${COLORS.reset}\n`);
  console.log(`${COLORS.bold}Server:${COLORS.reset} http://localhost:${PORT}`);
  console.log(`${COLORS.bold}LAN:${COLORS.reset}    http://${getLanIp()}:${PORT}`);
  console.log(`${COLORS.bold}Push:${COLORS.reset}   ${subscriptions.size} subscription(s) loaded`);
  console.log(`${COLORS.bold}Phone:${COLORS.reset}  ${telephonyConfig.mode} mode, fallback delay ${telephonyConfig.callDelayMs}ms`);
  logSystem(`VAPID keys loaded from ${vapidKeys.source}. Public key: ${vapidPublicKey}`);
  if (!sendPushSecret) {
    logSystem("SEND_PUSH_SECRET is not set. /api/push/send is disabled, but terminal hotkeys still work.");
  }
  console.log(`${COLORS.bold}Keys:${COLORS.reset}`);
  console.log(`  [Space] / [Enter] / [S] : Trigger high-risk alert, Web Push, voice fallback, SMS no-answer`);
  console.log(`  [R]                     : Reset app state`);
  console.log(`  [Q]                     : Quit server`);
  console.log("\n------------------------------------------------------------\n");
  logSystem("Waiting for deployed frontend or mobile PWA to connect...");
});

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
process.stdin.on("keypress", (_str, key) => {
  if (key.ctrl && key.name === "c") {
    process.exit();
  }

  const keyName = key.name || "";
  if (keyName === "s" || keyName === "space" || keyName === "return") {
    triggerAlert();
  } else if (keyName === "r") {
    triggerReset();
  } else if (keyName === "q") {
    process.exit();
  }
});
