import { useState } from "react";
import { Lock, QrCode, ScanFace } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";
import { FaceIdGlyph } from "./BiometricStepUp";

interface BankLoginScreenProps {
  onLogin: () => void;
  selectedQtdnd: string;
  setSelectedQtdnd: (val: string) => void;
}

export function BankLoginScreen({
  onLogin,
  selectedQtdnd,
  setSelectedQtdnd,
}: BankLoginScreenProps) {
  const [password, setPassword] = useState("");
  const [faceIdModalVisible, setFaceIdModalVisible] = useState(false);
  const [faceIdStatus, setFaceIdStatus] = useState<"idle" | "scanning" | "success" | "failed">("idle");
  const [faceIdText, setFaceIdText] = useState("Face ID");

  const qtdndList = [
    "QTDND Đà Nẵng",
    "QTDND Thái Bình",
    "QTDND An Giang",
    "QTDND Lam Sơn",
    "QTDND Nghệ An",
    "QTDND Đồng Tháp",
  ];

  const handleBiometricLoginClick = () => {
    setFaceIdModalVisible(true);
    setFaceIdStatus("scanning");
    setFaceIdText("Đang nhận dạng khuôn mặt...");

    // Stage 1: Match database
    setTimeout(() => {
      setFaceIdStatus("scanning");
      setFaceIdText("Đối chiếu dữ liệu sinh trắc...");
    }, 750);

    // Stage 2: Verified Success
    setTimeout(() => {
      setFaceIdStatus("success");
      setFaceIdText("Xác thực thành công");
    }, 1500);

    // Stage 3: Close modal and log in
    setTimeout(() => {
      setFaceIdModalVisible(false);
      onLogin();
    }, 2250);
  };

  return (
    <section className="screen screen--login" aria-labelledby="login-title">
      <div className="login-banner">
        <div className="login-banner__overlay"></div>
        <div className="login-banner__content">
          <div className="qtdnd-logo" aria-label="Branch Logo">
            <span className="qtdnd-logo__icon">🏦</span>
            <strong className="qtdnd-logo__text">{selectedQtdnd}</strong>
          </div>
          <h1 id="login-title">Co-opBank KNIGHT</h1>
          <h2 className="login-banner__desc">Hiệp sĩ số bảo vệ thẻ giao dịch tự động bằng Agentic AI và cá nhân hóa trải nghiệm khôi phục</h2>
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
            onClick={handleBiometricLoginClick}
            title="Đăng nhập Face ID"
            aria-label="Đăng nhập Face ID"
          >
            <ScanFace size={28} />
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

      {faceIdModalVisible && (
        <div className="ios-faceid-modal-backdrop" onClick={() => setFaceIdModalVisible(false)}>
          <div className="ios-faceid-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ios-faceid-modal__glyph-wrapper">
              <FaceIdGlyph state={faceIdStatus} />
            </div>
            <p className="ios-faceid-modal__status">{faceIdText}</p>
          </div>
        </div>
      )}
    </section>
  );
}
