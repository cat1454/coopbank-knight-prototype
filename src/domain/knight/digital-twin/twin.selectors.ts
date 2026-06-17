/**
 * Rule-based selectors cho CustomerDigitalTwin
 * Co-opBank KNIGHT · src/domain/knight/digital-twin/twin.selectors.ts
 *
 * Pure functions — không có side effects, không import React.
 * KNIGHT gọi các hàm này khi cần ra quyết định.
 * Risk adjustment là SEMI-DYNAMIC: dùng rule-based logic từ lịch sử thực,
 * không hardcode hoàn toàn — nhưng cũng không dùng ML runtime.
 */

import type {
  AdjustedThresholds,
  BeneficiaryNode,
  ConsentScope,
  CustomerDigitalTwin,
  SpendingCategory,
} from "./twin.types";

// ─────────────────────────────────────────────
// Consent checks
// ─────────────────────────────────────────────

/**
 * KNIGHT phải gọi hàm này trước khi dùng bất kỳ data cá nhân hóa nào.
 * Trả về false → tính năng liên quan tắt hoàn toàn, không chỉ ẩn UI.
 */
export function canUseConsent(twin: CustomerDigitalTwin, scope: ConsentScope): boolean {
  const record = twin.consent.consents.find((c) => c.scope === scope);
  if (!record) return false;
  if (!record.granted) return false;
  if (record.revokedAt) return false;
  return true;
}

/**
 * Lấy danh sách các scope đang được cấp phép.
 */
export function getGrantedScopes(twin: CustomerDigitalTwin): ConsentScope[] {
  return twin.consent.consents
    .filter((c) => c.granted && !c.revokedAt)
    .map((c) => c.scope);
}

// ─────────────────────────────────────────────
// Risk threshold adjustment (semi-dynamic)
// ─────────────────────────────────────────────

const BASE_SUSPEND_THRESHOLD = 800;
const BASE_TIMEOUT_MINUTES = 5;

/**
 * Tính ngưỡng risk tạm khóa thẻ dựa trên lịch sử false positive.
 *
 * Rule logic:
 * - Nếu false positive rate > 30% → tăng ngưỡng suspend lên 850
 *   (tránh làm phiền khách hàng hay bị cảnh báo nhầm)
 * - Nếu false positive rate > 50% → tăng lên 900 (đặt biệt thận trọng)
 * - Nếu có ≥ 2 confirmed fraud → giữ ngưỡng mặc định (khách từng bị thật)
 * - Ngưỡng tối đa là 900 để không vô hiệu hóa bảo vệ
 */
export function getAdjustedSuspendThreshold(twin: CustomerDigitalTwin): number {
  const { summary, adjustedThresholds } = twin.trustHistory;

  // Ưu tiên override từ server nếu có
  if (adjustedThresholds.suspendThreshold !== BASE_SUSPEND_THRESHOLD) {
    return Math.min(adjustedThresholds.suspendThreshold, 900);
  }

  const { falsePositiveRate, confirmedFraudCount } = summary;

  // Khách từng bị fraud thật → không nâng ngưỡng
  if (confirmedFraudCount >= 2) return BASE_SUSPEND_THRESHOLD;

  if (falsePositiveRate > 0.5) return Math.min(900, BASE_SUSPEND_THRESHOLD + 100);
  if (falsePositiveRate > 0.3) return Math.min(875, BASE_SUSPEND_THRESHOLD + 50);

  return BASE_SUSPEND_THRESHOLD;
}

/**
 * Tính ngưỡng notify dựa trên suspend threshold điều chỉnh.
 * Luôn giữ khoảng cách 100 điểm dưới suspend threshold.
 */
export function getAdjustedNotifyThreshold(twin: CustomerDigitalTwin): number {
  const suspend = getAdjustedSuspendThreshold(twin);
  return Math.max(600, suspend - 100);
}

/**
 * Tính timeout chờ phản hồi khách dựa trên lịch sử push response.
 *
 * Rule logic:
 * - Base: 5 phút
 * - Nếu avgPushResponseTime > 3 phút → tăng timeout lên 8 phút
 * - Nếu pushResponseRate < 50% → tăng thêm 2 phút (khách ít phản hồi push)
 * - Nếu có incident timeout trước đó → giảm xuống 4 phút (escalate nhanh hơn)
 * - Giới hạn: tối thiểu 3 phút, tối đa 10 phút
 */
