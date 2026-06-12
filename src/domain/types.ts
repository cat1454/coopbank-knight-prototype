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
  | "recovery_offer_ready"
  | "audit_complete"
  | "card_unsuspended"
  | "device_session_whitelisted"
  | "enhanced_monitoring_30m"
  | "customer_timeout"
  | "voice_call_placed"
  | "voice_call_no_answer"
  | "voice_call_answered"
  | "sms_fallback_sent"
  | "fraud_ops_escalated"
  | "card_remains_suspended";

export type VisibleScreen =
  | "guard"
  | "critical-alert"
  | "fraud-review"
  | "biometric-step-up"
  | "virtual-card"
  | "recovery-offer"
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
  | "GENERATE_OFFER_SUCCESS"
  | "AUDIT_COMPLETE"
  | "UNSUSPEND_CARD_SUCCESS"
  | "WHITELIST_SESSION_SUCCESS"
  | "ENHANCED_MONITORING_STARTED"
  | "CUSTOMER_RESPONSE_TIMEOUT"
  | "VOICE_CALL_PLACED"
  | "VOICE_CALL_NO_ANSWER"
  | "VOICE_CALL_ANSWERED"
  | "SMS_SENT"
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
  recommendedAction: "monitor" | "notify" | "suspend";
  assessedAt: string;
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

export interface RecoveryOffer {
  id: string;
  customerId: string;
  trigger: "post_fraud_incident";
  title: string;
  body: string;
  cashbackRatePercent: number;
  durationDays: number;
  categories: string[];
  consentBasis: "personalization_consent";
  status: "ready" | "activated" | "dismissed";
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
  recoveryOffer?: RecoveryOffer;
  auditEvents: AuditEvent[];
  smsFallbackSent: boolean;
  fraudOpsEscalated: boolean;
  enhancedMonitoringUntil?: string;
}

export interface CreateFraudCaseInput {
  customerId: string;
  cardId: string;
  amountVnd: number;
  transactions: string[];
  status?: FraudCase["status"];
}
