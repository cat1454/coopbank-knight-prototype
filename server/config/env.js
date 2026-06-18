import path from "path";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
export const serverDir = path.resolve(configDir, "..");

export const PORT = Number(process.env.PORT || 5000);

export const DEFAULT_ALLOWED_ORIGINS = [
  "https://knight.danangtoiiu.live",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export const allowedOrigins = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const sendPushSecret = process.env.SEND_PUSH_SECRET || "";
export const autoTriggerOnConnect = process.env.AUTO_TRIGGER_ON_CONNECT === "1";
export const subscriptionsFile = process.env.PUSH_SUBSCRIPTIONS_FILE || path.join(serverDir, "push-subscriptions.json");
export const vapidKeysFile = process.env.VAPID_KEYS_FILE || path.join(serverDir, "vapid-keys.local.json");
export const vapidSubject = process.env.VAPID_SUBJECT || "mailto:knight-demo@example.com";
