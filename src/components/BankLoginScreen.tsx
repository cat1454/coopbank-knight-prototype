import { useState } from "react";
import { Lock, Fingerprint, QrCode, ShieldAlert } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

interface BankLoginScreenProps {
  onLogin: () => void;
  onStartDemo: () => void;
  selectedQtdnd: string;
  setSelectedQtdnd: (val: string) => void;
}

export function BankLoginScreen({
  onLogin,
  onStartDemo,
  selectedQtdnd,
  setSelectedQtdnd,
}: BankLoginScreenProps) {
  const [password, setPassword] = useState("");

  const qtdndList = [
    "QTDND Đà Nẵng",
    "QTDND Thái Bình",
    "QTDND An Giang",
    "QTDND Lam Sơn",
    "QTDND Nghệ An",
    "QTDND Đồng Tháp",
  ];

  return (
    <section className="screen screen--login" aria-labelledby="login-title">
      <div className="login-banner">
        <div className="login-banner__overlay"></div>
        <div className="login-banner__content">
          <div className="qtdnd-logo" aria-label="Branch Logo">
            <span className="qtdnd-logo__icon">🏦</span>
            <strong className="qtdnd-logo__text">{selectedQtdnd}</strong>
          </div>
          <h1 id="login-title">Co-opBank Mobile</h1>
          <h2 className="login-banner__desc">Co-opBank luôn canh gác các giao dịch bất thường.</h2>
        </div>
      </div>

      <div className="login-form">
        <div className="form-group">
          <label htmlFor="qtdnd-select" className="form-label">Chi nhánh QTDND</label>
          <select
            id="qtdnd-select"
            value={selectedQtdnd}
            onChange={(e) => setSelectedQtdnd(e.target.value)}
            className="form-control"
          >
            {qtdndList.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="password-input" className="form-label">Mật khẩu</label>
          <div className="input-with-icon">
            <Lock size={16} className="input-icon" />
            <input
              id="password-input"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
            />
          </div>
        </div>

        <div className="login-actions">
          <PrimaryButton onClick={onLogin}>Đăng nhập</PrimaryButton>
          <button
            type="button"
            className="biometric-login-btn"
            onClick={onLogin}
            title="Đăng nhập Face ID"
            aria-label="Đăng nhập Face ID"
          >
            <Fingerprint size={28} />
          </button>
        </div>
      </div>

      <div className="quick-utilities">
        <button type="button" className="utility-btn">
          <QrCode size={18} />
          <span>QR Pay</span>
        </button>
        <button type="button" className="utility-btn">
          <QrCode size={18} />
          <span>QR của tôi</span>
        </button>
      </div>

      <div className="demo-trigger-card">
        <div className="demo-trigger-card__title">
          <ShieldAlert size={14} className="demo-shield-icon" />
          <span>Mô phỏng Sự cố AI</span>
        </div>
        <p className="demo-trigger-card__desc">
          Bắt đầu demo bảo vệ giao dịch rủi ro lúc 02:00 sáng khi khách đang ngủ.
        </p>
        <PrimaryButton icon={<ShieldAlert size={16} />} onClick={onStartDemo} variant="danger">
          Bắt đầu
        </PrimaryButton>
      </div>
    </section>
  );
}
