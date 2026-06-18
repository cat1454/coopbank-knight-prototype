/**
 * Mock Digital Twin Store (server-side, in-memory)
 * Co-opBank KNIGHT · server/twin/twinStore.js
 *
 * Lưu CustomerDigitalTwin dưới dạng plain JS objects (mirror của TypeScript types).
 * Không import TypeScript — server chạy Node.js native ESM.
 */

function now() {
  return new Date().toISOString();
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

let activePersonalityTemplate = "frugal";

const PERSONALITY_TEMPLATES = {
  frugal: {
    spendingByCategory: [
      {
        categoryId: "utilities",
        categoryLabel: "Điện, nước, internet",
        last30Days: { totalVnd: 1200000, txCount: 6, avgVnd: 200000 },
        last90Days: { totalVnd: 3600000, txCount: 18, avgVnd: 200000 },
        last180Days: { totalVnd: 7200000, txCount: 36, avgVnd: 200000 },
        shareOf90DayTotal: 0.41,
        isEssential: true,
        trend: "stable",
      },
      {
        categoryId: "groceries",
        categoryLabel: "Siêu thị, nhu yếu phẩm",
        last30Days: { totalVnd: 900000, txCount: 8, avgVnd: 112500 },
        last90Days: { totalVnd: 2400000, txCount: 24, avgVnd: 100000 },
        last180Days: { totalVnd: 4800000, txCount: 48, avgVnd: 100000 },
        shareOf90DayTotal: 0.27,
        isEssential: true,
        trend: "stable",
      },
      {
        categoryId: "food_drink",
        categoryLabel: "Ăn uống",
        last30Days: { totalVnd: 700000, txCount: 10, avgVnd: 70000 },
        last90Days: { totalVnd: 1080000, txCount: 28, avgVnd: 38571 },
        last180Days: { totalVnd: 2100000, txCount: 56, avgVnd: 37500 },
        shareOf90DayTotal: 0.12,
        isEssential: false,
        trend: "increasing",
      },
      {
        categoryId: "transport",
        categoryLabel: "Đi lại, xăng xe",
        last30Days: { totalVnd: 400000, txCount: 4, avgVnd: 100000 },
        last90Days: { totalVnd: 1000000, txCount: 12, avgVnd: 83000 },
        last180Days: { totalVnd: 2000000, txCount: 24, avgVnd: 83000 },
        shareOf90DayTotal: 0.11,
        isEssential: false,
        trend: "stable",
      },
      {
        categoryId: "ecommerce_fashion",
        categoryLabel: "Mua sắm online",
        last30Days: { totalVnd: 500000, txCount: 1, avgVnd: 500000 },
        last90Days: { totalVnd: 800000, txCount: 2, avgVnd: 400000 },
        last180Days: { totalVnd: 1200000, txCount: 3, avgVnd: 400000 },
        shareOf90DayTotal: 0.09,
        isEssential: false,
        trend: "stable",
      },
    ],
    typicalActiveHours: [8, 9, 10, 12, 19, 20, 21],
    typicalAmountRange: { minVnd: 20000, maxVnd: 1500000, p95Vnd: 2000000 },
    typicalGeos: ["Ha Noi", "Hanoi"],
  },
  tech_geek: {
    spendingByCategory: [
      {
        categoryId: "ecommerce_fashion",
        categoryLabel: "Mua sắm online (Shopee/Lazada)",
        last30Days: { totalVnd: 4500000, txCount: 12, avgVnd: 375000 },
        last90Days: { totalVnd: 12000000, txCount: 36, avgVnd: 333333 },
        last180Days: { totalVnd: 24000000, txCount: 72, avgVnd: 333333 },
        shareOf90DayTotal: 0.50,
        isEssential: false,
        trend: "increasing",
      },
      {
        categoryId: "tech_gadgets",
        categoryLabel: "Thiết bị công nghệ & Steam",
        last30Days: { totalVnd: 2500000, txCount: 3, avgVnd: 833333 },
        last90Days: { totalVnd: 7200000, txCount: 8, avgVnd: 900000 },
        last180Days: { totalVnd: 15000000, txCount: 15, avgVnd: 1000000 },
        shareOf90DayTotal: 0.30,
        isEssential: false,
        trend: "stable",
      },
      {
        categoryId: "food_drink",
        categoryLabel: "Ăn uống & Cà phê",
        last30Days: { totalVnd: 1200000, txCount: 15, avgVnd: 80000 },
        last90Days: { totalVnd: 4800000, txCount: 45, avgVnd: 106666 },
        last180Days: { totalVnd: 9600000, txCount: 90, avgVnd: 106666 },
        shareOf90DayTotal: 0.20,
        isEssential: false,
        trend: "stable",
      },
    ],
    typicalActiveHours: [0, 1, 2, 8, 12, 13, 21, 22, 23],
    typicalAmountRange: { minVnd: 50000, maxVnd: 10000000, p95Vnd: 15000000 },
    typicalGeos: ["Ha Noi", "Hanoi"],
  },
  traveler: {
    spendingByCategory: [
      {
        categoryId: "transport",
        categoryLabel: "Vé máy bay & Di chuyển",
        last30Days: { totalVnd: 3500000, txCount: 4, avgVnd: 875000 },
        last90Days: { totalVnd: 8400000, txCount: 12, avgVnd: 700000 },
        last180Days: { totalVnd: 18000000, txCount: 24, avgVnd: 700000 },
        shareOf90DayTotal: 0.35,
        isEssential: false,
        trend: "increasing",
      },
      {
        categoryId: "travel_accommodation",
        categoryLabel: "Khách sạn & Homestay",
        last30Days: { totalVnd: 3000000, txCount: 2, avgVnd: 1500000 },
        last90Days: { totalVnd: 7200000, txCount: 5, avgVnd: 1440000 },
        last180Days: { totalVnd: 14400000, txCount: 10, avgVnd: 1440000 },
        shareOf90DayTotal: 0.30,
        isEssential: false,
        trend: "stable",
      },
      {
        categoryId: "food_drink",
        categoryLabel: "Ẩm thực vùng miền",
        last30Days: { totalVnd: 1800000, txCount: 18, avgVnd: 100000 },
        last90Days: { totalVnd: 4800000, txCount: 40, avgVnd: 120000 },
        last180Days: { totalVnd: 9600000, txCount: 80, avgVnd: 120000 },
        shareOf90DayTotal: 0.20,
        isEssential: false,
        trend: "stable",
      },
      {
        categoryId: "groceries",
        categoryLabel: "Quà lưu niệm & Đặc sản",
        last30Days: { totalVnd: 1200000, txCount: 4, avgVnd: 300000 },
        last90Days: { totalVnd: 3600000, txCount: 10, avgVnd: 360000 },
        last180Days: { totalVnd: 7200000, txCount: 20, avgVnd: 360000 },
        shareOf90DayTotal: 0.15,
        isEssential: false,
        trend: "stable",
      },
    ],
    typicalActiveHours: [6, 7, 8, 9, 12, 14, 17, 18, 19, 20, 21, 22],
    typicalAmountRange: { minVnd: 100000, maxVnd: 5000000, p95Vnd: 8000000 },
    typicalGeos: ["Ha Noi", "Da Nang", "Da Lat", "Nha Trang"],
  },
  foodie: {
    spendingByCategory: [
      {
        categoryId: "food_drink",
        categoryLabel: "GrabFood & Nhà hàng",
        last30Days: { totalVnd: 3600000, txCount: 30, avgVnd: 120000 },
        last90Days: { totalVnd: 9600000, txCount: 80, avgVnd: 120000 },
        last180Days: { totalVnd: 18000000, txCount: 150, avgVnd: 120000 },
        shareOf90DayTotal: 0.40,
        isEssential: false,
        trend: "increasing",
      },
      {
        categoryId: "entertainment",
        categoryLabel: "CGV Cinema & Sân khấu",
        last30Days: { totalVnd: 1200000, txCount: 6, avgVnd: 200000 },
        last90Days: { totalVnd: 3600000, txCount: 18, avgVnd: 200000 },
        last180Days: { totalVnd: 7200000, txCount: 36, avgVnd: 200000 },
        shareOf90DayTotal: 0.25,
        isEssential: false,
        trend: "stable",
      },
      {
        categoryId: "coffee_shop",
        categoryLabel: "Starbucks & Trà sữa",
        last30Days: { totalVnd: 900000, txCount: 18, avgVnd: 50000 },
        last90Days: { totalVnd: 2700000, txCount: 50, avgVnd: 54000 },
        last180Days: { totalVnd: 5400000, txCount: 100, avgVnd: 54000 },
        shareOf90DayTotal: 0.20,
        isEssential: false,
        trend: "stable",
      },
      {
        categoryId: "groceries",
        categoryLabel: "Siêu thị nấu nướng",
        last30Days: { totalVnd: 1000000, txCount: 5, avgVnd: 200000 },
        last90Days: { totalVnd: 2700000, txCount: 15, avgVnd: 180000 },
        last180Days: { totalVnd: 5400000, txCount: 30, avgVnd: 180000 },
        shareOf90DayTotal: 0.15,
        isEssential: true,
        trend: "stable",
      },
    ],
    typicalActiveHours: [11, 12, 13, 17, 18, 19, 20, 21, 22],
    typicalAmountRange: { minVnd: 30000, maxVnd: 1200000, p95Vnd: 2000000 },
    typicalGeos: ["Ha Noi", "Hanoi"],
  },
};

/**
 * Mock twin cho Nguyễn Minh An — CID-001
 * Phản ánh đúng scenario KNIGHT 2AM fraud demo.
 */
function createMinhAnTwin() {
  const template = PERSONALITY_TEMPLATES[activePersonalityTemplate] || PERSONALITY_TEMPLATES.frugal;
  return {
    customerId: "CID-001",
    schemaVersion: "1.0",
    createdAt: daysAgo(365),
    lastUpdatedAt: now(),

    identity: {
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
    },

    behavioral: {
      customerId: "CID-001",
      updatedAt: now(),
      spendingByCategory: template.spendingByCategory,
      typicalActiveHours: template.typicalActiveHours,
      typicalActiveDays: [1, 2, 3, 4, 5, 6],
      lastActiveAt: now(),
      typicalAmountRange: template.typicalAmountRange,
      typicalChannels: ["ecommerce", "pos"],
      typicalGeos: template.typicalGeos,
      avgPushResponseTimeMinutes: 2.5,
      pushResponseRatePercent: 85,
    },

    beneficiaryGraph: {
      customerId: "CID-001",
      updatedAt: now(),
      nodes: [
        {
          id: "BEN-001",
          type: "bank_account",
          label: "Nguyễn Thị Lan (Vợ)",
          bankCode: "VCB",
          accountMasked: "****8821",
          firstSeenAt: daysAgo(365),
          lastSeenAt: daysAgo(3),
          txCount: 48,
          totalSentVnd: 24000000,
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
        {
          id: "BEN-EVN",
          type: "merchant",
          label: "Điện lực Hà Nội (EVN)",
          bankCode: "BIDV",
          accountMasked: "****0001",
          firstSeenAt: daysAgo(540),
          lastSeenAt: daysAgo(10),
          txCount: 18,
          totalSentVnd: 3600000,
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
    },

    trustHistory: {
      customerId: "CID-001",
      updatedAt: now(),
      currentTrustScore: 82,
      trustLevel: "high",
      incidentHistory: [],
      summary: {
        totalIncidents: 0,
        confirmedFraudCount: 0,
        falsePositiveCount: 0,
        falsePositiveRate: 0,
        lastIncidentAt: null,
        daysSinceLastIncident: null,
      },
      adjustedThresholds: {
        suspendThreshold: 800,
        notifyThreshold: 700,
        timeoutMinutes: 5,
      },
    },

    consent: {
      customerId: "CID-001",
      updatedAt: daysAgo(30),
      consents: [
        { scope: "spending_analysis", granted: true, grantedAt: daysAgo(30), version: "tos-2025-01" },
        { scope: "device_behavioral", granted: true, grantedAt: daysAgo(30), version: "tos-2025-01" },
        { scope: "beneficiary_graph", granted: true, grantedAt: daysAgo(30), version: "tos-2025-01" },
        { scope: "post_incident_offer", granted: true, grantedAt: daysAgo(30), version: "tos-2025-01" },
        { scope: "push_critical_bypass", granted: true, grantedAt: daysAgo(30), version: "tos-2025-01" },
        { scope: "third_party_merchant_data", granted: false, version: "tos-2025-01" },
      ],
    },

    riskTrend: {
      customerId: "CID-001",
      updatedAt: now(),
      currentScore: 147,
      baselineScore: 145,
      snapshots: Array.from({ length: 7 }, (_, i) => ({
        timestamp: daysAgo(7 - i),
        score: 120 + Math.floor(Math.random() * 40),
        trigger: "transaction",
      })),
      trend: { direction: "stable", changePercent7Days: 2, changePercent30Days: -5 },
      elevatedRiskUntil: null,
      nextReviewAt: null,
    },

    recoveryJourney: {
      customerId: "CID-001",
      incidentId: null,
      phase: "no_incident",
      emotionalState: "recovered",
      phaseStartedAt: null,
      behaviorMetrics: null,
      activeOffer: null,
      recoveryMetrics: null,
    },
  };
}

// ─────────────────────────────────────────────
// In-memory store
// ─────────────────────────────────────────────

/** @type {Map<string, object>} */
const store = new Map([["CID-001", createMinhAnTwin()]]);

export function getTwinById(customerId) {
  return store.get(customerId) ?? null;
}

export function upsertTwin(twin) {
  store.set(twin.customerId, { ...twin, lastUpdatedAt: new Date().toISOString() });
}

export function patchTwin(customerId, patch) {
  const existing = store.get(customerId);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...patch,
    lastUpdatedAt: new Date().toISOString(),
  };
  store.set(customerId, updated);
  return updated;
}

export function listTwinIds() {
  return Array.from(store.keys());
}

export function resetTwin(customerId) {
  if (customerId === "CID-001") {
    store.set("CID-001", createMinhAnTwin());
    return true;
  }
  return false;
}

export function setTwinPersonality(customerId, personalityId) {
  if (customerId === "CID-001" && PERSONALITY_TEMPLATES[personalityId]) {
    activePersonalityTemplate = personalityId;
    const updated = createMinhAnTwin();
    store.set("CID-001", updated);
    return updated;
  }
  return null;
}