export function getAdjustedTimeoutMinutes(twin: CustomerDigitalTwin): number {
  const { avgPushResponseTimeMinutes, pushResponseRatePercent } = twin.behavioral;
  const { incidentHistory, adjustedThresholds } = twin.trustHistory;

  if (adjustedThresholds.timeoutMinutes !== BASE_TIMEOUT_MINUTES) {
    return Math.min(Math.max(adjustedThresholds.timeoutMinutes, 3), 10);
  }

  const hadPriorTimeout = incidentHistory.some((i) => i.customerIntent === "timeout");
  let timeout = BASE_TIMEOUT_MINUTES;

  if (avgPushResponseTimeMinutes > 3) timeout += 3;
  if (pushResponseRatePercent < 50) timeout += 2;
  if (hadPriorTimeout) timeout -= 1;

  return Math.min(Math.max(timeout, 3), 10);
}

/**
 * Trả về toàn bộ ngưỡng đã điều chỉnh (convenience wrapper).
 */
export function getAdjustedThresholds(twin: CustomerDigitalTwin): AdjustedThresholds {
  return {
    suspendThreshold: getAdjustedSuspendThreshold(twin),
    notifyThreshold: getAdjustedNotifyThreshold(twin),
    timeoutMinutes: getAdjustedTimeoutMinutes(twin),
  };
}

// ─────────────────────────────────────────────
// Identity & session checks
// ─────────────────────────────────────────────

/**
 * Thiết bị hiện tại có phải thiết bị đã biết không?
 */
export function isCurrentDeviceKnown(twin: CustomerDigitalTwin): boolean {
  return twin.identity.currentSession.isKnownDevice;
}

/**
 * Session hiện tại có IP/geo bất thường không?
 */
export function hasGeoAnomaly(twin: CustomerDigitalTwin): boolean {
  const { isKnownGeo, ipRisk, geoCountry } = twin.identity.currentSession;
  if (!isKnownGeo) return true;
  if (ipRisk === "vpn" || ipRisk === "tor") return true;
  // Nếu không phải VN và không có trong typical geos
  if (geoCountry !== "VN" && !twin.behavioral.typicalGeos.includes(geoCountry)) return true;
  return false;
}

/**
 * Giờ hiện tại có nằm trong typical active hours không?
 */
export function isTypicalHour(twin: CustomerDigitalTwin, hourUtc7: number): boolean {
  return twin.behavioral.typicalActiveHours.includes(hourUtc7);
}

/**
 * Biometric đã đăng ký và hợp lệ?
 */
export function isBiometricAvailable(twin: CustomerDigitalTwin): boolean {
  return twin.identity.biometricStatus === "registered";
}

// ─────────────────────────────────────────────
// Beneficiary checks
// ─────────────────────────────────────────────

/**
 * Tìm beneficiary node theo id.
 */
export function findBeneficiary(twin: CustomerDigitalTwin, beneficiaryId: string): BeneficiaryNode | undefined {
  return twin.beneficiaryGraph.nodes.find((n) => n.id === beneficiaryId);
}

/**
 * Người nhận này có phải lần đầu không?
 */
export function isNewBeneficiary(twin: CustomerDigitalTwin, beneficiaryId: string): boolean {
  const node = findBeneficiary(twin, beneficiaryId);
  if (!node) return true;                       // không có trong graph = mới
  return node.riskSignals.isNewRecipient;
}

/**
 * Người nhận có dấu hiệu nguy hiểm không (mule, scam)?
 */
export function isBeneficiaryFlagged(twin: CustomerDigitalTwin, beneficiaryId: string): boolean {
  const node = findBeneficiary(twin, beneficiaryId);
  if (!node) return false;
  return (
    node.riskSignals.isReportedMule ||
    node.riskSignals.isScamTypology ||
    node.riskSignals.clusterRisk === "mule_cluster"
  );
}

/**
 * Tính điểm risk bổ sung từ beneficiary (0–200 điểm thêm vào composite score).
 *
 * Rule:
 * - Người nhận mới: +60
 * - Merchant category risk high: +50
 * - Được report là mule: +120
 * - Khớp scam typology: +100
 * - Mule cluster: +80
 */
export function getBeneficiaryRiskBonus(twin: CustomerDigitalTwin, beneficiaryId: string): number {
  const node = findBeneficiary(twin, beneficiaryId);
  if (!node) return 60; // người nhận mới, không có lịch sử → +60

  const signals = node.riskSignals;
  let bonus = 0;

  if (signals.isNewRecipient) bonus += 60;
  if (signals.merchantCategoryRisk === "high") bonus += 50;
  else if (signals.merchantCategoryRisk === "medium") bonus += 25;
  if (signals.isReportedMule) bonus += 120;
  if (signals.isScamTypology) bonus += 100;
  if (signals.clusterRisk === "mule_cluster") bonus += 80;
  else if (signals.clusterRisk === "known_cluster") bonus += 20;

  return Math.min(bonus, 200); // cap tại 200
}

