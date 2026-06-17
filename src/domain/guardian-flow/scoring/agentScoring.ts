
import type { GuardianAgentName, GuardianAgentResult, GuardianScenario } from "../types";
import { clampScore, hourFromTimestamp } from "./scoringUtils";
import type { TwinEnrichedContext } from "./twinContext";

function buildAgent(agentName: GuardianAgentName, score: number, signals: string[], reasoning: string): GuardianAgentResult {
  return {
    agentName,
    score: clampScore(score),
    status: "done",
    signals,
    reasoning,
  };
}

function scoreTransaction(scenario: GuardianScenario) {
  const { transaction, userProfile } = scenario;
  const hour = hourFromTimestamp(transaction.timestamp);
  const signals: string[] = [];
  let score = 10;

  if (transaction.amountVnd > userProfile.typicalAmounts.p95) {
    score += 45;
    signals.push("amount_above_baseline");
    signals.push("amount_above_p95");
  } else if (transaction.amountVnd > userProfile.typicalAmounts.p75) {
    score += 28;
    signals.push("amount_above_baseline");
  } else {
    signals.push("amount_normal");
  }

  if (hour >= 22 || hour < 6 || !userProfile.typicalHours.includes(hour)) {
    score += 18;
    signals.push("unusual_hour");
  }

  if (userProfile.recentTransferCount1h > 3) {
    score += 20;
    signals.push("high_velocity");
  }

  return buildAgent("transaction", score, signals, "So sánh số tiền, giờ giao dịch và tần suất với baseline của khách hàng.");
}

function scoreDevice(scenario: GuardianScenario) {
  const { deviceInfo } = scenario.transaction;
  const signals: string[] = [];
  let score = 8;

  if (deviceInfo.isNew) {
    score += 40;
    signals.push("new_device");
  } else {
    signals.push("trusted_device");
  }

  if (deviceInfo.hasVPN || deviceInfo.ipReputation === "bad") {
    score += deviceInfo.ipReputation === "bad" ? 35 : 25;
    signals.push("vpn_or_bad_ip");
  } else if (deviceInfo.ipReputation === "suspicious") {
    score += 15;
    signals.push("vpn_or_bad_ip");
  }

  if (deviceInfo.isEmulator || deviceInfo.isRooted) {
    score += deviceInfo.isEmulator ? 50 : 25;
    signals.push("rooted_or_emulator");
  }

  return buildAgent("device", score, signals, "Kiểm tra độ tin cậy thiết bị, phiên đăng nhập và tín hiệu mạng.");
}

function scoreBehavioral(scenario: GuardianScenario, twin?: TwinEnrichedContext) {
  const { transaction, userProfile } = scenario;
  const signals: string[] = [];
  let score = 10;

  if (!userProfile.knownRecipients.includes(transaction.recipientId)) {
    score += 24;
    signals.push("new_recipient");
  }

  // Twin-aware: dùng isGeoAnomaly từ BeneficiaryGraph/session thay vì chỉ typicalLocations hardcode
  const geoAnomaly = twin ? !twin.isDeviceKnown || twin.isGeoAnomaly : !userProfile.typicalLocations.includes(transaction.location);
  if (geoAnomaly) {
    score += 22;
    signals.push("location_deviation");
  }

  // Twin-aware: dùng isTypicalHour từ BehavioralBaseline thay vì chỉ typicalHours hardcode
  if (twin && !twin.isTypicalHour) {
    score += 8;  // bonus nhỏ ngoài transaction agent vì có cross-agent signal
    signals.push("unusual_hour");
  }

  if (userProfile.verifiedLocations.includes(transaction.location) && transaction.priorActions.includes("travel_location_verified")) {
    score = Math.max(10, score - 10);
    signals.push("verified_travel_context");
  }

  if (signals.length === 0) {
    signals.push("known_behavior");
  }

  if (transaction.amountVnd > userProfile.typicalAmounts.p95) {
    score += 18;
    signals.push("amount_above_baseline");
    signals.push("amount_above_p95");
  } else if (transaction.amountVnd > userProfile.typicalAmounts.p75) {
    score += 12;
    signals.push("amount_above_baseline");
  }

  const reasonSuffix = twin ? " Có dữ liệu digital twin để đối chiếu." : " Dùng heuristics khi không có twin.";
  return buildAgent("behavioral", score, signals, `Đối chiếu người nhận, vị trí, giờ và số tiền với digital twin giả lập.${reasonSuffix}`);
}

