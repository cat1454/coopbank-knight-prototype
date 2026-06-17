/**
 * Digital Twin API Client
 * Co-opBank KNIGHT · src/shared/api/twin.ts
 *
 * Frontend service để gọi mock backend API /api/twin/*.
 * Tất cả error đều trả về null thay vì throw — caller tự xử lý fallback.
 */

import { buildBackendUrl } from "./backend";
import type {
  BeneficiaryGraph,
  BeneficiaryNode,
  ConsentRegistry,
  CustomerDigitalTwin,
  RiskProfileTrend,
} from "../../domain/knight/digital-twin";

// ─────────────────────────────────────────────
// Safe explain response (không phải raw twin)
// ─────────────────────────────────────────────

export interface TwinExplainResponse {
  customerId: string;
  generatedAt: string;
  explainSummary: {
    sessionRiskSignals: string[];
    topEssentialSpending: { label: string; sharePercent: number }[];
    flaggedBeneficiaries: {
      label: string;
      isNew: boolean;
      scamTypology: string | null;
    }[];
    trustScore: number;
    trustLevel: string;
    incidentCount: number;
    currentRiskScore: number;
    riskDirection: "improving" | "stable" | "worsening";
    recoveryPhase: string;
  };
  activeConsents: string[];
  adjustedThresholds: {
    suspendThreshold: number;
    notifyThreshold: number;
    timeoutMinutes: number;
  };
}

export interface BeneficiaryLookupResponse {
  found: boolean;
  isNew?: boolean;
  riskSignals?: BeneficiaryNode["riskSignals"];
  id?: string;
  label?: string;
  type?: string;
  txCount?: number;
  totalSentVnd?: number;
  isFrequent?: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function get<T>(path: string): Promise<T | null> {
  const url = buildBackendUrl(path);
  if (!url) return null;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function post<TBody, TResponse>(path: string, body: TBody): Promise<TResponse | null> {
  const url = buildBackendUrl(path);
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as TResponse;
  } catch {
    return null;
  }
}

async function patch<TBody, TResponse>(path: string, body: TBody): Promise<TResponse | null> {
  const url = buildBackendUrl(path);
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as TResponse;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Twin API
// ─────────────────────────────────────────────

/**
 * Lấy full twin. Chỉ dùng server-side / internal — không hiển thị raw cho khách.
 */
export async function fetchTwin(customerId: string): Promise<CustomerDigitalTwin | null> {
  return get<CustomerDigitalTwin>(`/api/twin/${customerId}`);
}

/**
 * Lấy safe explain — dùng cho UI để giải thích KNIGHT đã dùng data gì.
 * Đây là endpoint an toàn hiển thị cho khách.
 */
export async function fetchTwinExplain(customerId: string): Promise<TwinExplainResponse | null> {
  return get<TwinExplainResponse>(`/api/twin/${customerId}/explain`);
}

/**
 * Cập nhật một phần twin (PATCH).
 */
export async function patchTwin(
  customerId: string,
  patch_data: Partial<CustomerDigitalTwin>
): Promise<CustomerDigitalTwin | null> {
  return patch<Partial<CustomerDigitalTwin>, CustomerDigitalTwin>(
    `/api/twin/${customerId}`,
    patch_data
  );
}

/**
 * Reset twin về mock ban đầu (dùng trong demo reset flow).
 */
export async function resetTwin(customerId: string): Promise<boolean> {
  const result = await post<Record<string, never>, { success: boolean }>(
    `/api/twin/${customerId}/reset`,
    {}
  );
  return result?.success ?? false;
}

/**
 * Cập nhật cá tính chi tiêu & sở thích của twin.
 */
export async function updateTwinPersonality(customerId: string, personalityId: string): Promise<boolean> {
  const result = await post<{ personalityId: string }, { success: boolean }>(
    `/api/twin/${customerId}/personality`,
    { personalityId }
  );
  return result?.success ?? false;
}

// ─────────────────────────────────────────────
// Beneficiary API
// ─────────────────────────────────────────────

/**
 * Lấy toàn bộ danh sách beneficiary của khách.
 * @param onlyFlagged - chỉ lấy các node bị cảnh báo
 */
export async function fetchBeneficiaries(
  customerId: string,
  onlyFlagged = false
): Promise<{ summary: BeneficiaryGraph["summary"]; nodes: BeneficiaryNode[] } | null> {
  const qs = onlyFlagged ? "?flagged=true" : "";
  return get(`/api/twin/${customerId}/beneficiaries${qs}`);
}

/**
 * Lookup một beneficiary theo id.
 * Trả về { found: false, isNew: true } nếu không có trong graph.
 */
export async function lookupBeneficiary(
  customerId: string,
  beneficiaryId: string
): Promise<BeneficiaryLookupResponse | null> {
  return get<BeneficiaryLookupResponse>(
    `/api/twin/${customerId}/beneficiary/${encodeURIComponent(beneficiaryId)}`
  );
}

/**
 * Upsert một beneficiary node vào graph của khách.
 */
export async function upsertBeneficiary(
  customerId: string,
  node: BeneficiaryNode
): Promise<{ success: boolean; node: BeneficiaryNode; summary: BeneficiaryGraph["summary"] } | null> {
  return post(`/api/twin/${customerId}/beneficiary`, node);
}

// ─────────────────────────────────────────────
// Consent & Risk Trend
// ─────────────────────────────────────────────

export async function fetchConsent(customerId: string): Promise<ConsentRegistry | null> {
  return get<ConsentRegistry>(`/api/twin/${customerId}/consent`);
}

export async function fetchRiskTrend(customerId: string): Promise<RiskProfileTrend | null> {
  return get<RiskProfileTrend>(`/api/twin/${customerId}/risk-trend`);
}
