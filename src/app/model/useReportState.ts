import { useEffect } from "react";
import { buildBackendUrl } from "../../shared/api/backend";
import type { KnightScenarioState } from "../../domain/types";

export function useReportState(state: KnightScenarioState) {
  useEffect(() => {
    const reportStateUrl = buildBackendUrl("/api/report-state");

    if (!reportStateUrl) {
      return;
    }

    fetch(reportStateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentState: state.currentState,
        auditEvents: state.auditEvents,
      }),
    }).catch(() => {
      // Ignore errors when server is not running
    });
  }, [state.currentState, state.auditEvents]);
}
