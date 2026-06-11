import { CheckCircle2, RotateCcw } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface LegitimateResolutionScreenProps {
  state: KnightScenarioState;
  onShowTimeline: () => void;
  onReset: () => void;
}

export function LegitimateResolutionScreen({ state, onShowTimeline, onReset }: LegitimateResolutionScreenProps) {
  return (
    <section className="screen" aria-labelledby="legit-title">
      <div className="resolution-icon resolution-icon--success" aria-hidden="true">
        <CheckCircle2 size={42} />
      </div>
      <StatusPill tone="success">False positive resolved</StatusPill>
      <h1 id="legit-title">Thẻ đã được mở lại.</h1>
      <p className="screen-lead">
        Cảm ơn bạn đã xác nhận. KNIGHT đã whitelist phiên hiện tại và bật giám sát tăng cường trong 30 phút.
      </p>
      <div className="status-row status-row--wrap">
        <StatusPill tone="success">Card: {state.card.status}</StatusPill>
        <StatusPill tone="info">Session trusted</StatusPill>
        <StatusPill tone="info">30 phút monitoring</StatusPill>
      </div>
      <div className="action-stack">
        <PrimaryButton onClick={onShowTimeline}>Xem timeline</PrimaryButton>
        <PrimaryButton icon={<RotateCcw size={18} />} onClick={onReset} variant="secondary">
          Reset
        </PrimaryButton>
      </div>
    </section>
  );
}
