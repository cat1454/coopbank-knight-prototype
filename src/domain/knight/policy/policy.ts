import type { KnightScenarioState } from "../types";
import { isAccountSecuredForRecovery, shouldActivateReassurancePackage } from "../recovery/trustRecovery";

export type KnightActionName =
  | "risk.evaluate"
  | "notification.push"
  | "card.suspend"
  | "card.unsuspend"
  | "card.terminate"
  | "card.issueNewVirtualCard"
  | "auth.verifyBiometric"
  | "case.createFraudCase"
  | "behavior.observePostIncident"
  | "trustRecovery.calculate"
  | "reassurance.activateSafetySupport"
  | "cashback.activateEssential"
  | "recovery.observe"
  | "fraudOps.escalate";

export function canAutoSuspend(state: KnightScenarioState) {
  return (
    state.riskAssessment.score >= state.riskAssessment.threshold &&
    state.riskAssessment.recommendedAction === "suspend" &&
    state.card.status === "active"
  );
}

export function canTerminateCard(state: KnightScenarioState) {
  return state.customerIntent === "fraud" && state.biometricStatus === "verified";
}

export function canIssueNewCard(state: KnightScenarioState) {
  return (
    state.card.status === "terminated" &&
    state.customerIntent === "fraud" &&
    state.biometricStatus === "verified"
  );
}

export function canObservePostIncidentBehavior(state: KnightScenarioState) {
  return state.currentState === "next_morning_recovery_ready" && isAccountSecuredForRecovery(state);
}

export function canAssessTrustRecovery(state: KnightScenarioState) {
  return (
    state.currentState === "post_incident_behavior_observed" &&
    !!state.postIncidentBehaviorSignals?.length
  );
}

export function canActivateReassurancePackage(state: KnightScenarioState) {
  return (
    state.currentState === "trust_recovery_assessed" &&
    !!state.trustRecoveryAssessment &&
    shouldActivateReassurancePackage(state, state.trustRecoveryAssessment)
  );
}

export function canActivateEssentialCashback(state: KnightScenarioState) {
  return (
    state.currentState === "reassurance_package_active" &&
    state.customer.personalizationConsent &&
    state.reassurancePackage?.essentialCashback.status === "consented"
  );
}

export function canObserveRecovery(state: KnightScenarioState) {
  return (
    state.currentState === "cashback_activated" &&
    state.reassurancePackage?.essentialCashback.status === "activated"
  );
}

export function canUnsuspend(state: KnightScenarioState) {
  return state.customerIntent === "legitimate" && state.biometricStatus === "verified";
}

export function deriveAllowedActions(state: KnightScenarioState): KnightActionName[] {
  const actions: KnightActionName[] = ["risk.evaluate"];

  if (canAutoSuspend(state)) {
    actions.push("card.suspend", "notification.push");
  }

  if (state.currentState === "biometric_required") {
    actions.push("auth.verifyBiometric");
  }

  if (canTerminateCard(state)) {
    actions.push("card.terminate");
  }

  if (canIssueNewCard(state)) {
    actions.push("card.issueNewVirtualCard");
  }

  if (state.newCard && state.customerIntent === "fraud") {
    actions.push("case.createFraudCase");
  }

  if (canObservePostIncidentBehavior(state)) {
    actions.push("behavior.observePostIncident");
  }

  if (canAssessTrustRecovery(state)) {
    actions.push("trustRecovery.calculate");
  }

  if (canActivateReassurancePackage(state)) {
    actions.push("reassurance.activateSafetySupport");
  }

  if (canActivateEssentialCashback(state)) {
    actions.push("cashback.activateEssential");
  }

  if (canObserveRecovery(state)) {
    actions.push("recovery.observe");
  }

  if (canUnsuspend(state)) {
    actions.push("card.unsuspend");
  }

  if (state.currentState === "customer_timeout") {
    actions.push("fraudOps.escalate");
  }

  return actions;
}
