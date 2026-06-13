import { useState } from "react";
import {
  Home,
  QrCode,
  History,
  Settings as SettingsIcon,
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
  ArrowRightLeft,
} from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import { PrimaryButton } from "./PrimaryButton";
import type { BankTransaction } from "../app/App";
import { KnightAgentVisual } from "./KnightAgentVisual";
import { disablePushNotifications, enablePushNotifications } from "../services/pushNotifications";

interface BankDashboardProps {
  state: KnightScenarioState;
  selectedQtdnd: string;
  onStartDemo: () => void;
  onLogout: () => void;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  transactions: BankTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<BankTransaction[]>>;
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
}: BankDashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "transfer" | "knight" | "history" | "settings">("home");
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Transfer Step States
  const [transferStep, setTransferStep] = useState<"input" | "confirm" | "processing" | "success">("input");
  const [transferBank, setTransferBank] = useState("Techcombank");
  const [transferAccount, setTransferAccount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferContent, setTransferContent] = useState("");

  // Settings states
  const [voiceOtt, setVoiceOtt] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(true);
  const [consentBasis, setConsentBasis] = useState(state.customer.personalizationConsent);
  const [protectionLevel, setProtectionLevel] = useState<"monitor" | "standard" | "maximum">("standard");
  const [pushAlerts, setPushAlerts] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "saving" | "enabled" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("Thêm vào Màn hình chính, mở từ biểu tượng KNIGHT, rồi bật thông báo.");

  // Suggested Beneficiaries
  const handleSelectSuggestion = (type: "safe" | "fraud") => {
    if (type === "safe") {
      setTransferBank("Techcombank");
      setTransferAccount("19038472910");
      setTransferRecipient("Nguyễn Văn B");
      setTransferAmount("200000");
      setTransferContent("Huynh Phuoc Phu chuyen tien");
    } else {
      setTransferBank("Co-opBank");
      setTransferAccount("88884920412");
      setTransferRecipient("ShopMall Global");
      setTransferAmount("10000000");
      setTransferContent("Thanh toan don hang");
    }
  };

  const handleNextStep = () => {
    if (transferBank && transferAccount && transferRecipient && transferAmount && transferContent) {
      setTransferStep("confirm");
    }
  };

  const handleConfirmTransfer = () => {
    setTransferStep("processing");

    setTimeout(() => {
      const amountNum = Number(transferAmount);

      // If it is the suspicious transaction (ShopMall Global or 10,000,000 VND)
      if (transferRecipient.toLowerCase().includes("shopmall") || amountNum === 10000000) {
        onStartDemo(); // Intercept! Trigger background AI agent risk detection
      } else {
        // Safe Transaction
        setBalance((prev) => prev - amountNum);
        setTransactions((prev) => [
          {
            id: `TXN-${Date.now()}`,
            merchantName: transferRecipient,
            amountVnd: amountNum,
            time: "Vừa xong",
            status: "success",
            type: "transfer",
          },
          ...prev,
        ]);
        setTransferStep("success");
      }
    }, 1200);
  };

  const resetTransferForm = () => {
    setTransferStep("input");
    setTransferBank("Techcombank");
    setTransferAccount("");
    setTransferRecipient("");
    setTransferAmount("");
    setTransferContent("");
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
        <div className={`ai-status-bar ${state.currentState === "audit_complete" ? "upgraded" : ""}`}>
          <div className="ai-pulse-dot"></div>
          <ShieldCheck size={16} className="ai-shield" />
          {state.currentState === "audit_complete" ? (
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
    if (transferStep === "input") {
      return (
        <div className="tab-content dashboard-transfer">
          <h2 className="section-title">Chuyển tiền nhanh 24/7</h2>
          <div className="transfer-form">
            <div className="form-group">
              <label htmlFor="bank-select" className="form-label">Ngân hàng thụ hưởng</label>
              <select
                id="bank-select"
                className="form-control"
                value={transferBank}
                onChange={(e) => setTransferBank(e.target.value)}
              >
                <option value="Techcombank">Techcombank</option>
                <option value="Vietcombank">Vietcombank</option>
                <option value="Co-opBank">Co-opBank</option>
                <option value="BIDV">BIDV</option>
                <option value="Agribank">Agribank</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="account-input" className="form-label">Số tài khoản / Số thẻ nhận</label>
              <input
                id="account-input"
                type="text"
                className="form-control"
                placeholder="Nhập số tài khoản nhận"
                value={transferAccount}
                onChange={(e) => setTransferAccount(e.target.value)}
              />
            </div>

            {/* Beneficiary suggestions */}
            <div className="suggestion-box">
              <span className="suggestion-label">Gợi ý người nhận nhanh:</span>
              <div className="suggestion-chips">
                <button
                  type="button"
                  className="suggestion-chip safe"
                  onClick={() => handleSelectSuggestion("safe")}
                >
                  🟢 Nguyễn Văn B (An toàn)
                </button>
                <button
                  type="button"
                  className="suggestion-chip fraud"
                  onClick={() => handleSelectSuggestion("fraud")}
                >
                  🔴 ShopMall Global (Rủi ro)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="recipient-input" className="form-label">Tên người thụ hưởng</label>
              <input
                id="recipient-input"
                type="text"
                className="form-control"
                placeholder="Tên người thụ hưởng"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount-input" className="form-label">Số tiền chuyển (VND)</label>
              <input
                id="amount-input"
                type="number"
                className="form-control"
                placeholder="Nhập số tiền chuyển"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="content-input" className="form-label">Nội dung chuyển khoản</label>
              <input
                id="content-input"
                type="text"
                className="form-control"
                placeholder="Nội dung chuyển khoản"
                value={transferContent}
                onChange={(e) => setTransferContent(e.target.value)}
              />
            </div>

            <div className="transfer-warning-box">
              <ShieldCheck size={16} />
              <span>Hệ thống bảo vệ KNIGHT AI sẽ kiểm tra giao dịch này.</span>
            </div>

            <PrimaryButton onClick={handleNextStep}>Tiếp tục</PrimaryButton>
          </div>
        </div>
      );
    }

    if (transferStep === "confirm") {
      return (
        <div className="tab-content dashboard-transfer">
          <h2 className="section-title">Xác nhận thông tin giao dịch</h2>
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
            <PrimaryButton variant="secondary" onClick={() => setTransferStep("input")}>
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

    if (transferStep === "success") {
      return (
        <div className="tab-content dashboard-transfer success-view">
          <div className="success-icon-wrapper">
            <CheckCircle2 size={48} className="success-icon" />
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
          const cockpitClass = isUpgraded ? "ai-cockpit upgraded" : "ai-cockpit";
          const coreStatus = isUpgraded ? "Hoạt động (v2.0 Enhanced)" : "Hoạt động (v1.0 Standard)";
          const policyLevel = isUpgraded ? "L2 & L3 (Nâng cao)" : "L2 (Khóa thẻ tự động)";
          
          return (
            <div className={cockpitClass}>
              <div className="ai-cockpit-header">
                <span className="ai-cockpit-dot"></span>
                <strong>BẢNG ĐIỀU KHIỂN GIÁM SÁT AI</strong>
              </div>
              <div className="ai-cockpit-grid">
                <div className="cockpit-item">
                  <span>Lõi bảo vệ</span>
                  <strong>{coreStatus}</strong>
                </div>
                <div className="cockpit-item">
                  <span>Phản ứng</span>
                  <strong>250ms (Real-time)</strong>
                </div>
                <div className="cockpit-item">
                  <span>Cấp độ Policy</span>
                  <strong>{policyLevel}</strong>
                </div>
                <div className="cockpit-item">
                  <span>Thiết bị tin cậy</span>
                  <strong>1 thiết bị (Chính chủ)</strong>
                </div>
                <div className="cockpit-item">
                  <span>Nhật ký bảo mật</span>
                  <strong>{state.auditEvents.length} sự kiện</strong>
                </div>
                <div className="cockpit-item">
                  <span>Lớp mạng/IP</span>
                  <strong>An toàn (0 đe dọa)</strong>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Protection Levels */}
        <div className="settings-section">
          <span className="settings-section-title">Mức độ bảo mật</span>
          <div className="protection-level-selector">
            <button
              type="button"
              className={`level-btn ${protectionLevel === "monitor" ? "active" : ""}`}
              onClick={() => setProtectionLevel("monitor")}
            >
              <strong>Giám sát</strong>
              <span>Chỉ gửi cảnh báo</span>
            </button>
            <button
              type="button"
              className={`level-btn ${protectionLevel === "standard" ? "active" : ""}`}
              onClick={() => setProtectionLevel("standard")}
            >
              <strong>Tiêu chuẩn</strong>
              <span>Khóa thẻ (L2)</span>
            </button>
            <button
              type="button"
              className={`level-btn ${protectionLevel === "maximum" ? "active" : ""}`}
              onClick={() => setProtectionLevel("maximum")}
            >
              <strong>Tối đa</strong>
              <span>Face ID mọi GD</span>
            </button>
          </div>
        </div>

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

  return (
    <div className="dashboard-layout">
      <div className="dashboard-body">
        {activeTab === "home" && renderHome()}
        {activeTab === "transfer" && renderTransfer()}
        {activeTab === "knight" && renderKnightTab()}
        {activeTab === "history" && renderHistory()}
        {activeTab === "settings" && renderSettings()}
      </div>

      {/* Bottom Tab Bar */}
      <nav className="bottom-tabs" aria-label="Thanh điều hướng chính">
        <button
          type="button"
          className={`tab-btn ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          <Home size={20} />
          <span>Trang chủ</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "transfer" ? "active" : ""}`}
          onClick={() => setActiveTab("transfer")}
        >
          <ArrowRightLeft size={20} />
          <span>Chuyển tiền</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "knight" ? "active" : ""}`}
          onClick={() => setActiveTab("knight")}
        >
          <ShieldCheck size={20} />
          <span>Hộ vệ AI</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={20} />
          <span>Lịch sử</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <SettingsIcon size={20} />
          <span>Cài đặt</span>
        </button>
      </nav>
    </div>
  );
}
