import type {
  KnightScenarioState,
  PostIncidentBehaviorSignal,
  TrustRecoveryAssessment,
} from "./types";

export function calculateTrustRecoveryScore(signals: PostIncidentBehaviorSignal[]) {
  return Math.min(
    100,
    signals.reduce((total, signal) => total + signal.weight, 0),
  );
}

export function isAccountSecuredForRecovery(state: KnightScenarioState) {
  return (
    state.card.status === "terminated" &&
    state.newCard?.status === "active" &&
    state.fraudCase?.status === "created"
  );
}

export function shouldActivateReassurancePackage(
  state: KnightScenarioState,
  assessment: TrustRecoveryAssessment,
) {
  return isAccountSecuredForRecovery(state) && assessment.score >= assessment.threshold;
}
