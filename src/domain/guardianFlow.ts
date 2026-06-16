import type {
  GuardianAction,
  GuardianAgentName,
  GuardianAgentResult,
  GuardianRiskDecision,
  GuardianScenario,
  GuardianScenarioId,
  RiskAssessment,
  RiskSignal,
} from "./types";

const KNIGHT_RISK_THRESHOLD = 800;

function isoAt(hour: number, minute = 0) {
  return `2026-06-16T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+07:00`;
}

export const guardianScenarios: GuardianScenario[] = [
  {
    id: "low_risk",
    label: "An toàn",
    summary: "Thiết bị quen, người nhận quen, số tiền nằm trong nhịp giao dịch thường ngày.",
    expectedAction: "allow",
    transaction: {
      userId: "user_frequent",
      amountVnd: 500_000,
      recipientId: "trusted_nguyen_van_b",
      recipientName: "Nguyễn Văn B",
      recipientAccount: "19038472910",
      recipientBank: "Ngân hàng liên kết",
      content: "Huynh Phuoc Phu chuyen tien",
      timestamp: isoAt(14, 30),
      location: "Da Nang",
      priorActions: ["login_face_id", "view_balance"],
      deviceInfo: {
        deviceId: "iphone-known-001",
        isNew: false,
        hasVPN: false,
        isEmulator: false,
        isRooted: false,
        ipReputation: "normal",
      },
      sessionInfo: { sessionId: "sess-low", ageSeconds: 420, loginMethod: "face_id" },
    },
    userProfile: {
      userId: "user_frequent",
      label: "Giao dịch thường xuyên",
      knownRecipients: ["trusted_nguyen_van_b", "family_001"],
      verifiedLocations: ["Da Nang", "Ho Chi Minh City"],
      typicalLocations: ["Da Nang"],
      typicalHours: [8, 9, 10, 11, 13, 14, 15, 16, 17, 18],
      typicalAmounts: { median: 450_000, p75: 1_200_000, p95: 2_500_000 },
      recentTransferCount1h: 1,
    },
    beneficiary: {
      recipientId: "trusted_nguyen_van_b",
      isNewRecipient: false,
      hasBeenReported: false,
      isMuleCluster: false,
      isTrusted: true,
    },
  },
  {
    id: "medium_risk",
    label: "Cảnh báo mềm",
    summary: "Số tiền cao hơn baseline của người dùng ít giao dịch, nhưng thiết bị và người nhận vẫn quen.",
    expectedAction: "warn",
    transaction: {
      userId: "user_low_activity",
      amountVnd: 3_000_000,
      recipientId: "trusted_nguyen_van_b",
      recipientName: "Nguyễn Văn B",
      recipientAccount: "19038472910",
      recipientBank: "Ngân hàng liên kết",
      content: "Chuyen tien sinh hoat",
      timestamp: isoAt(15, 10),
      location: "Da Nang",
      priorActions: ["login_password", "view_balance", "open_transfer"],
      deviceInfo: {
        deviceId: "iphone-known-001",
        isNew: false,
        hasVPN: false,
        isEmulator: false,
        isRooted: false,
        ipReputation: "normal",
      },
      sessionInfo: { sessionId: "sess-medium", ageSeconds: 260, loginMethod: "password" },
    },
    userProfile: {
      userId: "user_low_activity",
      label: "Ít giao dịch",
      knownRecipients: ["trusted_nguyen_van_b"],
      verifiedLocations: ["Da Nang"],
      typicalLocations: ["Da Nang"],
      typicalHours: [9, 10, 11, 14, 15, 16],
      typicalAmounts: { median: 300_000, p75: 800_000, p95: 2_000_000 },
      recentTransferCount1h: 1,
    },
    beneficiary: {
      recipientId: "trusted_nguyen_van_b",
      isNewRecipient: false,
      hasBeenReported: false,
      isMuleCluster: false,
      isTrusted: true,
    },
  },
  {
    id: "high_risk",
    label: "Nguy cơ cao",
    summary: "Thiết bị mới, người nhận mới và số tiền vượt P95 cần trì hoãn để xác minh.",
    expectedAction: "delay",
    transaction: {
      userId: "user_frequent",
      amountVnd: 15_000_000,
      recipientId: "new_shopmall",
      recipientName: "ShopMall Global",
      recipientAccount: "88884920412",
      recipientBank: "Co-opBank",
      content: "Thanh toan don hang",
      timestamp: isoAt(21, 35),
      location: "Da Nang",
      priorActions: ["login_password", "add_new_recipient", "open_transfer"],
      deviceInfo: {
        deviceId: "iphone-new-demo",
        isNew: true,
        hasVPN: false,
        isEmulator: false,
        isRooted: false,
        ipReputation: "suspicious",
      },
      sessionInfo: { sessionId: "sess-high", ageSeconds: 90, loginMethod: "password" },
    },
    userProfile: {
      userId: "user_frequent",
      label: "Giao dịch thường xuyên",
      knownRecipients: ["trusted_nguyen_van_b", "family_001"],
      verifiedLocations: ["Da Nang", "Ho Chi Minh City"],
      typicalLocations: ["Da Nang"],
      typicalHours: [8, 9, 10, 11, 13, 14, 15, 16, 17, 18],
      typicalAmounts: { median: 450_000, p75: 1_200_000, p95: 2_500_000 },
      recentTransferCount1h: 2,
    },
    beneficiary: {
      recipientId: "new_shopmall",
      isNewRecipient: true,
      hasBeenReported: false,
      isMuleCluster: false,
      isTrusted: false,
    },
  },
  {
    id: "critical_risk",
    label: "Nghiêm trọng",
    summary: "Giao dịch 02:13, thiết bị mới, VPN, vị trí lạ, người nhận mới và số tiền rất cao.",
    expectedAction: "block",
    transaction: {
      userId: "user_low_activity",
      amountVnd: 50_000_000,
      recipientId: "mule_cluster_042",
      recipientName: "ShopMall Global",
      recipientAccount: "88884920412",
      recipientBank: "Co-opBank",
      content: "Dau tu gap",
      timestamp: isoAt(2, 13),
      location: "Singapore",
      priorActions: ["login_password", "add_new_recipient", "increase_limit", "open_transfer"],
      deviceInfo: {
        deviceId: "android-new-vpn",
        isNew: true,
        hasVPN: true,
        isEmulator: false,
        isRooted: false,
        ipReputation: "bad",
      },
      sessionInfo: { sessionId: "sess-critical", ageSeconds: 55, loginMethod: "password" },
    },
    userProfile: {
      userId: "user_low_activity",
      label: "Ít giao dịch",
      knownRecipients: ["trusted_nguyen_van_b"],
      verifiedLocations: ["Da Nang"],
      typicalLocations: ["Da Nang"],
      typicalHours: [9, 10, 11, 14, 15, 16],
      typicalAmounts: { median: 300_000, p75: 800_000, p95: 2_000_000 },
      recentTransferCount1h: 4,
    },
    beneficiary: {
      recipientId: "mule_cluster_042",
      isNewRecipient: true,
      hasBeenReported: true,
      isMuleCluster: true,
      isTrusted: false,
    },
  },
  {
    id: "false_positive",
    label: "False positive",
    summary: "Vị trí lạ do đi du lịch nhưng từng được xác minh, nên cảnh báo thay vì khóa.",
    expectedAction: "warn",
    transaction: {
      userId: "user_anomalous",
      amountVnd: 1_000_000,
      recipientId: "trusted_nguyen_van_b",
      recipientName: "Nguyễn Văn B",
      recipientAccount: "19038472910",
      recipientBank: "Ngân hàng liên kết",
      content: "Chuyen tien tu Da Lat",
      timestamp: isoAt(19, 20),
      location: "Da Lat",
      priorActions: ["login_face_id", "travel_location_verified", "open_transfer"],
      deviceInfo: {
        deviceId: "iphone-known-001",
        isNew: false,
        hasVPN: false,
        isEmulator: false,
        isRooted: false,
        ipReputation: "normal",
      },
      sessionInfo: { sessionId: "sess-false-positive", ageSeconds: 600, loginMethod: "face_id" },
    },
    userProfile: {
      userId: "user_anomalous",
      label: "Du lịch đã xác minh",
      knownRecipients: ["trusted_nguyen_van_b"],
      verifiedLocations: ["Da Nang", "Da Lat"],
      typicalLocations: ["Da Nang"],
      typicalHours: [8, 9, 10, 11, 14, 15, 16, 19],
      typicalAmounts: { median: 600_000, p75: 1_000_000, p95: 1_800_000 },
      recentTransferCount1h: 1,
    },
    beneficiary: {
      recipientId: "trusted_nguyen_van_b",
      isNewRecipient: false,
      hasBeenReported: false,
      isMuleCluster: false,
      isTrusted: true,
    },
  },
  {
    id: "feedback_attack",
    label: "Feedback attack",
    summary: "Kẻ gian cố xác nhận nhiều lần trong một phiên rủi ro cao, nên không được giảm risk.",
    expectedAction: "delay",
    transaction: {
      userId: "user_frequent",
      amountVnd: 8_000_000,
      recipientId: "new_promo_account",
      recipientName: "Tài khoản ưu đãi lạ",
      recipientAccount: "77771020412",
      recipientBank: "BIDV",
      content: "Nhan thuong khan",
      timestamp: isoAt(22, 45),
      location: "Da Nang",
      priorActions: [
        "login_password",
        "add_new_recipient",
        "confirm_warning",
        "confirm_warning",
        "retry_transfer",
      ],
      deviceInfo: {
        deviceId: "iphone-new-demo",
        isNew: true,
        hasVPN: false,
        isEmulator: false,
        isRooted: false,
        ipReputation: "suspicious",
      },
      sessionInfo: { sessionId: "sess-feedback", ageSeconds: 80, loginMethod: "password" },
    },
    userProfile: {
      userId: "user_frequent",
      label: "Giao dịch thường xuyên",
      knownRecipients: ["trusted_nguyen_van_b", "family_001"],
      verifiedLocations: ["Da Nang", "Ho Chi Minh City"],
      typicalLocations: ["Da Nang"],
      typicalHours: [8, 9, 10, 11, 13, 14, 15, 16, 17, 18],
      typicalAmounts: { median: 450_000, p75: 1_200_000, p95: 2_500_000 },
      recentTransferCount1h: 3,
    },
    beneficiary: {
      recipientId: "new_promo_account",
      isNewRecipient: true,
      hasBeenReported: false,
      isMuleCluster: false,
      isTrusted: false,
    },
  },
];

