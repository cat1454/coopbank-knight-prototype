import {
  demoCard,
  demoCustomer,
  demoFraudCase,
  demoNewCard,
  demoRecoveryOffer,
  demoRiskAssessment,
  demoTimelineBase,
  demoTransaction,
} from "../data/demoScenario";
import { appendAuditEvent, resetAuditSequence } from "./audit";
import { canAutoSuspend, canIssueNewCard, canShowRecoveryOffer, canTerminateCard, canUnsuspend } from "./policy";
import type { KnightEventType, KnightScenarioState, VisibleScreen } from "./types";

export type { KnightEventType } from "./types";
export { deriveAllowedActions } from "./policy";

export function createInitialKnightState(): KnightScenarioState {
  resetAuditSequence();

  return {
    currentState: "idle_monitoring",
    customer: demoCustomer,
    transaction: demoTransaction,
    riskAssessment: demoRiskAssessment,
    card: demoCard,
    customerIntent: "unknown",
    biometricStatus: "not_required",
    auditEvents: [],
    smsFallbackSent: false,
    fraudOpsEscalated: false,
  };
}

export function runScenarioEvents(state: KnightScenarioState, events: KnightEventType[]) {
  return events.reduce((currentState, event) => dispatchScenarioEvent(currentState, event), state);
}

