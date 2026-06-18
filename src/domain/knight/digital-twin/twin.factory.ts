/**
 * Mock Digital Twin Factory
 * Co-opBank KNIGHT · src/domain/knight/digital-twin/twin.factory.ts
 *
 * Tạo twin mock cho demo scenarios.
 * Tất cả data đều là mock — không có thông tin thật.
 */

import type {
  BeneficiaryGraph,
  BehavioralBaseline,
  ConsentRegistry,
  CustomerDigitalTwin,
  IdentityContext,
  RecoveryJourneyState,
  RiskProfileTrend,
  TrustScoreHistory,
} from "./twin.types";

// ─────────────────────────────────────────────
// Shared builders
// ─────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ─────────────────────────────────────────────
// Nguyễn Minh An (CID-001)
// Khách hàng chính trong demo KNIGHT 2AM fraud scenario
// ─────────────────────────────────────────────

function minhAnIdentity(): IdentityContext {
  return {
    customerId: "CID-001",
    knownDevices: [
      {
        fingerprint: "FP-IPHONE-MINH-AN-001",
        label: "iPhone 15 Pro của Minh An",
        platform: "iOS 17.4",
        lastSeenAt: daysAgo(1),
        trustLevel: "trusted",
        enrolledBiometric: true,
      },
    ],
    // Session hiện tại = thiết bị lạ từ Singapore (fraud scenario)
    currentSession: {
      deviceFingerprint: "FP-UNKNOWN-SG-XYZ",
      ipAddress: "103.27.x.x",
      ipRisk: "vpn",
      geoCountry: "SG",
      geoCity: "Singapore",
      startedAt: now(),
      isKnownDevice: false,
      isKnownGeo: false,
      loginMethod: "password",
    },
    biometricStatus: "registered",
    biometricMethod: "face_id",
  };
}

function minhAnBehavioral(): BehavioralBaseline {
  return {
    customerId: "CID-001",
    updatedAt: daysAgo(0),
    spendingByCategory: [
      {
        categoryId: "utilities",
        categoryLabel: "Điện, nước, internet",
        last30Days: { totalVnd: 1_200_000, txCount: 6, avgVnd: 200_000 },
        last90Days: { totalVnd: 3_600_000, txCount: 18, avgVnd: 200_000 },
        last180Days: { totalVnd: 7_200_000, txCount: 36, avgVnd: 200_000 },
        shareOf90DayTotal: 0.41,
        isEssential: true,
        trend: "stable",
      },
      {
        categoryId: "groceries",
        categoryLabel: "Siêu thị, nhu yếu phẩm",
        last30Days: { totalVnd: 900_000, txCount: 8, avgVnd: 112_500 },
        last90Days: { totalVnd: 2_400_000, txCount: 24, avgVnd: 100_000 },
        last180Days: { totalVnd: 4_800_000, txCount: 48, avgVnd: 100_000 },
        shareOf90DayTotal: 0.27,
        isEssential: true,
        trend: "stable",
      },
      {
        categoryId: "ecommerce_fashion",
        categoryLabel: "Mua sắm thời trang online",
        last30Days: { totalVnd: 500_000, txCount: 1, avgVnd: 500_000 },
        last90Days: { totalVnd: 800_000, txCount: 2, avgVnd: 400_000 },
        last180Days: { totalVnd: 1_200_000, txCount: 3, avgVnd: 400_000 },
        shareOf90DayTotal: 0.09,
        isEssential: false,
        trend: "stable",
      },
      {
        categoryId: "transport",
        categoryLabel: "Đi lại, xăng xe",
        last30Days: { totalVnd: 400_000, txCount: 4, avgVnd: 100_000 },
        last90Days: { totalVnd: 1_000_000, txCount: 12, avgVnd: 83_000 },
        last180Days: { totalVnd: 2_000_000, txCount: 24, avgVnd: 83_000 },
        shareOf90DayTotal: 0.11,
        isEssential: false,
        trend: "stable",
      },
      {
        categoryId: "food_drink",
        categoryLabel: "Ăn uống",
        last30Days: { totalVnd: 700_000, txCount: 10, avgVnd: 70_000 },
        last90Days: { totalVnd: 1_080_000, txCount: 28, avgVnd: 38_571 },
        last180Days: { totalVnd: 2_100_000, txCount: 56, avgVnd: 37_500 },
        shareOf90DayTotal: 0.12,
        isEssential: false,
        trend: "increasing",
      },
    ],
    typicalActiveHours: [8, 9, 10, 12, 19, 20, 21],  // buổi sáng + buổi tối
    typicalActiveDays: [1, 2, 3, 4, 5, 6],            // thứ 2–thứ 7
    lastActiveAt: daysAgo(0),
    typicalAmountRange: {
      minVnd: 20_000,
      maxVnd: 1_500_000,
      p95Vnd: 2_000_000,
    },
    typicalChannels: ["ecommerce", "pos"],
    typicalGeos: ["Ha Noi", "Hanoi"],
    avgPushResponseTimeMinutes: 2.5,
    pushResponseRatePercent: 85,
  };
}

