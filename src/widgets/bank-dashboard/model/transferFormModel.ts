import type { GuardianRiskDecision, GuardianTransactionEvaluationInput } from "../../../domain/types";

export type TransferStep =
  | "input_recipient"
  | "input_details"
  | "confirm"
  | "processing"
  | "warning"
  | "verification"
  | "held"
  | "success";

export type GuardianLevelSetting = "max" | "standard" | "min";

export interface TransferSignal {
  tone: "neutral" | "success" | "warning" | "danger";
  label: string;
  detail: string;
}

export const transferChecklistItems = [
  "Tôi biết rõ người nhận và đã kiểm tra số tài khoản.",
  "Không ai yêu cầu tôi chuyển tiền gấp hoặc giữ bí mật.",
  "Nội dung giao dịch không liên quan đầu tư, thưởng hoặc hoàn tiền bất thường.",
];

const riskyTransferContentPattern = /dau tu|đầu tư|gap|gấp|bi mat|bí mật|hoan tien|hoàn tiền|thuong|thưởng|otp|crypto/i;

export function normalizeBankSearchText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function isGuardianConsentOff() {
  const stored = typeof window !== "undefined" ? window.sessionStorage.getItem("knight_guardianflow_consent") : null;
  return stored !== null && stored !== "granted";
}

export function getGuardianLevelSetting(): GuardianLevelSetting {
  if (typeof window === "undefined") return "standard";
  return (window.sessionStorage.getItem("knight_guardian_level") as GuardianLevelSetting) || "standard";
}

export function getKnownRecipientName(account: string) {
  if (account === "19038472910") return "NGUYỄN VĂN B";
  if (account === "88884920412") return "Lừa đảo: Mã độc APK";
  if (account === "99992019482") return "Lừa đảo: Tuyển CTV giật đơn";
  if (account === "77771020412") return "Lừa đảo: SMS Phishing tri ân";
  if (account === "66661902847") return "Lừa đảo: Sàn đầu tư ảo";
  return "TRẦN MINH TUẤN";
}

export function isRiskRecipient(recipientAccount: string, recipientName: string) {
  const account = recipientAccount.trim();
  const name = recipientName.toLowerCase();
  return (
    account === "88884920412" ||
    account === "99992019482" ||
    account === "77771020412" ||
    account === "66661902847" ||
    name.includes("shopmall") ||
    name.includes("mule") ||
    name.includes("khuyen mai") ||
    name.includes("dau tu") ||
    name.includes("khuyến mãi") ||
    name.includes("đầu tư") ||
    name.includes("lừa đảo") ||
    name.includes("lua dao")
  );
}

export function getTransferAmountSignal(hasTransferAmount: boolean, transferAmountNumber: number): TransferSignal {
  if (!hasTransferAmount) {
    return {
      tone: "neutral",
      label: "Đang khớp với thói quen chuyển tiền",
      detail: "Chưa có số tiền để so với nhịp thường ngày.",
    };
  }

  if (transferAmountNumber >= 30_000_000) {
    return {
      tone: "danger",
      label: "Vượt nhịp thường ngày",
      detail: "Cần giữ lại hoặc mở xác minh KNIGHT trước khi tiền rời tài khoản.",
    };
  }

  if (transferAmountNumber >= 10_000_000) {
    return {
      tone: "warning",
      label: "Cao hơn giao dịch quen thuộc",
      detail: "KNIGHT sẽ yêu cầu thêm tín hiệu người nhận và phiên đăng nhập.",
    };
  }

  return {
    tone: "success",
    label: "Trong nhịp thường ngày",
    detail: "Số tiền gần vùng giao dịch quen thuộc của tài khoản.",
  };
}

export function getTransferContentSignal(normalizedTransferContent: string): TransferSignal {
  if (!normalizedTransferContent) {
    return {
      tone: "neutral",
      label: "Đang quét nội dung",
      detail: "Nội dung chuyển khoản sẽ được quét theo dấu hiệu lừa đảo phổ biến.",
    };
  }

  if (riskyTransferContentPattern.test(normalizedTransferContent)) {
    return {
      tone: "danger",
      label: "Từ khóa cần kiểm tra",
      detail: "Nội dung giống mẫu gấp, đầu tư, hoàn tiền hoặc yêu cầu giữ bí mật.",
    };
  }

  return {
    tone: "success",
    label: "Nội dung ổn định",
    detail: "Không thấy cụm từ rủi ro trong note giao dịch.",
  };
}

export function getRecipientSignal(transferAccount: string, transferRecipient: string) {
  if (!transferAccount) return "Chưa có người nhận";
  return isRiskRecipient(transferAccount, transferRecipient)
    ? "Người nhận cần xác minh"
    : "Người nhận có thể đối chiếu";
}

export function countTransferIntakeSignals(values: Array<string | boolean>) {
  return values.filter(Boolean).length;
}

export function buildGuardianTransactionInput(params: {
  amountVal: number;
  contentVal: string;
  recipientAccountVal: string;
  recipientNameVal: string;
  transferBank: string;
}): GuardianTransactionEvaluationInput {
  const riskRecipient = isRiskRecipient(params.recipientAccountVal, params.recipientNameVal);
  const criticalShape = riskRecipient && params.amountVal >= 30_000_000;

  return {
    amountVnd: params.amountVal,
    recipientName: params.recipientNameVal,
    recipientAccount: params.recipientAccountVal,
    recipientBank: params.transferBank,
    content: params.contentVal,
    location: criticalShape ? "Singapore" : "Da Nang",
    deviceTrust: riskRecipient || params.amountVal >= 10_000_000 ? "new" : "trusted",
    ipReputation: criticalShape ? "bad" : riskRecipient ? "suspicious" : "normal",
    loginMethod: "password",
    priorActions: riskRecipient
      ? ["login_password", "add_new_recipient", ...(criticalShape ? ["increase_limit"] : []), "open_transfer"]
      : ["login_password", "view_balance", "open_transfer"],
  };
}

export function markDecisionAllowed(
  decision: GuardianRiskDecision,
  explanation: string,
  reasonCode: string,
): GuardianRiskDecision {
  return {
    ...decision,
    aiLevel: "safe",
    policyLevel: "L0",
    action: "allow",
    explanation,
    reasonCodes: [reasonCode, ...decision.reasonCodes],
    requiresStepUp: false,
    requiresChecklist: false,
    requiresReview: false,
  };
}