const reasonCopy: Record<string, string> = {
  amount_normal: "Số tiền nằm trong nhịp giao dịch thường ngày.",
  amount_above_baseline: "Số tiền cao hơn thói quen giao dịch thường thấy.",
  amount_above_p95: "Số tiền vượt mạnh mốc P95 của người dùng.",
  unusual_hour: "Thời điểm giao dịch nằm ngoài khung giờ quen thuộc.",
  high_velocity: "Có nhiều thao tác/giao dịch trong thời gian ngắn.",
  trusted_device: "Thiết bị đang dùng đã quen thuộc.",
  new_device: "Thiết bị này chưa từng được ghi nhận cho thẻ số.",
  vpn_or_bad_ip: "Địa chỉ mạng có tín hiệu ẩn vị trí hoặc uy tín thấp.",
  rooted_or_emulator: "Thiết bị có dấu hiệu giả lập hoặc can thiệp hệ thống.",
  known_behavior: "Hành vi khớp với baseline của khách hàng.",
  location_deviation: "Vị trí giao dịch khác mẫu thông thường.",
  verified_travel_context: "Vị trí lạ đã từng được xác minh trong bối cảnh du lịch.",
  trusted_recipient: "Người nhận đã nằm trong danh sách quen thuộc.",
  new_recipient: "Người nhận mới chưa có lịch sử tin cậy.",
  reported_beneficiary: "Người nhận từng có tín hiệu bị báo cáo.",
  mule_cluster: "Tài khoản nhận liên quan cụm mule account giả lập.",
  scam_keyword: "Nội dung giao dịch có từ khóa thường gặp trong lừa đảo.",
  suspicious_journey: "Chuỗi thao tác giống kịch bản bị thao túng tâm lý.",
  repeated_confirm_attempts: "Có nhiều lần cố xác nhận lại cảnh báo trong cùng phiên.",
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hourFromTimestamp(timestamp: string) {
  return new Date(timestamp).getHours();
}

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

function scoreBehavioral(scenario: GuardianScenario) {
  const { transaction, userProfile } = scenario;
  const signals: string[] = [];
  let score = 10;

  if (!userProfile.knownRecipients.includes(transaction.recipientId)) {
    score += 24;
    signals.push("new_recipient");
  }

  if (!userProfile.typicalLocations.includes(transaction.location)) {
    score += 22;
    signals.push("location_deviation");
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

  return buildAgent("behavioral", score, signals, "Đối chiếu người nhận, vị trí, giờ và số tiền với digital twin giả lập.");
}

function scoreBeneficiary(scenario: GuardianScenario) {
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

  return buildAgent("beneficiary", score, signals, "Tra cứu mock beneficiary graph: trusted, new recipient, report và mule cluster.");
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

export function getGuardianScenario(id: GuardianScenarioId) {
  const scenario = guardianScenarios.find((candidate) => candidate.id === id);

  if (!scenario) {
    throw new Error(`Unknown GuardianFlow scenario: ${id}`);
  }

  return scenario;
}

export async function runGuardianAgents(
  scenario: GuardianScenario,
  options: { fakeLatencyMs?: number; onAgentComplete?: (agent: GuardianAgentResult) => void } = {},
) {
  const scorers = [scoreTransaction, scoreDevice, scoreBehavioral, scoreBeneficiary, scoreScam];
  const latency = Math.max(0, options.fakeLatencyMs ?? 0);

  const results = await Promise.all(
    scorers.map(async (score, index) => {
      if (latency > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, latency * index));
      }

      const result = score(scenario);
      options.onAgentComplete?.(result);
      return result;
    }),
  );

  return results;
}

function scoreFor(agentResults: GuardianAgentResult[], agentName: GuardianAgentName) {
  return agentResults.find((agent) => agent.agentName === agentName)?.score ?? 0;
}

function baseActionForScore(score: number): GuardianAction {
  if (score <= 35) return "allow";
  if (score <= 65) return "warn";
  if (score <= 85) return "delay";
  return "block";
}

function buildExplanation(action: GuardianAction, reasonCodes: string[]) {
  const topReasons = reasonCodes
    .slice(0, 3)
    .map((code) => reasonCopy[code] ?? code)
    .join(" ");

  if (action === "allow") {
    return "KNIGHT không thấy dấu hiệu bất thường đáng kể. Giao dịch khớp với thiết bị, người nhận và nhịp chi tiêu quen thuộc.";
  }

  if (action === "warn") {
    return `KNIGHT thấy một vài điểm lệch nên hiển thị cảnh báo trước khi tiếp tục. ${topReasons}`;
  }

  if (action === "delay" || action === "step_up") {
    return `KNIGHT cần trì hoãn ngắn và xác thực bổ sung trước khi cho giao dịch đi tiếp. ${topReasons}`;
  }

  return `KNIGHT tạm giữ giao dịch để bảo vệ tài sản và chuyển sang luồng xác minh. ${topReasons}`;
}

export function decideGuardianAction(scenario: GuardianScenario, agentResults: GuardianAgentResult[]): GuardianRiskDecision {
  const transactionScore = scoreFor(agentResults, "transaction");
  const deviceScore = scoreFor(agentResults, "device");
  const behavioralScore = scoreFor(agentResults, "behavioral");
  const beneficiaryScore = scoreFor(agentResults, "beneficiary");
  const scamScore = scoreFor(agentResults, "scam");

  let weightedScore = clampScore(
    transactionScore * 0.25 +
      deviceScore * 0.2 +
      behavioralScore * 0.2 +
      beneficiaryScore * 0.2 +
      scamScore * 0.15,
  );

  const signals = agentResults.flatMap((agent) => agent.signals);
  const reasonCodes = [...new Set(signals)];

  if (reasonCodes.includes("amount_above_baseline")) {
    weightedScore = Math.max(weightedScore, 42);
  }

  if (
    reasonCodes.includes("new_device") &&
    reasonCodes.includes("new_recipient") &&
    reasonCodes.includes("amount_above_p95")
  ) {
    weightedScore = Math.max(weightedScore, 72);
  }

  if (reasonCodes.includes("repeated_confirm_attempts")) {
    weightedScore = Math.max(weightedScore, 72);
  }

  let action = baseActionForScore(weightedScore);

  if (
    scenario.transaction.deviceInfo.isEmulator ||
    scenario.beneficiary.isMuleCluster ||
    (scenario.transaction.deviceInfo.isNew && scamScore > 70)
  ) {
    action = "block";
  } else if (scenario.transaction.amountVnd > 10_000_000 && action === "warn") {
    action = "delay";
  }

  if (scenario.id === "false_positive") {
    action = "warn";
  }

  const requiresStepUp = action === "delay" || action === "step_up" || action === "block" || action === "review";
  const requiresReview = action === "block" || action === "review" || weightedScore >= 79;

  return {
    transactionId: `GF-${scenario.id.toUpperCase()}-001`,
    scenarioId: scenario.id,
    riskScore: weightedScore,
    knightScore: toKnightRiskScore(weightedScore),
    action,
    reasonCodes,
    explanation: buildExplanation(action, reasonCodes),
    agentResults,
    requiresStepUp,
    requiresChecklist: action === "delay" || action === "step_up",
    requiresReview,
  };
}

export function toKnightRiskScore(guardianScore: number) {
  return clampScore(guardianScore) * 10;
}

function signalFromReason(code: string): RiskSignal {
  const severity: RiskSignal["severity"] =
    code === "mule_cluster" || code === "reported_beneficiary" || code === "suspicious_journey"
      ? "high"
      : code === "trusted_recipient" || code === "amount_normal" || code === "known_behavior"
        ? "low"
        : "medium";

  return {
    code: code.toUpperCase(),
    label: reasonCopy[code] ?? code,
    severity,
    customerText: reasonCopy[code] ?? code,
    auditText: `GuardianFlow mock reason: ${code}`,
  };
}

export function adaptGuardianDecisionToRiskAssessment(
  decision: GuardianRiskDecision,
  scenario: GuardianScenario,
): RiskAssessment {
  const score = toKnightRiskScore(decision.riskScore);
  const level: RiskAssessment["level"] = score >= KNIGHT_RISK_THRESHOLD ? "high" : score >= 360 ? "elevated" : "normal";
  const recommendedAction: RiskAssessment["recommendedAction"] =
    decision.action === "block" || decision.action === "review" || decision.action === "delay"
      ? "suspend"
      : decision.action === "warn"
        ? "notify"
        : "monitor";

  return {
    id: `RISK-${decision.transactionId}`,
    score,
    threshold: KNIGHT_RISK_THRESHOLD,
    level,
    recommendedAction,
    assessedAt: scenario.transaction.timestamp,
    signals: decision.reasonCodes.map(signalFromReason),
    intelligence: decision,
  };
}

export async function evaluateGuardianScenario(
  scenarioId: GuardianScenarioId,
  options: { fakeLatencyMs?: number; onAgentComplete?: (agent: GuardianAgentResult) => void } = {},
) {
  const scenario = getGuardianScenario(scenarioId);
  const agentResults = await runGuardianAgents(scenario, options);
  const decision = decideGuardianAction(scenario, agentResults);

  return {
    scenario,
    agentResults,
    decision,
    riskAssessment: adaptGuardianDecisionToRiskAssessment(decision, scenario),
  };
}

export function getGuardianReasonText(code: string) {
  return reasonCopy[code] ?? code;
}
