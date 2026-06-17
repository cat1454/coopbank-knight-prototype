
import type { GuardianRiskDecision, GuardianScenario, RiskAssessment, RiskSignal } from "../types";
import { reasonCopy } from "./reasonCopy";
import { toKnightRiskScore } from "./decisionPolicy";

const DEFAULT_KNIGHT_RISK_THRESHOLD = 800;

function signalFromReason(code: string): RiskSignal {
  const severity: RiskSignal["severity"] =
    code === "mule_cluster" || code === "reported_beneficiary" || code === "suspicious_journey"
      ? "high"
      : code === "trusted_recipient" || code === "amount_normal" || code === "known_behavior"
        ? "low"
        : "medium";

  return {
    code: code.toUpperCase(),
    label: reasonCopy[code] ?? code,
    severity,
    customerText: reasonCopy[code] ?? code,
    auditText: `GuardianFlow reason: ${code}`,
  };
}

export function adaptGuardianDecisionToRiskAssessment(
  decision: GuardianRiskDecision,
  scenario: GuardianScenario,
  adjustedThreshold?: number
): RiskAssessment {
  const threshold = adjustedThreshold ?? DEFAULT_KNIGHT_RISK_THRESHOLD;
  const score = toKnightRiskScore(decision.riskScore);
  const level: RiskAssessment["level"] = score >= threshold ? "high" : score >= 360 ? "elevated" : "normal";
  const recommendedAction: RiskAssessment["recommendedAction"] =
    decision.aiLevel === "hold" || decision.aiLevel === "critical" || decision.action === "block" || decision.action === "review"
      ? "suspend"
      : decision.aiLevel === "verify" || decision.action === "delay" || decision.action === "step_up"
        ? "verify"
      : decision.action === "warn"
        ? "notify"
        : "monitor";

  return {
    id: `RISK-${decision.transactionId}`,
    score,
    threshold,
    level,
    recommendedAction,
    assessedAt: scenario.transaction.timestamp,
    signals: decision.reasonCodes.map(signalFromReason),
    intelligence: decision,
  };
}
