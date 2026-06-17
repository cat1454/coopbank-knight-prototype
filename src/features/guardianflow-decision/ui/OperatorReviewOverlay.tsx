
import { ShieldAlert, ShieldCheck, Video } from "lucide-react";
import type { GuardianFlowScenarioViewModel } from "../model/useGuardianFlowScenario";

interface OperatorReviewOverlayProps {
  guardianFlow: GuardianFlowScenarioViewModel;
}

export function OperatorReviewOverlay({ guardianFlow }: OperatorReviewOverlayProps) {
  if (!guardianFlow.isHumanReviewing) return null;

  return (
<div className="operator-call-overlay" style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(4px)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          border: "1px solid var(--color-line)",
          zIndex: 100
        }}>
          <div className="operator-call-card" style={{
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px"
          }}>
            {guardianFlow.humanReviewStep === "connecting" && (
              <div className="operator-connecting" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div className="pulse-ring" style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  border: "2px solid var(--color-trust)",
                  display: "grid",
                  placeItems: "center",
                  animation: "pulse-blue-glow 2s infinite"
                }}>
                  <Video size={28} style={{ color: "var(--color-trust)" }} />
                </div>
                <h3 style={{ fontSize: "var(--text-md)", color: "var(--color-ink)", margin: "4px 0", fontWeight: "bold" }}>Đang kết nối Tổng đài xác minh...</h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                  Co-opBank đang chuyển kết nối an toàn đến Ban Kiểm soát giao dịch khẩn cấp.
                </p>
              </div>
            )}
            
            {guardianFlow.humanReviewStep === "chatting" && (
              <div className="operator-chatting" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
                <div className="operator-video-preview" style={{
                  width: "120px",
                  height: "80px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #0f172a, #1e293b)",
                  border: "1px solid var(--color-line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  position: "relative"
                }}>
                  👩‍💼
                  <div className="operator-badge" style={{
                    position: "absolute",
                    bottom: "4px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--color-fraud)",
                    color: "white",
                    fontSize: "7px",
                    padding: "1px 4px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap"
                  }}>ĐANG GHI ÂM</div>
                </div>
                <h3 style={{ fontSize: "var(--text-sm)", color: "var(--color-ink)", margin: 0, fontWeight: "bold" }}>Điện thoại viên: Nguyễn Minh Thư</h3>
                <p className="operator-message" style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-ink)",
                  lineHeight: "1.45",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-line)",
                  padding: "10px",
                  borderRadius: "8px",
                  textAlign: "left",
                  margin: "4px 0"
                }}>
                  "Chào Anh Phú, tôi là Minh Thư hỗ trợ xác minh rủi ro giao dịch Co-opBank. KNIGHT AI phát hiện giao dịch của bạn có điểm bất thường cao. Xin vui lòng xác nhận bạn có đang bị ai ép buộc chuyển tiền hoặc làm theo hướng dẫn không quen biết không?"
                </p>
                <div className="operator-actions" style={{ display: "grid", gap: "8px", width: "100%" }}>
                  <button
                    type="button"
                    style={{
                      background: "var(--color-success)",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      fontWeight: "bold",
                      padding: "10px",
                      cursor: "pointer",
                      fontSize: "var(--text-xs)"
                    }}
                    onClick={() => guardianFlow.completeHumanReview(true)}
                  >
                    Tôi tự tay chuyển tiền (Duyệt)
                  </button>
                  <button
                    type="button"
                    style={{
                      background: "rgba(217, 45, 32, 0.08)",
                      border: "1px solid rgba(217, 45, 32, 0.35)",
                      borderRadius: "6px",
                      color: "var(--color-fraud)",
                      fontWeight: "bold",
                      padding: "8px",
                      cursor: "pointer",
                      fontSize: "var(--text-xs)"
                    }}
                    onClick={() => guardianFlow.completeHumanReview(false)}
                  >
                    Tôi bị lừa, xin hủy!
                  </button>
                </div>
              </div>
            )}
            
            {guardianFlow.humanReviewStep === "approved" && (
              <div className="operator-status approved" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={36} style={{ color: "var(--color-success)" }} />
                <h3 style={{ fontSize: "var(--text-sm)", color: "var(--color-success)", margin: 0, fontWeight: "bold" }}>Giao dịch được phê duyệt</h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                  Tổng đài viên đã kiểm tra bối cảnh và phê duyệt cho giao dịch đi tiếp.
                </p>
              </div>
            )}

            {guardianFlow.humanReviewStep === "rejected" && (
              <div className="operator-status rejected" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <ShieldAlert size={36} style={{ color: "var(--color-fraud)" }} />
                <h3 style={{ fontSize: "var(--text-sm)", color: "var(--color-fraud)", margin: 0, fontWeight: "bold" }}>Đã chặn giao dịch</h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                  Giao dịch đã được hủy thành công để đảm bảo an toàn tài sản cho bạn.
                </p>
              </div>
            )}
          </div>
        </div>
  );
}
