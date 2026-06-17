import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Search,
  X,
  QrCode,
  Eye,
  EyeOff,
  Send,
  Smartphone,
  TrendingUp,
  Receipt,
  Droplet,
  Wifi,
  Ticket,
  ShieldCheck,
  User,
  CreditCard,
  CheckCircle2,
  Clock,
  LockKeyhole,
  Video,
  ShieldAlert,
} from "lucide-react";
import type { KnightScenarioState } from "../../domain/types";
import { formatVnd } from "../../domain/format";
import { PrimaryButton } from "../../shared/ui";
import type { BankTransaction } from "../../entities/bank-account/model/bankingDemo";
import { KnightAgentVisual } from "../knight-agent-visual/KnightAgentVisual";
import { disablePushNotifications, enablePushNotifications } from "../../shared/api/pushNotifications";
import { GuardianFlowPanel } from "../../features/guardianflow-decision/ui/GuardianFlowPanel";
import { BottomTabs, type BankDashboardTab } from "./BottomTabs";
import { transferChecklistItems, useBankTransferFlow } from "./useBankTransferFlow";

const getFriendlyAiLevel = (level: string) => {
  switch (level) {
    case "safe": return "An toàn";
    case "watch": return "Cần giám sát";
    case "verify": return "Cần xác thực";
    case "hold": return "Tạm giữ";
    case "critical": return "Cảnh báo cao";
    default: return level;
  }
};

const getFriendlyPolicy = (policy: string) => {
  const lower = policy.toLowerCase();
  if (lower.includes("l2")) return "Tự động khóa thẻ";
  if (lower.includes("l3")) return "Khóa thẻ & Chặn GD lạ";
  return policy;
};

const getDeviceName = () => {
  if (typeof window === "undefined" || !window.navigator) return "Thiết bị này";
  const ua = window.navigator.userAgent;
  
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  
  if (/Android/i.test(ua)) {
    const parts = ua.split(";");
    for (let part of parts) {
      part = part.trim();
      if (part.includes("Build/")) {
        const model = part.split("Build/")[0].trim();
        if (model) return model;
      }
      if (/SM-[A-Z0-9]+/i.test(part)) {
        return "Samsung " + part.match(/SM-[A-Z0-9]+/i)?.[0];
      }
    }
    
    if (/Samsung/i.test(ua)) return "Samsung Galaxy";
    if (/Pixel/i.test(ua)) return "Google Pixel";
    if (/Xiaomi|Redmi|Poco/i.test(ua)) return "Xiaomi";
    if (/OPPO/i.test(ua)) return "OPPO";
    if (/Vivo/i.test(ua)) return "Vivo";
    if (/Huawei/i.test(ua)) return "Huawei";
    
    return "Điện thoại Android";
  }
  
  if (/Windows NT/i.test(ua)) return "Windows PC";
  if (/Macintosh/i.test(ua)) return "macOS PC";
  
  return "Thiết bị này";
};

interface BankDashboardProps {
  state: KnightScenarioState;
  selectedQtdnd: string;
  onStartDemo: () => void;
  onLogout: () => void;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  transactions: BankTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<BankTransaction[]>>;
  guardianDemoEnabled?: boolean;
}

