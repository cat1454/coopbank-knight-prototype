const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const DEFAULT_MOCK_RECIPIENT = "+84901234567";
const NO_ANSWER_STATUSES = new Set(["no-answer", "busy", "failed", "canceled"]);
const ANSWERED_STATUSES = new Set(["answered", "in-progress"]);

export function isE164PhoneNumber(value) {
  return typeof value === "string" && E164_PATTERN.test(value.trim());
}

export function maskPhoneNumber(value) {
  if (!isE164PhoneNumber(value)) {
    return "[invalid phone]";
  }

  const phone = value.trim();
  return `${phone.slice(0, 4)}****${phone.slice(-4)}`;
}

function clampCallDelay(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 5000;
  }

  return Math.min(5000, Math.max(3000, Math.trunc(parsed)));
}

function parseAllowlist(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function stripTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function createTelephonyConfig(env = process.env) {
  const mode = env.TELEPHONY_MODE === "live" ? "live" : "mock";
  const fromNumber = String(env.TWILIO_FROM_NUMBER || "").trim();
  const recipientNumber = String(env.KNIGHT_DEMO_CUSTOMER_PHONE_E164 || (mode === "mock" ? DEFAULT_MOCK_RECIPIENT : "")).trim();
  const webhookBaseUrl = stripTrailingSlash(env.TWILIO_WEBHOOK_BASE_URL);

  const config = {
    mode,
    callDelayMs: clampCallDelay(env.HIGH_RISK_CALL_DELAY_MS),
    accountSid: String(env.TWILIO_ACCOUNT_SID || "").trim(),
    authToken: String(env.TWILIO_AUTH_TOKEN || "").trim(),
    fromNumber,
    allowedToNumbers: parseAllowlist(env.TWILIO_ALLOWED_TO_NUMBERS),
    recipientNumber,
    webhookBaseUrl,
  };

  if (mode === "live") {
    const missing = [];

    if (!config.accountSid) missing.push("TWILIO_ACCOUNT_SID");
    if (!config.authToken) missing.push("TWILIO_AUTH_TOKEN");
    if (!config.fromNumber) missing.push("TWILIO_FROM_NUMBER");
    if (!config.recipientNumber) missing.push("KNIGHT_DEMO_CUSTOMER_PHONE_E164");
    if (!config.webhookBaseUrl) missing.push("TWILIO_WEBHOOK_BASE_URL");

    if (missing.length > 0) {
      throw new Error(`Missing live telephony env: ${missing.join(", ")}`);
    }

    if (!isE164PhoneNumber(config.fromNumber)) {
      throw new Error("TWILIO_FROM_NUMBER must be E.164, for example +15551234567");
    }

    if (!isE164PhoneNumber(config.recipientNumber)) {
      throw new Error("KNIGHT_DEMO_CUSTOMER_PHONE_E164 must be E.164, for example +84901234567");
    }

    if (!config.webhookBaseUrl.startsWith("https://")) {
      throw new Error("TWILIO_WEBHOOK_BASE_URL must be HTTPS in live telephony mode");
    }
  }

  return config;
}

function ensureRecipientAllowed(config) {
  if (!config.allowedToNumbers.has(config.recipientNumber)) {
    throw new Error(`Recipient ${maskPhoneNumber(config.recipientNumber)} is not in TWILIO_ALLOWED_TO_NUMBERS allowlist`);
  }
}

function buildWebhookUrl(config, pathname, incidentId) {
  const url = new URL(pathname, `${config.webhookBaseUrl}/`);
  url.searchParams.set("incidentId", incidentId);
  return url.toString();
}

function createSmsBody() {
  return [
    "Co-opBank KNIGHT: Phat hien giao dich bat thuong, the so dang tam khoa.",
    "Vui long mo ung dung Co-opBank de xac minh.",
    "Khong chia se ma bao mat cho bat ky ai.",
  ].join(" ");
}

export function createVoiceAlertTwiml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Response>",
    '<Say language="vi-VN" voice="alice">',
    "Co-opBank KNIGHT phat hien giao dich bat thuong. The so cua quy khach dang duoc tam khoa de bao ve tai san.",
    "</Say>",
    '<Pause length="1"/>',
    '<Say language="vi-VN" voice="alice">',
    "Vui long mo ung dung Co-opBank de xac minh giao dich. Khong chia se ma bao mat cho bat ky ai.",
    "</Say>",
    "</Response>",
  ].join("");
}

export function validateTwilioWebhook({ authToken, signature, url, params, validateRequest }) {
  if (!authToken || !signature || !url || typeof validateRequest !== "function") {
    return false;
  }

  try {
    return Boolean(validateRequest(authToken, signature, url, params || {}));
  } catch {
    return false;
  }
}

export function normalizeCallStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export function createTelephonyService(config, deps = {}) {
  const client = deps.client;
  const log = deps.log || (() => {});
  const smsSentIncidentIds = new Set();

  return {
    async placeVoiceAlertCall({ incidentId }) {
      if (config.mode !== "live") {
        log(`Mock telephony: would call ${maskPhoneNumber(config.recipientNumber) || "[no recipient]"}`);
        return { mode: "mock", sid: "MOCK-CALL", toMasked: maskPhoneNumber(config.recipientNumber) };
      }

      ensureRecipientAllowed(config);

      if (!client?.calls?.create) {
        throw new Error("Twilio client is not configured for voice calls");
      }

      const call = await client.calls.create({
        to: config.recipientNumber,
        from: config.fromNumber,
        url: buildWebhookUrl(config, "/api/twilio/voice-alert", incidentId),
        statusCallback: buildWebhookUrl(config, "/api/twilio/voice-status", incidentId),
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
      });

      return { mode: "live", sid: call.sid, toMasked: maskPhoneNumber(config.recipientNumber) };
    },

    async handleVoiceStatus({ incidentId, callStatus }) {
      const normalizedStatus = normalizeCallStatus(callStatus);

      if (!NO_ANSWER_STATUSES.has(normalizedStatus)) {
        return { smsSent: false, ignored: true };
      }

      if (smsSentIncidentIds.has(incidentId)) {
        return { smsSent: false, ignored: true };
      }

      smsSentIncidentIds.add(incidentId);

      if (config.mode !== "live") {
        log(`Mock telephony: would SMS ${maskPhoneNumber(config.recipientNumber) || "[no recipient]"}`);
        return { smsSent: true, ignored: false, sid: "MOCK-SMS" };
      }

      ensureRecipientAllowed(config);

      if (!client?.messages?.create) {
        throw new Error("Twilio client is not configured for SMS");
      }

      const message = await client.messages.create({
        to: config.recipientNumber,
        from: config.fromNumber,
        body: createSmsBody(),
      });

      return { smsSent: true, ignored: false, sid: message.sid };
    },

    isNoAnswerStatus(callStatus) {
      return NO_ANSWER_STATUSES.has(normalizeCallStatus(callStatus));
    },

    isAnsweredStatus(callStatus) {
      return ANSWERED_STATUSES.has(normalizeCallStatus(callStatus));
    },
  };
}
