import type { KnightEventType } from "../domain/types";

const startEvents: KnightEventType[] = ["RISK_EVENT_RECEIVED"];

export const reviewEvents: KnightEventType[] = ["AUTO_SUSPEND_ALLOWED", "PUSH_SENT"];
export const highRiskEvents: KnightEventType[] = [...startEvents, ...reviewEvents];

export const fraudResolutionEvents: KnightEventType[] = [
  "BIOMETRIC_SUCCESS_FRAUD",
  "TERMINATE_CARD_SUCCESS",
  "ISSUE_CARD_SUCCESS",
];

export const fraudCaseEvents: KnightEventType[] = [
  ...fraudResolutionEvents,
  "CREATE_CASE_SUCCESS",
];

const trustRecoveryEvents: KnightEventType[] = [
  "OPEN_NEXT_MORNING_RECOVERY",
  "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS",
  "ASSESS_TRUST_RECOVERY_SUCCESS",
  "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS",
  "CUSTOMER_ACCEPTS_ESSENTIAL_CASHBACK",
  "ACTIVATE_ESSENTIAL_CASHBACK_SUCCESS",
  "OBSERVE_RECOVERY_SUCCESS",
  "COMPLETE_REACT_CYCLE",
];

const fullFraudStoryEvents: KnightEventType[] = [
  ...highRiskEvents,
  "CUSTOMER_TAPS_FRAUD",
  "REQUEST_BIOMETRIC",
  ...fraudCaseEvents,
  ...trustRecoveryEvents,
];

export const legitimateResolutionEvents: KnightEventType[] = [
  "BIOMETRIC_SUCCESS_LEGIT",
  "UNSUSPEND_CARD_SUCCESS",
  "WHITELIST_SESSION_SUCCESS",
  "ENHANCED_MONITORING_STARTED",
];

export const timeoutEvents: KnightEventType[] = [
  ...highRiskEvents,
  "CUSTOMER_RESPONSE_TIMEOUT",
  "ESCALATE_FRAUD_OPS",
  "KEEP_CARD_SUSPENDED",
];

export function getShotEvents(shot: string | null): KnightEventType[] | null {
  switch (shot) {
    case "reason":
    case "alert":
      return ["RISK_EVENT_RECEIVED"];
    case "fraud-review":
      return highRiskEvents;
    case "faceid":
      return [...highRiskEvents, "CUSTOMER_TAPS_FRAUD", "REQUEST_BIOMETRIC"];
    case "card":
      return [
        ...highRiskEvents,
        "CUSTOMER_TAPS_FRAUD",
        "REQUEST_BIOMETRIC",
        ...fraudResolutionEvents.slice(0, 3),
      ];
    case "case":
      return [...highRiskEvents, "CUSTOMER_TAPS_FRAUD", "REQUEST_BIOMETRIC", ...fraudCaseEvents];
    case "behavior":
    case "insight":
      return [
        ...highRiskEvents,
        "CUSTOMER_TAPS_FRAUD",
        "REQUEST_BIOMETRIC",
        ...fraudCaseEvents,
        "OPEN_NEXT_MORNING_RECOVERY",
        "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS",
      ];
    case "morning":
      return [
        ...highRiskEvents,
        "CUSTOMER_TAPS_FRAUD",
        "REQUEST_BIOMETRIC",
        ...fraudCaseEvents,
        "OPEN_NEXT_MORNING_RECOVERY",
      ];
    case "assessment":
    case "offer":
      return [
        ...highRiskEvents,
        "CUSTOMER_TAPS_FRAUD",
        "REQUEST_BIOMETRIC",
        ...fraudCaseEvents,
        "OPEN_NEXT_MORNING_RECOVERY",
        "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS",
        "ASSESS_TRUST_RECOVERY_SUCCESS",
      ];
    case "package":
    case "activated":
      return [
        ...highRiskEvents,
        "CUSTOMER_TAPS_FRAUD",
        "REQUEST_BIOMETRIC",
        ...fraudCaseEvents,
        "OPEN_NEXT_MORNING_RECOVERY",
        "OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS",
        "ASSESS_TRUST_RECOVERY_SUCCESS",
        "ACTIVATE_REASSURANCE_PACKAGE_SUCCESS",
      ];
    case "recovery":
    case "sentiment":
      return fullFraudStoryEvents;
    case "timeout":
      return timeoutEvents;
    default:
      return null;
  }
}
