import http from "http";
import webPush from "web-push";
import {
  allowedOrigins,
  autoTriggerOnConnect,
  PORT,
  sendPushSecret,
  subscriptionsFile,
  vapidKeysFile,
  vapidSubject,
} from "./config/env.js";
import { loadVapidKeys } from "./config/vapid.js";
import { DEMO_FLOW_IDS, getDemoFlow } from "./flows/demoFlows.js";
import { createCorsHandlers, getLanIp } from "./http/cors.js";
import { sendJson } from "./http/respond.js";
import { COLORS, logAct, logAlert, logObserve, logReason, logSystem } from "./logging/console.js";
import { createApiRoutes } from "./routes/apiRoutes.js";
import { createTokenMatcher } from "./security/auth.js";
import { createIncidentService } from "./services/incidentService.js";
import { createPushService } from "./services/pushService.js";
import { createPushSubscriptionStore } from "./services/pushSubscriptions.js";
import { createReportStateTracker } from "./services/reportStateTracker.js";
import { createSseHub } from "./services/sseHub.js";
import { attachTerminalControls } from "./terminal/controls.js";

const { applyCors } = createCorsHandlers(allowedOrigins);
const tokenMatches = createTokenMatcher(sendPushSecret);
const vapidKeys = loadVapidKeys(vapidKeysFile, logSystem);
const vapidPublicKey = vapidKeys.publicKey;
const vapidPrivateKey = vapidKeys.privateKey;

webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const sseHub = createSseHub({ logSystem });
const subscriptionStore = createPushSubscriptionStore({ subscriptionsFile, logSystem });
const pushService = createPushService({ webPush, subscriptionStore, logSystem });

let autoTriggerTimer = null;
let incidentService;

const reportStateTracker = createReportStateTracker({
  COLORS,
  logAct,
  logObserve,
  logReason,
  onIdleMonitoring() {
    incidentService?.clearAlertFlag();
  },
});

function clearAutoTriggerTimer() {
  if (autoTriggerTimer) {
    clearTimeout(autoTriggerTimer);
    autoTriggerTimer = null;
  }
}

function scheduleAutoTrigger() {
  clearAutoTriggerTimer();
  logSystem("Auto-triggering risk alert after 2.5 seconds...");
  autoTriggerTimer = setTimeout(() => {
    autoTriggerTimer = null;
    logSystem("Auto-trigger timeout reached.");
    incidentService.triggerAlert();
  }, 2500);
}

incidentService = createIncidentService({
  broadcast: sseHub.broadcast,
  clearAutoTriggerTimer,
  getDemoFlow,
  logAlert,
  logSystem,
  resetPushCycle: pushService.resetPushCycle,
  resetReportState: reportStateTracker.reset,
  sendPushToAll: pushService.sendPushToAll,
  startRepeatPush: pushService.startRepeatPush,
  stopRepeatPush: pushService.stopRepeatPush,
});

const handleApiRoute = createApiRoutes({
  autoTriggerOnConnect,
  clearAutoTriggerTimer,
  hasPushSecret: Boolean(sendPushSecret),
  incidentService,
  logSystem,
  pushService,
  reportStateTracker,
  scheduleAutoTrigger,
  sseHub,
  subscriptionStore,
  tokenMatches,
  vapidPublicKey,
});

subscriptionStore.load();

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
  const handled = await handleApiRoute(req, res, requestUrl);

  if (!handled) {
    sendJson(res, 404, { error: "Not found" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.clear();
  console.log(`\n${COLORS.bgBlue}============================================================${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}       CO-OPBANK KNIGHT SECURITY ENGINE - ACTIVE SHIELD     ${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}============================================================${COLORS.reset}\n`);
  console.log(`${COLORS.bold}Server:${COLORS.reset} http://localhost:${PORT}`);
  console.log(`${COLORS.bold}LAN:${COLORS.reset}    http://${getLanIp()}:${PORT}`);
  console.log(`${COLORS.bold}Push:${COLORS.reset}   ${subscriptionStore.size} subscription(s) loaded`);
  logSystem(`VAPID keys loaded from ${vapidKeys.source}. Public key: ${vapidPublicKey}`);
  if (!sendPushSecret) {
    logSystem("SEND_PUSH_SECRET is not set. /api/push/send is disabled, but terminal hotkeys still work.");
  }
  logSystem(
    autoTriggerOnConnect
      ? "AUTO_TRIGGER_ON_CONNECT=1: cảnh báo ban đầu sẽ tự chạy khi app kết nối."
      : "Auto-trigger khi app kết nối đang tắt. Dùng phím 1/2 để bắt đầu flow quay.",
  );
  console.log(`${COLORS.bold}Keys:${COLORS.reset}`);
  console.log(`  [1]                     : Mở cảnh 02:00 · tự bấm luồng bảo vệ`);
  console.log(`  [2]                     : Mở cảnh 08:30 · tự bấm luồng phục hồi`);
  console.log(`  [Space] / [Enter] / [S] : Chỉ trigger cảnh báo rủi ro ban đầu`);
  console.log(`  [R]                     : Reset app state`);
  console.log(`  [Q]                     : Quit server`);
  console.log("\n------------------------------------------------------------\n");
  logSystem("Waiting for deployed frontend or mobile PWA to connect...");
});

attachTerminalControls({
  demoFlowIds: DEMO_FLOW_IDS,
  startDemoFlow: incidentService.startDemoFlow,
  triggerAlert: incidentService.triggerAlert,
  triggerReset: incidentService.triggerReset,
});
