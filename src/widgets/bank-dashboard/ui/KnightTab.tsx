import { type Dispatch, type SetStateAction } from "react";
import { CheckCircle2, Clock, LockKeyhole, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { ThreatLensPanel } from "../../../features/threatlens-decision/ui/ThreatLensPanel";
import { KnightAgentVisual } from "../../knight-agent-visual/KnightAgentVisual";
import type { BankTransferFlow } from "../useBankTransferFlow";
import { getDeviceName, getThreatLensLevelLabel, type ThreatLensLevelSetting } from "../model/dashboardCopy";
import "./SettingsTab.css";
import "./KnightTab.css";

interface KnightTabProps {
  state: KnightScenarioState;
  hasThreatLensConsent: boolean;
  threatLensLevelSetting: ThreatLensLevelSetting;
  latestThreatLensDecision: BankTransferFlow["latestThreatLensDecision"];
  onStartDemo: () => void;
  threatLensDemoEnabled: boolean;
  pushAlerts: boolean;
  pushStatus: "idle" | "saving" | "enabled" | "error";
  handlePushAlertsChange: (checked: boolean) => Promise<void>;
  pushMessage: string;
  voiceOtt: boolean;
  setVoiceOtt: Dispatch<SetStateAction<boolean>>;
  consentBasis: boolean;
  setConsentBasis: Dispatch<SetStateAction<boolean>>;
  onViewTwin: () => void;
}

export function KnightTab({
  state,
  hasThreatLensConsent,
  threatLensLevelSetting,
  latestThreatLensDecision,
  onStartDemo,
  threatLensDemoEnabled,
  pushAlerts,
  pushStatus,
  handlePushAlertsChange,
  pushMessage,
  voiceOtt,
  setVoiceOtt,
  consentBasis,
  setConsentBasis,
  onViewTwin,
}: KnightTabProps) {

  return (
    <div className="tab-content dashboard-knight">
      {/* Visual Animated Agent in compact/mobile mode */}
      <div className="mobile-agent-container">
        <KnightAgentVisual state={state} variant="mobile" />
      </div>

      {/* Bảng điều khiển bảo mật AI Security Cockpit */}
      {(() => {
        const isUpgraded = state.currentState === "audit_complete";
        const cockpitClass = !hasThreatLensConsent ? "ai-cockpit deactivated" : isUpgraded ? "ai-cockpit upgraded" : "ai-cockpit";
        const coreStatus = !hasThreatLensConsent ? "Đã tắt" : isUpgraded ? "Bảo vệ tối đa" : "Đang bảo vệ";
        const responseVal = !hasThreatLensConsent ? "--" : "Tức thì (< 0.25s)";
        const policyLevel = !hasThreatLensConsent ? "Bị tắt" : getThreatLensLevelLabel(threatLensLevelSetting);
        const devicesVal = !hasThreatLensConsent ? "--" : `${getDeviceName()} (Chính chủ)`;
        const logsVal = !hasThreatLensConsent ? "--" : `Đã quét ${state.auditEvents.length} lần`;
        const networkVal = !hasThreatLensConsent ? "--" : "Đường truyền an toàn";
        
        return (
          <div className={cockpitClass}>
            <div className="ai-cockpit-header">
              <span className="ai-cockpit-dot"></span>
              <strong>HỘ VỆ AI GIÁM SÁT AN TOÀN</strong>
            </div>
            <p className="ai-cockpit-desc">
              {!hasThreatLensConsent
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

            {hasThreatLensConsent && (
              <button
                type="button"
                className="view-twin-btn"
                onClick={onViewTwin}
              >
                Xem Bản sao số bảo mật
              </button>
            )}
          </div>
        );
      })()}

      {/* Protection Levels */}
      <ThreatLensPanel
        demoEnabled={threatLensDemoEnabled}
        latestDecision={latestThreatLensDecision}
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
}