export function dispatchScenarioEvent(
  state: KnightScenarioState,
  event: KnightEventType,
): KnightScenarioState {
  if (event === "RESET_SCENARIO") {
    return createInitialKnightState();
  }

  switch (event) {
    case "RISK_EVENT_RECEIVED":
      return {
        ...state,
        currentState: "risk_detected",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L0",
          actor: "KNIGHT",
          action: "risk.evaluate",
          result: "success",
          reason: "Risk score 847 with device, IP, velocity and time anomalies",
          customerVisible: true,
          label: "4 giao dịch bất thường",
        }),
      };

    case "AUTO_SUSPEND_ALLOWED":
      if (!canAutoSuspend(state)) return state;
      return {
        ...state,
        currentState: "card_suspended_l2",
        card: { ...state.card, status: "suspended" },
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L2",
          actor: "KNIGHT",
          action: "card.suspend",
          result: "success",
          reason: "High-risk transaction crossed L2 reversible-action threshold",
          customerVisible: true,
          label: "Tạm khóa thẻ",
        }),
      };

    case "PUSH_SENT":
      if (state.currentState !== "card_suspended_l2") return state;
      return {
        ...state,
        currentState: "awaiting_customer_response",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L1",
          actor: "KNIGHT",
          action: "notification.pushSent",
          result: "success",
          reason: "Customer notified immediately after temporary suspension",
          customerVisible: false,
          label: "Gửi cảnh báo cho khách",
        }),
      };

    case "CUSTOMER_TAPS_FRAUD":
      if (state.currentState !== "awaiting_customer_response" && state.currentState !== "voice_call_answered") {
        return state;
      }
      return {
        ...state,
        currentState: "customer_confirms_fraud",
        customerIntent: "fraud",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L3",
          actor: "Customer",
          action: "customer.confirmFraud",
          result: "success",
          reason: "Customer confirms they did not make the transaction",
          customerVisible: true,
          label: "Customer confirms fraud",
        }),
      };

    case "CUSTOMER_TAPS_LEGIT":
      if (state.currentState !== "awaiting_customer_response" && state.currentState !== "voice_call_answered") {
        return state;
      }
      return {
        ...state,
        currentState: "customer_confirms_legit",
        customerIntent: "legitimate",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L3",
          actor: "Customer",
          action: "customer.confirmLegitimate",
          result: "success",
          reason: "Customer confirms this transaction is legitimate",
          customerVisible: true,
          label: "Customer confirms legitimate",
        }),
      };

    case "REQUEST_BIOMETRIC":
      if (state.customerIntent !== "fraud" && state.customerIntent !== "legitimate") return state;
      return {
        ...state,
        currentState: "biometric_required",
        biometricStatus: "required",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "REASON",
          policyLevel: "L3",
          actor: "System",
          action: "auth.requestBiometric",
          result: "pending",
          reason: "L3 action requires customer-controlled Face ID step-up",
          customerVisible: true,
          label: "Face ID required",
        }),
      };

    case "BIOMETRIC_SUCCESS_FRAUD":
      if (state.currentState !== "biometric_required" || state.customerIntent !== "fraud") return state;
      return markBiometricVerified(state);

    case "BIOMETRIC_SUCCESS_LEGIT":
      if (state.currentState !== "biometric_required" || state.customerIntent !== "legitimate") return state;
      return markBiometricVerified(state);

    case "BIOMETRIC_FAILED":
      if (state.currentState !== "biometric_required") return state;
      return {
        ...state,
        biometricStatus: "failed",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L3",
          actor: "System",
          action: "auth.verifyBiometric",
          result: "failed",
          reason: "Face ID did not verify the customer, so no L3 card action ran",
          customerVisible: true,
          label: "Face ID failed",
        }),
      };

    case "TERMINATE_CARD_SUCCESS":
      if (!canTerminateCard(state)) return state;
      return {
        ...state,
        currentState: "card_terminated_l3",
        card: { ...state.card, status: "terminated" },
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L3",
          actor: "KNIGHT",
          action: "card.terminate",
          result: "success",
          reason: "Customer confirmed fraud and Face ID was verified",
          customerVisible: true,
          label: "Khóa vĩnh viễn thẻ cũ",
        }),
      };

    case "ISSUE_CARD_SUCCESS":
      if (!canIssueNewCard(state)) return state;
      return {
        ...state,
        currentState: "new_card_issued",
        newCard: demoNewCard,
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L3",
          actor: "KNIGHT",
          action: "card.issueNewVirtualCard",
          result: "success",
          reason: "Replacement virtual card issued after old card termination",
          customerVisible: true,
          label: "Terminate + issue new card",
        }),
      };

    case "CREATE_CASE_SUCCESS":
      if (!state.newCard || state.customerIntent !== "fraud") return state;
      return {
        ...state,
        currentState: "fraud_case_created",
        fraudCase: demoFraudCase,
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L3",
          actor: "KNIGHT",
          action: "case.createFraudCase",
          result: "success",
          reason: "Fraud case opened for Fraud Ops review, including chargeback eligibility",
          customerVisible: true,
          label: "Fraud case created",
        }),
      };

    case "GENERATE_OFFER_SUCCESS":
      if (!canShowRecoveryOffer(state)) return state;
      return {
        ...state,
        currentState: "recovery_offer_ready",
        recoveryOffer: demoRecoveryOffer,
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L3",
          actor: "KNIGHT",
          action: "personalization.generateRecoveryOffer",
          result: "success",
          reason: "Offer generated only because personalization consent exists",
          customerVisible: true,
          label: "Recovery offer generated",
        }),
      };

    case "AUDIT_COMPLETE":
      if (state.currentState !== "recovery_offer_ready" && state.currentState !== "enhanced_monitoring_30m") {
        return state;
      }
      return { ...state, currentState: "audit_complete" };

    case "UNSUSPEND_CARD_SUCCESS":
      if (!canUnsuspend(state)) return state;
      return {
        ...state,
        currentState: "card_unsuspended",
        card: { ...state.card, status: "active" },
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L2",
          actor: "KNIGHT",
          action: "card.unsuspend",
          result: "success",
          reason: "Customer verified the transaction as legitimate",
          customerVisible: true,
          label: "Mở lại thẻ",
        }),
      };

    case "WHITELIST_SESSION_SUCCESS":
      if (state.currentState !== "card_unsuspended") return state;
      return {
        ...state,
        currentState: "device_session_whitelisted",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L2",
          actor: "KNIGHT",
          action: "session.whitelist",
          result: "success",
          reason: "Current device session temporarily trusted after Face ID",
          customerVisible: true,
          label: "Whitelist session tạm thời",
        }),
      };

    case "ENHANCED_MONITORING_STARTED":
      if (state.currentState !== "device_session_whitelisted") return state;
      return {
        ...state,
        currentState: "enhanced_monitoring_30m",
        enhancedMonitoringUntil: "2025-06-01T02:33:18+07:00",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L2",
          actor: "KNIGHT",
          action: "monitoring.enhanced30m",
          result: "success",
          reason: "Enhanced monitoring starts for thirty minutes after false positive resolution",
          customerVisible: true,
          label: "Giám sát tăng cường 30 phút",
        }),
      };

    case "CUSTOMER_RESPONSE_TIMEOUT":
      if (state.currentState !== "awaiting_customer_response") return state;
      return {
        ...state,
        currentState: "customer_timeout",
        customerIntent: "timeout",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L2",
          actor: "System",
          action: "customer.timeout",
          result: "success",
          reason: "Customer did not respond within the urgent 3-5 second window",
          customerVisible: true,
          label: "Customer timeout",
        }),
      };

    case "VOICE_CALL_PLACED":
      if (state.currentState !== "customer_timeout") return state;
      return {
        ...state,
        currentState: "voice_call_placed",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L1",
          actor: "KNIGHT",
          action: "notification.voiceCall",
          result: "success",
          reason: "Automated voice call placed after the urgent push alert received no response",
          customerVisible: true,
          label: "Automated voice call placed",
        }),
      };

    case "VOICE_CALL_NO_ANSWER":
      if (state.currentState !== "voice_call_placed") return state;
      return {
        ...state,
        currentState: "voice_call_no_answer",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L1",
          actor: "System",
          action: "notification.voiceNoAnswer",
          result: "success",
          reason: "Automated call was not answered, so SMS fallback is now allowed",
          customerVisible: true,
          label: "Voice call no-answer",
        }),
      };

    case "VOICE_CALL_ANSWERED":
      if (state.currentState !== "voice_call_placed") return state;
      return {
        ...state,
        currentState: "voice_call_answered",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L1",
          actor: "System",
          action: "notification.voiceAnswered",
          result: "success",
          reason: "Customer answered the automated call and was directed back to the app",
          customerVisible: true,
          label: "Voice call answered",
        }),
      };

    case "SMS_SENT":
      if (state.currentState !== "voice_call_no_answer") return state;
      return {
        ...state,
        currentState: "sms_fallback_sent",
        smsFallbackSent: true,
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L1",
          actor: "KNIGHT",
          action: "notification.smsFallback",
          result: "success",
          reason: "SMS fallback sent only after the automated call was not answered",
          customerVisible: true,
          label: "SMS fallback sent",
        }),
      };

    case "ESCALATE_FRAUD_OPS":
      if (state.currentState !== "sms_fallback_sent") return state;
      return {
        ...state,
        currentState: "fraud_ops_escalated",
        fraudOpsEscalated: true,
        fraudCase: { ...demoFraudCase, status: "escalated", createdAt: demoTimelineBase.escalatedAt },
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L4",
          actor: "KNIGHT",
          action: "fraudOps.escalate",
          result: "success",
          reason: "Human Fraud Ops review required because customer did not respond",
          customerVisible: true,
          label: "Fraud Ops escalated",
        }),
      };

    case "KEEP_CARD_SUSPENDED":
      if (state.currentState !== "fraud_ops_escalated") return state;
      return {
        ...state,
        currentState: "card_remains_suspended",
        card: { ...state.card, status: "suspended" },
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L2",
          actor: "KNIGHT",
          action: "card.keepSuspended",
          result: "success",
          reason: "Timeout path keeps the reversible suspension and does not terminate card",
          customerVisible: true,
          label: "Thẻ vẫn đang tạm khóa",
        }),
      };

    default:
      return state;
  }
}

