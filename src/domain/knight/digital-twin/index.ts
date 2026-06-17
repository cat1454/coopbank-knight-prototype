/**
 * Public API của digital-twin domain module
 * Co-opBank KNIGHT · src/domain/knight/digital-twin/index.ts
 */

export type {
  ActiveOffer,
  AdjustedThresholds,
  BehavioralBaseline,
  BeneficiaryGraph,
  BeneficiaryNode,
  BeneficiaryRiskSignals,
  ConsentRecord,
  ConsentRegistry,
  ConsentScope,
  CurrentSession,
  CustomerDigitalTwin,
  DeviceTrustLevel,
  EmotionalState,
  IdentityContext,
  IncidentRecord,
  IpRisk,
  KnownDevice,
  PostIncidentBehaviorMetrics,
  RecoveryJourneyState,
  RecoveryMetrics,
  RecoveryPhase,
  RiskProfileTrend,
  RiskSnapshot,
  RiskTrendSummary,
  ScamTypology,
  SpendingCategory,
  SpendingTrend,
  SpendingWindow,
  TrustLevel,
  TrustScoreHistory,
} from "./twin.types";

export {
  canUseConsent,
  findBeneficiary,
  getAdjustedNotifyThreshold,
  getAdjustedSuspendThreshold,
  getAdjustedThresholds,
  getAdjustedTimeoutMinutes,
  getBeneficiaryRiskBonus,
  getEssentialSpendingShare,
  getGrantedScopes,
  getRecoveryOfferEligibility,
  getTopEssentialCategories,
  getTwinRiskSummary,
  isBeneficiaryFlagged,
  hasGeoAnomaly,
  isBiometricAvailable,
  isCurrentDeviceKnown,
  isNewBeneficiary,
  isTypicalHour,
} from "./twin.selectors";

export type { TwinRiskSummary } from "./twin.selectors";

export {
  createMinhAnTwin,
  getTwinById,
  listAllTwinIds,
  upsertTwin,
} from "./twin.factory";

export {
  appendRiskSnapshot,
  attachOffer,
  markRecovered,
  patchTwin,
  recordIncident,
  setElevatedMonitoring,
  transitionRecoveryPhase,
  updateBehaviorMetrics,
  updateCurrentSession,
  upsertBeneficiaryNode,
} from "./twin.updater";
