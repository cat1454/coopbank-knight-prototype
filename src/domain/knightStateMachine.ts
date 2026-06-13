import {
  demoBehaviorSignals,
  demoCard,
  demoCustomer,
  demoFraudCase,
  demoNewCard,
  demoReassurancePackage,
  demoRecoveryObservation,
  demoRiskAssessment,
  demoTrustRecoveryAssessment,
  demoTransaction,
} from "../data/demoScenario";
import { appendAuditEvent, resetAuditSequence } from "./audit";
import {
  canActivateEssentialCashback,
  canActivateReassurancePackage,
  canAssessTrustRecovery,
  canAutoSuspend,
  canIssueNewCard,
  canObservePostIncidentBehavior,
  canObserveRecovery,
  canTerminateCard,
  canUnsuspend,
} from "./policy";
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
      if (state.currentState !== "awaiting_customer_response") return state;
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
      if (state.currentState !== "awaiting_customer_response") return state;
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

    case "OPEN_NEXT_MORNING_RECOVERY":
      if (state.currentState !== "fraud_case_created" || !state.fraudCase || !state.newCard) {
        return state;
      }
      return {
        ...state,
        currentState: "next_morning_recovery_ready",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L0",
          actor: "KNIGHT",
          action: "recovery.openNextMorningWindow",
          result: "success",
          reason: "Phiên khẩn cấp ban đêm đã kết thúc; KNIGHT chờ đến 08:30 sáng hôm sau mới bắt đầu đánh giá phục hồi niềm tin",
          customerVisible: true,
          label: "Sáng hôm sau: mở phiên phục hồi",
        }),
      };

    case "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS": {
      if (!canObservePostIncidentBehavior(state)) return state;
      const withSafetyConfirmation = appendAuditEvent(state.auditEvents, {
        phase: "OBSERVE",
        policyLevel: "L0",
        actor: "KNIGHT",
        action: "account.confirmSecured",
        result: "success",
        reason: "Thẻ cũ đã khóa, thẻ thay thế đang hoạt động và hồ sơ tra soát đã được tạo trước khi phân tích phục hồi niềm tin",
        customerVisible: true,
        label: "Tài khoản đã được bảo vệ",
      });

      return {
        ...state,
        currentState: "post_incident_behavior_observed",
        postIncidentBehaviorSignals: demoBehaviorSignals,
        auditEvents: appendAuditEvent(withSafetyConfirmation, {
          phase: "OBSERVE",
          policyLevel: "L0",
          actor: "KNIGHT",
          action: "behavior.observePostIncident",
          result: "success",
          reason: "Ghi nhận 5 tín hiệu hành vi sau sự cố mà không khẳng định cảm xúc là dữ kiện",
          customerVisible: true,
          label: "Thu thập tín hiệu hành vi",
        }),
      };
    }

    case "ASSESS_TRUST_RECOVERY_SUCCESS": {
      if (!canAssessTrustRecovery(state)) return state;
      const withScore = appendAuditEvent(state.auditEvents, {
        phase: "REASON",
        policyLevel: "L2",
        actor: "KNIGHT",
        action: "trustRecovery.calculate",
        result: "success",
        reason: "Tổng trọng số tín hiệu hành vi có thể kiểm chứng tạo Điểm Nhu Cầu Phục Hồi 82/100",
        customerVisible: true,
        label: "Tính điểm nhu cầu phục hồi: 82/100",
      });

      return {
        ...state,
        currentState: "trust_recovery_assessed",
        trustRecoveryAssessment: {
          ...demoTrustRecoveryAssessment,
          essentialSpendingCategories: state.customer.personalizationConsent
            ? demoTrustRecoveryAssessment.essentialSpendingCategories
            : undefined,
        },
        auditEvents: appendAuditEvent(withScore, {
          phase: "REASON",
          policyLevel: "L2",
          actor: "KNIGHT",
          action: "trustRecovery.checkThreshold",
          result: "success",
          reason: "Điểm 82 vượt ngưỡng 70 nên khách hàng đủ điều kiện nhận hỗ trợ an toàn",
          customerVisible: true,
          label: "Đối chiếu ngưỡng kích hoạt",
        }),
      };
    }

    case "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS": {
      if (!canActivateReassurancePackage(state)) return state;
      const reassurancePackage = {
        ...demoReassurancePackage,
        essentialCashback: {
          ...demoReassurancePackage.essentialCashback,
          status: state.customer.personalizationConsent
            ? ("pending_consent" as const)
            : ("unavailable" as const),
        },
      };
      const withBenefitSelection = appendAuditEvent(state.auditEvents, {
        phase: "REASON",
        policyLevel: "L2",
        actor: "KNIGHT",
        action: "reassurance.selectBenefits",
        result: "success",
        reason: "Chọn bảo vệ, cảnh báo realtime, hỗ trợ ưu tiên, hoàn phí có điều kiện, báo cáo an toàn và nhóm chi tiêu thiết yếu phù hợp",
        customerVisible: true,
        label: "Chọn hỗ trợ đúng nhu cầu",
      });

      return {
        ...state,
        currentState: "reassurance_package_active",
        reassurancePackage,
        auditEvents: appendAuditEvent(withBenefitSelection, {
          phase: "ACT",
          policyLevel: "L2",
          actor: "KNIGHT",
          action: "reassurance.activateSafetySupport",
          result: "success",
          reason: "Hỗ trợ an toàn tự động chỉ được bật sau khi tài khoản an toàn và điểm phục hồi vượt ngưỡng",
          customerVisible: true,
          label: "Kích hoạt Gói Phục Hồi An Tâm",
        }),
      };
    }

    case "CUSTOMER_ACCEPTS_ESSENTIAL_CASHBACK":
      if (
        state.currentState !== "reassurance_package_active" ||
        !state.customer.personalizationConsent ||
        state.reassurancePackage?.essentialCashback.status !== "pending_consent"
      ) {
        return state;
      }
      return {
        ...state,
        reassurancePackage: {
          ...state.reassurancePackage,
          essentialCashback: {
            ...state.reassurancePackage.essentialCashback,
            status: "consented",
          },
        },
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L1",
          actor: "Customer",
          action: "customer.consentEssentialCashback",
          result: "success",
          reason: "Khách hàng xác nhận đồng ý cá nhân hóa hoàn tiền cho chi tiêu thiết yếu",
          customerVisible: true,
          label: "Khách xác nhận hoàn tiền thiết yếu",
        }),
      };

    case "ACTIVATE_ESSENTIAL_CASHBACK_SUCCESS":
      if (!canActivateEssentialCashback(state) || !state.reassurancePackage) return state;
      return {
        ...state,
        currentState: "cashback_activated",
        reassurancePackage: {
          ...state.reassurancePackage,
          essentialCashback: {
            ...state.reassurancePackage.essentialCashback,
            status: "activated",
          },
        },
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L1",
          actor: "KNIGHT",
          action: "cashback.activateEssential",
          result: "success",
          reason: "Kích hoạt hoàn tiền 10% đúng các nhóm đã được đồng ý: Điện, Nước và Siêu thị",
          customerVisible: true,
          label: "Kích hoạt hoàn tiền thiết yếu",
        }),
      };

    case "OBSERVE_RECOVERY_SUCCESS":
      if (!canObserveRecovery(state)) return state;
      return {
        ...state,
        currentState: "recovery_observed",
        recoveryObservation: demoRecoveryObservation,
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L0",
          actor: "KNIGHT",
          action: "recovery.observe",
          result: "success",
          reason: "Khách hàng tiếp tục thanh toán thiết yếu và số lần kiểm tra số dư lặp lại giảm 60%",
          customerVisible: true,
          label: "Quan sát tín hiệu phục hồi",
        }),
      };

    case "COMPLETE_REACT_CYCLE":
      if (state.currentState !== "recovery_observed" || !state.recoveryObservation) return state;
      return {
        ...state,
        currentState: "react_cycle_completed",
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "OBSERVE",
          policyLevel: "L0",
          actor: "KNIGHT",
          action: "react.complete",
          result: "success",
          reason: "Vòng phục hồi hoàn tất bằng bằng chứng hành vi quan sát được thay vì một điểm cảm xúc suy đoán",
          customerVisible: false,
          label: "ReAct cycle complete",
        }),
      };

    case "AUDIT_COMPLETE":
      if (
        state.currentState !== "reassurance_package_active" &&
        state.currentState !== "cashback_activated" &&
        state.currentState !== "recovery_observed" &&
        state.currentState !== "react_cycle_completed" &&
        state.currentState !== "enhanced_monitoring_30m"
      ) {
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
        enhancedMonitoringUntil: "2026-06-01T02:33:18+07:00",
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
          reason: "Khách hàng không phản hồi cảnh báo push",
          customerVisible: true,
          label: "Hết thời gian chờ",
        }),
      };

    case "ESCALATE_FRAUD_OPS":
      if (state.currentState !== "customer_timeout") return state;
      return {
        ...state,
        currentState: "fraud_ops_escalated",
        fraudCase: { ...demoFraudCase, status: "escalated", createdAt: "2026-06-12T12:00:00+07:00" },
        auditEvents: appendAuditEvent(state.auditEvents, {
          phase: "ACT",
          policyLevel: "L4",
          actor: "KNIGHT",
          action: "fraudOps.escalate",
          result: "success",
          reason: "Yêu cầu đội ngũ kiểm tra Fraud Ops xử lý thủ công do khách hàng không phản hồi",
          customerVisible: true,
          label: "Chuyển Fraud Ops xử lý",
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
          reason: "Giữ trạng thái khóa thẻ tạm thời để bảo vệ tài sản",
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
      return "virtual-card";
    case "fraud_case_created":
      return "guard";
    case "next_morning_recovery_ready":
      return "next-morning-recovery";
    case "post_incident_behavior_observed":
      return "post-incident-behavior";
    case "trust_recovery_assessed":
      return "trust-recovery-assessment";
    case "reassurance_package_active":
    case "cashback_activated":
    case "recovery_observed":
    case "react_cycle_completed":
      return "reassurance-package";
    case "audit_complete":
      return "guard";
    case "card_unsuspended":
    case "device_session_whitelisted":
    case "enhanced_monitoring_30m":
      return "legitimate-resolution";
    case "customer_timeout":
    case "fraud_ops_escalated":
    case "card_remains_suspended":
      return "timeout-escalation";
    default:
      return "guard";
  }
}
