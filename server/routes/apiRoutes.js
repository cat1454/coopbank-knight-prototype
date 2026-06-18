import { buildMockExplanation } from "../explain/explain.js";
import { listDemoFlows } from "../flows/demoFlows.js";
import { readJson } from "../http/body.js";
import { getLanIp } from "../http/cors.js";
import { sendJson } from "../http/respond.js";
import { isValidSubscription } from "../services/pushSubscriptions.js";
import { handleTwinRoutes } from "../twin/twinRoutes.js";

export function createApiRoutes({
  autoTriggerOnConnect,
  clearAutoTriggerTimer,
  hasPushSecret,
  incidentService,
  logSystem,
  pushService,
  reportStateTracker,
  scheduleAutoTrigger,
  sseHub,
  subscriptionStore,
  tokenMatches,
  vapidPublicKey,
}) {
  return async function handleApiRoute(req, res, requestUrl) {
    if (requestUrl.pathname === "/health" && req.method === "GET") {
      sendJson(res, 200, {
        status: "ok",
        subscriptions: subscriptionStore.size,
      });
      return true;
    }

    if (requestUrl.pathname === "/api/lan-ip" && req.method === "GET") {
      sendJson(res, 200, { ip: getLanIp() });
      return true;
    }

    if (requestUrl.pathname === "/api/demo-flows" && req.method === "GET") {
      sendJson(
        res,
        200,
        listDemoFlows().map((flow) => ({
          id: flow.id,
          label: flow.label,
          description: flow.description,
          events: flow.events.length,
          showCriticalAlert: flow.showCriticalAlert,
          autoAdvance: false,
        })),
      );
      return true;
    }

    const demoFlowMatch = requestUrl.pathname.match(/^\/api\/demo-flows\/([^/]+)\/start$/);
    if (demoFlowMatch && req.method === "POST") {
      if (!hasPushSecret) {
        sendJson(res, 503, { error: "SEND_PUSH_SECRET is not configured" });
        return true;
      }

      if (!tokenMatches(req.headers.authorization)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return true;
      }

      try {
        const result = incidentService.startDemoFlow(decodeURIComponent(demoFlowMatch[1]), "api");
        sendJson(res, 200, { success: true, ...result });
      } catch (error) {
        sendJson(res, 404, { error: error.message || "Unknown demo flow" });
      }
      return true;
    }

    if (requestUrl.pathname === "/api/push/public-key" && req.method === "GET") {
      sendJson(res, 200, { publicKey: vapidPublicKey });
      return true;
    }

    if (requestUrl.pathname === "/api/explain" && req.method === "POST") {
      try {
        const payload = await readJson(req, 128 * 1024);
        sendJson(res, 200, buildMockExplanation(payload));
      } catch (error) {
        sendJson(res, 400, { error: error.message || "Invalid request" });
      }
      return true;
    }

    if (requestUrl.pathname === "/api/push/subscribe" && req.method === "POST") {
      try {
        const subscription = await readJson(req);

        if (!isValidSubscription(subscription)) {
          sendJson(res, 400, { error: "Invalid push subscription" });
          return true;
        }

        subscriptionStore.set(subscription);
        subscriptionStore.save();
        logSystem(`Saved push subscription. Total subscriptions: ${subscriptionStore.size}`);
        sendJson(res, 200, { success: true, total: subscriptionStore.size });
      } catch (error) {
        sendJson(res, 400, { error: error.message || "Invalid request" });
      }
      return true;
    }

    if (requestUrl.pathname === "/api/push/unsubscribe" && req.method === "POST") {
      try {
        const payload = await readJson(req);
        const endpoint = typeof payload.endpoint === "string" ? payload.endpoint : "";

        if (!endpoint) {
          sendJson(res, 400, { error: "Missing subscription endpoint" });
          return true;
        }

        const deleted = subscriptionStore.delete(endpoint);
        if (deleted) {
          subscriptionStore.save();
        }
        logSystem(`Removed push subscription: ${deleted ? "yes" : "not found"}. Total subscriptions: ${subscriptionStore.size}`);
        sendJson(res, 200, { success: true, deleted, total: subscriptionStore.size });
      } catch (error) {
        sendJson(res, 400, { error: error.message || "Invalid request" });
      }
      return true;
    }

    if (requestUrl.pathname === "/api/incidents/high-risk" && req.method === "POST") {
      if (!hasPushSecret) {
        sendJson(res, 503, { error: "SEND_PUSH_SECRET is not configured" });
        return true;
      }

      if (!tokenMatches(req.headers.authorization)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return true;
      }

      try {
        const result = await incidentService.startHighRiskIncident("api");
        sendJson(res, 200, { success: true, ...result });
      } catch (error) {
        sendJson(res, 500, { error: error.message || "Could not start incident" });
      }
      return true;
    }

    if (requestUrl.pathname === "/api/incidents/current/cancel" && req.method === "POST") {
      try {
        const payload = await readJson(req);
        const reason = typeof payload.reason === "string" && payload.reason ? payload.reason : "customer_response";
        const result = incidentService.cancelCurrentIncident(reason);
        sendJson(res, 200, { success: true, ...result });
      } catch (error) {
        sendJson(res, 400, { error: error.message || "Invalid request" });
      }
      return true;
    }

    if (requestUrl.pathname === "/api/push/send" && req.method === "POST") {
      if (!hasPushSecret) {
        sendJson(res, 503, { error: "SEND_PUSH_SECRET is not configured" });
        return true;
      }

      if (!tokenMatches(req.headers.authorization)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return true;
      }

      if (!incidentService.hasActiveIncident()) {
        sendJson(res, 400, { error: "Cảnh báo không hoạt động. Không thể gửi push." });
        return true;
      }

      try {
        const payload = await readJson(req);
        const result = await pushService.sendPushToAll(payload);
        sendJson(res, 200, { success: true, ...result });
      } catch (error) {
        sendJson(res, 400, { error: error.message || "Invalid request" });
      }
      return true;
    }

    if (requestUrl.pathname === "/events" && req.method === "GET") {
      sseHub.open(req, res, {
        onConnect(clientCount) {
          reportStateTracker.reset();
          if (autoTriggerOnConnect && !incidentService.isAlertTriggered() && clientCount === 1) {
            scheduleAutoTrigger();
          }
        },
        onDisconnect(clientCount) {
          if (clientCount === 0) {
            incidentService.clearAlertFlag();
            clearAutoTriggerTimer();
          }
        },
      });
      return true;
    }

    if (requestUrl.pathname === "/api/report-state" && req.method === "POST") {
      try {
        const payload = await readJson(req);
        reportStateTracker.report(payload);
        sendJson(res, 200, { status: "ok" });
      } catch (error) {
        sendJson(res, 400, { error: error.message || "Invalid JSON" });
      }
      return true;
    }

    // Digital Twin API — /api/twin/*
    if (requestUrl.pathname.startsWith("/api/twin")) {
      return await handleTwinRoutes(req, res, requestUrl);
    }

    return false;
  };
}
