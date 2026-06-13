import { describe, expect, it } from "vitest";
import {
  createInitialKnightState,
  deriveAllowedActions,
  dispatchScenarioEvent,
  getVisibleScreen,
  runScenarioEvents,
  type KnightEventType,
} from "./knightStateMachine";
import type { KnightScenarioState } from "./types";

function run(events: KnightEventType[]) {
  return runScenarioEvents(createInitialKnightState(), events);
}

const fraudRecoveryEvents: KnightEventType[] = [
  "RISK_EVENT_RECEIVED",
  "AUTO_SUSPEND_ALLOWED",
  "PUSH_SENT",
  "CUSTOMER_TAPS_FRAUD",
  "REQUEST_BIOMETRIC",
  "BIOMETRIC_SUCCESS_FRAUD",
  "TERMINATE_CARD_SUCCESS",
  "ISSUE_CARD_SUCCESS",
  "CREATE_CASE_SUCCESS",
];

const fullTrustRecoveryEvents: KnightEventType[] = [
  ...fraudRecoveryEvents,
  "OPEN_NEXT_MORNING_RECOVERY",
  "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS",
  "ASSESS_TRUST_RECOVERY_SUCCESS",
  "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS",
  "CUSTOMER_ACCEPTS_ESSENTIAL_CASHBACK",
  "ACTIVATE_ESSENTIAL_CASHBACK_SUCCESS",
  "OBSERVE_RECOVERY_SUCCESS",
  "COMPLETE_REACT_CYCLE",
];

