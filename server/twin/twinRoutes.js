/**
 * Twin API Routes
 * Co-opBank KNIGHT · server/twin/twinRoutes.js
 *
 * Routes:
 *   GET  /api/twin/:customerId                      — lấy full twin
 *   PATCH /api/twin/:customerId                     — cập nhật một phần twin
 *   POST /api/twin/:customerId/reset                — reset về mock ban đầu
 *   GET  /api/twin/:customerId/beneficiaries        — danh sách beneficiary nodes
 *   GET  /api/twin/:customerId/beneficiary/:benId   — lookup 1 beneficiary
 *   POST /api/twin/:customerId/beneficiary          — thêm / upsert beneficiary
 *   GET  /api/twin/:customerId/consent              — consent registry
 *   GET  /api/twin/:customerId/risk-trend           — risk score history
 *   GET  /api/twin/:customerId/explain              — safe public summary (không raw twin)
 */

import { readJson } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import { getTwinById, listTwinIds, patchTwin, resetTwin, upsertTwin, setTwinPersonality } from "./twinStore.js";

// Regex patterns
const TWIN_BASE = /^\/api\/twin\/([^/]+)$/;
const TWIN_RESET = /^\/api\/twin\/([^/]+)\/reset$/;
const TWIN_BENEFICIARIES = /^\/api\/twin\/([^/]+)\/beneficiaries$/;
const TWIN_BENEFICIARY_ID = /^\/api\/twin\/([^/]+)\/beneficiary\/([^/]+)$/;
const TWIN_BENEFICIARY_POST = /^\/api\/twin\/([^/]+)\/beneficiary$/;
const TWIN_CONSENT = /^\/api\/twin\/([^/]+)\/consent$/;
const TWIN_RISK_TREND = /^\/api\/twin\/([^/]+)\/risk-trend$/;
const TWIN_EXPLAIN = /^\/api\/twin\/([^/]+)\/explain$/;
const TWIN_PERSONALITY = /^\/api\/twin\/([^/]+)\/personality$/;

/**
 * Tạo "safe explain" — chỉ trả về thông tin KNIGHT được giải thích cho khách,
 * không trả raw twin với toàn bộ data kỹ thuật.
 */
function buildSafeExplain(twin) {
  const essentials = twin.behavioral.spendingByCategory
    .filter((c) => c.isEssential)
    .sort((a, b) => b.shareOf90DayTotal - a.shareOf90DayTotal)
    .slice(0, 3)
    .map((c) => ({ label: c.categoryLabel, sharePercent: Math.round(c.shareOf90DayTotal * 100) }));

  const sessionRisk = [];
  const session = twin.identity.currentSession;
  if (!session.isKnownDevice) sessionRisk.push("Thiết bị không được nhận diện");
  if (session.ipRisk === "vpn" || session.ipRisk === "tor")
    sessionRisk.push(`Kết nối qua ${session.ipRisk.toUpperCase()}`);
  if (!session.isKnownGeo) sessionRisk.push(`Vị trí lạ (${session.geoCountry})`);

  const flaggedBeneficiaries = twin.beneficiaryGraph.nodes
    .filter((n) => n.riskSignals.isNewRecipient || n.riskSignals.isScamTypology)
    .map((n) => ({
      label: n.label,
      isNew: n.riskSignals.isNewRecipient,
      scamTypology: n.riskSignals.scamTypology !== "none" ? n.riskSignals.scamTypology : null,
    }));

  const grantedConsents = twin.consent.consents
    .filter((c) => c.granted && !c.revokedAt)
    .map((c) => c.scope);

  return {
    customerId: twin.customerId,
    generatedAt: new Date().toISOString(),

    // Dành cho UI: giải thích KNIGHT đã dùng data gì
    explainSummary: {
      sessionRiskSignals: sessionRisk,
      topEssentialSpending: essentials,
      flaggedBeneficiaries,
      trustScore: twin.trustHistory.currentTrustScore,
      trustLevel: twin.trustHistory.trustLevel,
      incidentCount: twin.trustHistory.summary.totalIncidents,
      currentRiskScore: twin.riskTrend.currentScore,
      riskDirection: twin.riskTrend.trend.direction,
      recoveryPhase: twin.recoveryJourney.phase,
    },

    // Consent đang active — hiển thị cho khách thấy KNIGHT dùng data nào
    activeConsents: grantedConsents,

    // Điều chỉnh ngưỡng (safe to show)
    adjustedThresholds: twin.trustHistory.adjustedThresholds,
  };
}

