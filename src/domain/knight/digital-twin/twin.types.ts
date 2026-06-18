/**
 * Customer Digital Twin — Type Definitions
 * Co-opBank KNIGHT · src/domain/knight/digital-twin/twin.types.ts
 *
 * Pure TypeScript — no React, no browser APIs.
 * Each interface represents one dimension of the customer's digital profile.
 * KNIGHT reads these to make explainable, policy-bound decisions.
 */

// ─────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────

export type ConsentScope =
  | "spending_analysis"       // phân tích chi tiêu để cá nhân hóa
  | "device_behavioral"       // theo dõi thiết bị/hành vi
  | "beneficiary_graph"       // lưu đồ thị người nhận
  | "post_incident_offer"     // tạo offer sau sự cố
  | "push_critical_bypass"    // bypass silent mode cho critical alert
  | "third_party_merchant_data"; // chia sẻ với đối tác

export type DeviceTrustLevel = "trusted" | "watch" | "new" | "suspicious";
export type IpRisk = "normal" | "vpn" | "tor" | "unknown";
export type SpendingTrend = "increasing" | "stable" | "decreasing";
export type ScamTypology =
  | "pig_butchering"    // lừa đầu tư dần dần (thả mồi, kéo dài)
  | "fake_merchant"     // merchant giả mạo thương hiệu
  | "romance_scam"      // lừa tình cảm
  | "job_scam"          // việc làm giả
  | "impersonation"     // giả mạo cơ quan nhà nước / ngân hàng
  | "none";

export type EmotionalState =
  | "anxious"    // vừa xảy ra sự cố, lo lắng
  | "relieved"   // đã xử lý xong, bớt lo
  | "engaged"    // nhận offer, đang tương tác tích cực
  | "recovered"  // trở lại hoạt động bình thường
  | "churned";   // ngừng dùng app sau sự cố

export type RecoveryPhase =
  | "no_incident"      // không có sự cố đang xử lý
  | "incident_active"  // đang trong luồng xử lý sự cố
  | "post_incident"    // sự cố xong, theo dõi phục hồi
  | "recovered";       // phục hồi hoàn toàn

export type TrustLevel = "high" | "standard" | "watch" | "restricted";

// ─────────────────────────────────────────────
// [1] IdentityContext
// ─────────────────────────────────────────────
// Trả lời: "KNIGHT đang bảo vệ ai, trên thiết bị nào?"

export interface KnownDevice {
  fingerprint: string;
  label: string;              // "iPhone của Minh An"
  platform: string;           // "iOS 17", "Android 14"
  lastSeenAt: string;         // ISO 8601
  trustLevel: DeviceTrustLevel;
  enrolledBiometric: boolean;
}

export interface CurrentSession {
  deviceFingerprint: string;
  ipAddress: string;
  ipRisk: IpRisk;
  geoCountry: string;         // "VN", "SG", "US"
  geoCity: string;
  startedAt: string;
  isKnownDevice: boolean;
  isKnownGeo: boolean;
  loginMethod: "password" | "face_id" | "fingerprint" | "otp";
}

export interface IdentityContext {
  customerId: string;
  knownDevices: KnownDevice[];
  currentSession: CurrentSession;
  biometricStatus: "registered" | "not_registered" | "expired";
  biometricMethod: "face_id" | "fingerprint" | "none";
}

// ─────────────────────────────────────────────
// [2] BehavioralBaseline
// ─────────────────────────────────────────────
// Trả lời: "Bình thường họ mua gì, khi nào, bao nhiêu?"

export interface SpendingWindow {
  totalVnd: number;
  txCount: number;
  avgVnd: number;
}

export interface SpendingCategory {
  categoryId: string;
  categoryLabel: string;
  last30Days: SpendingWindow;
  last90Days: SpendingWindow;
  last180Days: SpendingWindow;
  shareOf90DayTotal: number;   // 0..1 — tỷ trọng trong tổng chi tiêu 90 ngày
  isEssential: boolean;        // điện, nước, internet, nhu yếu phẩm
  trend: SpendingTrend;
}

export interface BehavioralBaseline {
  customerId: string;
  updatedAt: string;
  spendingByCategory: SpendingCategory[];
  typicalActiveHours: number[];          // [8, 9, 10, 19, 20, 21]
  typicalActiveDays: number[];           // [1,2,3,4,5] — weekday index (0=Sun)
  lastActiveAt: string;
  typicalAmountRange: {
    minVnd: number;
    maxVnd: number;
    p95Vnd: number;                      // 95th percentile — "thường không quá X"
  };
  typicalChannels: ("ecommerce" | "pos" | "in_app")[];
  typicalGeos: string[];                 // ["Ha Noi", "Ho Chi Minh"]
  avgPushResponseTimeMinutes: number;    // dùng để tính timeout động
  pushResponseRatePercent: number;       // 0..100
}

// ─────────────────────────────────────────────
// [3] BeneficiaryGraph
// ─────────────────────────────────────────────
// Trả lời: "Người nhận này quen không? Có dấu hiệu gì?"

export interface BeneficiaryRiskSignals {
  isNewRecipient: boolean;         // lần đầu giao dịch với khách này
  isReportedMule: boolean;         // có trong danh sách mule account
  isScamTypology: boolean;         // khớp scam pattern đã biết
  merchantCategoryRisk: "low" | "medium" | "high";
  clusterRisk: "isolated" | "known_cluster" | "mule_cluster";
  scamTypology: ScamTypology;
}

