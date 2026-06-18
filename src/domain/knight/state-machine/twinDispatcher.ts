/**
 * Twin-Aware State Machine Dispatcher
 * src/domain/knight/state-machine/twinDispatcher.ts
 *
 * Wrapper mỏng quanh dispatchScenarioEvent — không sửa signature gốc.
 * Khi có CustomerDigitalTwin:
 *   1. Gọi dispatchScenarioEvent như bình thường (state machine không thay đổi)
 *   2. Sau đó thực hiện twin side-effects (chuyển RecoveryPhase, append risk snapshot...)
 *   3. Twin side-effects được persist qua twinStore (server) hoặc callback
 *
 * Backward-compatible: khi twin = undefined, behavior y hệt dispatchScenarioEvent.
 */

import type { CustomerDigitalTwin } from "../digital-twin";
import {
  appendRiskSnapshot,
  getTopEssentialCategories,
  transitionRecoveryPhase,
  upsertTwin,
} from "../digital-twin";
import type { KnightEventType, KnightScenarioState } from "../types";
import { dispatchScenarioEvent } from "./transitions";

// ─────────────────────────────────────────────
// Twin side-effect hooks
// ─────────────────────────────────────────────

/**
 * Ánh xạ từ KnightEventType → RecoveryPhase transition.
 * Chỉ những events quan trọng mới trigger phase change.
 */
function getTwinPhaseTransition(
  event: KnightEventType
): { phase: import("../digital-twin").RecoveryPhase; incidentId?: string } | null {
  switch (event) {
    case "RISK_EVENT_RECEIVED":
    case "AUTO_SUSPEND_ALLOWED":
      return { phase: "incident_active" };

    case "CREATE_CASE_SUCCESS":
    case "ESCALATE_FRAUD_OPS":
      return { phase: "post_incident" };

    case "OBSERVE_RECOVERY_SUCCESS":
    case "COMPLETE_REACT_CYCLE":
      return { phase: "recovered" };

    case "UNSUSPEND_CARD_SUCCESS":
    case "WHITELIST_SESSION_SUCCESS":
      // Legitimate resolution — không phải post_incident, trở về no_incident
      return { phase: "no_incident" };

    case "RESET_SCENARIO":
      return { phase: "no_incident" };

    default:
      return null; // Không cần transition
  }
}

/**
 * Tính risk score từ KnightScenarioState để append vào RiskProfileTrend.
 */
function getRiskSnapshotScore(state: KnightScenarioState): number {
  return state.riskAssessment.score;
}

function getRiskSnapshotTrigger(
  event: KnightEventType
): import("../digital-twin").RiskSnapshot["trigger"] {
  switch (event) {
    case "RISK_EVENT_RECEIVED":
    case "AUTO_SUSPEND_ALLOWED":
      return "transaction";
    case "RESET_SCENARIO":
      return "manual_review";
    case "OBSERVE_RECOVERY_SUCCESS":
    case "COMPLETE_REACT_CYCLE":
      return "incident_resolution";
    default:
      return "transaction";
  }
}

// ─────────────────────────────────────────────
// Main dispatcher
// ─────────────────────────────────────────────

export interface TwinDispatchResult {
  nextState: KnightScenarioState;
  /** Twin đã được cập nhật sau side-effects (nếu có twin và có thay đổi) */
  updatedTwin?: CustomerDigitalTwin;
  /** Các side-effects đã chạy */
  sideEffects: string[];
}

/**
 * Twin-aware dispatch — chạy state machine + twin side-effects.
 *
 * @param state - State machine state hiện tại
 * @param event - Event cần dispatch
 * @param twin - CustomerDigitalTwin (optional). Khi undefined → behavior giống dispatchScenarioEvent
 * @returns TwinDispatchResult với nextState và updatedTwin (nếu có)
 */
export function dispatchWithTwin(
  state: KnightScenarioState,
  event: KnightEventType,
  twin?: CustomerDigitalTwin | null
): TwinDispatchResult {
  // [1] Chạy state machine như bình thường
  const nextState = dispatchScenarioEvent(state, event);

  // Nếu không có twin → trả về kết quả như cũ
  if (!twin) {
    return { nextState, sideEffects: [] };
  }

  const sideEffects: string[] = [];
  let updatedTwin = twin;

  // [2] Append risk snapshot khi có risk event
  if (
    event === "RISK_EVENT_RECEIVED" ||
    event === "AUTO_SUSPEND_ALLOWED"
  ) {
    updatedTwin = appendRiskSnapshot(updatedTwin, {
      score: getRiskSnapshotScore(nextState),
      trigger: getRiskSnapshotTrigger(event),
    });
    sideEffects.push(`risk_snapshot_appended: ${getRiskSnapshotScore(nextState)}`);
  }

  // [3] Transition recovery phase
  const phaseTransition = getTwinPhaseTransition(event);
  if (phaseTransition) {
    const incidentId = nextState.fraudCase?.id ?? nextState.card?.id;
    updatedTwin = transitionRecoveryPhase(
      updatedTwin,
      phaseTransition.phase,
      incidentId
    );
    sideEffects.push(`recovery_phase: ${phaseTransition.phase}`);
  }

  // [4] Persist twin (upsert vào in-memory store trong domain)
  if (sideEffects.length > 0) {
    upsertTwin(updatedTwin);
  }

  return { nextState, updatedTwin, sideEffects };
}

// ─────────────────────────────────────────────
// Trust recovery assessment — twin-aware
// ─────────────────────────────────────────────

/**
 * Trả về essential spending categories từ twin để dùng trong ASSESS_TRUST_RECOVERY_SUCCESS.
 * Fallback về demoTrustRecoveryAssessment.essentialSpendingCategories khi không có twin/consent.
 *
 * Mapping từ twin SpendingCategory → KnightScenarioState EssentialSpendingCategory:
 */
export function getTwinEssentialCategories(
  twin: CustomerDigitalTwin | null | undefined,
  fallback: import("../types").EssentialSpendingCategory[]
): import("../types").EssentialSpendingCategory[] {
  if (!twin) return fallback;

  const categories = getTopEssentialCategories(twin, 3);
  if (categories.length === 0) return fallback;

  // Map từ twin SpendingCategory → EssentialSpendingCategory
  const VALID_IDS = ["electricity", "water", "supermarket"] as const;
  const mapped = categories
    .map((c, i): import("../types").EssentialSpendingCategory | null => {
      const id = VALID_IDS[i];
      if (!id) return null;
      return {
        id,
        label: c.categoryLabel,
        amountVnd: c.last30Days.totalVnd,
        usagePattern: `${c.last30Days.txCount} lần / tháng`,
      };
    })
    .filter((x): x is import("../types").EssentialSpendingCategory => x !== null);

  return mapped.length > 0 ? mapped : fallback;
}

// ─────────────────────────────────────────────
// Timeout duration — twin-aware
// ─────────────────────────────────────────────

/**
 * Trả về timeout duration (ms) dựa trên twin context.
 * State machine dùng hàm này để set countdown timer.
 */
export function getTwinTimeoutMs(
  twin?: CustomerDigitalTwin | null,
  defaultMinutes = 5
): number {
  if (!twin) return defaultMinutes * 60 * 1000;

  const { timeoutMinutes } = twin.trustHistory.adjustedThresholds;
  const minutes = timeoutMinutes ?? defaultMinutes;
  return Math.min(Math.max(minutes, 3), 10) * 60 * 1000;
}
