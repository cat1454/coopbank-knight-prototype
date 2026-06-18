const REASON_COPY = {
  amount_above_baseline: "số tiền cao hơn thói quen giao dịch thường thấy",
  amount_above_p95: "số tiền vượt mạnh mốc an toàn cá nhân",
  new_device: "thiết bị đang dùng chưa quen thuộc",
  new_recipient: "người nhận chưa có lịch sử tin cậy",
  vpn_or_bad_ip: "địa chỉ mạng có dấu hiệu ẩn vị trí",
  mule_cluster: "tài khoản nhận nằm trong cụm rủi ro giả lập",
  scam_keyword: "nội dung giao dịch có từ khóa thường gặp trong lừa đảo",
  suspicious_journey: "chuỗi thao tác giống kịch bản bị thao túng tâm lý",
  repeated_confirm_attempts: "có nhiều lần cố xác nhận lại cảnh báo",
  verified_travel_context: "vị trí lạ đã từng được xác minh",
};

function actionPhrase(action) {
  if (action === "allow") return "cho phép giao dịch tiếp tục";
  if (action === "warn") return "hiển thị cảnh báo để bạn kiểm tra lại";
  if (action === "delay" || action === "step_up") return "trì hoãn ngắn và yêu cầu xác minh bổ sung";
  return "tạm giữ giao dịch và mở luồng xác minh KNIGHT";
}

export function buildMockExplanation(payload = {}) {
  const reasonCodes = Array.isArray(payload.reasonCodes) ? payload.reasonCodes : [];
  const readableReasons = reasonCodes
    .slice(0, 3)
    .map((code) => REASON_COPY[code] || String(code).replace(/_/g, " "))
    .join(", ");
  const action = typeof payload.action === "string" ? payload.action : "warn";
  const riskScore = Number.isFinite(Number(payload.riskScore)) ? Number(payload.riskScore) : 0;
  const reasonSentence = readableReasons
    ? `Lý do chính: ${readableReasons}.`
    : "Lý do chính: KNIGHT thấy giao dịch lệch khỏi mẫu an toàn thông thường.";

  return {
    source: "mock",
    explanation: `KNIGHT đánh giá điểm rủi ro ${riskScore}/100 và sẽ ${actionPhrase(action)}. ${reasonSentence} Đây là giải thích mock, không ảnh hưởng đến quyết định policy.`,
  };
}
