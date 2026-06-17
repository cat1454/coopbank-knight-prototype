import { useMemo, useState } from "react";
import { evaluateGuardianScenario, guardianScenarios } from "../../../domain/guardianFlow";
import type {
  GuardianAgentResult,
  GuardianRiskDecision,
  GuardianScenario,
  GuardianScenarioId,
} from "../../../domain/types";
import { checklistItems } from "./guardianFlowUi";

interface GuardianEvaluationState {
  scenario: GuardianScenario;
  decision: GuardianRiskDecision;
  agentUpdates: GuardianAgentResult[];
}

const CONSENT_KEY = "knight_guardianflow_consent";

export function useGuardianFlowScenario(latestDecision: GuardianRiskDecision | null) {
  const [hasConsent, setHasConsent] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(CONSENT_KEY) === "granted";
  });
  const [consentChecked, setConsentChecked] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<GuardianScenarioId>("low_risk");
  const [fakeLatencyMs, setFakeLatencyMs] = useState(0);
  const [detailedMode, setDetailedMode] = useState(true);
  const [evaluation, setEvaluation] = useState<GuardianEvaluationState | null>(null);
  const [agentUpdates, setAgentUpdates] = useState<GuardianAgentResult[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(() => checklistItems.map(() => false));

  const selectedScenarioData = useMemo(() => {
    return guardianScenarios.find((scenario) => scenario.id === selectedScenario) ?? guardianScenarios[0];
  }, [selectedScenario]);

  const grantConsent = () => {
    window.sessionStorage.setItem(CONSENT_KEY, "granted");
    setHasConsent(true);
  };

  const runScenario = async (scenarioId = selectedScenario) => {
    setIsConsoleOpen(false);
    setCheckedItems(checklistItems.map(() => false));
    setAgentUpdates([]);
    const result = await evaluateGuardianScenario(scenarioId, {
      fakeLatencyMs,
      onAgentComplete: (agent) => setAgentUpdates((current) => [...current, agent]),
    });
    setEvaluation({ ...result, agentUpdates: result.agentResults });
  };

  const reset = () => {
    setEvaluation(null);
    setAgentUpdates([]);
    setCheckedItems(checklistItems.map(() => false));
    setSelectedScenario("low_risk");
  };

  const decision = evaluation?.decision ?? latestDecision;
  const scenario = evaluation?.scenario ?? selectedScenarioData;
  const checkedCount = checkedItems.filter(Boolean).length;
  const isChecklistComplete = checkedCount === checklistItems.length;

  return {
    hasConsent,
    consentChecked,
    setConsentChecked,
    selectedScenario,
    setSelectedScenario,
    fakeLatencyMs,
    setFakeLatencyMs,
    detailedMode,
    setDetailedMode,
    evaluation,
    agentUpdates,
    isConsoleOpen,
    setIsConsoleOpen,
    checkedItems,
    setCheckedItems,
    grantConsent,
    runScenario,
    reset,
    decision,
    scenario,
    checkedCount,
    isChecklistComplete,
  };
}
