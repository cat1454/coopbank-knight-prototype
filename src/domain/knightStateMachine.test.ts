import { describe, expect, it } from "vitest";
import {
  createInitialKnightState,
  dispatchScenarioEvent,
  deriveAllowedActions,
  getVisibleScreen,
  runScenarioEvents,
  type KnightEventType,
} from "./knightStateMachine";

function run(events: KnightEventType[]) {
  return runScenarioEvents(createInitialKnightState(), events);
}

describe("KNIGHT state machine", () => {
  it("runs the confirmed fraud branch with L3 actions only after Face ID", () => {
    const beforeBiometric = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_TAPS_FRAUD",
      "REQUEST_BIOMETRIC",
    ]);

    expect(beforeBiometric.card.status).toBe("suspended");
    expect(deriveAllowedActions(beforeBiometric)).not.toContain("card.terminate");

    const completed = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_TAPS_FRAUD",
      "REQUEST_BIOMETRIC",
      "BIOMETRIC_SUCCESS_FRAUD",
      "TERMINATE_CARD_SUCCESS",
      "ISSUE_CARD_SUCCESS",
      "CREATE_CASE_SUCCESS",
      "GENERATE_OFFER_SUCCESS",
      "AUDIT_COMPLETE",
    ]);

    expect(completed.currentState).toBe("audit_complete");
    expect(completed.card.status).toBe("terminated");
    expect(completed.newCard?.status).toBe("active");
    expect(completed.fraudCase?.status).toBe("created");
    expect(completed.recoveryOffer?.status).toBe("ready");
    expect(getVisibleScreen(completed)).toBe("audit-timeline");
    expect(completed.auditEvents.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "risk.evaluate",
        "card.suspend",
        "auth.verifyBiometric",
        "card.terminate",
        "card.issueNewVirtualCard",
        "case.createFraudCase",
        "personalization.generateRecoveryOffer",
      ]),
    );
  });

  it("restores the card for legitimate transactions without creating a case or new card", () => {
    const completed = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_TAPS_LEGIT",
      "REQUEST_BIOMETRIC",
      "BIOMETRIC_SUCCESS_LEGIT",
      "UNSUSPEND_CARD_SUCCESS",
      "WHITELIST_SESSION_SUCCESS",
      "ENHANCED_MONITORING_STARTED",
    ]);

    expect(completed.currentState).toBe("enhanced_monitoring_30m");
    expect(completed.card.status).toBe("active");
    expect(completed.newCard).toBeUndefined();
    expect(completed.fraudCase).toBeUndefined();
    expect(getVisibleScreen(completed)).toBe("legitimate-resolution");
  });

  it("keeps the card suspended on timeout and escalates to Fraud Ops", () => {
    const completed = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_RESPONSE_TIMEOUT",
      "SMS_SENT",
      "ESCALATE_FRAUD_OPS",
      "KEEP_CARD_SUSPENDED",
    ]);

    expect(completed.currentState).toBe("card_remains_suspended");
    expect(completed.customerIntent).toBe("timeout");
    expect(completed.card.status).toBe("suspended");
    expect(completed.newCard).toBeUndefined();
    expect(completed.fraudCase?.status).toBe("escalated");
    expect(getVisibleScreen(completed)).toBe("timeout-escalation");
  });

  it("records a failed biometric attempt without running L3 card actions", () => {
    const state = dispatchScenarioEvent(
      run([
        "RISK_EVENT_RECEIVED",
        "AUTO_SUSPEND_ALLOWED",
        "PUSH_SENT",
        "CUSTOMER_TAPS_FRAUD",
        "REQUEST_BIOMETRIC",
      ]),
      "BIOMETRIC_FAILED",
    );

    expect(state.currentState).toBe("biometric_required");
    expect(state.biometricStatus).toBe("failed");
    expect(state.card.status).toBe("suspended");
    expect(deriveAllowedActions(state)).not.toContain("card.terminate");
    expect(state.auditEvents.at(-1)?.result).toBe("failed");
  });
});
