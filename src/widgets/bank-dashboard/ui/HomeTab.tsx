import { Bell, CreditCard, Droplet, Eye, EyeOff, QrCode, Receipt, Send, ShieldAlert, ShieldCheck, Smartphone, Ticket, TrendingUp, Wifi } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import type { BankDashboardTab } from "../BottomTabs";
import { KnightLogoMini } from "../../../shared/ui/knight-logo-mini/KnightLogoMini";
import "./HomeTabStatus.css";
import "./HomeTabSurface.css";
import "./HomeTabSurfaceActions.css";
import "./HomeTabActions.css";
import "./HomeTab.css";
import "./HomeTabInspireAccount.css";
import "./HomeTabInspireActions.css";

interface HomeTabProps {
  state: KnightScenarioState;
  selectedQtdnd: string;
  balance: number;
  balanceVisible: boolean;
  setBalanceVisible: (value: boolean) => void;
  hasThreatLensConsent: boolean;
  onLogout: () => void;
  setActiveTab: (tab: BankDashboardTab) => void;
}

export function HomeTab({
  state,
  selectedQtdnd,
  balance,
  balanceVisible,
  setBalanceVisible,
  hasThreatLensConsent,
  onLogout,
  setActiveTab,
}: HomeTabProps) {
    return (
      <div className="tab-content dashboard-home">
        {/* SVG Vector Hills Pattern (Deep in background) */}
        <div className="bg-illustration">
          <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }} aria-hidden="true">
            <path d="M-20 280 L-20 180 C80 170 120 220 180 180 C240 140 300 240 340 280 Z" fill="#bce4d2" opacity="0.2"/>
            <path d="M-20 280 L-20 200 C60 210 100 150 160 170 C220 190 280 130 340 160 L340 280 Z" fill="#9cd6bb" opacity="0.3"/>
          </svg>
        </div>

        {/* Custom Header */}
        <header className="dashboard-header">
          <div className="user-profile">
            <div className="avatar-logo-container">
              <KnightLogoMini size={30} />
            </div>
            <div className="user-info">
              <span className="welcome">Chào bạn mới,</span>
              <strong className="name">{state.customer.name}</strong>
            </div>
          </div>
          
          <div className="header-actions">
            <button type="button" className="bell-icon-container" aria-label="Thông báo">
              <Bell size={16} />
              <div className="bell-badge"></div>
            </button>
            <button
              type="button"
              className="logout-btn-minimal"
              onClick={onLogout}
              title="Đăng xuất"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Clean Floating Balance Card */}
        <div className="balance-card">
          <div className="balance-title">
            <span>SỐ DƯ KHẢ DỤNG</span>
            <button
              type="button"
              className="eye-btn balance-toggle"
              onClick={() => setBalanceVisible(!balanceVisible)}
              aria-label={balanceVisible ? "Ẩn số dư" : "Hiện số dư"}
            >
              {balanceVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="balance-value-row">
            <strong className="balance-amount">
              {balanceVisible ? formatVnd(balance) : "••••••••"}
            </strong>
          </div>
          
          {/* Clean Compact Badge */}
          <div className="balance-badge">
            <span className="balance-badge-text">Nhận thêm 300K U-Point</span>
            <span className="balance-badge-action">Xem ưu đãi ›</span>
          </div>

          <div className="balance-card__branch-minimal">
            <span>Quỹ liên kết: <strong>{selectedQtdnd} (Đà Nẵng)</strong></span>
          </div>
        </div>

        {/* AI Background Protection Status */}
        <div className={`ai-status-bar ${!hasThreatLensConsent ? "deactivated" : state.currentState === "audit_complete" ? "upgraded" : ""}`}>
          <div className="ai-pulse-dot"></div>
          {!hasThreatLensConsent ? (
            <ShieldAlert size={16} className="ai-shield" />
          ) : (
            <ShieldCheck size={16} className="ai-shield" />
          )}
          {!hasThreatLensConsent ? (
            <span>Hộ vệ AI <strong>KNIGHT ngoại tuyến</strong> (Chưa bật bảo vệ)</span>
          ) : state.currentState === "audit_complete" ? (
            <span>Hộ vệ <strong>KNIGHT AI v2.0 (Enhanced)</strong> đã kích hoạt tối đa</span>
          ) : (
            <span>Hệ thống <strong>KNIGHT AI</strong> đang chạy ngầm bảo vệ thẻ</span>
          )}
        </div>

        {/* Glassmorphism Quick Actions Grid */}
        <div className="quick-actions-bar">
          <button type="button" className="action-item" onClick={() => setActiveTab("transfer")}>
            <div className="action-icon">
              <Send size={16} style={{ transform: "rotate(-25deg)", marginLeft: "2px" }} />
            </div>
            <span className="action-label">Chuyển tiền</span>
          </button>
          <button type="button" className="action-item" onClick={() => setActiveTab("card")}>
            <div className="action-icon">
              <CreditCard size={16} />
            </div>
            <span className="action-label">Thẻ của tôi</span>
          </button>
          <button type="button" className="action-item">
            <div className="action-icon">
              <Smartphone size={16} />
            </div>
            <span className="action-label">Nạp tiền ĐT</span>
          </button>
          <button type="button" className="action-item" onClick={() => setActiveTab("transfer")}>
            <div className="action-icon">
              <QrCode size={16} />
            </div>
            <span className="action-label">Quét QR</span>
          </button>
          <button type="button" className="action-item">
            <div className="action-icon">
              <TrendingUp size={16} />
            </div>
            <span className="action-label">Sinh lời tự động</span>
          </button>
        </div>

        {/* Card Management (Satisfying assertions for "Thẻ số của tôi") */}
        <div className="dashboard-section" style={{ textAlign: "left", marginBottom: "20px" }}>
          <h2 className="section-title">Thẻ số của tôi</h2>
          {(() => {
            const displayCard = state.newCard || state.card;
            const displayStatus = state.newCard ? "active" : state.card.status;
            return (
              <button
                type="button"
                className="compact-card-btn"
                onClick={() => setActiveTab("card")}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(16, 24, 40, 0.08)" }}
                aria-label="Xem chi tiết thẻ số của tôi"
              >
                <div className="compact-card-btn__left" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CreditCard size={20} />
                  <div className="compact-card-btn__title" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold" }}>Thẻ Ghi Nợ Số</span>
                    <span className="compact-card-btn__number" style={{ fontSize: "10px", color: "var(--color-muted)" }}>{displayCard.maskedPan}</span>
                  </div>
                </div>
                <span className={`card-badge card-badge--${displayStatus}`} style={{ fontSize: "9px", padding: "4px 8px", borderRadius: "100px", fontWeight: "bold" }}>
                  {displayStatus === "active"
                    ? "Hoạt động"
                    : displayStatus === "suspended"
                    ? "Tạm khóa"
                    : "Đã khóa"}
                </span>
              </button>
            );
          })()}
        </div>

        {/* Dành cho bạn Promotion Section */}
        <div>
          <h3 className="dashboard-section-title">Dành cho bạn</h3>
          <div className="promo-card">
            <div className="promo-content">
              <span className="promo-tag">Thẻ tín dụng</span>
              <strong className="promo-heading">Hoàn đến 1.2 triệu U-Point chi tiêu Quảng cáo</strong>
              <div>
                <span className="promo-badge-pill">Nhận hoàn tiền</span>
              </div>
            </div>
            <div style={{ fontSize: "28px" }}>🎁</div>
          </div>
        </div>

        {/* Life Services */}
        <div className="dashboard-section" style={{ textAlign: "left" }}>
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
}
