import { ClockAlert, Loader2, RotateCcw } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { PrimaryButton, StatusPill } from "../../../shared/ui";
import "./CardProtection.css";

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

  const isWaiting = currentState === "customer_timeout";
  const isEscalated = currentState === "fraud_ops_escalated";
  const isComplete = currentState === "card_remains_suspended" || Boolean(fraudCase);

  const title = isWaiting
    ? "Hết thời gian chờ phản hồi"
    : isEscalated
      ? "Đang chuyển tiếp Fraud Ops..."
      : "Fraud Ops đang xem xét";

  const lead = isWaiting
    ? "Khách hàng không phản hồi cảnh báo Push. Hệ thống chuẩn bị chuyển hồ sơ sang bộ phận vận hành (Fraud Ops) để kiểm tra."
    : isEscalated
      ? "Hồ sơ giao dịch bất thường đang được chuyển tiếp. Thẻ số tạm thời tiếp tục được khóa để bảo vệ tài khoản."
      : "Hồ sơ đã được gửi đến Fraud Ops để xử lý thủ công. Thẻ vẫn tiếp tục được khóa tạm thời để bảo đảm an toàn.";

  const summaryDetail = isWaiting
    ? "Đang xử lý hồ sơ..."
    : isEscalated
      ? "Đang xếp hàng chờ xử lý..."
      : "Chờ kết quả xét duyệt từ nhân viên Fraud Ops.";

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
        <strong>Thẻ vẫn đang tạm khóa</strong>

        {fraudCase ? (
          <span>Hồ sơ: {fraudCase.id}</span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Loader2 className="spin" size={14} /> Đang cập nhật trạng thái...
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
