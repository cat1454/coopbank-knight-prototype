import crypto from "crypto";
import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import webPush from "web-push";

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

function triggerAlert() {
  if (alertTriggered) {
    logSystem("Risk alert was already triggered. Press R to reset before sending again.");
    return;
  }

  if (autoTriggerTimer) {
    clearTimeout(autoTriggerTimer);
    autoTriggerTimer = null;
  }

  alertTriggered = true;
  logAlert("Triggering risk alert to mobile app and iPhone push subscriptions.");
  broadcast({ type: "trigger", events: ["RISK_EVENT_RECEIVED"] });
  void sendPushToAll();
}

function triggerReset() {
  alertTriggered = false;
  lastAuditCount = 0;
  lastState = "";
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
  logSystem(`VAPID keys loaded from ${vapidKeys.source}. Public key: ${vapidPublicKey}`);
  if (!sendPushSecret) {
    logSystem("SEND_PUSH_SECRET is not set. /api/push/send is disabled, but terminal hotkeys still work.");
  }
  console.log(`${COLORS.bold}Keys:${COLORS.reset}`);
  console.log(`  [Space] / [Enter] / [S] : Trigger risk alert and Web Push`);
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
