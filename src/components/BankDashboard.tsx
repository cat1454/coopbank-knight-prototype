import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
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
  Clock,
  LockKeyhole,
} from "lucide-react";
import type { GuardianRiskDecision, KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import { PrimaryButton } from "./PrimaryButton";
import type { BankTransaction } from "../data/bankingDemo";
import { defaultTransferBank, transferBanks, type TransferBank } from "../data/transferBanks";
import { KnightAgentVisual } from "./KnightAgentVisual";
import { disablePushNotifications, enablePushNotifications } from "../services/pushNotifications";
import { evaluateGuardianTransaction } from "../domain/guardianFlow";
import { GuardianFlowPanel } from "./GuardianFlowPanel";

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

const transferChecklistItems = [
  "Tôi biết rõ người nhận và đã kiểm tra số tài khoản.",
  "Không ai yêu cầu tôi chuyển tiền gấp hoặc giữ bí mật.",
  "Nội dung giao dịch không liên quan đầu tư, thưởng hoặc hoàn tiền bất thường.",
];

const riskyTransferContentPattern = /dau tu|đầu tư|gap|gấp|bi mat|bí mật|hoan tien|hoàn tiền|thuong|thưởng|otp|crypto/i;

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
  const [activeTab, setActiveTab] = useState<"home" | "transfer" | "knight" | "history" | "settings">("home");
  const [balanceVisible, setBalanceVisible] = useState(false);

  // Transfer Step States
  const [transferStep, setTransferStep] = useState<"input" | "confirm" | "processing" | "warning" | "verification" | "held" | "success">("input");
  const [transferBank, setTransferBank] = useState(defaultTransferBank.displayName);
  const [bankQuery, setBankQuery] = useState(defaultTransferBank.displayName);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [transferAccount, setTransferAccount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferContent, setTransferContent] = useState("");
  const [latestGuardianDecision, setLatestGuardianDecision] = useState<GuardianRiskDecision | null>(null);
  const [transferChecklist, setTransferChecklist] = useState<boolean[]>(() => transferChecklistItems.map(() => false));

  // Settings states
  const [voiceOtt, setVoiceOtt] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(true);
  const [consentBasis, setConsentBasis] = useState(state.customer.personalizationConsent);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "saving" | "enabled" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("Thêm vào Màn hình chính, mở từ biểu tượng KNIGHT, rồi bật thông báo.");

  const transferAmountNumber = Number(transferAmount) || 0;
  const hasTransferAmount = transferAmountNumber > 0;
  const normalizedTransferContent = transferContent.trim();
  const normalizedBankQuery = bankQuery.trim().toLowerCase();
  const selectedBank = transferBanks.find((bank) => bank.displayName === transferBank);
  const filteredTransferBanks = transferBanks
    .filter((bank) => {
      if (!normalizedBankQuery) return true;
      return [bank.displayName, bank.legalName, bank.code, bank.bin].some((value) =>
        value.toLowerCase().includes(normalizedBankQuery),
      );
    })
    .slice(0, 8);
  const hasRiskyTransferContent = riskyTransferContentPattern.test(normalizedTransferContent);
  const amountSignal =
    !hasTransferAmount
      ? { tone: "neutral", label: "Đang khớp với thói quen chuyển tiền", detail: "Chưa có số tiền để so với nhịp thường ngày." }
      : transferAmountNumber >= 30_000_000
        ? { tone: "danger", label: "Vượt nhịp thường ngày", detail: "Cần giữ lại hoặc mở xác minh KNIGHT trước khi tiền rời tài khoản." }
        : transferAmountNumber >= 10_000_000
          ? { tone: "warning", label: "Cao hơn giao dịch quen thuộc", detail: "KNIGHT sẽ yêu cầu thêm tín hiệu người nhận và phiên đăng nhập." }
          : { tone: "success", label: "Trong nhịp thường ngày", detail: "Số tiền gần vùng giao dịch quen thuộc của tài khoản." };
  const contentSignal =
    !normalizedTransferContent
      ? { tone: "neutral", label: "Đang quét nội dung", detail: "Nội dung chuyển khoản sẽ được quét theo dấu hiệu lừa đảo phổ biến." }
      : hasRiskyTransferContent
        ? { tone: "danger", label: "Từ khóa cần kiểm tra", detail: "Nội dung giống mẫu gấp, đầu tư, hoàn tiền hoặc yêu cầu giữ bí mật." }
        : { tone: "success", label: "Nội dung ổn định", detail: "Không thấy cụm từ rủi ro trong note giao dịch." };
  const recipientSignal = transferAccount
    ? transferAccount === "88884920412" || transferRecipient.toLowerCase().includes("shopmall")
      ? "Người nhận cần xác minh"
      : "Người nhận có thể đối chiếu"
    : "Chưa có người nhận";
  const intakeSignalCount = [
    transferBank,
    transferAccount,
    transferRecipient,
    hasTransferAmount,
    normalizedTransferContent,
  ].filter(Boolean).length;

  // Suggested Beneficiaries
  const selectTransferBank = (bank: TransferBank) => {
    setTransferBank(bank.displayName);
    setBankQuery(bank.displayName);
    setBankPickerOpen(false);
  };

  const handleSelectSuggestion = (type: "safe" | "fraud") => {
    if (type === "safe") {
      selectTransferBank(defaultTransferBank);
      setTransferAccount("19038472910");
      setTransferRecipient("Nguyễn Văn B");
      setTransferAmount("200000");
      setTransferContent("Huynh Phuoc Phu chuyen tien");
    } else {
      selectTransferBank(defaultTransferBank);
      setTransferAccount("88884920412");
      setTransferRecipient("ShopMall Global");
      setTransferAmount("10000000");
      setTransferContent("Thanh toan don hang");
    }
  };

  const handleNextStep = () => {
    if (bankQuery.trim() && transferAccount && transferRecipient && transferAmount && transferContent) {
      setTransferBank(bankQuery.trim());
      setTransferStep("confirm");
    }
  };

  const completeTransfer = () => {
    const amountNum = Number(transferAmount);

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
  };

  const handleConfirmTransfer = () => {
    setTransferStep("processing");
    setTransferChecklist(transferChecklistItems.map(() => false));

    setTimeout(async () => {
      const amountNum = Number(transferAmount);
      const isRiskRecipient = transferAccount === "88884920412" || transferRecipient.toLowerCase().includes("shopmall");
      const isCriticalShape = isRiskRecipient && amountNum >= 30_000_000;
      const { decision } = await evaluateGuardianTransaction({
        amountVnd: amountNum,
        recipientName: transferRecipient,
        recipientAccount: transferAccount,
        recipientBank: bankQuery.trim() || transferBank,
        content: transferContent,
        location: isCriticalShape ? "Singapore" : "Da Nang",
        deviceTrust: isRiskRecipient || amountNum >= 10_000_000 ? "new" : "trusted",
        ipReputation: isCriticalShape ? "bad" : isRiskRecipient ? "suspicious" : "normal",
        loginMethod: "password",
        priorActions: isRiskRecipient
          ? ["login_password", "add_new_recipient", ...(isCriticalShape ? ["increase_limit"] : []), "open_transfer"]
          : ["login_password", "view_balance", "open_transfer"],
      });

      setLatestGuardianDecision(decision);

      if (decision.aiLevel === "safe") {
        completeTransfer();
        return;
      }

      if (decision.aiLevel === "watch") {
        setTransferStep("warning");
        return;
      }

      if (decision.aiLevel === "verify") {
        setTransferStep("verification");
        return;
      }

      setTransferStep("held");
    }, 1200);
  };

  const resetTransferForm = () => {
    setTransferStep("input");
    selectTransferBank(defaultTransferBank);
    setTransferAccount("");
    setTransferRecipient("");
    setTransferAmount("");
    setTransferContent("");
    setTransferChecklist(transferChecklistItems.map(() => false));
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
            <article className="transfer-ai-signal">
              <span>Tín hiệu người nhận</span>
              <strong>{recipientSignal}</strong>
              <small>KNIGHT đối chiếu tài khoản, ngân hàng và lịch sử giao dịch.</small>
            </article>
          </div>

          <div className="transfer-form">
            <div className="form-group">
              <label htmlFor="bank-input" className="form-label">Ngân hàng thụ hưởng</label>
              <div className="bank-picker">
                <div className="bank-picker__control">
                  <span className="bank-picker__logo" aria-hidden="true">
                    {selectedBank ? (
                      <img src={selectedBank.logoUrl} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 size={18} />
                    )}
                  </span>
                  <input
                    id="bank-input"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={bankPickerOpen}
                    aria-controls="bank-options"
                    aria-activedescendant={filteredTransferBanks[0] ? `bank-option-${filteredTransferBanks[0].code}` : undefined}
                    className="bank-picker__input"
                    placeholder="Nhập tên ngân hàng"
                    value={bankQuery}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setBankQuery(nextValue);
                      setTransferBank(nextValue);
                      setBankPickerOpen(true);
                    }}
                    onFocus={() => setBankPickerOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setBankPickerOpen(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="bank-picker__toggle"
                    aria-label="Mở danh sách ngân hàng"
                    onClick={() => setBankPickerOpen((current) => !current)}
                  >
                    <ChevronDown size={17} aria-hidden="true" />
                  </button>
                </div>

                {selectedBank && bankQuery === selectedBank.displayName ? (
                  <div className="bank-picker__selected">
                    <strong>{selectedBank.legalName}</strong>
                    <span>BIN {selectedBank.bin} · {selectedBank.code}</span>
                  </div>
                ) : null}

                {bankPickerOpen ? (
                  <div className="bank-picker__options" role="listbox" id="bank-options" aria-label="Danh sách ngân hàng">
                    {filteredTransferBanks.map((bank) => (
                      <button
                        type="button"
                        role="option"
                        id={`bank-option-${bank.code}`}
                        aria-selected={bank.displayName === transferBank}
                        className="bank-picker__option"
                        key={bank.code}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectTransferBank(bank)}
                      >
                        <img src={bank.logoUrl} alt={`Logo ${bank.displayName}`} referrerPolicy="no-referrer" />
                        <span>
                          <strong>{bank.displayName}</strong>
                          <small>{bank.legalName} · BIN {bank.bin}</small>
                        </span>
                      </button>
                    ))}

                    {filteredTransferBanks.length === 0 ? (
                      <button
                        type="button"
                        role="option"
                        aria-selected="false"
                        className="bank-picker__option bank-picker__option--manual"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setTransferBank(bankQuery.trim());
                          setBankPickerOpen(false);
                        }}
                      >
                        <Building2 size={18} aria-hidden="true" />
                        <span>
                          <strong>Dùng "{bankQuery.trim()}"</strong>
                          <small>Không có logo xác thực từ VietQR, chỉ lưu tên nhập tay.</small>
                        </span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
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
              <div className="transfer-field-signal">
                <strong>Đánh giá số tiền</strong>
                <span>{amountSignal.detail}</span>
              </div>
              <div className="amount-quick-row" aria-label="Mẫu số tiền nhanh">
                {[
                  ["200K", "200000"],
                  ["1M", "1000000"],
                  ["10M", "10000000"],
                  ["50M", "50000000"],
                ].map(([label, value]) => (
                  <button type="button" key={value} onClick={() => setTransferAmount(value)}>
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
              <div className={`transfer-field-signal transfer-field-signal--${contentSignal.tone}`}>
                <strong>Đánh giá nội dung</strong>
                <span>{contentSignal.detail}</span>
              </div>
              <div className="note-suggestion-row" aria-label="Mẫu note nhanh">
                <button type="button" onClick={() => setTransferContent("Chuyen tien sinh hoat")}>
                  Sinh hoạt
                </button>
                <button type="button" onClick={() => setTransferContent("Thanh toan dich vu")}>
                  Dịch vụ
                </button>
                <button type="button" onClick={() => setTransferContent("Ho tro gia dinh")}>
                  Gia đình
                </button>
              </div>
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
              <strong>{bankQuery.trim() || transferBank}</strong>
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

    if (transferStep === "warning" && latestGuardianDecision) {
      return (
        <div className="tab-content dashboard-transfer guardian-transfer-review guardian-transfer-review--warning">
          <AlertTriangle size={36} />
          <h2>KNIGHT cảnh báo giao dịch</h2>
          <div className="guardian-transfer-score">
            <strong>{latestGuardianDecision.riskScore}/100</strong>
            <span>AI level: {latestGuardianDecision.aiLevel}</span>
          </div>
          <p>{latestGuardianDecision.explanation}</p>
          <div className="action-stack">
            <PrimaryButton onClick={completeTransfer}>Tiếp tục chuyển tiền</PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => setTransferStep("input")}>
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
            <strong>{latestGuardianDecision.riskScore}/100</strong>
            <span>AI level: {latestGuardianDecision.aiLevel}</span>
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
            <PrimaryButton variant="secondary" onClick={() => setTransferStep("input")}>
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
            <strong>{latestGuardianDecision.riskScore}/100</strong>
            <span>AI level: {latestGuardianDecision.aiLevel}</span>
            <span>Policy: {latestGuardianDecision.policyLevel}</span>
          </div>
          <p>{latestGuardianDecision.explanation}</p>
          <p className="guardian-reference">Mã tham chiếu: {latestGuardianDecision.transactionId}</p>
          <div className="action-stack">
            <PrimaryButton
              onClick={() => {
                onStartDemo();
                setActiveTab("knight");
              }}
            >
              Mở luồng xác minh KNIGHT
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => setTransferStep("input")}>
              Quay lại
            </PrimaryButton>
          </div>
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
              <strong>{bankQuery.trim() || transferBank}</strong>
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
