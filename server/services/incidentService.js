export function createIncidentService({
  broadcast,
  clearAutoTriggerTimer,
  getDemoFlow,
  logAlert,
  logSystem,
  resetReportState,
  resetPushCycle,
  sendPushToAll,
  startRepeatPush,
  stopRepeatPush,
}) {
  let alertTriggered = false;
  let currentIncident = null;
  let incidentSequence = 0;

  function createIncidentId() {
    incidentSequence += 1;
    return `INC-${Date.now()}-${incidentSequence}`;
  }

  function isIncidentActive(incidentId) {
    return Boolean(currentIncident && currentIncident.id === incidentId && !currentIncident.cancelled);
  }

  function clearIncidentTimer(incident) {
    if (incident?.repeatTimer) {
      clearTimeout(incident.repeatTimer);
      incident.repeatTimer = null;
    }
    stopRepeatPush();
  }

  function broadcastIncidentEvents(incidentId, events) {
    broadcast({ type: "trigger", incidentId, events });
  }

  async function startHighRiskIncident(source = "manual") {
    if (alertTriggered && currentIncident && !currentIncident.cancelled) {
      logSystem("Cảnh báo đã được kích hoạt. Nhấn R để reset trước khi gửi lại.");
      return {
        started: false,
        incidentId: currentIncident.id,
        reason: "already_running",
      };
    }

    clearAutoTriggerTimer();
    resetPushCycle();

    const incident = {
      id: createIncidentId(),
      source,
      cancelled: false,
      repeatTimer: null,
    };

    currentIncident = incident;
    alertTriggered = true;

    logAlert("Kích hoạt cảnh báo cao — Gửi Web Push ngay, lặp mỗi 8 giây.");
    broadcastIncidentEvents(incident.id, ["RISK_EVENT_RECEIVED", "AUTO_SUSPEND_ALLOWED", "PUSH_SENT"]);

    const pushResult = await sendPushToAll();
    startRepeatPush(incident.id, () => isIncidentActive(incident.id));

    return {
      started: true,
      incidentId: incident.id,
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

  function triggerReset() {
    stopRepeatPush();
    alertTriggered = false;
    clearAutoTriggerTimer();
    resetPushCycle();
    resetReportState();
    if (currentIncident) {
      clearIncidentTimer(currentIncident);
      currentIncident = null;
    }
    logSystem("Gửi tín hiệu reset đến app...");
    broadcast({ type: "trigger", events: ["RESET_SCENARIO"] });
  }

  function startDemoFlow(flowId, source = "terminal") {
    const flow = getDemoFlow(flowId);

    triggerReset();

    const incident = {
      id: createIncidentId(),
      source,
      flowId,
      cancelled: false,
      repeatTimer: null,
    };

    currentIncident = incident;
    alertTriggered = true;

    logSystem(`Mở điểm bắt đầu demo: ${flow.label}`);
    broadcast({
      type: "demo-flow",
      incidentId: incident.id,
      flowId: flow.id,
      events: flow.events,
      showCriticalAlert: flow.showCriticalAlert,
      autoAdvance: false,
    });

    if (flow.sendPush) {
      void sendPushToAll();
      startRepeatPush(incident.id, () => isIncidentActive(incident.id));
    } else {
      stopRepeatPush();
    }

    return {
      started: true,
      incidentId: incident.id,
      flowId: flow.id,
      label: flow.label,
      events: flow.events.length,
      autoAdvance: false,
    };
  }

  return {
    cancelCurrentIncident,
    clearAlertFlag() {
      alertTriggered = false;
    },
    hasActiveIncident() {
      return Boolean(alertTriggered && currentIncident && !currentIncident.cancelled);
    },
    isAlertTriggered() {
      return alertTriggered;
    },
    startDemoFlow,
    startHighRiskIncident,
    triggerAlert,
    triggerReset,
  };
}
