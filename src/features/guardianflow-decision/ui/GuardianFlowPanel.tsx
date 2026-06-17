import { RotateCcw, ShieldCheck, Scale, Check, ShieldAlert, Video } from "lucide-react";
import { useState } from "react";
import { guardianScenarios } from "../../../domain/guardianFlow";
import type { GuardianRiskDecision, GuardianScenarioId } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import { PrimaryButton } from "../../../shared/ui";
import { checklistItems } from "../model/guardianFlowUi";
import { useGuardianFlowScenario } from "../model/useGuardianFlowScenario";
import { DecisionResult } from "./DecisionResult";

interface GuardianFlowPanelProps {
  demoEnabled?: boolean;
  latestDecision?: GuardianRiskDecision | null;
  onEscalateToKnight: () => void;
}

export function GuardianFlowPanel({
  demoEnabled = false,
  latestDecision = null,
  onEscalateToKnight,
}: GuardianFlowPanelProps) {
  const guardianFlow = useGuardianFlowScenario(latestDecision);

  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);

  const handleToggleConsent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setIsContractOpen(true);
    } else {
      setIsWithdrawConfirmOpen(true);
    }
  };

  return (
    <section className="guardian-panel" aria-labelledby="guardian-title" style={{ position: "relative", overflow: "hidden" }}>
      <div className="guardian-panel__header">
        <div>
          <span className="guardian-kicker">Trạng thái AI tự động</span>
          <h2 id="guardian-title">KNIGHT Decision Intelligence</h2>
        </div>
        {demoEnabled && (
          <button type="button" className="guardian-demo-button" aria-label="Demo">
            Demo
          </button>
        )}
      </div>

      {guardianFlow.hasConsent ? (
        <>
          {/* Cấu hình Cấp độ Bảo vệ AI */}
          <div className="guardian-levels-section" style={{ borderBottom: "1px solid var(--color-line)", paddingBottom: "16px", marginBottom: "8px" }}>
            <span className="guardian-kicker" style={{ color: "var(--color-trust)" }}>Cấu hình bảo vệ (Luật BV DLCN 2025)</span>
            <h3 style={{ fontSize: "var(--text-sm)", color: "var(--color-ink)", margin: "4px 0 10px", fontWeight: "700" }}>Chọn Cấp độ Kiểm soát AI</h3>
            
            <div className="guardian-levels-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                {
                  id: "min" as const,
                  name: "Tối thiểu",
                  desc: "Cảnh báo thụ động, không tự chặn tiền.",
                  color: "var(--color-trust)"
                },
                {
                  id: "standard" as const,
                  name: "Đồng hành",
                  desc: "Phân tích, hỗ trợ checklist & Tổng đài.",
                  color: "var(--color-trust)"
                },
                {
                  id: "max" as const,
                  name: "Tối đa",
                  desc: "Tự động khóa & Xác thực tăng cường.",
                  color: "var(--color-trust)"
                }
              ].map((lvl) => {
                const isActive = guardianFlow.guardianLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    className={`guardian-level-card ${isActive ? "active" : ""}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "10px 6px",
                      borderRadius: "10px",
                      border: isActive ? `1.5px solid var(--color-trust)` : "1px solid var(--color-line)",
                      background: isActive ? "rgba(23, 92, 211, 0.04)" : "var(--color-surface)",
                      color: "var(--color-ink)",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: isActive ? "0 4px 10px rgba(23, 92, 211, 0.08)" : "none"
                    }}
                    onClick={() => guardianFlow.setGuardianLevel(lvl.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "var(--color-trust)" }}>{lvl.name}</span>
                      {isActive && <Check size={12} style={{ color: "var(--color-trust)" }} />}
                    </div>
                    <span style={{ fontSize: "9px", color: "var(--color-muted)", lineHeight: "1.25" }}>{lvl.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {demoEnabled && (
            <>
              <div className="guardian-demo-grid">
                <label className="guardian-field">
                  <span>Scenario</span>
                  <select
                    value={guardianFlow.selectedScenario}
                    onChange={(event) => guardianFlow.setSelectedScenario(event.target.value as GuardianScenarioId)}
                  >
                    {guardianScenarios.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="guardian-field">
                  <span>Fake latency: {guardianFlow.fakeLatencyMs}ms</span>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="100"
                    value={guardianFlow.fakeLatencyMs}
                    onChange={(event) => guardianFlow.setFakeLatencyMs(Number(event.target.value))}
                  />
                </label>
                <label className="guardian-inline-toggle">
                  <input
                    type="checkbox"
                    checked={guardianFlow.detailedMode}
                    onChange={(event) => guardianFlow.setDetailedMode(event.target.checked)}
                  />
                  <span>Chế độ giải thích chi tiết</span>
                </label>
              </div>

              <div className="guardian-scenario-summary">
                <strong>{guardianFlow.scenario.label}</strong>
                <p>{guardianFlow.scenario.summary}</p>
                <span>{formatVnd(guardianFlow.scenario.transaction.amountVnd)} đến {guardianFlow.scenario.transaction.recipientName}</span>
              </div>

              <div className="guardian-actions">
                <PrimaryButton onClick={() => void guardianFlow.runScenario()}>Chạy scenario</PrimaryButton>
                <button type="button" className="guardian-icon-button" aria-label="Reset phiên" onClick={guardianFlow.reset}>
                  <RotateCcw size={16} />
                </button>
              </div>
            </>
          )}

          {guardianFlow.agentUpdates.length > 0 && !guardianFlow.evaluation?.decision && (
            <p className="guardian-processing" role="status" style={{ color: "var(--color-ink)" }}>
              Đang phân tích giao dịch... {guardianFlow.agentUpdates.length}/5 agents đã hoàn tất.
            </p>
          )}

          {guardianFlow.decision ? (
            <DecisionResult
              decision={guardianFlow.decision}
              detailedMode={guardianFlow.detailedMode}
              isConsoleOpen={guardianFlow.isConsoleOpen}
              onToggleConsole={() => guardianFlow.setIsConsoleOpen((value) => !value)}
              onEscalateToKnight={onEscalateToKnight}
              onStartHumanReview={guardianFlow.startHumanReview}
            />
          ) : (
            <article className="guardian-result guardian-result--safe" style={{ gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={22} style={{ color: "var(--color-success)" }} />
                <h3 style={{ color: "var(--color-ink)", margin: 0, fontSize: "var(--text-sm)", fontWeight: "bold" }}>KNIGHT đang giám sát nền</h3>
              </div>
              <p style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)", margin: 0 }}>Chưa có giao dịch nào cần can thiệp. Khi bạn chuyển tiền, KNIGHT sẽ tự phân mức AI và chỉ yêu cầu thêm bước nếu có tín hiệu rủi ro.</p>
            </article>
          )}

          {guardianFlow.decision?.requiresChecklist && (
            <div className="guardian-checklist">
              {checklistItems.map((item, index) => (
                <label key={item} style={{ color: "var(--color-ink)" }}>
                  <input
                    type="checkbox"
                    checked={guardianFlow.checkedItems[index]}
                    onChange={(event) => {
                      guardianFlow.setCheckedItems((current) =>
                        current.map((value, itemIndex) => (itemIndex === index ? event.target.checked : value)),
                      );
                    }}
                  />
                  <span>{item}</span>
                </label>
              ))}
              <p className="guardian-progress" style={{ color: "var(--color-ink)" }}>Đã xác nhận {guardianFlow.checkedCount}/6 mục</p>
              <PrimaryButton disabled={!guardianFlow.isChecklistComplete}>Tiếp tục xác thực Face ID</PrimaryButton>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 12px", gap: "12px", border: "1px dashed var(--color-line)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)", marginBottom: "8px" }}>
          <ShieldAlert size={36} style={{ color: "var(--color-muted)" }} />
          <h3 style={{ fontSize: "var(--text-sm)", color: "var(--color-ink)", fontWeight: "bold", margin: 0 }}>Hộ vệ AI đang tắt</h3>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", margin: 0, textAlign: "center", lineHeight: "1.4" }}>
            Hệ thống chưa được cấp quyền giám sát. Bật Hộ vệ AI để quét mã độc, ngăn chặn giao dịch lừa đảo công nghệ cao và bảo mật tài khoản của bạn.
          </p>
        </div>
      )}

      {/* Hộp bật tắt Hộ vệ AI */}
      <div style={{ marginTop: "12px", borderTop: "1px solid var(--color-line)", paddingTop: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-surface)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--color-line)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start", textAlign: "left" }}>
            <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--color-trust)", textTransform: "uppercase" }}>TRẠNG THÁI HỘ VỆ AI</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-ink)", fontWeight: "bold" }}>Kích hoạt Hộ vệ AI KNIGHT</span>
          </div>
          <label className="toggle-switch toggle-switch--success">
            <input
              type="checkbox"
              aria-label="Kích hoạt Hộ vệ AI KNIGHT"
              checked={guardianFlow.hasConsent}
              onChange={handleToggleConsent}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Contract Terms Modal */}
      {isContractOpen && (
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
                setIsContractOpen(false);
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
                setIsContractOpen(false);
              }}
            >
              Đồng ý và Kích hoạt
            </button>
          </div>
        </div>
      )}

      {/* Withdraw Consent Confirmation Modal */}
      {isWithdrawConfirmOpen && (
        <div style={{ position: "absolute", inset: 0, background: "var(--color-card)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 120, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-line)", textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <ShieldAlert size={40} style={{ color: "var(--color-fraud)" }} />
            <h3 style={{ fontSize: "var(--text-md)", color: "var(--color-ink)", fontWeight: "bold", margin: 0 }}>Ngừng sử dụng Hộ vệ AI?</h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: "1.4", margin: 0 }}>
              Bạn có chắc chắn muốn rút lại đồng ý và ngừng chia sẻ dữ liệu? Tài khoản của bạn sẽ mất đi lớp bảo vệ tự động của KNIGHT trước các cuộc gọi lừa đảo giả mạo và ứng dụng mã độc điều khiển từ xa.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%", marginTop: "12px" }}>
              <button
                type="button"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: "8px", color: "var(--color-ink)", fontWeight: "bold", padding: "10px", cursor: "pointer", fontSize: "var(--text-xs)" }}
                onClick={() => {
                  setIsWithdrawConfirmOpen(false);
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                style={{ background: "var(--color-fraud)", border: "none", borderRadius: "8px", color: "white", fontWeight: "bold", padding: "10px", cursor: "pointer", fontSize: "var(--text-xs)" }}
                onClick={() => {
                  guardianFlow.withdrawConsent();
                  setIsWithdrawConfirmOpen(false);
                }}
              >
                Tắt bảo vệ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay giả lập cuộc gọi Tổng đài viên */}
      {guardianFlow.isHumanReviewing && (
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
      )}
    </section>
  );
}