function scoreBeneficiary(scenario: GuardianScenario, twin?: TwinEnrichedContext) {
  const { beneficiary } = scenario;
  const signals: string[] = [];
  let score = beneficiary.isTrusted ? 8 : 15;

  if (beneficiary.isTrusted) {
    signals.push("trusted_recipient");
  }

  if (beneficiary.isNewRecipient) {
    score += 35;
    signals.push("new_recipient");
  }

  if (beneficiary.hasBeenReported) {
    score += 20;
    signals.push("reported_beneficiary");
  }

  if (beneficiary.isMuleCluster) {
    score += 35;
    signals.push("mule_cluster");
  }

  // Twin-aware: cộng thêm risk bonus từ BeneficiaryGraph (scam typology, cluster risk...)
  // Bonus được normalize từ 0–200 xuống 0–20 để không overwhelm composite score
  if (twin && twin.beneficiaryRiskBonus > 0) {
    const normalizedBonus = Math.round(twin.beneficiaryRiskBonus / 10);
    score += normalizedBonus;
    if (twin.scamTypologyDetected) {
      signals.push(`scam_typology_${twin.scamTypologyDetected}`);
    }
    if (twin.isBeneficiaryNew && !signals.includes("new_recipient")) {
      signals.push("new_recipient");
    }
  }

  return buildAgent("beneficiary", score, signals, "Tra cứu beneficiary graph: trusted, new recipient, report và mule cluster. Twin enrichment bổ sung scam typology.");
}

function scoreScam(scenario: GuardianScenario) {
  const { transaction, userProfile, beneficiary } = scenario;
  const content = transaction.content.toLocaleLowerCase("vi-VN");
  const signals: string[] = [];
  let score = 8;

  if (/(dau tu|đầu tư|gap|gấp|khan|khẩn|thuong|thưởng|hoan thue|hoàn thuế)/i.test(content)) {
    score += 20;
    signals.push("scam_keyword");
  }

  const suspiciousJourney =
    transaction.priorActions.includes("add_new_recipient") &&
    (transaction.priorActions.includes("increase_limit") || transaction.amountVnd > userProfile.typicalAmounts.p95) &&
    beneficiary.isNewRecipient;

  if (suspiciousJourney) {
    score += 24;
    signals.push("suspicious_journey");
  }

  const confirmAttempts = transaction.priorActions.filter((action) => action === "confirm_warning").length;
  if (confirmAttempts >= 2) {
    score += 10;
    signals.push("repeated_confirm_attempts");
  }

  if ((hourFromTimestamp(transaction.timestamp) >= 22 || hourFromTimestamp(transaction.timestamp) < 6) && beneficiary.isNewRecipient) {
    score += 8;
    signals.push("unusual_hour");
  }

  if (beneficiary.hasBeenReported || beneficiary.isMuleCluster) {
    score += 22;
    signals.push("reported_beneficiary");
  }

  if (signals.length === 0) {
    signals.push("known_behavior");
  }

  return buildAgent("scam", score, signals, "Nhận diện keyword và chuỗi thao tác thường gặp trong social engineering.");
}

export async function runGuardianAgents(
  scenario: GuardianScenario,
  options: {
    fakeLatencyMs?: number;
    onAgentComplete?: (agent: GuardianAgentResult) => void;
    twinContext?: TwinEnrichedContext;
  } = {},
) {
  const { twinContext } = options;
  const scorers: Array<(s: GuardianScenario, ctx?: TwinEnrichedContext) => GuardianAgentResult> = [
    scoreTransaction,
    scoreDevice,
    (s, ctx) => scoreBehavioral(s, ctx),
    (s, ctx) => scoreBeneficiary(s, ctx),
    scoreScam,
  ];
  const latency = Math.max(0, options.fakeLatencyMs ?? 0);

  const results = await Promise.all(
    scorers.map(async (score, index) => {
      if (latency > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, latency * index));
      }

      const result = score(scenario, twinContext);
      options.onAgentComplete?.(result);
      return result;
    }),
  );

  return results;
}
