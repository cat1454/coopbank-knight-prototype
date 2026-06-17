
export const reasonCopy: Record<string, string> = {
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

export function getGuardianReasonText(code: string) {
  return reasonCopy[code] ?? code;
}