function minhAnBeneficiaryGraph(): BeneficiaryGraph {
  return {
    customerId: "CID-001",
    updatedAt: daysAgo(0),
    nodes: [
      // Người thân / bạn bè quen
      {
        id: "BEN-001",
        type: "bank_account",
        label: "Nguyễn Thị Lan (Vợ)",
        bankCode: "VCB",
        accountMasked: "****8821",
        firstSeenAt: daysAgo(365),
        lastSeenAt: daysAgo(3),
        txCount: 48,
        totalSentVnd: 24_000_000,
        isFrequent: true,
        riskSignals: {
          isNewRecipient: false,
          isReportedMule: false,
          isScamTypology: false,
          merchantCategoryRisk: "low",
          clusterRisk: "isolated",
          scamTypology: "none",
        },
      },
      // Công ty dịch vụ điện (EVN)
      {
        id: "BEN-EVN",
        type: "merchant",
        label: "Điện lực Hà Nội (EVN)",
        bankCode: "BIDV",
        accountMasked: "****0001",
        firstSeenAt: daysAgo(540),
        lastSeenAt: daysAgo(10),
        txCount: 18,
        totalSentVnd: 3_600_000,
        isFrequent: true,
        riskSignals: {
          isNewRecipient: false,
          isReportedMule: false,
          isScamTypology: false,
          merchantCategoryRisk: "low",
          clusterRisk: "isolated",
          scamTypology: "none",
        },
      },
      // Merchant lạ — ShopMall Global (fraud scenario)
      {
        id: "BEN-SHOPMALL",
        type: "merchant",
        label: "ShopMall Global",
        bankCode: "???",
        accountMasked: "????",
        firstSeenAt: now(),
        lastSeenAt: now(),
        txCount: 0,
        totalSentVnd: 0,
        isFrequent: false,
        riskSignals: {
          isNewRecipient: true,
          isReportedMule: false,
          isScamTypology: true,
          merchantCategoryRisk: "high",
          clusterRisk: "known_cluster",
          scamTypology: "fake_merchant",
        },
      },
    ],
    summary: {
      totalKnownBeneficiaries: 3,
      newBeneficiariesLast30Days: 1,
      flaggedBeneficiariesCount: 1,
      muleContactCount: 0,
    },
  };
}

function minhAnTrustHistory(): TrustScoreHistory {
  return {
    customerId: "CID-001",
    updatedAt: daysAgo(0),
    currentTrustScore: 82,
    trustLevel: "high",
    incidentHistory: [], // lần đầu bị fraud — no prior history
    summary: {
      totalIncidents: 0,
      confirmedFraudCount: 0,
      falsePositiveCount: 0,
      falsePositiveRate: 0,
      lastIncidentAt: undefined,
      daysSinceLastIncident: undefined,
    },
    adjustedThresholds: {
      suspendThreshold: 800,   // default — không có lịch sử để điều chỉnh
      notifyThreshold: 700,
      timeoutMinutes: 5,
    },
  };
}