/**
 * Handler chính — trả về true nếu route được xử lý.
 */
export async function handleTwinRoutes(req, res, requestUrl) {
  const { pathname } = requestUrl;
  const method = req.method;

  // GET /api/twin (list all IDs — for dev/testing)
  if (pathname === "/api/twin" && method === "GET") {
    sendJson(res, 200, { customerIds: listTwinIds() });
    return true;
  }

  // GET /api/twin/:customerId — full twin
  const baseMatch = pathname.match(TWIN_BASE);
  if (baseMatch && method === "GET") {
    const twin = getTwinById(baseMatch[1]);
    if (!twin) { sendJson(res, 404, { error: "Twin not found" }); return true; }
    sendJson(res, 200, twin);
    return true;
  }

  // PATCH /api/twin/:customerId — partial update
  if (baseMatch && method === "PATCH") {
    try {
      const patch = await readJson(req, 256 * 1024);
      const updated = patchTwin(baseMatch[1], patch);
      if (!updated) { sendJson(res, 404, { error: "Twin not found" }); return true; }
      sendJson(res, 200, updated);
    } catch (err) {
      sendJson(res, 400, { error: err.message || "Invalid request" });
    }
    return true;
  }

  // POST /api/twin/:customerId/reset
  const resetMatch = pathname.match(TWIN_RESET);
  if (resetMatch && method === "POST") {
    const ok = resetTwin(resetMatch[1]);
    if (!ok) { sendJson(res, 404, { error: "Twin not found or not resettable" }); return true; }
    sendJson(res, 200, { success: true, twin: getTwinById(resetMatch[1]) });
    return true;
  }

  // POST /api/twin/:customerId/personality
  const personalityMatch = pathname.match(TWIN_PERSONALITY);
  if (personalityMatch && method === "POST") {
    try {
      const { personalityId } = await readJson(req, 64 * 1024);
      const updated = setTwinPersonality(personalityMatch[1], personalityId);
      if (!updated) {
        sendJson(res, 404, { error: "Twin not found or invalid personality" });
        return true;
      }
      sendJson(res, 200, { success: true, twin: updated });
    } catch (err) {
      sendJson(res, 400, { error: err.message || "Invalid request" });
    }
    return true;
  }

  // GET /api/twin/:customerId/explain — safe public summary
  const explainMatch = pathname.match(TWIN_EXPLAIN);
  if (explainMatch && method === "GET") {
    const twin = getTwinById(explainMatch[1]);
    if (!twin) { sendJson(res, 404, { error: "Twin not found" }); return true; }
    sendJson(res, 200, buildSafeExplain(twin));
    return true;
  }

  // GET /api/twin/:customerId/consent
  const consentMatch = pathname.match(TWIN_CONSENT);
  if (consentMatch && method === "GET") {
    const twin = getTwinById(consentMatch[1]);
    if (!twin) { sendJson(res, 404, { error: "Twin not found" }); return true; }
    sendJson(res, 200, twin.consent);
    return true;
  }

  // GET /api/twin/:customerId/risk-trend
  const riskTrendMatch = pathname.match(TWIN_RISK_TREND);
  if (riskTrendMatch && method === "GET") {
    const twin = getTwinById(riskTrendMatch[1]);
    if (!twin) { sendJson(res, 404, { error: "Twin not found" }); return true; }
    sendJson(res, 200, twin.riskTrend);
    return true;
  }

  // GET /api/twin/:customerId/beneficiaries — all nodes
  const beneficiariesMatch = pathname.match(TWIN_BENEFICIARIES);
  if (beneficiariesMatch && method === "GET") {
    const twin = getTwinById(beneficiariesMatch[1]);
    if (!twin) { sendJson(res, 404, { error: "Twin not found" }); return true; }

    // Support ?flagged=true filter
    const onlyFlagged = requestUrl.searchParams.get("flagged") === "true";
    const nodes = onlyFlagged
      ? twin.beneficiaryGraph.nodes.filter(
          (n) => n.riskSignals.isReportedMule || n.riskSignals.isScamTypology
        )
      : twin.beneficiaryGraph.nodes;

    sendJson(res, 200, {
      customerId: beneficiariesMatch[1],
      summary: twin.beneficiaryGraph.summary,
      nodes,
    });
    return true;
  }

  // GET /api/twin/:customerId/beneficiary/:benId — single lookup
  const benIdMatch = pathname.match(TWIN_BENEFICIARY_ID);
  if (benIdMatch && method === "GET") {
    const twin = getTwinById(benIdMatch[1]);
    if (!twin) { sendJson(res, 404, { error: "Twin not found" }); return true; }

    const node = twin.beneficiaryGraph.nodes.find((n) => n.id === benIdMatch[2]);
    if (!node) {
      // Không có trong graph → mới hoàn toàn
      sendJson(res, 200, {
        found: false,
        beneficiaryId: benIdMatch[2],
        isNew: true,
        riskSignals: {
          isNewRecipient: true,
          isReportedMule: false,
          isScamTypology: false,
          merchantCategoryRisk: "low",
          clusterRisk: "isolated",
          scamTypology: "none",
        },
      });
    } else {
      sendJson(res, 200, { found: true, ...node });
    }
    return true;
  }

  // POST /api/twin/:customerId/beneficiary — upsert node
  const benPostMatch = pathname.match(TWIN_BENEFICIARY_POST);
  if (benPostMatch && method === "POST") {
    try {
      const node = await readJson(req, 64 * 1024);
      if (!node.id || !node.type || !node.label) {
        sendJson(res, 400, { error: "Missing required fields: id, type, label" });
        return true;
      }

      const twin = getTwinById(benPostMatch[1]);
      if (!twin) { sendJson(res, 404, { error: "Twin not found" }); return true; }

      const existingIdx = twin.beneficiaryGraph.nodes.findIndex((n) => n.id === node.id);
      let nodes;
      if (existingIdx >= 0) {
        nodes = twin.beneficiaryGraph.nodes.map((n, i) => (i === existingIdx ? node : n));
      } else {
        nodes = [...twin.beneficiaryGraph.nodes, node];
      }

      const flaggedCount = nodes.filter(
        (n) => n.riskSignals.isReportedMule || n.riskSignals.isScamTypology
      ).length;

      const updatedTwin = {
        ...twin,
        beneficiaryGraph: {
          ...twin.beneficiaryGraph,
          nodes,
          updatedAt: new Date().toISOString(),
          summary: {
            ...twin.beneficiaryGraph.summary,
            totalKnownBeneficiaries: nodes.length,
            flaggedBeneficiariesCount: flaggedCount,
            muleContactCount: nodes.filter((n) => n.riskSignals.isReportedMule).length,
          },
        },
        lastUpdatedAt: new Date().toISOString(),
      };

      upsertTwin(updatedTwin);
      sendJson(res, 200, { success: true, node, summary: updatedTwin.beneficiaryGraph.summary });
    } catch (err) {
      sendJson(res, 400, { error: err.message || "Invalid request" });
    }
    return true;
  }

  return false; // không xử lý route này
}
