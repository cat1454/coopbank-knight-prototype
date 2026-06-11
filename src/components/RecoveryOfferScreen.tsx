import { Gift, ShieldCheck } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface RecoveryOfferScreenProps {
  state: KnightScenarioState;
  onShowTimeline: () => void;
}

export function RecoveryOfferScreen({ state, onShowTimeline }: RecoveryOfferScreenProps) {
  const offer = state.recoveryOffer!;

  return (
    <section className="screen" aria-labelledby="recovery-title">
      <div className="screen-kicker">
        <Gift size={18} aria-hidden="true" />
        <span>Consent-based personalization</span>
      </div>
      <h1 id="recovery-title">{offer.title}</h1>
      <p className="screen-lead">{offer.body}</p>
      <div className="offer-panel">
        <strong>5% cashback</strong>
        <span>90 ngày</span>
        <p>Dựa trên danh mục chi tiêu đã được bạn cho phép cá nhân hóa. Bạn có thể để sau.</p>
      </div>
      <div className="action-stack">
        <PrimaryButton icon={<ShieldCheck size={18} />} onClick={onShowTimeline}>
          Xem timeline
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={onShowTimeline}>
          Để sau
        </PrimaryButton>
      </div>
      <StatusPill tone="info">Không hứa hoàn tiền ngay</StatusPill>
    </section>
  );
}
