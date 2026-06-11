import { CreditCard, FileCheck2, ShieldCheck, Loader2 } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface VirtualCardScreenProps {
  state: KnightScenarioState;
  onShowOffer: () => void;
  isProcessing?: boolean;
}

export function VirtualCardScreen({ state, onShowOffer, isProcessing = false }: VirtualCardScreenProps) {
  const newCard = state.newCard;
  const fraudCase = state.fraudCase;
  const curState = state.currentState;

  // Determine stage flags
  const isTerminatedOnly = curState === "card_terminated_l3";
  const isIssuedOnly = curState === "new_card_issued";
  const isCaseCreated = curState === "fraud_case_created" || !!fraudCase;

  return (
    <section className="screen" aria-labelledby="virtual-card-title">
      <div className="screen-kicker">
        <CreditCard size={18} aria-hidden="true" />
        <span>Resolution</span>
      </div>

      <h1 id="virtual-card-title">
        {isTerminatedOnly ? "Đang xử lý thu hồi thẻ..." : isIssuedOnly ? "Đang cấp lại thẻ số..." : "Thẻ số mới đã sẵn sàng."}
      </h1>
      <p className="screen-lead">
        {isTerminatedOnly 
          ? "Đã xác nhận Face ID. Đang tiến hành hủy vĩnh viễn thẻ bị lộ thông tin trên hệ thống..." 
          : isIssuedOnly 
          ? "Thẻ cũ đã hủy. Hệ thống đang tạo lập thẻ ảo mới thay thế..." 
          : "Thẻ cũ đã khóa vĩnh viễn sau Face ID. Case fraud đang chờ Fraud Ops xem xét hoàn tiền."}
      </p>

      {/* Card Display */}
      {newCard ? (
        <div className="virtual-card" aria-label="Demo virtual card">
          <span>Co-opBank</span>
          <strong>{newCard.maskedPan}</strong>
          <small>Demo card - Active</small>
        </div>
      ) : (
        <div className="virtual-card" style={{ background: "linear-gradient(135deg, #475467 0%, #1d2939 100%)", opacity: 0.7 }} aria-label="Card under replacement">
          <span>Co-opBank</span>
          <strong style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Loader2 className="spin" size={20} /> Đang tạo thẻ mới...
          </strong>
          <small>Thẻ cũ đang hủy...</small>
        </div>
      )}

      {/* Case Summary Display */}
      {fraudCase ? (
        <div className="case-summary">
          <FileCheck2 size={18} aria-hidden="true" />
          <div>
            <span>Case ID</span>
            <strong>{fraudCase.id}</strong>
            <p>{formatVnd(state.transaction.amountVnd)} đang được review trong 3-5 ngày làm việc.</p>
          </div>
        </div>
      ) : (
        <div className="case-summary" style={{ borderStyle: "dashed", opacity: 0.6 }}>
          <Loader2 className="spin" size={18} style={{ color: "var(--color-muted)" }} />
          <div>
            <span>Hồ sơ tra soát</span>
            <strong>Đang khởi tạo...</strong>
            <p>Đang chuẩn bị dữ liệu giao dịch bất thường gửi phòng nghiệp vụ.</p>
          </div>
        </div>
      )}

      {/* Status Pills */}
      <div className="status-row status-row--wrap">
        <StatusPill tone="success">Old card terminated</StatusPill>
        <StatusPill tone={isTerminatedOnly ? "info" : "success"}>
          {isTerminatedOnly ? "Issuing card..." : "New card issued"}
        </StatusPill>
        <StatusPill tone={isCaseCreated ? "success" : "info"}>
          {isCaseCreated ? "Fraud case created" : "Creating case..."}
        </StatusPill>
      </div>

      <PrimaryButton 
        icon={isProcessing && !isCaseCreated ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />} 
        onClick={onShowOffer}
        disabled={isProcessing || !isCaseCreated}
      >
        {isProcessing && !isCaseCreated ? "Đang xử lý..." : "Xem ưu đãi"}
      </PrimaryButton>
    </section>
  );
}
