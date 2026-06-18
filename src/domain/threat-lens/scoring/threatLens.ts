
import type {
  ThreatLensAgentResult,
  ThreatLensScenarioId,
  ThreatLensTransactionEvaluationInput,
} from "../types";
import type { CustomerDigitalTwin } from "../../knight/digital-twin";
import { runThreatLensAgents } from "./agentScoring";
import { decideThreatLensAction } from "./decisionPolicy";
import { buildLiveTransferScenario } from "./liveTransferScenario";
import { adaptThreatLensDecisionToRiskAssessment } from "./riskAssessmentAdapter";
import { getThreatLensScenario } from "./scenarios";
import { buildTwinContext, getThresholdFromContext } from "./twinContext";

export { runThreatLensAgents } from "./agentScoring";
export { decideThreatLensAction, getThreatLensAiLevel, toKnightRiskScore } from "./decisionPolicy";
export { getThreatLensReasonText, reasonCopy } from "./reasonCopy";
export { adaptThreatLensDecisionToRiskAssessment } from "./riskAssessmentAdapter";
export { getThreatLensScenario, threatLensScenarios } from "./scenarios";
export { buildTwinContext } from "./twinContext";
export type { TwinEnrichedContext } from "./twinContext";

export async function evaluateThreatLensScenario(
  scenarioId: ThreatLensScenarioId,
  options: { fakeLatencyMs?: number; onAgentComplete?: (agent: ThreatLensAgentResult) => void } = {},
) {
  const scenario = getThreatLensScenario(scenarioId);
  const agentResults = await runThreatLensAgents(scenario, options);
  const decision = decideThreatLensAction(scenario, agentResults);

  return {
    scenario,
    agentResults,
    decision,
    riskAssessment: adaptThreatLensDecisionToRiskAssessment(decision, scenario),
  };
}

export async function evaluateThreatLensTransaction(
  input: ThreatLensTransactionEvaluationInput,
  options: {
    fakeLatencyMs?: number;
    onAgentComplete?: (agent: ThreatLensAgentResult) => void;
    /** CustomerDigitalTwin của khách — nếu có, scoring sẽ dùng dữ liệu thực thay heuristics */
    twin?: CustomerDigitalTwin | null;
  } = {},
) {
  const { twin } = options;

  // Lấy giờ hiện tại UTC+7 để kiểm tra typicalHour
  const currentHourUtc7 = (new Date().getUTCHours() + 7) % 24;

  // Build twinContext từ twin (nếu có) — truyền beneficiaryId sau khi biết recipient
  // Dùng rỗng trước, sẽ enrich trong scenario build
  const scenario = buildLiveTransferScenario(input, twin);

  // Build twinContext với recipientId thực từ scenario
  const twinContext = twin ? buildTwinContext(twin, scenario.beneficiary.recipientId, currentHourUtc7) : undefined;

  const agentResults = await runThreatLensAgents(scenario, {
    ...options,
    twinContext,
  });

  const decision = decideThreatLensAction(scenario, agentResults, {
    source: "transaction",
    transactionId: "TL-LIVE-TRANSFER-001",
  });

  // Truyền adjustedThreshold từ twin vào adapter
  const adjustedThreshold = getThresholdFromContext(twinContext);

  return {
    scenario,
    agentResults,
    decision,
    riskAssessment: adaptThreatLensDecisionToRiskAssessment(decision, scenario, adjustedThreshold),
    twinContext,
  };
}