function markBiometricVerified(state: KnightScenarioState): KnightScenarioState {
  return {
    ...state,
    currentState: "biometric_verified",
    biometricStatus: "verified",
    auditEvents: appendAuditEvent(state.auditEvents, {
      phase: "ACT",
      policyLevel: "L3",
      actor: "System",
      action: "auth.verifyBiometric",
      result: "success",
      reason: "Face ID verified the customer before any irreversible action",
      customerVisible: true,
      label: "Face ID verified",
    }),
  };
}

export function getVisibleScreen(state: KnightScenarioState): VisibleScreen {
  switch (state.currentState) {
    case "idle_monitoring":
      return "guard";
    case "risk_detected":
      return "critical-alert";
    case "card_suspended_l2":
    case "awaiting_customer_response":
    case "customer_confirms_fraud":
    case "customer_confirms_legit":
      return "fraud-review";
    case "biometric_required":
    case "biometric_verified":
      return "biometric-step-up";
    case "card_terminated_l3":
    case "new_card_issued":
    case "fraud_case_created":
      return "virtual-card";
    case "recovery_offer_ready":
      return "recovery-offer";
    case "audit_complete":
      return "audit-timeline";
    case "card_unsuspended":
    case "device_session_whitelisted":
    case "enhanced_monitoring_30m":
      return "legitimate-resolution";
    case "customer_timeout":
    case "voice_call_placed":
    case "voice_call_no_answer":
    case "sms_fallback_sent":
    case "fraud_ops_escalated":
    case "card_remains_suspended":
      return "timeout-escalation";
    case "voice_call_answered":
      return "fraud-review";
    default:
      return "guard";
  }
}
