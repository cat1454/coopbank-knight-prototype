
import type { KnightScenarioState, VisibleScreen } from "../types";

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