// ─────────────────────────────────────────────
// Spending & personalization
// ─────────────────────────────────────────────

/**
 * Lấy các danh mục chi tiêu thiết yếu, sắp xếp theo tỷ trọng 90 ngày.
 * Chỉ trả về nếu có consent `spending_analysis`.
 */
export function getTopEssentialCategories(
  twin: CustomerDigitalTwin,
  maxCount = 3
): SpendingCategory[] {
  if (!canUseConsent(twin, "spending_analysis")) return [];

  return twin.behavioral.spendingByCategory
    .filter((c) => c.isEssential)
    .sort((a, b) => b.shareOf90DayTotal - a.shareOf90DayTotal)
    .slice(0, maxCount);
}

/**
 * Tổng tỷ trọng chi tiêu thiết yếu trong 90 ngày (0..1).
 * Dùng để quyết định tone của recovery offer.
 */
export function getEssentialSpendingShare(twin: CustomerDigitalTwin): number {
  if (!canUseConsent(twin, "spending_analysis")) return 0;
  return twin.behavioral.spendingByCategory
    .filter((c) => c.isEssential)
    .reduce((sum, c) => sum + c.shareOf90DayTotal, 0);
}

// ─────────────────────────────────────────────
// Recovery offer eligibility
// ─────────────────────────────────────────────

/**
 * Khách có đủ điều kiện nhận recovery offer không?
 *
 * Điều kiện:
 * 1. Phase = post_incident (sự cố đã xử lý xong)
 * 2. Có consent spending_analysis + post_incident_offer
 * 3. Chưa có active offer
 * 4. Có ít nhất 1 danh mục essential spending
 */
export function getRecoveryOfferEligibility(twin: CustomerDigitalTwin): {
  eligible: boolean;
  reason: string;
} {
  const { recoveryJourney } = twin;

  if (recoveryJourney.phase !== "post_incident") {
    return { eligible: false, reason: "Sự cố chưa được xử lý xong" };
  }

  if (!canUseConsent(twin, "spending_analysis")) {
    return { eligible: false, reason: "Chưa có consent phân tích chi tiêu" };
  }

  if (!canUseConsent(twin, "post_incident_offer")) {
    return { eligible: false, reason: "Chưa có consent offer sau sự cố" };
  }

  if (recoveryJourney.activeOffer?.status === "active") {
    return { eligible: false, reason: "Đã có offer đang hoạt động" };
  }

  const essentialCategories = getTopEssentialCategories(twin);
  if (essentialCategories.length === 0) {
    return { eligible: false, reason: "Không có dữ liệu chi tiêu thiết yếu" };
  }

  return { eligible: true, reason: "Đủ điều kiện nhận recovery offer" };
}

// ─────────────────────────────────────────────
// Risk signal summary (dùng cho UI explain)
// ─────────────────────────────────────────────

export interface TwinRiskSummary {
  deviceAnomaly: boolean;
  geoAnomaly: boolean;
  timeAnomaly: boolean;
  beneficiaryRisk: boolean;
  scamTypologyDetected: ScamTypology | null;
  adjustedSuspendThreshold: number;
  riskBonusFromBeneficiary: number;
}

/** Scam typology — re-export for convenience */
type ScamTypology = import("./twin.types").ScamTypology;

/**
 * Tóm tắt các tín hiệu risk từ twin để truyền vào risk scoring engine.
 * Không bao gồm transaction details — chỉ context từ twin.
 */
export function getTwinRiskSummary(
  twin: CustomerDigitalTwin,
  beneficiaryId: string,
  currentHourUtc7: number
): TwinRiskSummary {
  const node = findBeneficiary(twin, beneficiaryId);
  const scamTypology = node?.riskSignals.scamTypology ?? null;

  return {
    deviceAnomaly: !isCurrentDeviceKnown(twin),
    geoAnomaly: hasGeoAnomaly(twin),
    timeAnomaly: !isTypicalHour(twin, currentHourUtc7),
    beneficiaryRisk: isBeneficiaryFlagged(twin, beneficiaryId),
    scamTypologyDetected: scamTypology === "none" ? null : scamTypology ?? null,
    adjustedSuspendThreshold: getAdjustedSuspendThreshold(twin),
    riskBonusFromBeneficiary: getBeneficiaryRiskBonus(twin, beneficiaryId),
  };
}
