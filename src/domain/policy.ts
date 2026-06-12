import type { KnightScenarioState } from "./types";

export type KnightActionName =
  | "risk.evaluate"
  | "notification.push"
  | "card.suspend"
  | "card.unsuspend"
  | "card.terminate"
  | "card.issueNewVirtualCard"
  | "auth.verifyBiometric"
  | "case.createFraudCase"
  | "personalization.generateRecoveryOffer"
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

export function canShowRecoveryOffer(state: KnightScenarioState) {
  return state.fraudCase?.status === "created" && state.customer.personalizationConsent;
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

  if (canShowRecoveryOffer(state)) {
    actions.push("personalization.generateRecoveryOffer");
  }

  if (canUnsuspend(state)) {
    actions.push("card.unsuspend");
  }

  if (state.currentState === "customer_timeout") {
    actions.push("fraudOps.escalate");
  }

  return actions;
}