export interface BeneficiaryNode {
  id: string;
  type: "bank_account" | "merchant" | "phone_wallet";
  label: string;
  bankCode?: string;               // mã ngân hàng (VCB, TCB, ...)
  accountMasked?: string;          // "****1234"
  firstSeenAt: string;
  lastSeenAt: string;
  txCount: number;
  totalSentVnd: number;
  isFrequent: boolean;             // txCount >= 3 trong 90 ngày
  riskSignals: BeneficiaryRiskSignals;
}

export interface BeneficiaryGraphSummary {
  totalKnownBeneficiaries: number;
  newBeneficiariesLast30Days: number;
  flaggedBeneficiariesCount: number;
  muleContactCount: number;
}

export interface BeneficiaryGraph {
  customerId: string;
  updatedAt: string;
  nodes: BeneficiaryNode[];
  summary: BeneficiaryGraphSummary;
}

// ─────────────────────────────────────────────
// [4] TrustScoreHistory
// ─────────────────────────────────────────────
// Trả lời: "Khách từng bị gì? KNIGHT từng đúng không?"

export interface IncidentRecord {
  id: string;
  occurredAt: string;
  riskScore: number;
  customerIntent: "fraud" | "legitimate" | "timeout";
  resolution: "card_terminated" | "card_unsuspended" | "escalated" | "expired";
  wasFalsePositive: boolean;        // khách xác nhận legitimate sau khi bị suspend
  timeToRespondMinutes: number;
  policyLevelsReached: string[];    // ["L2", "L3"]
}

export interface AdjustedThresholds {
  suspendThreshold: number;         // default 800 — tăng nếu nhiều false positive
  notifyThreshold: number;          // default 700
  timeoutMinutes: number;           // default 5 — giảm nếu khách hay timeout
}

export interface TrustScoreHistory {
  customerId: string;
  updatedAt: string;
  currentTrustScore: number;        // 0–100; cao = đáng tin cậy
  trustLevel: TrustLevel;
  incidentHistory: IncidentRecord[];
  summary: {
    totalIncidents: number;
    confirmedFraudCount: number;
    falsePositiveCount: number;
    falsePositiveRate: number;      // 0..1
    lastIncidentAt?: string;
    daysSinceLastIncident?: number;
  };
  adjustedThresholds: AdjustedThresholds;
}

// ─────────────────────────────────────────────
// [5] ConsentRegistry
// ─────────────────────────────────────────────
// Trả lời: "KNIGHT có quyền dùng data này không?"

export interface ConsentRecord {
  scope: ConsentScope;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  version: string;                  // version của điều khoản tại thời điểm đồng ý
}

export interface ConsentRegistry {
  customerId: string;
  updatedAt: string;
  consents: ConsentRecord[];
}

// ─────────────────────────────────────────────
// [6] RiskProfileTrend
// ─────────────────────────────────────────────
// Trả lời: "Risk của khách đang tăng hay giảm?"

export interface RiskSnapshot {
  timestamp: string;
  score: number;                    // 0–1000
  trigger: "transaction" | "device_change" | "geo_anomaly" | "manual_review" | "incident_resolution";
  incidentId?: string;
}

export interface RiskTrendSummary {
  direction: "improving" | "stable" | "worsening";
  changePercent7Days: number;       // dương = tăng risk, âm = giảm
  changePercent30Days: number;
}

export interface RiskProfileTrend {
  customerId: string;
  updatedAt: string;
  currentScore: number;
  baselineScore: number;            // trung bình 90 ngày khi không có incident
  snapshots: RiskSnapshot[];        // tối đa 90 ngày gần nhất
  trend: RiskTrendSummary;
  elevatedRiskUntil?: string;       // ISO 8601 — đang trong enhanced monitoring
  nextReviewAt?: string;
}

// ─────────────────────────────────────────────
// [7] RecoveryJourneyState
// ─────────────────────────────────────────────
// Trả lời: "Cảm xúc và hành vi của khách sau sự cố là gì?"

export interface PostIncidentBehaviorMetrics {
  balanceCheckFrequencyIncrease: number;   // % tăng so với baseline
  transactionHistoryViewCount: number;
  supportChannelOpened: boolean;
  essentialPaymentResumed: boolean;
  appOpenFrequencyChange: number;          // % thay đổi
}

export interface ActiveOffer {
  offerId: string;
  offerType: "essential_cashback" | "fee_waiver" | "priority_support";
  activatedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "cancelled";
  cashbackRatePercent?: number;
  categories?: string[];
}

export interface RecoveryMetrics {
  daysToRecoverNormalSpending?: number;
  npsScore?: number;                       // 0–10, nếu khách đánh giá sau sự cố
  churned: boolean;
}

export interface RecoveryJourneyState {
  customerId: string;
  incidentId?: string;
  phase: RecoveryPhase;
  emotionalState: EmotionalState;
  phaseStartedAt?: string;
  behaviorMetrics?: PostIncidentBehaviorMetrics;
  activeOffer?: ActiveOffer;
  recoveryMetrics?: RecoveryMetrics;
}

// ─────────────────────────────────────────────
// Root: CustomerDigitalTwin
// ─────────────────────────────────────────────

export interface CustomerDigitalTwin {
  customerId: string;
  schemaVersion: string;           // "1.0" — bump khi thay đổi breaking schema
  createdAt: string;
  lastUpdatedAt: string;

  identity: IdentityContext;
  behavioral: BehavioralBaseline;
  beneficiaryGraph: BeneficiaryGraph;
  trustHistory: TrustScoreHistory;
  consent: ConsentRegistry;
  riskTrend: RiskProfileTrend;
  recoveryJourney: RecoveryJourneyState;
}
