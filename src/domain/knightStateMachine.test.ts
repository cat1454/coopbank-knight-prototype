import { describe, expect, it } from "vitest";
import {
  createInitialKnightState,
  dispatchScenarioEvent,
  deriveAllowedActions,
  getVisibleScreen,
  runScenarioEvents,
  type KnightEventType,
} from "./knightStateMachine";
import type { KnightScenarioState } from "./types";

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
      "VOICE_CALL_PLACED",
      "VOICE_CALL_NO_ANSWER",
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
    expect(completed.auditEvents.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "notification.voiceCall",
        "notification.voiceNoAnswer",
        "notification.smsFallback",
        "card.keepSuspended",
      ]),
    );
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

  it("derives allowed actions for case creation, recovery offer, and timeout escalation", () => {
    const newCardIssued = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_TAPS_FRAUD",
      "REQUEST_BIOMETRIC",
      "BIOMETRIC_SUCCESS_FRAUD",
      "TERMINATE_CARD_SUCCESS",
      "ISSUE_CARD_SUCCESS",
    ]);
    expect(deriveAllowedActions(newCardIssued)).toContain("case.createFraudCase");

    const fraudCaseCreated = dispatchScenarioEvent(newCardIssued, "CREATE_CASE_SUCCESS");
    expect(deriveAllowedActions(fraudCaseCreated)).toContain("personalization.generateRecoveryOffer");

    const timedOut = run(["RISK_EVENT_RECEIVED", "AUTO_SUSPEND_ALLOWED", "PUSH_SENT", "CUSTOMER_RESPONSE_TIMEOUT"]);
    expect(deriveAllowedActions(timedOut)).toContain("notification.voiceCall");
    expect(deriveAllowedActions(timedOut)).not.toContain("notification.smsFallback");

    const callPlaced = dispatchScenarioEvent(timedOut, "VOICE_CALL_PLACED");
    expect(deriveAllowedActions(callPlaced)).not.toContain("notification.smsFallback");

    const noAnswer = dispatchScenarioEvent(callPlaced, "VOICE_CALL_NO_ANSWER");
    expect(deriveAllowedActions(noAnswer)).toContain("notification.smsFallback");

    const smsSent = dispatchScenarioEvent(noAnswer, "SMS_SENT");
    expect(deriveAllowedActions(smsSent)).toContain("fraudOps.escalate");
  });

  it("does not send SMS before a call no-answer event or after an answered call", () => {
    const timedOut = run(["RISK_EVENT_RECEIVED", "AUTO_SUSPEND_ALLOWED", "PUSH_SENT", "CUSTOMER_RESPONSE_TIMEOUT"]);

    const smsBeforeCall = dispatchScenarioEvent(timedOut, "SMS_SENT");
    expect(smsBeforeCall).toBe(timedOut);
    expect(smsBeforeCall.smsFallbackSent).toBe(false);

    const answered = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_RESPONSE_TIMEOUT",
      "VOICE_CALL_PLACED",
      "VOICE_CALL_ANSWERED",
      "SMS_SENT",
    ]);

    expect(answered.currentState).toBe("voice_call_answered");
    expect(answered.smsFallbackSent).toBe(false);
    expect(answered.card.status).toBe("suspended");
    expect(answered.newCard).toBeUndefined();
    expect(answered.fraudCase).toBeUndefined();
    expect(answered.auditEvents.map((event) => event.action)).not.toContain("notification.smsFallback");
  });

  it("keeps L3 card actions blocked throughout the timeout escalation path", () => {
    const timedOut = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_RESPONSE_TIMEOUT",
      "VOICE_CALL_PLACED",
      "VOICE_CALL_NO_ANSWER",
      "SMS_SENT",
      "TERMINATE_CARD_SUCCESS",
      "ISSUE_CARD_SUCCESS",
    ]);

    expect(timedOut.currentState).toBe("sms_fallback_sent");
    expect(timedOut.card.status).toBe("suspended");
    expect(timedOut.newCard).toBeUndefined();
    expect(timedOut.fraudCase).toBeUndefined();

    const oldTimeoutPath = run(["RISK_EVENT_RECEIVED", "AUTO_SUSPEND_ALLOWED", "PUSH_SENT", "CUSTOMER_RESPONSE_TIMEOUT"]);
    expect(deriveAllowedActions(oldTimeoutPath)).not.toContain("card.terminate");
    expect(deriveAllowedActions(oldTimeoutPath)).not.toContain("card.issueNewVirtualCard");
  });

  it("keeps invalid transitions as no-ops and returns guard for malformed state", () => {
    const initial = createInitialKnightState();
    const auditNoop = dispatchScenarioEvent(initial, "AUDIT_COMPLETE");
    expect(auditNoop).toBe(initial);

    const unknownEventNoop = dispatchScenarioEvent(initial, "UNKNOWN_EVENT" as KnightEventType);
    expect(unknownEventNoop).toBe(initial);

    const resetState = dispatchScenarioEvent(
      run(["RISK_EVENT_RECEIVED", "AUTO_SUSPEND_ALLOWED"]),
      "RESET_SCENARIO",
    );
    expect(resetState.currentState).toBe("idle_monitoring");
    expect(resetState.auditEvents).toHaveLength(0);

    const malformedState: KnightScenarioState = {
      ...initial,
      currentState: "malformed_state" as KnightScenarioState["currentState"],
    };
    expect(getVisibleScreen(malformedState)).toBe("guard");
  });
});
