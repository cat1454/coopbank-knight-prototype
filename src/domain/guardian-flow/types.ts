import type { PolicyLevel } from "../knight/types";

export type { RiskAssessment, RiskSignal } from "../knight/types";

export type GuardianScenarioId =
  | "low_risk"
  | "medium_risk"
  | "high_risk"
  | "critical_risk"
  | "false_positive"
  | "feedback_attack";

export type GuardianAgentName = "transaction" | "device" | "behavioral" | "beneficiary" | "scam";
export type GuardianAction = "allow" | "warn" | "delay" | "step_up" | "block" | "review";
export type GuardianAiLevel = "safe" | "watch" | "verify" | "hold" | "critical";
export type GuardianDecisionSource = "scenario" | "transaction";

export interface GuardianTransactionEvaluationInput {
  amountVnd: number;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  content: string;
  timestamp?: string;
  location?: string;
  deviceTrust?: "trusted" | "new" | "suspicious";
  ipReputation?: "normal" | "suspicious" | "bad";
  loginMethod?: "password" | "face_id" | "otp";
  priorActions?: string[];
}

export interface GuardianAgentResult {
  agentName: GuardianAgentName;
  score: number;
  status: "waiting" | "processing" | "done";
  signals: string[];
  reasoning: string;
}

export interface GuardianTransactionEvent {
  userId: string;
  amountVnd: number;
  recipientId: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  content: string;
  timestamp: string;
  location: string;
  priorActions: string[];
  deviceInfo: {
    deviceId: string;
    isNew: boolean;
    hasVPN: boolean;
    isEmulator: boolean;
    isRooted: boolean;
    ipReputation: "normal" | "suspicious" | "bad";
  };
  sessionInfo: {
    sessionId: string;
    ageSeconds: number;
    loginMethod: "password" | "face_id" | "otp";
  };
}

export interface GuardianUserProfile {
  userId: string;
  label: string;
  knownRecipients: string[];
  verifiedLocations: string[];
  typicalLocations: string[];
  typicalHours: number[];
  typicalAmounts: {
    median: number;
    p75: number;
    p95: number;
  };
  recentTransferCount1h: number;
}

export interface GuardianBeneficiaryProfile {
  recipientId: string;
  isNewRecipient: boolean;
  hasBeenReported: boolean;
  isMuleCluster: boolean;
  isTrusted: boolean;
}

export interface GuardianScenario {
  id: GuardianScenarioId;
  label: string;
  summary: string;
  expectedAction: GuardianAction;
  transaction: GuardianTransactionEvent;
  userProfile: GuardianUserProfile;
  beneficiary: GuardianBeneficiaryProfile;
}

export interface GuardianRiskDecision {
  transactionId: string;
  source: GuardianDecisionSource;
  scenarioId?: GuardianScenarioId;
  aiLevel: GuardianAiLevel;
  policyLevel: PolicyLevel;
  riskScore: number;
  knightScore: number;
  action: GuardianAction;
  reasonCodes: string[];
  explanation: string;
  agentResults: GuardianAgentResult[];
  requiresStepUp: boolean;
  requiresChecklist: boolean;
  requiresReview: boolean;
}
