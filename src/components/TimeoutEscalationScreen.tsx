import { ClockAlert, RotateCcw, Loader2 } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface TimeoutEscalationScreenProps {
  state: KnightScenarioState;
  onReset: () => void;
  isProcessing?: boolean;
}

export function TimeoutEscalationScreen({ state, onReset, isProcessing = false }: TimeoutEscalationScreenProps) {
  const fraudCase = state.fraudCase;
  const curState = state.currentState;

  // Determine stage flags
  const isTimeout = curState === "customer_timeout";
  const isSmsSent = curState === "sms_fallback_sent";
  const isEscalated = curState === "fraud_ops_escalated";
  const isComplete = curState === "card_remains_suspended" || !!fraudCase;

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
        {isComplete ? "Timeout branch active" : "Escalation in progress..."}
      </StatusPill>

      <h1 id="timeout-title">
        {isTimeout 
          ? "Đang ứng phó khẩn cấp..." 
          : isSmsSent 
          ? "Đang gửi SMS dự phòng..." 
          : isEscalated 
          ? "Đang chuyển tiếp hồ sơ..." 
          : "Fraud Ops đang xem xét."}
      </h1>

      <p className="screen-lead">
        {isTimeout 
          ? "Đã quá thời gian chờ 5 phút mà khách không phản hồi. KNIGHT bắt đầu luồng xử lý khẩn cấp..."
          : isSmsSent 
          ? "Đang gửi tin nhắn SMS dự phòng đến số điện thoại đăng ký của khách hàng..."
          : isEscalated 
          ? "Đang chuyển tiếp hồ sơ vụ việc sang hàng chờ kiểm duyệt của bộ phận Fraud Ops..."
          : "Khách chưa phản hồi sau 5 phút. KNIGHT đã gửi SMS fallback, chuyển tiếp cho nhân sự kiểm tra, và tiếp tục tạm khóa thẻ số bảo toàn tài sản."}
      </p>

      <div className="timeout-summary">
        <strong>Thẻ vẫn đang tạm khóa</strong>
        
        {fraudCase ? (
          <span>Case: {fraudCase.id}</span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Loader2 className="spin" size={14} /> Đang khởi tạo hồ sơ...
          </span>
        )}
        
        <p>
          {isTimeout 
            ? "Đang kích hoạt quy trình..." 
            : isSmsSent 
            ? "Đã gửi SMS. Đang lập hồ sơ tra soát..." 
            : "Chờ kết quả kiểm duyệt thủ công từ đội ngũ vận hành."}
        </p>
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
