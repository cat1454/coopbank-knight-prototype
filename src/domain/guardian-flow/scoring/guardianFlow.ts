
import type {
  GuardianAgentResult,
  GuardianScenarioId,
  GuardianTransactionEvaluationInput,
} from "../types";
import type { CustomerDigitalTwin } from "../../knight/digital-twin";
import { runGuardianAgents } from "./agentScoring";
import { decideGuardianAction } from "./decisionPolicy";
import { buildLiveTransferScenario } from "./liveTransferScenario";
import { adaptGuardianDecisionToRiskAssessment } from "./riskAssessmentAdapter";
import { getGuardianScenario } from "./scenarios";
import { buildTwinContext, getThresholdFromContext } from "./twinContext";

export { runGuardianAgents } from "./agentScoring";
export { decideGuardianAction, getGuardianAiLevel, toKnightRiskScore } from "./decisionPolicy";
export { getGuardianReasonText, reasonCopy } from "./reasonCopy";
export { adaptGuardianDecisionToRiskAssessment } from "./riskAssessmentAdapter";
export { getGuardianScenario, guardianScenarios } from "./scenarios";
export { buildTwinContext } from "./twinContext";
export type { TwinEnrichedContext } from "./twinContext";

export async function evaluateGuardianScenario(
  scenarioId: GuardianScenarioId,
  options: { fakeLatencyMs?: number; onAgentComplete?: (agent: GuardianAgentResult) => void } = {},
) {
  const scenario = getGuardianScenario(scenarioId);
  const agentResults = await runGuardianAgents(scenario, options);
  const decision = decideGuardianAction(scenario, agentResults);

  return {
    scenario,
    agentResults,
    decision,
    riskAssessment: adaptGuardianDecisionToRiskAssessment(decision, scenario),
  };
}

export async function evaluateGuardianTransaction(
  input: GuardianTransactionEvaluationInput,
  options: {
    fakeLatencyMs?: number;
    onAgentComplete?: (agent: GuardianAgentResult) => void;
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

  const agentResults = await runGuardianAgents(scenario, {
    ...options,
    twinContext,
  });

  const decision = decideGuardianAction(scenario, agentResults, {
    source: "transaction",
    transactionId: "GF-LIVE-TRANSFER-001",
  });

  // Truyền adjustedThreshold từ twin vào adapter
  const adjustedThreshold = getThresholdFromContext(twinContext);

  return {
    scenario,
    agentResults,
    decision,
    riskAssessment: adaptGuardianDecisionToRiskAssessment(decision, scenario, adjustedThreshold),
    twinContext,
  };
}
