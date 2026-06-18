/**
 * Twin Context Adapter
 * src/domain/threat-lens/scoring/twinContext.ts
 *
 * Chuyển đổi CustomerDigitalTwin thành context nhỏ gọn cho ThreatLens agents.
 * Pure function — không có side effects.
 *
 * Khi twin = undefined, tất cả helpers trả về giá trị mặc định an toàn
 * để mọi call site có thể spread `buildTwinContext(undefined)` mà không bị lỗi.
 */

import type { CustomerDigitalTwin, RecoveryPhase, ScamTypology } from "../../knight/digital-twin";
import {
  canUseConsent,
  getAdjustedSuspendThreshold,
  getAdjustedTimeoutMinutes,
  getBeneficiaryRiskBonus,
  getTopEssentialCategories,
  hasGeoAnomaly,
  isBiometricAvailable,
  isCurrentDeviceKnown,
  isNewBeneficiary,
  isTypicalHour,
} from "../../knight/digital-twin";

// ─────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────

export interface TwinEnrichedContext {
  /** Ngưỡng tạm khóa thẻ đã điều chỉnh theo lịch sử khách — thay thế constant 800 */
  adjustedSuspendThreshold: number;
  /** Timeout chờ phản hồi (phút) đã điều chỉnh theo avg push response */
  adjustedTimeoutMinutes: number;
  /** Điểm risk bổ sung từ beneficiary graph (0–200) */
  beneficiaryRiskBonus: number;
  /** Thiết bị hiện tại có phải thiết bị đã biết không */
  isDeviceKnown: boolean;
  /** Session hiện tại có IP/geo bất thường không */
  isGeoAnomaly: boolean;
  /** Giờ giao dịch có nằm trong typical active hours không */
  isTypicalHour: boolean;
  /** Biometric đã đăng ký (dùng để quyết định có thể yêu cầu Face ID không) */
  isBiometricAvailable: boolean;
  /** Scam typology detect từ beneficiary (null = không detect) */
  scamTypologyDetected: ScamTypology | null;
  /** Khách đã cho phép cá nhân hóa chưa */
  canPersonalize: boolean;
  /** Phase recovery hiện tại của khách */
  recoveryPhase: RecoveryPhase;
  /** Top essential spending categories (dùng cho recovery offer) */
  topEssentialCategories: { categoryId: string; categoryLabel: string; shareOf90DayTotal: number }[];
  /** Người nhận này có phải mới không */
  isBeneficiaryNew: boolean;
}

// ─────────────────────────────────────────────
// Default context (khi không có twin)
// ─────────────────────────────────────────────

const DEFAULT_CONTEXT: TwinEnrichedContext = {
  adjustedSuspendThreshold: 800,
  adjustedTimeoutMinutes: 5,
  beneficiaryRiskBonus: 0,
  isDeviceKnown: true,    // assume safe khi không có data
  isGeoAnomaly: false,
  isTypicalHour: true,
  isBiometricAvailable: false,
  scamTypologyDetected: null,
  canPersonalize: false,
  recoveryPhase: "no_incident",
  topEssentialCategories: [],
  isBeneficiaryNew: false,
};

// ─────────────────────────────────────────────
// Builder
// ─────────────────────────────────────────────

/**
 * Tạo TwinEnrichedContext từ CustomerDigitalTwin.
 *
 * @param twin - twin của khách (undefined = không có data → dùng defaults)
 * @param beneficiaryId - id người nhận trong giao dịch hiện tại
 * @param currentHourUtc7 - giờ hiện tại theo UTC+7 (0–23)
 */
export function buildTwinContext(
  twin: CustomerDigitalTwin | undefined | null,
  beneficiaryId: string,
  currentHourUtc7: number
): TwinEnrichedContext {
  if (!twin) return { ...DEFAULT_CONTEXT };

  // Lấy scam typology từ beneficiary node (nếu có)
  const benNode = twin.beneficiaryGraph.nodes.find((n) => n.id === beneficiaryId);
  const rawTypology = benNode?.riskSignals.scamTypology ?? null;
  const scamTypologyDetected: ScamTypology | null =
    rawTypology && rawTypology !== "none" ? rawTypology : null;

  const topEssentialCategories = getTopEssentialCategories(twin, 3).map((c) => ({
    categoryId: c.categoryId,
    categoryLabel: c.categoryLabel,
    shareOf90DayTotal: c.shareOf90DayTotal,
  }));

  return {
    adjustedSuspendThreshold: getAdjustedSuspendThreshold(twin),
    adjustedTimeoutMinutes: getAdjustedTimeoutMinutes(twin),
    beneficiaryRiskBonus: getBeneficiaryRiskBonus(twin, beneficiaryId),
    isDeviceKnown: isCurrentDeviceKnown(twin),
    isGeoAnomaly: hasGeoAnomaly(twin),
    isTypicalHour: isTypicalHour(twin, currentHourUtc7),
    isBiometricAvailable: isBiometricAvailable(twin),
    scamTypologyDetected,
    canPersonalize: canUseConsent(twin, "spending_analysis"),
    recoveryPhase: twin.recoveryJourney.phase,
    topEssentialCategories,
    isBeneficiaryNew: isNewBeneficiary(twin, beneficiaryId),
  };
}

/**
 * Lấy adjusted suspend threshold — convenience wrapper không cần twin context đầy đủ.
 * Dùng trong riskAssessmentAdapter và policy.
 */
export function getThresholdFromContext(ctx?: TwinEnrichedContext | null): number {
  return ctx?.adjustedSuspendThreshold ?? 800;
}

/**
 * Lấy timeout minutes — dùng trong state machine để emit timeout event.
 */
export function getTimeoutFromContext(ctx?: TwinEnrichedContext | null): number {
  return ctx?.adjustedTimeoutMinutes ?? 5;
}
