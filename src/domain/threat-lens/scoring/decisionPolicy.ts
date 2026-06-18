
import type {
  ThreatLensAction,
  ThreatLensAgentName,
  ThreatLensAgentResult,
  ThreatLensAiLevel,
  ThreatLensRiskDecision,
  ThreatLensScenario,
} from "../types";
import { reasonCopy } from "./reasonCopy";
import { clampScore } from "./scoringUtils";

function scoreFor(agentResults: ThreatLensAgentResult[], agentName: ThreatLensAgentName) {
  return agentResults.find((agent) => agent.agentName === agentName)?.score ?? 0;
}

function baseActionForScore(score: number): ThreatLensAction {
  if (score <= 35) return "allow";
  if (score <= 65) return "warn";
  if (score <= 85) return "delay";
  return "block";
}

export function getThreatLensAiLevel(score: number): ThreatLensAiLevel {
  const normalizedScore = clampScore(score);

  if (normalizedScore <= 35) return "safe";
  if (normalizedScore <= 65) return "watch";
  if (normalizedScore <= 79) return "verify";
  if (normalizedScore <= 85) return "hold";
  return "critical";
}

function policyLevelForAiLevel(aiLevel: ThreatLensAiLevel): ThreatLensRiskDecision["policyLevel"] {
  if (aiLevel === "safe") return "L0";
  if (aiLevel === "watch" || aiLevel === "verify") return "L1";
  return "L2";
}

function buildExplanation(action: ThreatLensAction, reasonCodes: string[]) {
  const topReasons = reasonCodes
    .slice(0, 3)
    .map((code) => reasonCopy[code] ?? code)
    .join(" ");

  if (action === "allow") {
    return "KNIGHT không thấy dấu hiệu bất thường đáng kể. Giao dịch khớp với thiết bị, người nhận và nhịp chi tiêu quen thuộc.";
  }

  if (action === "warn") {
    return `KNIGHT thấy một vài điểm lệch nên hiển thị cảnh báo trước khi tiếp tục. ${topReasons}`;
  }

  if (action === "delay" || action === "step_up") {
    return `KNIGHT cần trì hoãn ngắn và xác thực bổ sung trước khi cho giao dịch đi tiếp. ${topReasons}`;
  }

  return `KNIGHT tạm giữ giao dịch để bảo vệ tài sản và chuyển sang luồng xác minh. ${topReasons}`;
}

export function decideThreatLensAction(
  scenario: ThreatLensScenario,
  agentResults: ThreatLensAgentResult[],
  options: { source?: ThreatLensRiskDecision["source"]; transactionId?: string } = {},
): ThreatLensRiskDecision {
  const transactionScore = scoreFor(agentResults, "transaction");
  const deviceScore = scoreFor(agentResults, "device");
  const behavioralScore = scoreFor(agentResults, "behavioral");
  const beneficiaryScore = scoreFor(agentResults, "beneficiary");
  const scamScore = scoreFor(agentResults, "scam");

  let weightedScore = clampScore(
    transactionScore * 0.25 +
      deviceScore * 0.2 +
      behavioralScore * 0.2 +
      beneficiaryScore * 0.2 +
      scamScore * 0.15,
  );

  const signals = agentResults.flatMap((agent) => agent.signals);
  const reasonCodes = [...new Set(signals)];

  if (reasonCodes.includes("amount_above_baseline")) {
    weightedScore = Math.max(weightedScore, 42);
  }

  if (
    reasonCodes.includes("new_device") &&
    reasonCodes.includes("new_recipient") &&
    reasonCodes.includes("amount_above_p95")
  ) {
    weightedScore = Math.max(weightedScore, 72);
  }

  if (reasonCodes.includes("repeated_confirm_attempts")) {
    weightedScore = Math.max(weightedScore, 72);
  }

  let action = baseActionForScore(weightedScore);

  if (
    scenario.transaction.deviceInfo.isEmulator ||
    scenario.beneficiary.isMuleCluster ||
    (scenario.transaction.deviceInfo.isNew && scamScore > 70)
  ) {
    action = "block";
  } else if (scenario.transaction.amountVnd > 10_000_000 && action === "warn") {
    action = "delay";
  }

  if (scenario.id === "false_positive") {
    action = "warn";
  }

  const aiLevel = getThreatLensAiLevel(weightedScore);
  const source = options.source ?? "scenario";
  const requiresStepUp = action === "delay" || action === "step_up" || action === "block" || action === "review";
  const requiresReview = action === "block" || action === "review" || weightedScore >= 79;

  return {
    transactionId: options.transactionId ?? `TL-${scenario.id.toUpperCase()}-001`,
    source,
    scenarioId: source === "scenario" ? scenario.id : undefined,
    aiLevel,
    policyLevel: policyLevelForAiLevel(aiLevel),
    riskScore: weightedScore,
    knightScore: toKnightRiskScore(weightedScore),
    action,
    reasonCodes,
    explanation: buildExplanation(action, reasonCodes),
    agentResults,
    requiresStepUp,
    requiresChecklist: action === "delay" || action === "step_up",
    requiresReview,
  };
}

export function toKnightRiskScore(threatLensScore: number) {
  return clampScore(threatLensScore) * 10;
}