export function BankDashboard({
  state,
  selectedQtdnd,
  onStartDemo,
  onLogout,
  balance,
  setBalance,
  transactions,
  setTransactions,
  guardianDemoEnabled = false,
}: BankDashboardProps) {
  const [activeTab, setActiveTab] = useState<BankDashboardTab>("home");
  const [balanceVisible, setBalanceVisible] = useState(false);
  const {
    amountSignal,
    bankPickerOpen,
    bankSearch,
    completeTransfer,
    contentSignal,
    filteredTransferBanks,
    handleConfirmTransfer,
    handleNextStep,
    handleSelectSuggestion,
    hasTransferAmount,
    intakeSignalCount,
    latestGuardianDecision,
    recipientSignal,
    resetTransferFields,
    selectTransferBank,
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
    handleNextToDetails,
    isHumanReviewing,
    humanReviewStep,
    startHumanReview,
    completeHumanReview,
  } = useBankTransferFlow({ setBalance, setTransactions });

  const [liabilityAccepted, setLiabilityAccepted] = useState(false);

  // Settings states
  const [voiceOtt, setVoiceOtt] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(true);
  const [consentBasis, setConsentBasis] = useState(state.customer.personalizationConsent);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "saving" | "enabled" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("Thêm vào Màn hình chính, mở từ biểu tượng KNIGHT, rồi bật thông báo.");

  // Sync consent state to gray out visual/cockpit panel when deactivated
  const [hasGuardianConsent, setHasGuardianConsent] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.sessionStorage.getItem("knight_guardianflow_consent");
    return stored === null ? true : stored === "granted";
  });

  const [guardianLevelSetting, setGuardianLevelSetting] = useState<"max" | "standard" | "min">(() => {
    if (typeof window === "undefined") return "standard";
    return (window.sessionStorage.getItem("knight_guardian_level") as "max" | "standard" | "min") || "standard";
  });

  useEffect(() => {
    const handleStorage = () => {
      const stored = window.sessionStorage.getItem("knight_guardianflow_consent");
      setHasGuardianConsent(stored === null ? true : stored === "granted");

      const level = window.sessionStorage.getItem("knight_guardian_level");
      setGuardianLevelSetting((level as "max" | "standard" | "min") || "standard");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const resetTransferForm = () => {
    resetTransferFields();
    setActiveTab("home");
  };

  const handlePushAlertsChange = async (checked: boolean) => {
    if (!checked) {
      setPushStatus("saving");
      setPushMessage("Đang tắt thông báo trên thiết bị này...");
      await disablePushNotifications();
      setPushAlerts(false);
      setPushStatus("idle");
      setPushMessage("Thông báo đã tắt trên bản prototype này.");
      return;
    }

    setPushAlerts(true);
    setPushStatus("saving");
    setPushMessage("Đang đăng ký thiết bị với máy chủ laptop...");

    try {
      await enablePushNotifications();
      setPushStatus("enabled");
      setPushMessage("Đã bật thông báo. Hãy khóa màn hình điện thoại rồi bấm Space tại cửa sổ dòng lệnh ở máy tính để thử nghiệm.");
    } catch (error) {
      setPushAlerts(false);
      setPushStatus("error");
      setPushMessage(error instanceof Error ? error.message : "Không thể bật thông báo Push trên thiết bị này.");
    }
  };

  const renderHome = () => {
    return (
      <div className="tab-content dashboard-home">
        {/* Welcome Header */}
        <div className="dashboard-header">
          <div className="header-user">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div>
              <span className="user-welcome">Xin chào,</span>
              <strong className="user-name">{state.customer.name}</strong>
            </div>
          </div>
          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
            title="Đăng xuất"
          >
            Đăng xuất
          </button>
        </div>

        {/* Account Balance Card */}
        <div className="balance-card">
          <div className="balance-card__info">
            <span className="balance-label">Tài khoản thanh toán</span>
            <button
              type="button"
              className="balance-toggle"
              onClick={() => setBalanceVisible(!balanceVisible)}
              aria-label={balanceVisible ? "Ẩn số dư" : "Hiện số dư"}
            >
              {balanceVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <strong className="balance-amount">
            {balanceVisible ? formatVnd(balance) : "•••••• ₫"}
          </strong>
          <div className="balance-card__branch">
            <span>Quỹ liên kết:</span>
            <strong>{selectedQtdnd} (Đà Nẵng)</strong>
          </div>
        </div>

        {/* AI Background Protection Status */}
        <div className={`ai-status-bar ${!hasGuardianConsent ? "deactivated" : state.currentState === "audit_complete" ? "upgraded" : ""}`}>
          <div className="ai-pulse-dot"></div>
          {!hasGuardianConsent ? (
            <ShieldAlert size={16} className="ai-shield" />
          ) : (
            <ShieldCheck size={16} className="ai-shield" />
          )}
          {!hasGuardianConsent ? (
            <span>Hộ vệ AI <strong>KNIGHT ngoại tuyến</strong> (Chưa bật bảo vệ)</span>
          ) : state.currentState === "audit_complete" ? (
            <span>Hộ vệ <strong>KNIGHT AI v2.0 (Enhanced)</strong> đã kích hoạt tối đa</span>
          ) : (
            <span>Hệ thống <strong>KNIGHT AI</strong> đang chạy ngầm bảo vệ thẻ</span>
          )}
        </div>

        {/* Primary Features */}
        <div className="quick-services">
          <button type="button" className="service-item" onClick={() => setActiveTab("transfer")}>
            <div className="service-icon service-icon--transfer">
              <Send size={20} />
            </div>
            <span>Chuyển tiền</span>
          </button>
          <button type="button" className="service-item">
            <div className="service-icon service-icon--topup">
              <Smartphone size={20} />
            </div>
            <span>Nạp tiền ĐT</span>
          </button>
          <button type="button" className="service-item" onClick={() => setActiveTab("transfer")}>
            <div className="service-icon service-icon--qr">
              <QrCode size={20} />
            </div>
            <span>Quét QR</span>
          </button>
          <button type="button" className="service-item">
            <div className="service-icon service-icon--saving">
              <TrendingUp size={20} />
            </div>
            <span>Tiết kiệm</span>
          </button>
        </div>

        {/* Card Management */}
        <div className="dashboard-section">
          <h2 className="section-title">Thẻ số của tôi</h2>
          {(() => {
            const hasNewCard = !!state.newCard;
            const displayCard = state.newCard || state.card;
            const displayStatus = hasNewCard ? "active" : state.card.status;
            return (
              <div className={`my-card-widget ${displayStatus}`}>
                <div className="my-card-header">
                  <CreditCard size={20} />
                  <span>Thẻ Ghi Nợ Số</span>
                </div>
                <strong className="my-card-number">
                  {displayCard.maskedPan}
                </strong>
                <div className="my-card-footer">
                  <span>Trạng thái:</span>
                  <span className={`card-badge card-badge--${displayStatus}`}>
                    {displayStatus === "active"
                      ? "Đang hoạt động"
                      : displayStatus === "suspended"
                      ? "Đang tạm khóa"
                      : "Đã khóa vĩnh viễn"}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Life Services */}
        <div className="dashboard-section">
          <h2 className="section-title">Dịch vụ đời sống</h2>
          <div className="utilities-grid">
            <div className="utility-item">
              <Receipt size={18} />
              <span>Tiền điện</span>
            </div>
            <div className="utility-item">
              <Droplet size={18} />
              <span>Tiền nước</span>
            </div>
            <div className="utility-item">
              <Wifi size={18} />
              <span>Internet</span>
            </div>
            <div className="utility-item">
              <Ticket size={18} />
              <span>Vé tàu/xe</span>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderTransfer = () => {
    const levelSetting = typeof window !== "undefined" ? (window.sessionStorage.getItem("knight_guardian_level") as "max" | "standard" | "min") || "standard" : "standard";

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
                  <span>Hệ thống bảo vệ KNIGHT AI sẽ kiểm tra giao dịch này.</span>
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
      const canProceed = !isMinLevel || liabilityAccepted;

      return (
        <div className="tab-content dashboard-transfer guardian-transfer-review guardian-transfer-review--warning">
          <AlertTriangle size={36} />
          <h2>KNIGHT cảnh báo giao dịch</h2>
          <div className="guardian-transfer-score">
            <strong>Rủi ro: {latestGuardianDecision.riskScore}/100</strong>
            <span>Hệ thống AI: {getFriendlyAiLevel(latestGuardianDecision.aiLevel)}</span>
          </div>
          <p>{latestGuardianDecision.explanation}</p>

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
            <PrimaryButton disabled={!canProceed} onClick={completeTransfer}>Tiếp tục chuyển tiền</PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => {
              setLiabilityAccepted(false);
              setTransferStep("input_recipient");
            }}>
              Hủy giao dịch
            </PrimaryButton>
          </div>
        </div>
      );
    }

    if (transferStep === "verification" && latestGuardianDecision) {
      const checklistComplete = transferChecklist.every(Boolean);

      return (
        <div className="tab-content dashboard-transfer guardian-transfer-review guardian-transfer-review--verification">
          <Clock size={36} />
          <h2>KNIGHT yêu cầu xác thực bổ sung</h2>
          <div className="guardian-transfer-score">
            <strong>Rủi ro: {latestGuardianDecision.riskScore}/100</strong>
            <span>Hệ thống AI: {getFriendlyAiLevel(latestGuardianDecision.aiLevel)}</span>
          </div>
          <p>{latestGuardianDecision.explanation}</p>
          <div className="guardian-checklist">
            {transferChecklistItems.map((item, index) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={transferChecklist[index]}
                  onChange={(event) => {
                    setTransferChecklist((current) =>
                      current.map((value, itemIndex) => (itemIndex === index ? event.target.checked : value)),
                    );
                  }}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <div className="action-stack">
            <PrimaryButton disabled={!checklistComplete} onClick={completeTransfer}>
              Xác thực và chuyển tiền
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => setTransferStep("input_details")}>
              Quay lại chỉnh sửa
            </PrimaryButton>
          </div>
        </div>
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
  };

  const renderHistory = () => {
    const isSuspendedOrTerminated = state.card.status !== "active";
    return (
      <div className="tab-content dashboard-history">
        <h2 className="section-title">Lịch sử giao dịch</h2>
        <div className="history-list">
          {isSuspendedOrTerminated && (
            <div className="history-item pending">
              <div className="history-item__left">
                <span className="history-item__icon alert">⚠️</span>
                <div>
                  <strong className="history-merchant">{state.transaction.merchantName}</strong>
                  <span className="history-time">02:00 sáng - Thẻ bị chặn</span>
                </div>
              </div>
              <strong className="history-amount negative">
                -{formatVnd(state.transaction.amountVnd)}
              </strong>
            </div>
          )}
          {transactions.map((txn) => (
            <div className="history-item" key={txn.id}>
              <div className="history-item__left">
                <span className={`history-item__icon ${txn.type === "receive" ? "receive" : ""}`}>
                  {txn.type === "receive" ? "💸" : "☕"}
                </span>
                <div>
                  <strong className="history-merchant">{txn.merchantName}</strong>
                  <span className="history-time">{txn.time}</span>
                </div>
              </div>
              <strong className={`history-amount ${txn.type === "receive" ? "positive" : "negative"}`}>
                {txn.type === "receive" ? "+" : "-"}{formatVnd(txn.amountVnd)}
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="tab-content dashboard-settings">
        <h2 className="section-title">Cài đặt bảo mật KNIGHT AI</h2>
        <p className="settings-desc">
          Tùy chỉnh tính năng của hộ vệ tài chính KNIGHT AI được tích hợp trong tài khoản của bạn.
        </p>

        <div className="settings-options">
          <div className="setting-option">
            <div className="setting-option__info">
              <strong>Voice OTT (Thông báo giọng nói)</strong>
              <p>Đọc số dư và cảnh báo rủi ro bằng giọng nói tự động khi có biến động số dư.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={voiceOtt} onChange={(e) => setVoiceOtt(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-option">
            <div className="setting-option__info">
              <strong>Bảo mật sinh trắc học bắt buộc</strong>
              <p>Yêu cầu Face ID khi phát hiện các giao dịch điểm rủi ro L3 (Không tự động khóa vĩnh viễn).</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={biometricAuth} onChange={(e) => setBiometricAuth(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-option">
            <div className="setting-option__info">
              <strong>Cá nhân hóa dịch vụ (Consent)</strong>
              <p>Cho phép KNIGHT đề xuất các ưu đãi và chương trình cashback dựa trên thói quen chi tiêu.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={consentBasis} onChange={(e) => setConsentBasis(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="app-version-info">
          <span>Co-opBank Mobile v4.8.2</span>
          <span>Hộ vệ KNIGHT AI v1.2.0</span>
        </div>
      </div>
    );
  };

  const renderKnightTab = () => {
    return (
      <div className="tab-content dashboard-knight">
        {/* Visual Animated Agent in compact/mobile mode */}
        <div className="mobile-agent-container">
          <KnightAgentVisual state={state} variant="mobile" />
        </div>

        {/* Bảng điều khiển bảo mật AI Security Cockpit */}
        {(() => {
          const isUpgraded = state.currentState === "audit_complete";
          const cockpitClass = !hasGuardianConsent ? "ai-cockpit deactivated" : isUpgraded ? "ai-cockpit upgraded" : "ai-cockpit";
          const coreStatus = !hasGuardianConsent ? "Đã tắt" : isUpgraded ? "Bảo vệ tối đa" : "Đang bảo vệ";
          const responseVal = !hasGuardianConsent ? "--" : "Tức thì (< 0.25s)";
          const policyLevel = !hasGuardianConsent ? "Bị tắt" : guardianLevelSetting === "min" ? "Tối thiểu" : guardianLevelSetting === "max" ? "Tối đa" : "Đồng hành";
          const devicesVal = !hasGuardianConsent ? "--" : `${getDeviceName()} (Chính chủ)`;
          const logsVal = !hasGuardianConsent ? "--" : `Đã quét ${state.auditEvents.length} lần`;
          const networkVal = !hasGuardianConsent ? "--" : "Đường truyền an toàn";
          
          return (
            <div className={cockpitClass}>
              <div className="ai-cockpit-header">
                <span className="ai-cockpit-dot"></span>
                <strong>HỘ VỆ AI GIÁM SÁT AN TOÀN</strong>
              </div>
              <p className="ai-cockpit-desc">
                {!hasGuardianConsent 
                  ? "Vui lòng kích hoạt giám sát để Hộ vệ KNIGHT AI bảo vệ bạn."
                  : "KNIGHT AI đang chạy ngầm để quét và bảo vệ tài khoản của bạn."}
              </p>
              <div className="ai-cockpit-grid">
                <div className="cockpit-item">
                  <div className="cockpit-item-header">
                    <ShieldCheck className="cockpit-item-icon" size={14} />
                    <span>Trạng thái</span>
                  </div>
                  <strong>{coreStatus}</strong>
                </div>
                <div className="cockpit-item">
                  <div className="cockpit-item-header">
                    <Clock className="cockpit-item-icon" size={14} />
                    <span>Tốc độ quét</span>
                  </div>
                  <strong>{responseVal}</strong>
                </div>
                <div className="cockpit-item">
                  <div className="cockpit-item-header">
                    <LockKeyhole className="cockpit-item-icon" size={14} />
                    <span>Cấp độ bảo vệ</span>
                  </div>
                  <strong>{policyLevel}</strong>
                </div>
                <div className="cockpit-item">
                  <div className="cockpit-item-header">
                    <Smartphone className="cockpit-item-icon" size={14} />
                    <span>Thiết bị dùng</span>
                  </div>
                  <strong>{devicesVal}</strong>
                </div>
                <div className="cockpit-item">
                  <div className="cockpit-item-header">
                    <CheckCircle2 className="cockpit-item-icon" size={14} />
                    <span>Quét an toàn</span>
                  </div>
                  <strong>{logsVal}</strong>
                </div>
                <div className="cockpit-item">
                  <div className="cockpit-item-header">
                    <Wifi className="cockpit-item-icon" size={14} />
                    <span>Kết nối mạng</span>
                  </div>
                  <strong>{networkVal}</strong>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Protection Levels */}
        <GuardianFlowPanel
          demoEnabled={guardianDemoEnabled}
          latestDecision={latestGuardianDecision}
          onEscalateToKnight={onStartDemo}
        />

        {/* Notification Settings */}
        <div className="settings-section">
          <span className="settings-section-title">Thông báo bảo mật</span>
          <div className="ios-settings-list">
            <div className="ios-settings-row">
              <span>Cảnh báo Push thông minh</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  disabled={pushStatus === "saving"}
                  onChange={(e) => void handlePushAlertsChange(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <p className={`settings-footnote push-status push-status--${pushStatus}`} role="status">
              {pushMessage}
            </p>
            <div className="ios-settings-row">
              <span>Giọng nói biến động số dư</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={voiceOtt}
                  onChange={(e) => setVoiceOtt(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Consent Settings */}
        <div className="settings-section">
          <span className="settings-section-title">Quyền và Đồng ý</span>
          <div className="ios-settings-list">
            <div className="ios-settings-row">
              <span>Cá nhân hóa ưu đãi an tâm</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={consentBasis}
                  onChange={(e) => setConsentBasis(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          <p className="settings-footnote">
            Tính năng cá nhân hóa đề xuất ưu đãi dựa trên thói quen chi tiêu an toàn của bạn. Bạn có thể thay đổi bất kỳ lúc nào.
          </p>
        </div>
      </div>
    );
  };

  const renderBankPickerSheet = () => {
    if (!bankPickerOpen) return null;

    return (
      <div
        className="bank-sheet-backdrop"
        role="presentation"
        onMouseDown={() => {
          setBankSearch("");
          setBankPickerOpen(false);
        }}
      >
        <section
          className="bank-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bank-sheet-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="bank-sheet__close"
            aria-label="Đóng chọn ngân hàng"
            onClick={() => {
              setBankSearch("");
              setBankPickerOpen(false);
            }}
          >
            <X size={24} aria-hidden="true" />
          </button>

          <h2 id="bank-sheet-title">Bạn muốn chuyển khoản tới ngân hàng nào?</h2>

          <div className="bank-sheet__search">
            <span className="bank-sheet__search-icon" aria-hidden="true">
              <Building2 size={18} />
            </span>
            <input
              type="text"
              role="combobox"
              aria-label="Tìm ngân hàng"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls="bank-sheet-options"
              placeholder="ngân hàng nào?"
              value={bankSearch}
              autoFocus
              onChange={(event) => setBankSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setBankSearch("");
                  setBankPickerOpen(false);
                }
              }}
            />
            <Search size={19} aria-hidden="true" />
          </div>

          <div className="bank-sheet__list" role="listbox" id="bank-sheet-options" aria-label="Danh sách ngân hàng">
            {filteredTransferBanks.map((bank) => (
              <button
                type="button"
                role="option"
                aria-label={`${bank.listTitle} ${bank.legalName}`}
                aria-selected={bank.displayName === transferBank}
                className="bank-sheet__option"
                key={bank.code}
                onClick={() => selectTransferBank(bank)}
              >
                <span className="bank-sheet__logo">
                  <img src={bank.logoUrl} alt={`Logo ${bank.displayName}`} referrerPolicy="no-referrer" />
                </span>
                <span className="bank-sheet__copy">
                  <strong>{bank.listTitle}</strong>
                  <small>{bank.legalName}</small>
                </span>
              </button>
            ))}

            {filteredTransferBanks.length === 0 ? (
              <p className="bank-sheet__empty">Không tìm thấy ngân hàng có logo xác thực.</p>
            ) : null}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-body">
        {activeTab === "home" && renderHome()}
        {activeTab === "transfer" && renderTransfer()}
        {activeTab === "knight" && renderKnightTab()}
        {activeTab === "history" && renderHistory()}
        {activeTab === "settings" && renderSettings()}
      </div>

      {renderBankPickerSheet()}

      <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
