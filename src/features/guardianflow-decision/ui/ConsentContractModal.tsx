
import { Scale } from "lucide-react";
import type { GuardianFlowScenarioViewModel } from "../model/useGuardianFlowScenario";

interface ConsentContractModalProps {
  isOpen: boolean;
  guardianFlow: GuardianFlowScenarioViewModel;
  onClose: () => void;
}

export function ConsentContractModal({ isOpen, guardianFlow, onClose }: ConsentContractModalProps) {
  if (!isOpen) return null;

  return (
<div className="operator-call-overlay" style={{
          position: "absolute",
          inset: 0,
          background: "var(--color-card)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          border: "1px solid var(--color-line)",
          zIndex: 110,
          textAlign: "left"
        }}>
          <div style={{ borderBottom: "1px solid var(--color-line)", paddingBottom: "10px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Scale size={24} style={{ color: "var(--color-trust)" }} />
            <div>
              <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--color-trust)", textTransform: "uppercase", display: "block" }}>HỢP ĐỒNG DỊCH VỤ & BẢO VỆ DLCN</span>
              <h3 style={{ fontSize: "var(--text-sm)", color: "var(--color-ink)", fontWeight: "bold", margin: 0 }}>Điều khoản sử dụng Hộ vệ AI KNIGHT</h3>
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid var(--color-line)",
            background: "var(--color-surface)",
            fontSize: "11px",
            color: "var(--color-ink)",
            lineHeight: "1.45",
            marginBottom: "10px",
            maxHeight: "180px"
          }}>
            <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p style={{ margin: "0 0 12px 0", fontWeight: "bold" }}>Độc lập - Tự do - Hạnh phúc</p>
            <p style={{ margin: "0 0 12px 0", fontStyle: "italic", textAlign: "center" }}>Hà Nội, ngày 17 tháng 06 năm 2026</p>
            
            <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>BẢN ĐỒNG Ý PHÂN TÁCH VỀ XỬ LÝ DỮ LIỆU CÁ NHÂN NHẠY CẢM VÀ SỬ DỤNG HỘ VỆ AI</p>
            <p style={{ margin: "0 0 8px 0" }}>
              Căn cứ Luật Bảo vệ dữ liệu cá nhân 2025 (có hiệu lực ngày 01/01/2026) và Quyết định 2345/QĐ-NHNN của Ngân hàng Nhà nước Việt Nam về việc triển khai các giải pháp an toàn, bảo mật trong thanh toán trực tuyến.
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              Khách hàng (Chủ thể dữ liệu) đồng ý cho phép Ngân hàng Hợp tác xã Việt Nam (Co-opBank) thu thập, phân tích và xử lý các thông tin cá nhân dưới đây phục vụ cho mục đích kích hoạt tính năng Hộ vệ AI KNIGHT phát hiện giao dịch lừa đảo công nghệ cao:
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "12px 0" }}>
              <label style={{ display: "flex", gap: "8px", alignItems: "start", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={guardianFlow.consentBiometrics}
                  onChange={(e) => guardianFlow.setConsentBiometrics(e.target.checked)}
                  style={{ marginTop: "2px" }}
                />
                <div>
                  <strong>1. Dữ liệu Sinh trắc học:</strong> Đối chiếu hình ảnh khuôn mặt trùng khớp với eKYC căn cước công dân gắn chip để thực hiện xác thực bắt buộc theo QĐ 2345 cho giao dịch trên 10 triệu đồng hoặc khi phát hiện tín hiệu bất thường.
                </div>
              </label>
              
              <label style={{ display: "flex", gap: "8px", alignItems: "start", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={guardianFlow.consentBehavioral}
                  onChange={(e) => guardianFlow.setConsentBehavioral(e.target.checked)}
                  style={{ marginTop: "2px" }}
                />
                <div>
                  <strong>2. Dữ liệu Thiết bị & Hành vi:</strong> Phân tích nhịp gõ phím, cách thao tác màn hình, phát hiện các tiến trình điều khiển thiết bị từ xa đáng nghi nhằm ngăn chặn ứng dụng gián điệp, Trojan độc hại.
                </div>
              </label>

              <label style={{ display: "flex", gap: "8px", alignItems: "start", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={guardianFlow.consentLocation}
                  onChange={(e) => guardianFlow.setConsentLocation(e.target.checked)}
                  style={{ marginTop: "2px" }}
                />
                <div>
                  <strong>3. Phân tích Mạng & Tài khoản rủi ro:</strong> Tra cứu IP mạng, tọa độ giao dịch lạ, đối chiếu tài khoản người nhận với cơ sở dữ liệu Mule Account (tài khoản rác) nghi ngờ lừa đảo.
                </div>
              </label>
            </div>

            <p style={{ margin: "8px 0 0 0" }}>
              <strong>Quyền của khách hàng:</strong> Khách hàng có quyền thay đổi cấp độ kiểm soát AI, yêu cầu can thiệp kiểm soát bởi Kiểm soát viên là con người (Human-in-the-loop), và có quyền rút lại sự đồng ý ngừng chia sẻ dữ liệu bất kỳ lúc nào bằng cách tắt Hộ vệ AI trong cấu hình.
            </p>
          </div>

          <label style={{ display: "flex", gap: "8px", alignItems: "start", cursor: "pointer", fontSize: "11px", marginBottom: "12px" }}>
            <input
              type="checkbox"
              checked={guardianFlow.consentChecked}
              onChange={(e) => guardianFlow.setConsentChecked(e.target.checked)}
              style={{ marginTop: "1px" }}
            />
            <span style={{ fontWeight: "700", color: "var(--color-success)" }}>
              Tôi xác nhận đã đọc kỹ và đồng ý kích hoạt Hộ vệ AI KNIGHT.
            </span>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
            <button
              type="button"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: "8px", color: "var(--color-ink)", fontWeight: "bold", padding: "10px", cursor: "pointer", fontSize: "var(--text-xs)" }}
              onClick={() => {
                onClose();
                guardianFlow.setConsentChecked(false);
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={!guardianFlow.consentChecked}
              style={{
                background: guardianFlow.consentChecked ? "var(--color-success)" : "#cbd5e1",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "bold",
                padding: "10px",
                cursor: guardianFlow.consentChecked ? "pointer" : "not-allowed",
                fontSize: "var(--text-xs)"
              }}
              onClick={() => {
                guardianFlow.grantConsent();
                onClose();
              }}
            >
              Đồng ý và Kích hoạt
            </button>
          </div>
        </div>
  );
}
