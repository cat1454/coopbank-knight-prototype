import { ClockAlert, Loader2, RotateCcw } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface TimeoutEscalationScreenProps {
  state: KnightScenarioState;
  onReset: () => void;
  isProcessing?: boolean;
}

export function TimeoutEscalationScreen({
  state,
  onReset,
  isProcessing = false,
}: TimeoutEscalationScreenProps) {
  const fraudCase = state.fraudCase;
  const currentState = state.currentState;

  const isWaitingToCall = currentState === "customer_timeout";
  const isCalling = currentState === "voice_call_placed";
  const isNoAnswer = currentState === "voice_call_no_answer";
  const isSmsSent = currentState === "sms_fallback_sent";
  const isEscalated = currentState === "fraud_ops_escalated";
  const isComplete = currentState === "card_remains_suspended" || Boolean(fraudCase);

  const title = isWaitingToCall
    ? "Dang goi dien khan cap..."
    : isCalling
      ? "KNIGHT dang goi tu dong..."
      : isNoAnswer
        ? "Khach chua bat may."
        : isSmsSent
          ? "Da gui SMS du phong."
          : isEscalated
            ? "Dang chuyen Fraud Ops."
            : "Fraud Ops dang xem xet.";

  const lead = isWaitingToCall
    ? "Sau 5 giay chua co phan hoi tu Web Push, KNIGHT chuan bi goi dien tu dong den so dien thoai da dang ky."
    : isCalling
      ? "Cuoc goi canh bao dang duoc thuc hien. The so van tam khoa trong khi cho khach xac minh."
      : isNoAnswer
        ? "Cuoc goi khong duoc tra loi, vi vay SMS du phong moi duoc phep gui."
        : isSmsSent
          ? "SMS da duoc gui de huong dan khach mo ung dung Co-opBank va xac minh giao dich."
          : isEscalated
            ? "Ho so dang duoc dua vao hang cho cua Fraud Ops. KNIGHT khong tu dong khoa vinh vien the."
            : "Khach chua phan hoi sau Web Push, cuoc goi va SMS. The van tam khoa de bao ve tai san.";

  const summaryDetail = isWaitingToCall
    ? "Cho bo dem 5 giay..."
    : isCalling
      ? "Dang do chuong cuoc goi..."
      : isNoAnswer
        ? "Cho gui SMS du phong..."
        : isSmsSent
          ? "Da gui SMS, dang tao ho so tra soat..."
          : "Cho ket qua kiem duyet thu cong tu doi ngu van hanh.";

  return (
    <section className="screen" aria-labelledby="timeout-title">
      <div
        className={`resolution-icon ${isComplete ? "resolution-icon--warning" : ""}`}
        style={!isComplete ? { background: "var(--color-warning-soft)", color: "var(--color-warning)" } : undefined}
        aria-hidden="true"
      >
        {isComplete ? <ClockAlert size={42} /> : <Loader2 className="spin" size={42} />}
      </div>

      <StatusPill tone="warning">
        {isComplete ? "Timeout branch active" : "Escalation in progress"}
      </StatusPill>

      <h1 id="timeout-title">{title}</h1>

      <p className="screen-lead">{lead}</p>

      <div className="timeout-summary">
        <strong>The van dang tam khoa</strong>

        {fraudCase ? (
          <span>Case: {fraudCase.id}</span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Loader2 className="spin" size={14} /> Dang cap nhat trang thai...
          </span>
        )}

        <p>{summaryDetail}</p>
      </div>

      <PrimaryButton
        icon={<RotateCcw size={18} />}
        onClick={onReset}
        variant="secondary"
        disabled={isProcessing && !isComplete}
      >
        Reset
      </PrimaryButton>
    </section>
  );
}
