/**
 * Twin Updater — cập nhật CustomerDigitalTwin sau mỗi event quan trọng
 * Co-opBank KNIGHT · src/domain/knight/digital-twin/twin.updater.ts
 *
 * Pure functions — trả về twin mới (immutable update pattern).
 * Không có side effects; caller tự persist.
 */

import type {
  ActiveOffer,
  BeneficiaryNode,
  CustomerDigitalTwin,
  PostIncidentBehaviorMetrics,
  RecoveryPhase,
  RiskSnapshot,
} from "./twin.types";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function timestamp(): string {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────

/**
 * Cập nhật session khi khách đăng nhập trên thiết bị mới.
 */
export function updateCurrentSession(
  twin: CustomerDigitalTwin,
  session: CustomerDigitalTwin["identity"]["currentSession"]
): CustomerDigitalTwin {
  const isKnownDevice = twin.identity.knownDevices.some(
    (d) => d.fingerprint === session.deviceFingerprint
  );
  return {
    ...twin,
    lastUpdatedAt: timestamp(),
    identity: {
      ...twin.identity,
      currentSession: { ...session, isKnownDevice },
    },
  };
}

// ─────────────────────────────────────────────
// Risk trend
// ─────────────────────────────────────────────

/**
 * Thêm một risk snapshot mới (sau khi transaction được đánh giá).
 * Giữ tối đa 90 entries.
 */
export function appendRiskSnapshot(
  twin: CustomerDigitalTwin,
  snapshot: Omit<RiskSnapshot, "timestamp">
): CustomerDigitalTwin {
  const newSnapshot: RiskSnapshot = { ...snapshot, timestamp: timestamp() };
  const snapshots = [...twin.riskTrend.snapshots, newSnapshot].slice(-90);

  // Tính trend đơn giản
  const recent7 = snapshots.slice(-7);
  const avg7 = recent7.reduce((s, r) => s + r.score, 0) / (recent7.length || 1);
  const prevAvg7 = snapshots.slice(-14, -7).reduce((s, r) => s + r.score, 0) / 7 || avg7;
  const changePercent7Days = ((avg7 - prevAvg7) / (prevAvg7 || 1)) * 100;

  const recent30 = snapshots.slice(-30);
  const avg30 = recent30.reduce((s, r) => s + r.score, 0) / (recent30.length || 1);
  const prevAvg30 = snapshots.slice(-60, -30).reduce((s, r) => s + r.score, 0) / 30 || avg30;
  const changePercent30Days = ((avg30 - prevAvg30) / (prevAvg30 || 1)) * 100;

  const direction =
    changePercent7Days > 5 ? "worsening" : changePercent7Days < -5 ? "improving" : "stable";

  return {
    ...twin,
    lastUpdatedAt: timestamp(),
    riskTrend: {
      ...twin.riskTrend,
      currentScore: newSnapshot.score,
      snapshots,
      trend: { direction, changePercent7Days, changePercent30Days },
    },
  };
}

/**
 * Đặt elevated monitoring window (sau khi card bị suspend L2).
 */
export function setElevatedMonitoring(
  twin: CustomerDigitalTwin,
  untilIso: string
): CustomerDigitalTwin {
  return {
    ...twin,
    lastUpdatedAt: timestamp(),
    riskTrend: { ...twin.riskTrend, elevatedRiskUntil: untilIso },
  };
}

// ─────────────────────────────────────────────
// Incident & trust history
// ─────────────────────────────────────────────

/**
 * Thêm incident record sau khi sự cố được giải quyết.
 */
export function recordIncident(
  twin: CustomerDigitalTwin,
  incident: CustomerDigitalTwin["trustHistory"]["incidentHistory"][number]
): CustomerDigitalTwin {
  const incidentHistory = [...twin.trustHistory.incidentHistory, incident];
  const confirmedFraud = incidentHistory.filter((i) => i.customerIntent === "fraud");
  const falsePositives = incidentHistory.filter((i) => i.wasFalsePositive);

  return {
    ...twin,
    lastUpdatedAt: timestamp(),
    trustHistory: {
      ...twin.trustHistory,
      incidentHistory,
      summary: {
        totalIncidents: incidentHistory.length,
        confirmedFraudCount: confirmedFraud.length,
        falsePositiveCount: falsePositives.length,
        falsePositiveRate: falsePositives.length / (incidentHistory.length || 1),
        lastIncidentAt: incident.occurredAt,
        daysSinceLastIncident: 0,
      },
    },
  };
}

// ─────────────────────────────────────────────
// Beneficiary graph
// ─────────────────────────────────────────────

/**
 * Thêm hoặc cập nhật beneficiary node sau giao dịch.
 */
export function upsertBeneficiaryNode(
  twin: CustomerDigitalTwin,
  node: BeneficiaryNode
): CustomerDigitalTwin {
  const existing = twin.beneficiaryGraph.nodes.findIndex((n) => n.id === node.id);
  let nodes: BeneficiaryNode[];

  if (existing >= 0) {
    nodes = twin.beneficiaryGraph.nodes.map((n, i) => (i === existing ? node : n));
  } else {
    nodes = [...twin.beneficiaryGraph.nodes, node];
  }

  const flagged = nodes.filter(
    (n) => n.riskSignals.isReportedMule || n.riskSignals.isScamTypology
  );

  return {
    ...twin,
    lastUpdatedAt: timestamp(),
    beneficiaryGraph: {
      ...twin.beneficiaryGraph,
      nodes,
      updatedAt: timestamp(),
      summary: {
        totalKnownBeneficiaries: nodes.length,
        newBeneficiariesLast30Days: twin.beneficiaryGraph.summary.newBeneficiariesLast30Days,
        flaggedBeneficiariesCount: flagged.length,
        muleContactCount: nodes.filter((n) => n.riskSignals.isReportedMule).length,
      },
    },
  };
}

// ─────────────────────────────────────────────
// Recovery journey
// ─────────────────────────────────────────────

/**
 * Chuyển phase của recovery journey.
 */
export function transitionRecoveryPhase(
  twin: CustomerDigitalTwin,
  phase: RecoveryPhase,
  incidentId?: string
): CustomerDigitalTwin {
  return {
    ...twin,
    lastUpdatedAt: timestamp(),
    recoveryJourney: {
      ...twin.recoveryJourney,
      phase,
      incidentId: incidentId ?? twin.recoveryJourney.incidentId,
      phaseStartedAt: timestamp(),
      // Reset emotional state khi bắt đầu incident mới
      emotionalState: phase === "incident_active" ? "anxious" : twin.recoveryJourney.emotionalState,
    },
  };
}

/**
 * Cập nhật behavior metrics sau sự cố (dùng cho trust recovery assessment).
 */
export function updateBehaviorMetrics(
  twin: CustomerDigitalTwin,
  metrics: PostIncidentBehaviorMetrics
): CustomerDigitalTwin {
  return {
    ...twin,
    lastUpdatedAt: timestamp(),
    recoveryJourney: {
      ...twin.recoveryJourney,
      behaviorMetrics: metrics,
      emotionalState: metrics.essentialPaymentResumed ? "engaged" : "relieved",
    },
  };
}

/**
 * Gắn active offer vào recovery journey.
 */
export function attachOffer(
  twin: CustomerDigitalTwin,
  offer: ActiveOffer
): CustomerDigitalTwin {
  return {
    ...twin,
    lastUpdatedAt: timestamp(),
    recoveryJourney: {
      ...twin.recoveryJourney,
      activeOffer: offer,
      emotionalState: "engaged",
    },
  };
}

/**
 * Đánh dấu khách đã phục hồi hoàn toàn.
 */
export function markRecovered(
  twin: CustomerDigitalTwin,
  npsScore?: number
): CustomerDigitalTwin {
  return {
    ...twin,
    lastUpdatedAt: timestamp(),
    recoveryJourney: {
      ...twin.recoveryJourney,
      phase: "recovered",
      emotionalState: "recovered",
      recoveryMetrics: {
        daysToRecoverNormalSpending: undefined,
        npsScore,
        churned: false,
      },
    },
  };
}

// ─────────────────────────────────────────────
// Generic patch (dùng khi server cần PATCH endpoint)
// ─────────────────────────────────────────────

/**
 * Deep merge patch vào twin. Chỉ merge top-level sections để tránh corruption.
 * Server dùng hàm này để xử lý PATCH /api/twin/:id.
 */
export function patchTwin(
  twin: CustomerDigitalTwin,
  patch: DeepPartial<CustomerDigitalTwin>
): CustomerDigitalTwin {
  return {
    ...twin,
    ...(patch.identity ? { identity: { ...twin.identity, ...patch.identity } } : {}),
    ...(patch.behavioral ? { behavioral: { ...twin.behavioral, ...patch.behavioral } } : {}),
    ...(patch.beneficiaryGraph ? { beneficiaryGraph: { ...twin.beneficiaryGraph, ...patch.beneficiaryGraph } } : {}),
    ...(patch.trustHistory ? { trustHistory: { ...twin.trustHistory, ...patch.trustHistory } } : {}),
    ...(patch.consent ? { consent: { ...twin.consent, ...patch.consent } } : {}),
    ...(patch.riskTrend ? { riskTrend: { ...twin.riskTrend, ...patch.riskTrend } } : {}),
    ...(patch.recoveryJourney ? { recoveryJourney: { ...twin.recoveryJourney, ...patch.recoveryJourney } } : {}),
    lastUpdatedAt: timestamp(),
  } as CustomerDigitalTwin;
}
