import { useState } from "react";
import {
  ArrowLeftRight,
  Award,
  Bot,
  CalendarDays,
  Headphones,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FaceIdGlyph } from "../../features/biometric-step-up/ui/BiometricStepUp";
import { KnightLogoMini } from "../../shared/ui";
import "./BankLoginScreen.css";
import "./BankLoginActions.css";
import "./BankLoginMotion.css";

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
  const [faceIdModalVisible, setFaceIdModalVisible] = useState(false);
  const [faceIdStatus, setFaceIdStatus] = useState<"idle" | "scanning" | "success" | "failed">("idle");
  const [faceIdText, setFaceIdText] = useState("Face ID");
  const qtdndList = ["QTDND Đà Nẵng", "QTDND Thái Bình", "QTDND An Giang", "QTDND Lam Sơn"];

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

  const rotateBranch = () => {
    const currentIndex = qtdndList.indexOf(selectedQtdnd);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % qtdndList.length;
    setSelectedQtdnd(qtdndList[nextIndex]);
  };

  return (
    <section className="screen screen--login" aria-labelledby="login-title">
      <div className="login-art" aria-hidden="true">
        <div className="login-art__scan login-art__scan--one"></div>
        <div className="login-art__scan login-art__scan--two"></div>
        <div className="login-art__cliff">
          <span className="login-art__runner"></span>
        </div>
        <div className="login-art__cloud login-art__cloud--left"></div>
        <div className="login-art__cloud login-art__cloud--right"></div>
        <div className="login-art__island">
          <span></span>
        </div>
      </div>

      <div className="login-hero">
        <KnightLogoMini size={62} className="login-hero__logo" />
        <div className="login-hero__copy">
          <p>An tâm giao dịch,</p>
          <h1 id="login-title">HUYNH PHUOC PHU</h1>
          <button
            type="button"
            className="login-branch-chip"
            onClick={rotateBranch}
            aria-label={`Chi nhánh hiện tại ${selectedQtdnd}`}
          >
            <ShieldCheck size={14} aria-hidden="true" />
            <span>{selectedQtdnd}</span>
          </button>
        </div>
      </div>

      <p className="login-inspiration">
        <span>KNIGHT AI 24/7</span>
        <strong>sẵn sàng</strong>
      </p>

      <div className="login-panel">
        <div className="login-quick-actions" aria-label="Tiện ích nhanh">
          <button type="button" className="login-quick-action">
            <ArrowLeftRight size={30} aria-hidden="true" />
            <span>Chuyển tiền<br />& Thanh toán</span>
          </button>
          <button type="button" className="login-quick-action">
            <QrCode size={30} aria-hidden="true" />
            <span>Quét mã<br />QR</span>
          </button>
          <button type="button" className="login-quick-action">
            <Award size={30} aria-hidden="true" />
            <span>KNIGHT<br />Rewards</span>
          </button>
        </div>

        <div className="login-actions">
          <button type="button" className="login-primary-btn" onClick={onLogin}>
            Đăng nhập
          </button>
          <button type="button" className="login-secondary-btn" onClick={handleBiometricLoginClick}>
            <QrCode size={24} aria-hidden="true" />
            Mã QR cá nhân
          </button>
          <button
            type="button"
            className="biometric-login-btn"
            onClick={handleBiometricLoginClick}
            title="Đăng nhập Face ID"
            aria-label="Đăng nhập Face ID"
          >
            <span className="login-faceid-button-glyph" aria-hidden="true">
              <FaceIdGlyph state="idle" />
            </span>
          </button>
        </div>

        <div className="login-ai-strip" aria-label="Trạng thái bảo vệ AI">
          <Bot size={18} aria-hidden="true" />
          <span>AI đang giám sát giao dịch bất thường</span>
          <Sparkles size={16} aria-hidden="true" />
        </div>
      </div>

      <nav className="login-bottom-nav" aria-label="Tiện ích hỗ trợ">
        <button type="button" className="utility-btn">
          <CalendarDays size={27} aria-hidden="true" />
          <span>Đặt lịch hẹn</span>
        </button>
        <button type="button" className="utility-btn">
          <MapPin size={27} aria-hidden="true" />
          <span>Chi nhánh & ATM</span>
        </button>
        <button type="button" className="utility-btn">
          <Phone size={27} aria-hidden="true" />
          <span>Tổng đài</span>
        </button>
        <button type="button" className="utility-btn">
          <Headphones size={27} aria-hidden="true" />
          <span>Hỗ trợ</span>
        </button>
      </nav>

      <div className="login-home-indicator" aria-hidden="true"></div>

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
