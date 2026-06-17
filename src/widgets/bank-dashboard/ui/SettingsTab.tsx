
import type { Dispatch, SetStateAction } from "react";

interface SettingsTabProps {
  voiceOtt: boolean;
  setVoiceOtt: Dispatch<SetStateAction<boolean>>;
  biometricAuth: boolean;
  setBiometricAuth: Dispatch<SetStateAction<boolean>>;
  consentBasis: boolean;
  setConsentBasis: Dispatch<SetStateAction<boolean>>;
}

export function SettingsTab({
  voiceOtt,
  setVoiceOtt,
  biometricAuth,
  setBiometricAuth,
  consentBasis,
  setConsentBasis,
}: SettingsTabProps) {
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
}
