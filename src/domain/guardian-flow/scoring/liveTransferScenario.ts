
import type { GuardianScenario, GuardianTransactionEvaluationInput } from "../types";
import type { CustomerDigitalTwin } from "../../knight/digital-twin";
import { isNewBeneficiary, findBeneficiary, isBeneficiaryFlagged } from "../../knight/digital-twin";
import { isoAt } from "./scoringUtils";

function normalizeGuardianText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function isTrustedTransferRecipient(input: GuardianTransactionEvaluationInput) {
  const normalizedName = normalizeGuardianText(input.recipientName);
  return input.recipientAccount === "19038472910" || normalizedName.includes("nguyen van b");
}

function isKnownRiskRecipient(input: GuardianTransactionEvaluationInput) {
  const normalizedName = normalizeGuardianText(input.recipientName);
  return input.recipientAccount === "88884920412" || normalizedName.includes("shopmall");
}

function hasScamContent(input: GuardianTransactionEvaluationInput) {
  return /(dau tu|đầu tư|gap|gấp|khan|khẩn|thuong|thưởng|hoan thue|hoàn thuế)/i.test(input.content);
}

export function buildLiveTransferScenario(
  input: GuardianTransactionEvaluationInput,
  twin?: CustomerDigitalTwin | null
): GuardianScenario {
  const trustedRecipient = isTrustedTransferRecipient(input);
  const knownRiskRecipient = isKnownRiskRecipient(input);
  const scamContent = hasScamContent(input);
  const criticalShape = input.amountVnd >= 30_000_000 || input.ipReputation === "bad";
  const timestamp = input.timestamp ?? (criticalShape ? isoAt(2, 13) : isoAt(15, 10));
  const location = input.location ?? "Da Nang";

  // ── Twin-aware enrichment ──────────────────────────────────────────
  // Nếu có twin, dùng dữ liệu thực từ BehavioralBaseline và BeneficiaryGraph
  // thay vì heuristics hardcode. Fallback về heuristics khi không có twin.

  const recipientId = trustedRecipient
    ? "trusted_nguyen_van_b"
    : knownRiskRecipient
      ? "mule_cluster_042"
      : `recipient_${input.recipientAccount.slice(-6)}`;

  // knownRecipients: từ BeneficiaryGraph (isFrequent nodes)
  const knownRecipients: string[] = twin
    ? twin.beneficiaryGraph.nodes
        .filter((n) => n.isFrequent && !n.riskSignals.isReportedMule)
        .map((n) => n.id)
    : ["trusted_nguyen_van_b"];

  // typicalHours: từ BehavioralBaseline
  const typicalHours: number[] = twin
    ? twin.behavioral.typicalActiveHours
    : [9, 10, 11, 14, 15, 16];

  // typicalAmounts: từ BehavioralBaseline
  const typicalAmounts = twin
    ? {
        median: Math.round(twin.behavioral.typicalAmountRange.minVnd * 3),
        p75: Math.round(twin.behavioral.typicalAmountRange.maxVnd * 0.6),
        p95: twin.behavioral.typicalAmountRange.p95Vnd,
      }
    : { median: 300_000, p75: 800_000, p95: 2_000_000 };

  // isNewRecipient: từ BeneficiaryGraph nếu có twin
  const isRecipientNew = twin
    ? isNewBeneficiary(twin, recipientId) && !trustedRecipient
    : !trustedRecipient;

  // beneficiary risk signals từ twin
  const benNode = twin ? findBeneficiary(twin, recipientId) : undefined;
  const isFlagged = twin ? isBeneficiaryFlagged(twin, recipientId) : knownRiskRecipient;

  const priorActions =
    input.priorActions ??
    (isRecipientNew
      ? ["login_password", "add_new_recipient", "open_transfer"]
      : ["login_password", "view_balance", "open_transfer"]);

  const deviceTrust = input.deviceTrust ?? (isRecipientNew && input.amountVnd >= 10_000_000 ? "new" : "trusted");
  const ipReputation = input.ipReputation ?? (isFlagged ? "suspicious" : "normal");

  // verifiedLocations và typicalLocations từ twin nếu có
  const typicalLocations = twin ? twin.behavioral.typicalGeos : ["Da Nang"];
  const verifiedLocations = twin ? twin.behavioral.typicalGeos : ["Da Nang"];
  const recentTransferCount1h = criticalShape ? 4 : 1;

  return {
    id: "high_risk",
    label: "Live transfer evaluation",
    summary: "KNIGHT chấm giao dịch chuyển tiền từ dữ liệu người dùng vừa nhập.",
    expectedAction: "warn",
    transaction: {
      userId: twin?.customerId ?? "user_low_activity",
      amountVnd: input.amountVnd,
      recipientId,
      recipientName: input.recipientName,
      recipientAccount: input.recipientAccount,
      recipientBank: input.recipientBank,
      content: input.content,
      timestamp,
      location,
      priorActions,
      deviceInfo: {
        deviceId: deviceTrust === "trusted" ? "iphone-known-001" : "iphone-new-transfer",
        isNew: deviceTrust !== "trusted",
        hasVPN: ipReputation === "bad",
        isEmulator: false,
        isRooted: false,
        ipReputation,
      },
      sessionInfo: {
        sessionId: "sess-live-transfer",
        ageSeconds: isRecipientNew ? 80 : 260,
        loginMethod: input.loginMethod ?? "password",
      },
    },
    userProfile: {
      userId: twin?.customerId ?? "user_low_activity",
      label: twin ? `${twin.customerId} profile` : "Ít giao dịch",
      knownRecipients,
      verifiedLocations,
      typicalLocations,
      typicalHours,
      typicalAmounts,
      recentTransferCount1h,
    },
    beneficiary: {
      recipientId,
      isNewRecipient: isRecipientNew,
      hasBeenReported: benNode
        ? benNode.riskSignals.isReportedMule
        : isFlagged && (input.amountVnd >= 10_000_000 || scamContent),
      isMuleCluster: benNode
        ? benNode.riskSignals.clusterRisk === "mule_cluster"
        : isFlagged && (criticalShape || input.ipReputation === "bad"),
      isTrusted: trustedRecipient || (benNode?.isFrequent === true && !benNode.riskSignals.isReportedMule),
    },
  };
}

