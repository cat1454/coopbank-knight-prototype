import type { PolicyLevel } from "../knight/types";

export type { RiskAssessment, RiskSignal } from "../knight/types";

export type ThreatLensScenarioId =
  | "low_risk"
  | "medium_risk"
  | "high_risk"
  | "critical_risk"
  | "false_positive"
  | "feedback_attack"
  | "scam_remote_access"
  | "scam_fake_job"
  | "scam_phishing"
  | "scam_romance";

export type ThreatLensAgentName = "transaction" | "device" | "behavioral" | "beneficiary" | "scam";
export type ThreatLensAction = "allow" | "warn" | "delay" | "step_up" | "block" | "review";
export type ThreatLensAiLevel = "safe" | "watch" | "verify" | "hold" | "critical";
export type ThreatLensDecisionSource = "scenario" | "transaction";

export interface ThreatLensTransactionEvaluationInput {
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

export interface ThreatLensAgentResult {
  agentName: ThreatLensAgentName;
  score: number;
  status: "waiting" | "processing" | "done";
  signals: string[];
  reasoning: string;
}

export interface ThreatLensTransactionEvent {
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

export interface ThreatLensUserProfile {
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

export interface ThreatLensBeneficiaryProfile {
  recipientId: string;
  isNewRecipient: boolean;
  hasBeenReported: boolean;
  isMuleCluster: boolean;
  isTrusted: boolean;
}

export interface ThreatLensScenario {
  id: ThreatLensScenarioId;
  label: string;
  summary: string;
  expectedAction: ThreatLensAction;
  transaction: ThreatLensTransactionEvent;
  userProfile: ThreatLensUserProfile;
  beneficiary: ThreatLensBeneficiaryProfile;
}

export interface ThreatLensRiskDecision {
  transactionId: string;
  source: ThreatLensDecisionSource;
  scenarioId?: ThreatLensScenarioId;
  aiLevel: ThreatLensAiLevel;
  policyLevel: PolicyLevel;
  riskScore: number;
  knightScore: number;
  action: ThreatLensAction;
  reasonCodes: string[];
  explanation: string;
  agentResults: ThreatLensAgentResult[];
  requiresStepUp: boolean;
  requiresChecklist: boolean;
  requiresReview: boolean;
}
