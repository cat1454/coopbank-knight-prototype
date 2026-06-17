
import type { Dispatch, SetStateAction } from "react";
import { AlertTriangle, Building2, CheckCircle2, ChevronDown, LockKeyhole, ShieldAlert, ShieldCheck, Video } from "lucide-react";
import { formatVnd } from "../../../domain/format";
import { PrimaryButton } from "../../../shared/ui";
import type { BankDashboardTab } from "../BottomTabs";
import { transferChecklistItems, type BankTransferFlow } from "../useBankTransferFlow";
import {
  getFriendlyAiLevel,
  getFriendlyPolicy,
  getGuardianLevelLabel,
  getGuardianLevelTransferCopy,
  type GuardianLevelSetting,
} from "../model/dashboardCopy";
import { FaceIdVerificationScreen } from "./FaceIdVerificationScreen";
import "./TransferTab.css";

interface TransferTabProps {
  flow: BankTransferFlow;
  hasGuardianConsent: boolean;
  liabilityAccepted: boolean;
  setLiabilityAccepted: Dispatch<SetStateAction<boolean>>;
  resetTransferForm: () => void;
  onStartDemo: () => void;
  setActiveTab: (tab: BankDashboardTab) => void;
}

export function TransferTab({
  flow,
  hasGuardianConsent,
  liabilityAccepted,
  setLiabilityAccepted,
  resetTransferForm,
  onStartDemo,
  setActiveTab,
}: TransferTabProps) {
  const {
    amountSignal,
    completeCompanionReviewedTransfer,
    completeTransfer,
    contentSignal,
    handleConfirmTransfer,
    handleTransferFaceIdSuccess,
    handleNextStep,
    handleNextToDetails,
    handleSelectSuggestion,
    hasTransferAmount,
    intakeSignalCount,
    latestGuardianDecision,
    recipientSignal,
    selectedBank,
    setBankPickerOpen,
    setBankSearch,
    handleAccountChange,
    setTransferAmount,
    setTransferChecklist,
    setTransferContent,
    setTransferStep,
    transferAccount,
    transferAmount,
    transferAmountNumber,
    transferBank,
    transferChecklist,
    transferContent,
    transferRecipient,
    transferStep,
    isResolvingName,
    isRecipientVerified,
    isTransferAiPending,
    isTransferFaceIdOpen,
    cancelTransferVerification,
    isHumanReviewing,
    humanReviewStep,
    startHumanReview,
    completeHumanReview,
  } = flow;

    const levelSetting = typeof window !== "undefined" ? (window.sessionStorage.getItem("knight_guardian_level") as GuardianLevelSetting) || "standard" : "standard";

    if (isHumanReviewing) {
      return (
        <div className="tab-content dashboard-transfer" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "420px", textAlign: "center", padding: "24px", background: "var(--color-card)", borderRadius: "18px", border: "1px solid var(--color-line)", boxShadow: "var(--shadow-soft)" }}>
          <div className="operator-call-card" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            {humanReviewStep === "connecting" && (
              <div className="operator-connecting" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div className="pulse-ring-transfer" style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  border: "2px solid var(--color-trust)",
                  display: "grid",
                  placeItems: "center",
                  animation: "pulse-blue-glow 2s infinite"
                }}>
                  <Video size={32} style={{ color: "var(--color-trust)" }} />
                </div>
                <h3 style={{ fontSize: "var(--text-md)", color: "var(--color-ink)", margin: "4px 0", fontWeight: "bold" }}>Đang kết nối Tổng đài xác minh...</h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: "1.4" }}>
                  Yêu cầu từ thiết bị của bạn đang được ưu tiên xử lý. Cuộc gọi xác thực bảo mật được mã hóa đầu cuối.
                </p>
              </div>
            )}
            
            {humanReviewStep === "chatting" && (
              <div className="operator-chatting" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%" }}>
                <div className="operator-video-preview" style={{
                  width: "150px",
                  height: "100px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0f172a, #1e293b)",
                  border: "1px solid var(--color-line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                  position: "relative",
                  boxShadow: "var(--shadow-soft)"
                }}>
                  👩‍💼
                  <div className="operator-badge" style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--color-fraud)",
                    color: "white",
                    fontSize: "8px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.5px"
                  }}>GHI ÂM HD</div>
                </div>
                <h3 style={{ fontSize: "var(--text-sm)", color: "var(--color-ink)", margin: 0, fontWeight: "bold" }}>Kiểm soát viên: Nguyễn Minh Thư</h3>
                <p className="operator-message" style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-ink)",
                  lineHeight: "1.5",
                  background: "var(--color-surface)",
                  padding: "12px",
                  borderRadius: "10px",
                  textAlign: "left",
                  margin: "4px 0",
                  border: "1px solid var(--color-line)"
                }}>
                  "Chào anh Huỳnh Phước Phú. Tôi nhận được yêu cầu cứu xét thủ công cho giao dịch chuyển khoản trị giá {formatVnd(Number(transferAmount))}đ đến tài khoản {transferRecipient}.
                  Để bảo đảm an toàn, xin vui lòng xác nhận bạn thực hiện giao dịch hoàn toàn tự nguyện, không làm theo bất kỳ yêu cầu/đe dọa từ người lạ nào qua điện thoại?"
                </p>
                <div className="operator-actions" style={{ display: "grid", gap: "8px", width: "100%" }}>
                  <button
                    type="button"
                    style={{
                      background: "var(--color-success)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontWeight: "bold",
                      padding: "12px",
                      cursor: "pointer",
                      fontSize: "var(--text-sm)",
                    }}
                    onClick={() => completeHumanReview(true)}
                  >
                    Tôi tự tay chuyển tiền (Duyệt ngay)
                  </button>
                  <button
                    type="button"
                    style={{
                      background: "rgba(217, 45, 32, 0.08)",
                      border: "1px solid rgba(217, 45, 32, 0.35)",
                      borderRadius: "8px",
                      color: "var(--color-fraud)",
                      fontWeight: "bold",
                      padding: "10px",
                      cursor: "pointer",
                      fontSize: "var(--text-xs)"
                    }}
                    onClick={() => completeHumanReview(false)}
                  >
                    Tôi nghi ngờ bị lừa, xin hủy giao dịch
                  </button>
                </div>
              </div>
            )}
            
            {humanReviewStep === "approved" && (
              <div className="operator-status approved" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={44} style={{ color: "var(--color-success)" }} />
                <h3 style={{ fontSize: "var(--text-md)", color: "var(--color-success)", margin: 0, fontWeight: "bold" }}>Giao dịch đã duyệt</h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                  Yêu cầu xác minh hoàn tất. Đang chuyển tiếp tiền đi...
                </p>
              </div>
            )}

            {humanReviewStep === "rejected" && (
              <div className="operator-status rejected" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={44} style={{ color: "var(--color-fraud)" }} />
                <h3 style={{ fontSize: "var(--text-md)", color: "var(--color-fraud)", margin: 0, fontWeight: "bold" }}>Đã chặn & Hủy giao dịch</h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                  Giao dịch đã được hủy thành công. Hộ vệ AI đang phong tỏa tài khoản thụ hưởng có dấu hiệu gian lận.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (transferStep === "input_recipient" || transferStep === "input_details") {
      return (
        <div className="tab-content dashboard-transfer">
          <h2 className="section-title">Chuyển tiền nhanh 24/7</h2>
          
          {hasGuardianConsent && (
            <>
              <section className="transfer-ai-banner" aria-label="KNIGHT transfer intake">
                <div className="transfer-ai-banner__header">
                  <div>
                    <span className="transfer-ai-kicker">KNIGHT AI Intake</span>
                    <strong>KNIGHT đang nhận diện giao dịch</strong>
                  </div>
                  <span className="transfer-ai-progress">{intakeSignalCount}/5 tín hiệu</span>
                </div>
                <p>
                  Đang đối chiếu số tiền, người nhận, nội dung và phiên đăng nhập trước khi xác nhận.
                </p>
              </section>

              <div className="transfer-ai-grid" aria-label="Tín hiệu nhận diện chuyển tiền">
                <article className={`transfer-ai-signal transfer-ai-signal--${amountSignal.tone}`}>
                  <span>Tín hiệu số tiền</span>
                  <strong>{hasTransferAmount ? formatVnd(transferAmountNumber) : "Chưa nhập"}</strong>
                  <small>{amountSignal.label}</small>
                </article>
                <article className={`transfer-ai-signal transfer-ai-signal--${contentSignal.tone}`}>
                  <span>Tín hiệu nội dung</span>
                  <strong>{contentSignal.label}</strong>
                  <small>{contentSignal.detail}</small>
                </article>
                <article className={`transfer-ai-signal ${isRecipientVerified ? "transfer-ai-signal--success" : "transfer-ai-signal--neutral"}`}>
                  <span>Tín hiệu người nhận</span>
                  <strong>{recipientSignal}</strong>
                  <small>KNIGHT đối chiếu tài khoản, ngân hàng và lịch sử giao dịch.</small>
                </article>
              </div>
            </>
          )}

          <div className="transfer-form-modern">
            {/* Card 1: Recipient Info */}
            <div className={`transfer-card ${transferStep === "input_recipient" ? "" : "step-hidden"}`}>
              <h3 className="card-sub-title">1. Thông tin thụ hưởng</h3>
              
              <div className="form-group">
                <span className="form-label">Ngân hàng thụ hưởng</span>
                <div className="bank-picker">
                  <button
                    type="button"
                    className="bank-picker__trigger"
                    aria-label={
                      selectedBank
                        ? `Ngân hàng thụ hưởng ${selectedBank.displayName} ${selectedBank.legalName}`
                        : `Ngân hàng thụ hưởng ${transferBank}`
                    }
                    onClick={() => {
                      setBankSearch("");
                      setBankPickerOpen(true);
                    }}
                  >
                    <span className="bank-picker__logo" aria-hidden="true">
                      {selectedBank ? (
                        <img src={selectedBank.logoUrl} alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 size={18} />
                      )}
                    </span>
                    <span className="bank-picker__trigger-text">
                      <strong>{selectedBank?.listTitle ?? transferBank}</strong>
                      {selectedBank ? <small>{selectedBank.legalName}</small> : null}
                    </span>
                    <span className="bank-picker__toggle" aria-hidden="true">
                      <ChevronDown size={17} aria-hidden="true" />
                    </span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="account-input" className="form-label">Số tài khoản / Số thẻ nhận</label>
                <input
                  id="account-input"
                  type="text"
                  className="form-control"
                  placeholder="Nhập số tài khoản nhận"
                  value={transferAccount}
                  onChange={(e) => handleAccountChange(e.target.value)}
                />
              </div>

              {/* Suggestions */}
              <div className="suggestion-box">
                <span className="suggestion-label">Gợi ý người nhận nhanh:</span>
                <div className="suggestion-chips">
                  <button
                    type="button"
                    className="suggestion-chip safe"
                    onClick={() => handleSelectSuggestion("safe")}
                  >
                    <CheckCircle2 size={13} aria-hidden="true" /> Nguyễn Văn B (An toàn)
                  </button>
                  <button
                    type="button"
                    className="suggestion-chip fraud"
                    onClick={() => handleSelectSuggestion("fraud")}
                  >
                    <AlertTriangle size={13} aria-hidden="true" /> ShopMall Global (Rủi ro)
                  </button>
                </div>
              </div>

              {/* Tên người thụ hưởng - Auto-resolving */}
              <div className="form-group recipient-result-group">
                <label className="form-label">Tên người thụ hưởng</label>
                {isResolvingName && (
                  <div className="recipient-resolver loading">
                    <span className="mini-spinner"></span>
                    <span>Đang truy vấn ngân hàng nhận...</span>
                  </div>
                )}

                {!isResolvingName && isRecipientVerified && transferRecipient && (
                  <>
                    <div className="recipient-resolver success">
                      <ShieldCheck size={18} className="verified-icon" />
                      <strong>{transferRecipient}</strong>
                    </div>

                    {/* Early risk detection banners */}
                    {hasGuardianConsent && transferRecipient.toLowerCase().includes("shopmall") && (
                      <div className="ai-early-warning danger">
                        <AlertTriangle size={18} />
                        <div>
                          <strong>CẢNH BÁO TÀI KHOẢN GIAN LẬN (MULE)</strong>
                          <span>KNIGHT AI phát hiện tài khoản nhận này nằm trong danh sách đen cảnh báo về lừa đảo công nghệ cao. Bạn hãy dừng lại hoặc xác minh cuộc gọi từ bên thứ ba!</span>
                        </div>
                      </div>
                    )}
                    {hasGuardianConsent && transferRecipient.toLowerCase().includes("nguyễn văn b") && (
                      <div className="ai-early-warning success">
                        <ShieldCheck size={18} />
                        <div>
                          <strong>TÀI KHOẢN TIN CẬY</strong>
                          <span>KNIGHT AI xác nhận tài khoản này có trong danh sách giao dịch an toàn quen thuộc của bạn.</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!isResolvingName && !isRecipientVerified && (
                  <div className="recipient-resolver empty">
                    <span>Nhập ngân hàng và số tài khoản để truy vấn...</span>
                  </div>
                )}
              </div>

              {/* Action Button for Step 1 */}
              <div style={{ marginTop: "16px" }}>
                <PrimaryButton
                  disabled={!isRecipientVerified || isResolvingName}
                  onClick={handleNextToDetails}
                >
                  Tiếp tục
                </PrimaryButton>
              </div>
            </div>

            {/* Card 2: Transaction Details (Dependent section) */}
            <div className={`transfer-card dependent-section ${isRecipientVerified ? "unlocked" : "locked"} ${transferStep === "input_details" ? "" : "step-hidden"}`}>
              <div className="dependent-lock-overlay">
                <LockKeyhole size={24} />
                <span>Hoàn thành thông tin người nhận để nhập số tiền</span>
              </div>

              <h3 className="card-sub-title">2. Chi tiết giao dịch</h3>

              <div className="form-group">
                <label htmlFor="amount-input" className="form-label">Số tiền chuyển (VND)</label>
                <div className={`amount-input-shell amount-input-shell--${amountSignal.tone}`}>
                  <span>₫</span>
                  <input
                    id="amount-input"
                    type="number"
                    className="form-control"
                    placeholder="Nhập số tiền chuyển"
                    min="1000"
                    inputMode="numeric"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                </div>
                {hasGuardianConsent && hasTransferAmount && (
                  <div className="transfer-field-signal">
                    <strong>Đánh giá số tiền</strong>
                    <span>{amountSignal.detail}</span>
                  </div>
                )}
                <div className="amount-quick-row" aria-label="Mẫu số tiền nhanh">
                  {[
                    ["200K", "200000"],
                    ["1M", "1000000"],
                    ["10M", "10000000"],
                    ["50M", "50000000"],
                  ].map(([label, value]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setTransferAmount(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="content-input" className="form-label">Nội dung chuyển khoản</label>
                <textarea
                  id="content-input"
                  className="form-control transfer-note-input"
                  placeholder="Nội dung chuyển khoản"
                  rows={3}
                  value={transferContent}
                  onChange={(e) => setTransferContent(e.target.value)}
                />
                {hasGuardianConsent && transferContent && (
                  <div className={`transfer-field-signal transfer-field-signal--${contentSignal.tone}`}>
                    <strong>Đánh giá nội dung</strong>
                    <span>{contentSignal.detail}</span>
                  </div>
                )}
                <div className="note-suggestion-row" aria-label="Mẫu note nhanh">
                  {["Sinh hoạt", "Dịch vụ", "Gia đình"].map((label, i) => {
                    const sampleNote = [
                      "Chuyen tien sinh hoat",
                      "Thanh toan dich vu",
                      "Ho tro gia dinh",
                    ][i];
                    return (
                      <button
                        type="button"
                        key={label}
                        onClick={() => setTransferContent(sampleNote)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasGuardianConsent ? (
                <div className="transfer-warning-box">
                  <ShieldCheck size={16} />
                  <span>
                    <strong>{getGuardianLevelLabel(levelSetting)}:</strong> KNIGHT {getGuardianLevelTransferCopy(levelSetting)}
                  </span>
                </div>
              ) : (
                <div className="transfer-warning-box" style={{ background: "rgba(100, 116, 139, 0.06)", borderColor: "var(--color-line)", color: "var(--color-muted)" }}>
                  <ShieldAlert size={16} style={{ color: "var(--color-muted)" }} />
                  <span>KNIGHT AI ngoại tuyến. Giao dịch này KHÔNG được giám sát bảo vệ.</span>
                </div>
              )}

              <div className="action-stack" style={{ marginTop: "16px" }}>
                <PrimaryButton
                  disabled={!isRecipientVerified || !transferAmount || !transferContent}
                  onClick={handleNextStep}
                >
                  Tiếp tục
                </PrimaryButton>
                <PrimaryButton
                  variant="secondary"
                  onClick={() => setTransferStep("input_recipient")}
                >
                  Quay lại
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (transferStep === "confirm") {
      return (
        <div className="tab-content dashboard-transfer">
          <h2 className="section-title">Xác nhận thông tin giao dịch</h2>
          <div className="transfer-ai-confirm-panel" aria-label="Tóm tắt nhận diện KNIGHT">
            <div>
              <span>Nhận diện số tiền</span>
              <strong>{amountSignal.label}</strong>
            </div>
            <div>
              <span>Nhận diện nội dung</span>
              <strong>{contentSignal.label}</strong>
            </div>
            <div>
              <span>Người nhận</span>
              <strong>{recipientSignal}</strong>
            </div>
            <div>
              <span>Cấp bảo vệ</span>
              <strong>{getGuardianLevelLabel(levelSetting)}</strong>
            </div>
          </div>
          <div className="confirmation-card">
            <div className="confirm-row">
              <span>Tên người nhận</span>
              <strong>{transferRecipient}</strong>
            </div>
            <div className="confirm-row">
              <span>Số tài khoản</span>
              <strong>{transferAccount}</strong>
            </div>
            <div className="confirm-row">
              <span>Ngân hàng nhận</span>
              <strong>{transferBank}</strong>
            </div>
            <div className="confirm-row">
              <span>Số tiền chuyển</span>
              <strong className="amount-highlight">{formatVnd(Number(transferAmount))}</strong>
            </div>
            <div className="confirm-row">
              <span>Phí chuyển khoản</span>
              <span className="free-text">Miễn phí (0 ₫)</span>
            </div>
            <div className="confirm-row">
              <span>Nguồn tiền</span>
              <span>Huỳnh Phước Phú</span>
            </div>
          </div>

          <div className="action-stack" style={{ marginTop: "20px" }}>
            <PrimaryButton onClick={handleConfirmTransfer}>Xác nhận chuyển tiền</PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => setTransferStep("input_details")}>
              Quay lại
            </PrimaryButton>
          </div>

          {isTransferFaceIdOpen && (
            <div className="transfer-faceid-backdrop" role="presentation">
              <section
                className="transfer-faceid-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Xác thực Face ID chuyển tiền"
              >
                <FaceIdVerificationScreen
                  riskScore={latestGuardianDecision?.riskScore ?? 0}
                  aiLevel={latestGuardianDecision ? getFriendlyAiLevel(latestGuardianDecision.aiLevel) : "Đang kiểm tra"}
                  explanation={latestGuardianDecision?.explanation ?? "KNIGHT AI đang hoàn tất xác thực giao dịch song song với Face ID."}
                  recipientName={transferRecipient}
                  amount={Number(transferAmount)}
                  onSuccess={handleTransferFaceIdSuccess}
                  onBack={cancelTransferVerification}
                  isPreCheck
                  isAiPending={isTransferAiPending}
                  autoStart
                  isPopup
                />
              </section>
            </div>
          )}
        </div>
      );
    }

    if (transferStep === "processing") {
      return (
        <div className="tab-content dashboard-transfer processing-view">
          <div className="spinner"></div>
          <h2>Đang xử lý giao dịch...</h2>
          <p>KNIGHT AI đang kiểm tra điểm rủi ro an toàn giao dịch của bạn.</p>
        </div>
      );
    }

    if (transferStep === "warning" && latestGuardianDecision) {
      const isMinLevel = levelSetting === "min";
      const isCompanionLevel = levelSetting === "standard";
      const shouldUseCompanionChecklist = isCompanionLevel && latestGuardianDecision.requiresChecklist;
      const companionChecklistComplete = transferChecklist.every(Boolean);
      const canProceed = isMinLevel ? liabilityAccepted : shouldUseCompanionChecklist ? companionChecklistComplete : true;

      return (
        <div className="tab-content dashboard-transfer guardian-transfer-review guardian-transfer-review--warning">
          <AlertTriangle size={36} />
          <h2>KNIGHT cảnh báo giao dịch</h2>
          <div className="guardian-transfer-score">
            <strong>Rủi ro: {latestGuardianDecision.riskScore}/100</strong>
            <span>Hệ thống AI: {getFriendlyAiLevel(latestGuardianDecision.aiLevel)}</span>
          </div>
          <p>{latestGuardianDecision.explanation}</p>

          {isCompanionLevel && (
            <div className="companion-policy-note">
              <strong>Đồng hành đang hỗ trợ quyết định</strong>
              <span>
                KNIGHT chưa tự khóa tiền ở mức này. Hệ thống giữ bạn trong flow kiểm tra, đưa checklist ngắn và cho phép gọi Tổng đài nếu cần xác minh thủ công.
              </span>
            </div>
          )}

          {shouldUseCompanionChecklist && (
            <div className="guardian-checklist transfer-companion-checklist" role="group" aria-label="Checklist Đồng hành">
              {transferChecklistItems.map((item, index) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    checked={transferChecklist[index]}
                    onChange={() =>
                      setTransferChecklist((current) =>
                        current.map((checked, currentIndex) => (currentIndex === index ? !checked : checked)),
                      )
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
              <p className="guardian-progress">
                Đã xác nhận {transferChecklist.filter(Boolean).length}/{transferChecklistItems.length} mục
              </p>
            </div>
          )}

          {isMinLevel && (
            <label className="liability-check" style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr",
              gap: "8px",
              alignItems: "start",
              margin: "16px 0",
              textAlign: "left",
              fontSize: "11px",
              color: "#fca5a5",
              background: "rgba(239, 68, 68, 0.08)",
              padding: "10px",
              borderRadius: "8px",
              border: "1px dashed rgba(239, 68, 68, 0.35)",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                style={{ marginTop: "2px" }}
                checked={liabilityAccepted}
                onChange={(e) => setLiabilityAccepted(e.target.checked)}
              />
              <span>Tôi đã đọc kỹ cảnh báo, tự chịu trách nhiệm pháp lý đối với mọi rủi ro mất tiền và miễn trừ hoàn toàn trách nhiệm cho ngân hàng.</span>
            </label>
          )}

          <div className="action-stack">
            <PrimaryButton
              disabled={!canProceed}
              onClick={shouldUseCompanionChecklist ? completeCompanionReviewedTransfer : completeTransfer}
            >
              {shouldUseCompanionChecklist ? "Hoàn tất checklist và tiếp tục" : "Tiếp tục chuyển tiền"}
            </PrimaryButton>
            {isCompanionLevel && (
              <PrimaryButton variant="secondary" onClick={startHumanReview}>
                Yêu cầu Tổng đài viên xác minh
              </PrimaryButton>
            )}
            <PrimaryButton variant={isCompanionLevel ? "ghost" : "secondary"} onClick={() => {
              setLiabilityAccepted(false);
              setTransferStep("input_recipient");
            }}>
              Hủy giao dịch
            </PrimaryButton>
          </div>
        </div>
      );
    }

    if (transferStep === "verification") {
      return (
        <FaceIdVerificationScreen
          riskScore={latestGuardianDecision?.riskScore ?? 0}
          aiLevel={latestGuardianDecision ? getFriendlyAiLevel(latestGuardianDecision.aiLevel) : "Đang kiểm tra"}
          explanation={latestGuardianDecision?.explanation ?? "KNIGHT AI đang hoàn tất xác thực giao dịch song song với Face ID."}
          recipientName={transferRecipient}
          amount={Number(transferAmount)}
          onSuccess={handleTransferFaceIdSuccess}
          onBack={cancelTransferVerification}
          isPreCheck
          isAiPending={isTransferAiPending}
          autoStart
        />
      );
    }

    if (transferStep === "held" && latestGuardianDecision) {
      return (
        <div className="tab-content dashboard-transfer guardian-transfer-review guardian-transfer-review--held">
          <LockKeyhole size={36} />
          <h2>Giao dịch tạm thời bị giữ lại</h2>
          <div className="guardian-transfer-score">
            <strong>Rủi ro: {latestGuardianDecision.riskScore}/100</strong>
            <span>Hệ thống AI: {getFriendlyAiLevel(latestGuardianDecision.aiLevel)}</span>
            <span>Cách xử lý: {getFriendlyPolicy(latestGuardianDecision.policyLevel)}</span>
          </div>
          <p>{latestGuardianDecision.explanation}</p>
          <p className="guardian-reference">Mã tham chiếu: {latestGuardianDecision.transactionId}</p>
          
          <div className="guardian-legal-notice" style={{
            background: "rgba(125, 211, 252, 0.05)",
            padding: "10px",
            borderRadius: "8px",
            border: "1px dashed rgba(125, 211, 252, 0.25)",
            fontSize: "11px",
            color: "rgba(241,245,249,0.7)",
            marginBottom: "12px",
            textAlign: "left"
          }}>
            <strong>Quyền lợi Khách hàng (Luật BV DLCN 2025):</strong> Bạn có quyền phản đối quyết định tự động của AI và yêu cầu Chuyên viên kiểm duyệt giao dịch trực tiếp hỗ trợ giải phóng.
          </div>

          <div className="action-stack">
            <PrimaryButton
              onClick={() => {
                onStartDemo();
                setActiveTab("knight");
              }}
            >
              Mở luồng xác minh KNIGHT
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={startHumanReview}>
              Yêu cầu Tổng đài viên xác minh (Human Review)
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setTransferStep("input_details")}>
              Quay lại chỉnh sửa
            </PrimaryButton>
          </div>
        </div>
      );
    }

    if (transferStep === "success") {
      return (
        <div className="tab-content dashboard-transfer success-view">
          <div className="checkmark-wrapper">
            <svg className="checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <h2>Giao dịch thành công</h2>
          <strong className="amount-success">{formatVnd(Number(transferAmount))}</strong>

          <div className="receipt-details">
            <div className="receipt-row">
              <span>Người thụ hưởng:</span>
              <strong>{transferRecipient}</strong>
            </div>
            <div className="receipt-row">
              <span>Tài khoản nhận:</span>
              <strong>{transferAccount}</strong>
            </div>
            <div className="receipt-row">
              <span>Ngân hàng nhận:</span>
              <strong>{transferBank}</strong>
            </div>
            <div className="receipt-row">
              <span>Mã giao dịch:</span>
              <strong>FT261628490218</strong>
            </div>
          </div>

          <PrimaryButton onClick={resetTransferForm}>Về trang chủ</PrimaryButton>
        </div>
      );
    }
}
