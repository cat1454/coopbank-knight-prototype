export type PolicyLevel = "L0" | "L1" | "L2" | "L3" | "L4";
export type ReActPhase = "OBSERVE" | "REASON" | "ACT";
export type ActionResult = "success" | "failed" | "pending";
export type CustomerIntent = "unknown" | "fraud" | "legitimate" | "timeout";

export type CardStatus = "active" | "suspended" | "terminated";
export type ScenarioStateName =
  | "idle_monitoring"
  | "risk_detected"
  | "card_suspended_l2"
  | "awaiting_customer_response"
  | "customer_confirms_fraud"
  | "customer_confirms_legit"
  | "biometric_required"
  | "biometric_verified"
  | "card_terminated_l3"
  | "new_card_issued"
  | "fraud_case_created"
  | "next_morning_recovery_ready"
  | "post_incident_behavior_observed"
  | "trust_recovery_assessed"
  | "reassurance_package_active"
  | "cashback_activated"
  | "recovery_observed"
  | "react_cycle_completed"
  | "audit_complete"
  | "card_unsuspended"
  | "device_session_whitelisted"
  | "enhanced_monitoring_30m"
  | "customer_timeout"
  | "fraud_ops_escalated"
  | "card_remains_suspended";

export type VisibleScreen =
  | "guard"
  | "critical-alert"
  | "fraud-review"
  | "biometric-step-up"
  | "virtual-card"
  | "fraud-case-submitted"
  | "next-morning-recovery"
  | "post-incident-behavior"
  | "trust-recovery-assessment"
  | "reassurance-package"
  | "audit-timeline"
  | "legitimate-resolution"
  | "timeout-escalation";

export type KnightEventType =
  | "RISK_EVENT_RECEIVED"
  | "AUTO_SUSPEND_ALLOWED"
  | "PUSH_SENT"
  | "CUSTOMER_TAPS_FRAUD"
  | "CUSTOMER_TAPS_LEGIT"
  | "REQUEST_BIOMETRIC"
  | "BIOMETRIC_SUCCESS_FRAUD"
  | "BIOMETRIC_SUCCESS_LEGIT"
  | "BIOMETRIC_FAILED"
  | "TERMINATE_CARD_SUCCESS"
  | "ISSUE_CARD_SUCCESS"
  | "CREATE_CASE_SUCCESS"
  | "OPEN_NEXT_MORNING_RECOVERY"
  | "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS"
  | "ASSESS_TRUST_RECOVERY_SUCCESS"
  | "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS"
  | "CUSTOMER_ACCEPTS_ESSENTIAL_CASHBACK"
  | "ACTIVATE_ESSENTIAL_CASHBACK_SUCCESS"
  | "OBSERVE_RECOVERY_SUCCESS"
  | "COMPLETE_REACT_CYCLE"
  | "AUDIT_COMPLETE"
  | "UNSUSPEND_CARD_SUCCESS"
  | "WHITELIST_SESSION_SUCCESS"
  | "ENHANCED_MONITORING_STARTED"
  | "CUSTOMER_RESPONSE_TIMEOUT"
  | "ESCALATE_FRAUD_OPS"
  | "KEEP_CARD_SUSPENDED"
  | "RESET_SCENARIO";

export interface CustomerProfile {
  id: string;
  name: string;
  personalizationConsent: boolean;
}

export interface TransactionEvent {
  id: string;
  cardId: string;
  merchantName: string;
  merchantCategory: string;
  amountVnd: number;
  occurredAt: string;
  deviceFingerprint: string;
  ipCountry: string;
  ipRisk: "normal" | "vpn" | "tor" | "unknown";
  channel: "ecommerce" | "in_app" | "pos";
}

export interface RiskSignal {
  code: string;
  label: string;
  severity: "low" | "medium" | "high";
  customerText: string;
  auditText: string;
}

export interface RiskAssessment {
  id: string;
  score: number;
  threshold: number;
  level: "normal" | "elevated" | "high";
  signals: RiskSignal[];
  recommendedAction: "monitor" | "notify" | "verify" | "suspend";
  assessedAt: string;
  intelligence?: GuardianRiskDecision;
}

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

export interface VirtualCard {
  id: string;
  customerId: string;
  maskedPan: string;
  status: CardStatus;
  label: string;
  issuedAt: string;
  isDemo: boolean;
}

export interface FraudCase {
  id: string;
  customerId: string;
  cardId: string;
  amountVnd: number;
  status: "created" | "under_review" | "resolved" | "escalated";
  createdAt: string;
  expectedReviewWindow: string;
  transactions: string[];
}

export interface EssentialSpendingCategory {
  id: "electricity" | "water" | "supermarket";
  label: string;
  amountVnd: number;
  usagePattern: string;
}

export interface PostIncidentBehaviorSignal {
  id:
    | "balance_checks"
    | "transaction_history_views"
    | "account_protection_views"
    | "support_channel_opens"
    | "essential_payment_pause";
  label: string;
  observedAt: string;
  occurrenceCount: number;
  weight: number;
  evidence: string;
}

export interface TrustRecoveryAssessment {
  id: string;
  customerId: string;
  generatedAt: string;
  score: number;
  threshold: number;
  level: "standard" | "high";
  decision: "continue_monitoring" | "activate_reassurance_package";
  explanation: string;
  signals: PostIncidentBehaviorSignal[];
  essentialSpendingCategories?: EssentialSpendingCategory[];
}

export interface ReassuranceBenefit {
  id:
    | "account_protection"
    | "realtime_alerts"
    | "priority_support"
    | "conditional_fee_refund"
    | "safety_report";
  title: string;
  description: string;
  activation: "automatic";
  status: "active";
}

export interface ReassurancePackage {
  id: string;
  customerId: string;
  trigger: "trust_recovery_threshold";
  title: string;
  activatedAt: string;
  protectionDurationDays: number;
  status: "active";
  benefits: ReassuranceBenefit[];
  essentialCashback: {
    ratePercent: number;
    categories: string[];
    durationLabel: string;
    validThroughLabel: string;
    consentBasis: "personalization_consent";
    status: "pending_consent" | "consented" | "activated" | "unavailable";
  };
}

export interface RecoveryObservation {
  observedAt: string;
  essentialPaymentResumed: boolean;
  repeatedBalanceChecksChangePercent: number;
  supportCaseStatus: "priority_support_active";
  summary: string;
  reactCycleStatus: "COMPLETE";
}

export interface AuditEvent {
  id: string;
  caseId?: string;
  timestamp: string;
  phase: ReActPhase;
  policyLevel: PolicyLevel;
  actor: "KNIGHT" | "Customer" | "FraudOps" | "System";
  action: string;
  result: ActionResult;
  reason: string;
  customerVisible: boolean;
  label: string;
}

export interface KnightScenarioState {
  currentState: ScenarioStateName;
  customer: CustomerProfile;
  transaction: TransactionEvent;
  riskAssessment: RiskAssessment;
  card: VirtualCard;
  customerIntent: CustomerIntent;
  biometricStatus: "not_required" | "required" | "verified" | "failed";
  newCard?: VirtualCard;
  fraudCase?: FraudCase;
  postIncidentBehaviorSignals?: PostIncidentBehaviorSignal[];
  trustRecoveryAssessment?: TrustRecoveryAssessment;
  reassurancePackage?: ReassurancePackage;
  recoveryObservation?: RecoveryObservation;
  auditEvents: AuditEvent[];
  enhancedMonitoringUntil?: string;
}

export interface CreateFraudCaseInput {
  customerId: string;
  cardId: string;
  amountVnd: number;
  transactions: string[];
  status?: FraudCase["status"];
}
