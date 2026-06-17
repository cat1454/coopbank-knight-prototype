export function createReportStateTracker({ COLORS, logAct, logObserve, logReason, onIdleMonitoring }) {
  let lastAuditCount = 0;
  let lastState = "";

  function reset() {
    lastAuditCount = 0;
    lastState = "";
  }

  function report(payload) {
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
      onIdleMonitoring?.();
    }
  }

  return { report, reset };
}
