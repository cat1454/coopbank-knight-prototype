import type { ThreatLensAgentResult, ThreatLensRiskDecision } from "../../../domain/types";

export const checklistItems = [
  "Tôi biết rõ người nhận là ai và đã xác minh thông tin.",
  "Không ai yêu cầu tôi chuyển tiền gấp hoặc giữ bí mật.",
  "Đây không phải giao dịch để nhận thưởng, hoàn thuế hoặc đầu tư.",
  "Tôi không bị áp lực hoặc sợ hãi khi thực hiện giao dịch này.",
  "Số tài khoản nhận đã được xác nhận qua kênh chính thức.",
  "Tôi hiểu giao dịch có thể không hoàn lại sau khi thực hiện.",
];

export function actionLabel(action: ThreatLensRiskDecision["action"]) {
  switch (action) {
    case "allow":
      return "Cho phép";
    case "warn":
      return "Cảnh báo";
    case "delay":
      return "Trì hoãn";
    case "step_up":
      return "Xác thực bổ sung";
    case "block":
      return "Tạm giữ";
    case "review":
      return "Fraud Review";
  }
}

export function aiLevelLabel(level: ThreatLensRiskDecision["aiLevel"]) {
  switch (level) {
    case "safe":
      return "An toàn";
    case "watch":
      return "Cần giám sát";
    case "verify":
      return "Cần xác thực";
    case "hold":
      return "Tạm giữ";
    case "critical":
      return "Cảnh báo cao";
    default:
      return level;
  }
}

export function scoreTone(score: number) {
  if (score <= 35) return "safe";
  if (score <= 65) return "warn";
  if (score <= 85) return "danger";
  return "critical";
}

export function displayAgentName(agentName: ThreatLensAgentResult["agentName"]) {
  switch (agentName) {
    case "transaction":
      return "Transaction";
    case "device":
      return "Device";
    case "behavioral":
      return "Behavioral";
    case "beneficiary":
      return "Beneficiary";
    case "scam":
      return "Scam";
  }
}
