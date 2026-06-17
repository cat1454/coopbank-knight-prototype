import { CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { PrimaryButton, StatusPill } from "../../../shared/ui";

interface LegitimateResolutionScreenProps {
  state: KnightScenarioState;
  onShowTimeline: () => void;
  onReset: () => void;
  isProcessing?: boolean;
}

export function LegitimateResolutionScreen({
  state,
  onShowTimeline,
  onReset,
  isProcessing = false,
}: LegitimateResolutionScreenProps) {
  const curState = state.currentState;

  // Determine stage flags
  const isBiometricVerified = curState === "biometric_verified";
  const isCardUnsuspended = curState === "card_unsuspended";
  const isWhitelisted = curState === "device_session_whitelisted";
  const isComplete = curState === "enhanced_monitoring_30m";

  return (
    <section className="screen" aria-labelledby="legit-title">
      <div 
        className={`resolution-icon ${isComplete ? "resolution-icon--success" : ""}`} 
        style={!isComplete ? { background: "var(--color-info-soft)", color: "var(--color-primary)" } : undefined}
        aria-hidden="true"
      >
        {isComplete ? <CheckCircle2 size={42} /> : <Loader2 className="spin" size={42} />}
      </div>

      <StatusPill tone={isComplete ? "success" : "info"}>
        {isComplete ? "False positive resolved" : "Processing policies..."}
      </StatusPill>

      <h1 id="legit-title">
        {isBiometricVerified 
          ? "Đang mở khóa thẻ..." 
          : isCardUnsuspended 
          ? "Đang thiết lập phiên..." 
          : isWhitelisted 
          ? "Đang khởi tạo giám sát..." 
          : "Thẻ đã được mở lại."}
      </h1>

      <p className="screen-lead">
        {isBiometricVerified 
          ? "Danh tính đã được xác thực bằng Face ID. KNIGHT đang gửi tín hiệu kích hoạt lại thẻ số."
          : isCardUnsuspended 
          ? "Thẻ đã hoạt động trở lại. KNIGHT đang đưa phiên thiết bị hiện tại vào danh sách tin cậy (Whitelist)."
          : isWhitelisted 
          ? "Đã tin cậy thiết bị. KNIGHT đang thiết lập bộ giám sát tăng cường thời gian thực."
          : "Cảm ơn bạn đã xác nhận. KNIGHT đã whitelist phiên hiện tại và bật giám sát tăng cường trong 30 phút."}
      </p>

      <div className="status-row status-row--wrap">
        <StatusPill tone={isBiometricVerified ? "warning" : "success"}>
          {isBiometricVerified ? "Card: opening..." : `Card: ${state.card.status}`}
        </StatusPill>
        <StatusPill tone={isComplete ? "success" : (isWhitelisted || isCardUnsuspended) ? "warning" : "info"}>
          {isComplete ? "Session trusted" : (isWhitelisted || isCardUnsuspended) ? "Session whitelisting..." : "Session: pending"}
        </StatusPill>
        <StatusPill tone={isComplete ? "success" : isWhitelisted ? "warning" : "info"}>
          {isComplete ? "30m monitoring active" : isWhitelisted ? "Starting monitoring..." : "Monitoring: pending"}
        </StatusPill>
      </div>

      <div className="action-stack">
        <PrimaryButton onClick={onShowTimeline} disabled={isProcessing || !isComplete}>
          Xem timeline
        </PrimaryButton>
        <PrimaryButton 
          icon={<RotateCcw size={18} />} 
          onClick={onReset} 
          variant="secondary"
          disabled={isProcessing && !isComplete}
        >
          Reset
        </PrimaryButton>
      </div>
    </section>
  );
}
