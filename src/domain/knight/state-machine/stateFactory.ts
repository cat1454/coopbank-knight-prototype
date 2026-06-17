
import { demoCard, demoCustomer, demoRiskAssessment, demoTransaction } from "../../../data/demoScenario";
import { resetAuditSequence } from "../audit/audit";
import type { KnightScenarioState } from "../types";

export function createInitialKnightState(): KnightScenarioState {
  resetAuditSequence();

  return {
    currentState: "idle_monitoring",
    customer: demoCustomer,
    transaction: demoTransaction,
    riskAssessment: demoRiskAssessment,
    card: demoCard,
    customerIntent: "unknown",
    biometricStatus: "not_required",
    auditEvents: [],
  };
}