describe("KNIGHT state machine", () => {
  it("runs the secured-account trust recovery flow with explainable audit evidence", () => {
    const beforeBiometric = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_TAPS_FRAUD",
      "REQUEST_BIOMETRIC",
    ]);

    expect(beforeBiometric.card.status).toBe("suspended");
    expect(deriveAllowedActions(beforeBiometric)).not.toContain("card.terminate");

    const completedBeforeAudit = run(fullTrustRecoveryEvents);

    expect(completedBeforeAudit.currentState).toBe("react_cycle_completed");
    expect(completedBeforeAudit.card.status).toBe("terminated");
    expect(completedBeforeAudit.newCard?.status).toBe("active");
    expect(completedBeforeAudit.fraudCase?.status).toBe("created");
    expect(completedBeforeAudit.trustRecoveryAssessment?.score).toBe(82);
    expect(completedBeforeAudit.trustRecoveryAssessment?.threshold).toBe(70);
    expect(completedBeforeAudit.reassurancePackage?.status).toBe("active");
    expect(completedBeforeAudit.reassurancePackage?.essentialCashback.status).toBe("activated");
    expect(completedBeforeAudit.recoveryObservation?.essentialPaymentResumed).toBe(true);
    expect(completedBeforeAudit.recoveryObservation?.repeatedBalanceChecksChangePercent).toBe(-60);
    expect(getVisibleScreen(completedBeforeAudit)).toBe("reassurance-package");
    expect(completedBeforeAudit.auditEvents.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "account.confirmSecured",
        "behavior.observePostIncident",
        "trustRecovery.calculate",
        "trustRecovery.checkThreshold",
        "reassurance.selectBenefits",
        "reassurance.activateSafetySupport",
        "customer.consentEssentialCashback",
        "cashback.activateEssential",
        "recovery.observe",
        "react.complete",
      ]),
    );

    const completed = dispatchScenarioEvent(completedBeforeAudit, "AUDIT_COMPLETE");
    expect(completed.currentState).toBe("audit_complete");
    expect(getVisibleScreen(completed)).toBe("guard");
  });

  it("keeps recovery reasoning behind the secured-account sequence", () => {
    const initial = createInitialKnightState();

    expect(dispatchScenarioEvent(initial, "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS")).toBe(initial);
    expect(dispatchScenarioEvent(initial, "ASSESS_TRUST_RECOVERY_SUCCESS")).toBe(initial);
    expect(dispatchScenarioEvent(initial, "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS")).toBe(initial);

    const caseCreated = run(fraudRecoveryEvents);
    expect(getVisibleScreen(caseCreated)).toBe("fraud-case-submitted");

    const morningReady = dispatchScenarioEvent(caseCreated, "OPEN_NEXT_MORNING_RECOVERY");
    expect(morningReady.currentState).toBe("next_morning_recovery_ready");
    expect(getVisibleScreen(morningReady)).toBe("next-morning-recovery");

    const observed = dispatchScenarioEvent(morningReady, "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS");
    expect(observed.currentState).toBe("post_incident_behavior_observed");
    expect(getVisibleScreen(observed)).toBe("post-incident-behavior");

    const assessed = dispatchScenarioEvent(observed, "ASSESS_TRUST_RECOVERY_SUCCESS");
    expect(assessed.currentState).toBe("trust_recovery_assessed");
    expect(getVisibleScreen(assessed)).toBe("trust-recovery-assessment");

    const packageActive = dispatchScenarioEvent(assessed, "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS");
    expect(packageActive.currentState).toBe("reassurance_package_active");
    expect(packageActive.reassurancePackage?.benefits).toHaveLength(5);
    expect(getVisibleScreen(packageActive)).toBe("reassurance-package");
  });

  it("does not activate a reassurance package below the score threshold", () => {
    const assessed = run([
      ...fraudRecoveryEvents,
      "OPEN_NEXT_MORNING_RECOVERY",
      "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS",
      "ASSESS_TRUST_RECOVERY_SUCCESS",
    ]);
    const belowThreshold: KnightScenarioState = {
      ...assessed,
      trustRecoveryAssessment: {
        ...assessed.trustRecoveryAssessment!,
        score: 69,
        level: "standard",
        decision: "continue_monitoring",
      },
    };

    expect(dispatchScenarioEvent(belowThreshold, "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS")).toBe(
      belowThreshold,
    );
  });

  it("activates safety support without consent but keeps essential cashback unavailable", () => {
    const caseCreated = run(fraudRecoveryEvents);
    const withoutConsent = {
      ...caseCreated,
      customer: { ...caseCreated.customer, personalizationConsent: false },
    };
    const packageActive = runScenarioEvents(withoutConsent, [
      "OPEN_NEXT_MORNING_RECOVERY",
      "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS",
      "ASSESS_TRUST_RECOVERY_SUCCESS",
      "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS",
    ]);

    expect(packageActive.reassurancePackage?.status).toBe("active");
    expect(packageActive.reassurancePackage?.essentialCashback.status).toBe("unavailable");
    expect(packageActive.trustRecoveryAssessment?.essentialSpendingCategories).toBeUndefined();
    expect(
      dispatchScenarioEvent(packageActive, "CUSTOMER_ACCEPTS_ESSENTIAL_CASHBACK"),
    ).toBe(packageActive);
  });

  it("requires explicit cashback consent before activation", () => {
    const packageActive = run([
      ...fraudRecoveryEvents,
      "OPEN_NEXT_MORNING_RECOVERY",
      "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS",
      "ASSESS_TRUST_RECOVERY_SUCCESS",
      "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS",
    ]);

    expect(dispatchScenarioEvent(packageActive, "ACTIVATE_ESSENTIAL_CASHBACK_SUCCESS")).toBe(
      packageActive,
    );

    const consented = dispatchScenarioEvent(
      packageActive,
      "CUSTOMER_ACCEPTS_ESSENTIAL_CASHBACK",
    );
    expect(consented.reassurancePackage?.essentialCashback.status).toBe("consented");

    const activated = dispatchScenarioEvent(consented, "ACTIVATE_ESSENTIAL_CASHBACK_SUCCESS");
    expect(activated.currentState).toBe("cashback_activated");
    expect(activated.reassurancePackage?.essentialCashback.status).toBe("activated");
  });

  it("restores the card for legitimate transactions without creating a recovery package", () => {
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
    expect(completed.fraudCase).toBeUndefined();
    expect(completed.reassurancePackage).toBeUndefined();
    expect(getVisibleScreen(completed)).toBe("legitimate-resolution");
  });

  it("keeps the card suspended on timeout and escalates to Fraud Ops", () => {
    const completed = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_RESPONSE_TIMEOUT",
      "ESCALATE_FRAUD_OPS",
      "KEEP_CARD_SUSPENDED",
    ]);

    expect(completed.currentState).toBe("card_remains_suspended");
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

    expect(state.biometricStatus).toBe("failed");
    expect(state.card.status).toBe("suspended");
    expect(deriveAllowedActions(state)).not.toContain("card.terminate");
    expect(state.auditEvents.at(-1)?.result).toBe("failed");
  });

  it("derives allowed actions across recovery and timeout policy boundaries", () => {
    const caseCreated = run(fraudRecoveryEvents);
    expect(deriveAllowedActions(caseCreated)).not.toContain("behavior.observePostIncident");

    const morningReady = dispatchScenarioEvent(caseCreated, "OPEN_NEXT_MORNING_RECOVERY");
    expect(deriveAllowedActions(morningReady)).toContain("behavior.observePostIncident");

    const observed = dispatchScenarioEvent(morningReady, "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS");
    expect(deriveAllowedActions(observed)).toContain("trustRecovery.calculate");

    const assessed = dispatchScenarioEvent(observed, "ASSESS_TRUST_RECOVERY_SUCCESS");
    expect(deriveAllowedActions(assessed)).toContain("reassurance.activateSafetySupport");

    const packageActive = dispatchScenarioEvent(assessed, "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS");
    expect(deriveAllowedActions(packageActive)).not.toContain("cashback.activateEssential");

    const consented = dispatchScenarioEvent(
      packageActive,
      "CUSTOMER_ACCEPTS_ESSENTIAL_CASHBACK",
    );
    expect(deriveAllowedActions(consented)).toContain("cashback.activateEssential");

    const cashbackActive = dispatchScenarioEvent(
      consented,
      "ACTIVATE_ESSENTIAL_CASHBACK_SUCCESS",
    );
    expect(deriveAllowedActions(cashbackActive)).toContain("recovery.observe");

    const timedOut = run([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
      "CUSTOMER_RESPONSE_TIMEOUT",
    ]);
    expect(deriveAllowedActions(timedOut)).toContain("fraudOps.escalate");
    expect(deriveAllowedActions(timedOut)).not.toContain("card.terminate");
  });

  it("keeps invalid transitions as no-ops and guards malformed state", () => {
    const initial = createInitialKnightState();
    expect(dispatchScenarioEvent(initial, "AUDIT_COMPLETE")).toBe(initial);
    expect(dispatchScenarioEvent(initial, "UNKNOWN_EVENT" as KnightEventType)).toBe(initial);

    const malformedState: KnightScenarioState = {
      ...initial,
      currentState: "malformed_state" as KnightScenarioState["currentState"],
    };
    expect(getVisibleScreen(malformedState)).toBe("guard");
  });
});