function minhAnConsent(): ConsentRegistry {
  return {
    customerId: "CID-001",
    updatedAt: daysAgo(30),
    consents: [
      {
        scope: "spending_analysis",
        granted: true,
        grantedAt: daysAgo(30),
        version: "tos-2025-01",
      },
      {
        scope: "device_behavioral",
        granted: true,
        grantedAt: daysAgo(30),
        version: "tos-2025-01",
      },
      {
        scope: "beneficiary_graph",
        granted: true,
        grantedAt: daysAgo(30),
        version: "tos-2025-01",
      },
      {
        scope: "post_incident_offer",
        granted: true,
        grantedAt: daysAgo(30),
        version: "tos-2025-01",
      },
      {
        scope: "push_critical_bypass",
        granted: true,
        grantedAt: daysAgo(30),
        version: "tos-2025-01",
      },
      {
        scope: "third_party_merchant_data",
        granted: false,               // khách từ chối chia sẻ với đối tác
        version: "tos-2025-01",
      },
    ],
  };
}

function minhAnRiskTrend(): RiskProfileTrend {
  // Lịch sử risk score bình thường trước khi incident 2AM
  const snapshots = Array.from({ length: 7 }, (_, i) => ({
    timestamp: daysAgo(7 - i),
    score: 120 + Math.floor(Math.random() * 40),
    trigger: "transaction" as const,
  }));

  return {
    customerId: "CID-001",
    updatedAt: daysAgo(0),
    currentScore: 847,             // vừa bị detect ở score này
    baselineScore: 145,            // baseline 90 ngày (low normal)
    snapshots,
    trend: {
      direction: "stable",
      changePercent7Days: 2,
      changePercent30Days: -5,
    },
    elevatedRiskUntil: undefined,
    nextReviewAt: undefined,
  };
}

function minhAnRecoveryJourney(): RecoveryJourneyState {
  return {
    customerId: "CID-001",
    incidentId: undefined,
    phase: "no_incident",         // → sẽ chuyển sang "incident_active" khi incident bắt đầu
    emotionalState: "recovered",
    phaseStartedAt: undefined,
    behaviorMetrics: undefined,
    activeOffer: undefined,
    recoveryMetrics: undefined,
  };
}

/**
 * Tạo Digital Twin đầy đủ cho Nguyễn Minh An (demo chính KNIGHT 2AM).
 */
export function createMinhAnTwin(): CustomerDigitalTwin {
  return {
    customerId: "CID-001",
    schemaVersion: "1.0",
    createdAt: daysAgo(365),
    lastUpdatedAt: now(),
    identity: minhAnIdentity(),
    behavioral: minhAnBehavioral(),
    beneficiaryGraph: minhAnBeneficiaryGraph(),
    trustHistory: minhAnTrustHistory(),
    consent: minhAnConsent(),
    riskTrend: minhAnRiskTrend(),
    recoveryJourney: minhAnRecoveryJourney(),
  };
}

// ─────────────────────────────────────────────
// Twin store (in-memory, keyed by customerId)
// Được server mock API sử dụng
// ─────────────────────────────────────────────

const twinStore = new Map<string, CustomerDigitalTwin>([
  ["CID-001", createMinhAnTwin()],
]);

export function getTwinById(customerId: string): CustomerDigitalTwin | undefined {
  return twinStore.get(customerId);
}

export function upsertTwin(twin: CustomerDigitalTwin): void {
  twinStore.set(twin.customerId, { ...twin, lastUpdatedAt: new Date().toISOString() });
}

export function listAllTwinIds(): string[] {
  return Array.from(twinStore.keys());
}
