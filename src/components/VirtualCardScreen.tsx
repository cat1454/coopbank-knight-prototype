import { CreditCard, FileCheck2, ShieldCheck } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface VirtualCardScreenProps {
  state: KnightScenarioState;
  onShowOffer: () => void;
}

export function VirtualCardScreen({ state, onShowOffer }: VirtualCardScreenProps) {
  const newCard = state.newCard;
  const fraudCase = state.fraudCase;

  return (
    <section className="screen" aria-labelledby="virtual-card-title">
      <div className="screen-kicker">
        <CreditCard size={18} aria-hidden="true" />
        <span>Resolution</span>
      </div>
      <h1 id="virtual-card-title">Thẻ số mới đã sẵn sàng.</h1>
      <p className="screen-lead">
        Thẻ cũ đã khóa vĩnh viễn sau Face ID. Case fraud đang chờ Fraud Ops xem xét hoàn tiền.
      </p>

      <div className="virtual-card" aria-label="Demo virtual card">
        <span>Co-opBank</span>
        <strong>{newCard!.maskedPan}</strong>
        <small>Demo card - Active</small>
      </div>

      <div className="case-summary">
        <FileCheck2 size={18} aria-hidden="true" />
        <div>
          <span>Case ID</span>
          <strong>{fraudCase!.id}</strong>
          <p>{formatVnd(state.transaction.amountVnd)} đang được review trong 3-5 ngày làm việc.</p>
        </div>
      </div>

      <div className="status-row status-row--wrap">
        <StatusPill tone="success">Old card terminated</StatusPill>
        <StatusPill tone="success">New card issued</StatusPill>
        <StatusPill tone="info">Fraud case created</StatusPill>
      </div>

      <PrimaryButton icon={<ShieldCheck size={18} />} onClick={onShowOffer}>
        Xem ưu đãi
      </PrimaryButton>
    </section>
  );
}
