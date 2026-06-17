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
const LEVEL_KEY = "knight_guardian_level";
const CONSENT_BIOMETRICS_KEY = "knight_consent_biometrics";
const CONSENT_BEHAVIORAL_KEY = "knight_consent_behavioral";
const CONSENT_LOCATION_KEY = "knight_consent_location";

export function useGuardianFlowScenario(latestDecision: GuardianRiskDecision | null) {
  const [hasConsent, setHasConsent] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.sessionStorage.getItem(CONSENT_KEY);
    return stored === null ? true : stored === "granted";
  });
  
  // Consent checklist states for PDP compliance
  const [consentChecked, setConsentChecked] = useState(false); // General agreement
  const [consentBiometrics, setConsentBiometrics] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(CONSENT_BIOMETRICS_KEY) !== "false";
  });
  const [consentBehavioral, setConsentBehavioral] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(CONSENT_BEHAVIORAL_KEY) !== "false";
  });
  const [consentLocation, setConsentLocation] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(CONSENT_LOCATION_KEY) !== "false";
  });

  // Guardian Control Level state: max, standard, min
  const [guardianLevel, setGuardianLevelState] = useState<"max" | "standard" | "min">(() => {
    if (typeof window === "undefined") return "standard";
    return (window.sessionStorage.getItem(LEVEL_KEY) as "max" | "standard" | "min") || "standard";
  });

  const [selectedScenario, setSelectedScenario] = useState<GuardianScenarioId>("low_risk");
  const [fakeLatencyMs, setFakeLatencyMs] = useState(0);
  const [detailedMode, setDetailedMode] = useState(true);
  const [evaluation, setEvaluation] = useState<GuardianEvaluationState | null>(null);
  const [agentUpdates, setAgentUpdates] = useState<GuardianAgentResult[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(() => checklistItems.map(() => false));

  // Operator review simulator states
  const [isHumanReviewing, setIsHumanReviewing] = useState(false);
  const [humanReviewStep, setHumanReviewStep] = useState<"idle" | "connecting" | "chatting" | "approved" | "rejected">("idle");

  const selectedScenarioData = useMemo(() => {
    return guardianScenarios.find((scenario) => scenario.id === selectedScenario) ?? guardianScenarios[0];
  }, [selectedScenario]);

  const setGuardianLevel = (level: "max" | "standard" | "min") => {
    window.sessionStorage.setItem(LEVEL_KEY, level);
    setGuardianLevelState(level);
    // Dispatch storage event to sync other hooks (e.g. useBankTransferFlow)
    window.dispatchEvent(new Event("storage"));
  };

  const grantConsent = () => {
    window.sessionStorage.setItem(CONSENT_KEY, "granted");
    window.sessionStorage.setItem(CONSENT_BIOMETRICS_KEY, consentBiometrics ? "true" : "false");
    window.sessionStorage.setItem(CONSENT_BEHAVIORAL_KEY, consentBehavioral ? "true" : "false");
    window.sessionStorage.setItem(CONSENT_LOCATION_KEY, consentLocation ? "true" : "false");
    setHasConsent(true);
    // Dispatch storage event to sync
    window.dispatchEvent(new Event("storage"));
  };

  const withdrawConsent = () => {
    window.sessionStorage.setItem(CONSENT_KEY, "withdrawn");
    window.sessionStorage.removeItem(CONSENT_BIOMETRICS_KEY);
    window.sessionStorage.removeItem(CONSENT_BEHAVIORAL_KEY);
    window.sessionStorage.removeItem(CONSENT_LOCATION_KEY);
    setHasConsent(false);
    setConsentChecked(false);
    // Dispatch storage event to sync
    window.dispatchEvent(new Event("storage"));
  };

  const runScenario = async (scenarioId = selectedScenario) => {
    setIsConsoleOpen(false);
    setCheckedItems(checklistItems.map(() => false));
    setAgentUpdates([]);
    setHumanReviewStep("idle");
    setIsHumanReviewing(false);
    const result = await evaluateGuardianScenario(scenarioId, {
      fakeLatencyMs,
      onAgentComplete: (agent) => setAgentUpdates((current) => [...current, agent]),
    });

    // Adjust decision details based on user control level
    const finalDecision = { ...result.decision };
    const levelSetting = (window.sessionStorage.getItem(LEVEL_KEY) as "max" | "standard" | "min") || "standard";
    const amount = result.scenario.transaction.amountVnd;

    if (levelSetting === "min") {
      // Minimal protection: Downgrade holds/blocks unless required by law (amount >= 10M)
      if (amount < 10_000_000 && (finalDecision.action === "block" || finalDecision.action === "delay" || finalDecision.action === "step_up" || finalDecision.requiresStepUp)) {
        finalDecision.action = "warn";
        finalDecision.requiresStepUp = false;
        finalDecision.requiresChecklist = false;
        finalDecision.requiresReview = false;
        finalDecision.explanation = "KNIGHT phát hiện dấu hiệu nguy hiểm lớn, nhưng do bạn cấu hình Giám sát tối thiểu nên giao dịch chỉ hiển thị cảnh báo thay vì tạm giữ.";
      } else if (amount >= 10_000_000 && finalDecision.action === "block") {
        // Still requires step-up/verification according to State Bank of Vietnam QD 2345
        finalDecision.action = "step_up";
        finalDecision.requiresStepUp = true;
        finalDecision.requiresChecklist = true;
        finalDecision.explanation = "KNIGHT nhận thấy giao dịch có rủi ro nghiêm trọng. Vì số tiền từ 10 triệu đồng trở lên, quy định Quyết định 2345/QĐ-NHNN bắt buộc thực hiện các xác thực bổ sung.";
      }
    } else if (levelSetting === "max") {
      // Maximum protection: Upgrade warnings to verify / delay
      if (finalDecision.action === "warn") {
        finalDecision.action = "step_up";
        finalDecision.requiresStepUp = true;
        finalDecision.requiresChecklist = true;
        finalDecision.explanation = "[Chế độ bảo vệ Tối đa] Giao dịch có dấu hiệu lệch baseline. Hệ thống yêu cầu xác thực checklist và Face ID bổ sung để đảm bảo an toàn.";
      }
    }

    setEvaluation({ ...result, decision: finalDecision, agentUpdates: result.agentResults });
  };

  const reset = () => {
    setEvaluation(null);
    setAgentUpdates([]);
    setCheckedItems(checklistItems.map(() => false));
    setSelectedScenario("low_risk");
    setHumanReviewStep("idle");
    setIsHumanReviewing(false);
  };

  const startHumanReview = () => {
    setIsHumanReviewing(true);
    setHumanReviewStep("connecting");
    setTimeout(() => {
      setHumanReviewStep("chatting");
    }, 1500);
  };

  const completeHumanReview = (approved: boolean) => {
    if (approved) {
      setHumanReviewStep("approved");
      if (evaluation) {
        setEvaluation({
          ...evaluation,
          decision: {
            ...evaluation.decision,
            action: "allow",
            riskScore: 10,
            aiLevel: "safe",
            explanation: "Giao dịch đã được phê duyệt thủ công bởi Tổng đài viên sau khi xác minh bối cảnh.",
            requiresStepUp: false,
            requiresChecklist: false,
            requiresReview: false
          }
        });
      }
    } else {
      setHumanReviewStep("rejected");
      if (evaluation) {
        setEvaluation({
          ...evaluation,
          decision: {
            ...evaluation.decision,
            action: "block",
            explanation: "Giao dịch đã bị từ chối chuyển tiền bởi Tổng đài viên và khách hàng để ngăn ngừa rủi ro lừa đảo."
          }
        });
      }
    }
    setTimeout(() => {
      setIsHumanReviewing(false);
    }, 2000);
  };

  const decision = evaluation?.decision ?? latestDecision;
  const scenario = evaluation?.scenario ?? selectedScenarioData;
  const checkedCount = checkedItems.filter(Boolean).length;
  const isChecklistComplete = checkedCount === checklistItems.length;

  return {
    hasConsent,
    consentChecked,
    setConsentChecked,
    consentBiometrics,
    setConsentBiometrics,
    consentBehavioral,
    setConsentBehavioral,
    consentLocation,
    setConsentLocation,
    guardianLevel,
    setGuardianLevel,
    withdrawConsent,
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
    isHumanReviewing,
    humanReviewStep,
    startHumanReview,
    completeHumanReview,
  };
}

export type GuardianFlowScenarioViewModel = ReturnType<typeof useGuardianFlowScenario>;
