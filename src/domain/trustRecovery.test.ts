import { describe, expect, it } from "vitest";
import { demoBehaviorSignals } from "../data/demoScenario";
import {
  calculateTrustRecoveryScore,
  isAccountSecuredForRecovery,
  shouldActivateReassurancePackage,
} from "./trustRecovery";
import { createInitialKnightState, runScenarioEvents } from "./knightStateMachine";
import type { KnightEventType, TrustRecoveryAssessment } from "./types";

const securedAccountEvents: KnightEventType[] = [
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

function assessment(score: number, threshold = 70): TrustRecoveryAssessment {
  return {
    id: "TRUST-ASSESSMENT-TEST",
    customerId: "CUS-001",
    generatedAt: "2026-06-01T02:04:45+07:00",
    score,
    threshold,
    level: score >= threshold ? "high" : "standard",
    decision: score >= threshold ? "activate_reassurance_package" : "continue_monitoring",
    explanation: "Test assessment",
    signals: demoBehaviorSignals,
  };
}

describe("trust recovery reasoning", () => {
  it("calculates the deterministic demo score from observable behavior weights", () => {
    expect(calculateTrustRecoveryScore(demoBehaviorSignals)).toBe(82);
  });

  it("activates support at the threshold and keeps monitoring below it", () => {
    const securedState = runScenarioEvents(createInitialKnightState(), securedAccountEvents);

    expect(shouldActivateReassurancePackage(securedState, assessment(70))).toBe(true);
    expect(shouldActivateReassurancePackage(securedState, assessment(69))).toBe(false);
  });

  it("requires the old card terminated, replacement active, and fraud case created", () => {
    const initialState = createInitialKnightState();
    const beforeCase = runScenarioEvents(createInitialKnightState(), securedAccountEvents.slice(0, -1));
    const securedState = runScenarioEvents(createInitialKnightState(), securedAccountEvents);

    expect(isAccountSecuredForRecovery(initialState)).toBe(false);
    expect(isAccountSecuredForRecovery(beforeCase)).toBe(false);
    expect(isAccountSecuredForRecovery(securedState)).toBe(true);
    expect(shouldActivateReassurancePackage(beforeCase, assessment(82))).toBe(false);
  });

  it("does not require personalization consent for automatic safety support", () => {
    const securedState = runScenarioEvents(createInitialKnightState(), securedAccountEvents);
    const withoutConsent = {
      ...securedState,
      customer: { ...securedState.customer, personalizationConsent: false },
    };

    expect(shouldActivateReassurancePackage(withoutConsent, assessment(82))).toBe(true);
  });
});
