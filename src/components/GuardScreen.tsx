import { Bell, Play, ShieldCheck } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface GuardScreenProps {
  state: KnightScenarioState;
  onStart: () => void;
}

export function GuardScreen({ state, onStart }: GuardScreenProps) {
  return (
    <section className="screen screen--guard" aria-labelledby="guard-title">
      <div className="guard-visual" aria-hidden="true">
        <ShieldCheck size={52} strokeWidth={1.8} />
      </div>
      <StatusPill tone="success">KNIGHT đang bảo vệ thẻ số</StatusPill>
      <h1 id="guard-title">Co-opBank luôn canh gác các giao dịch bất thường.</h1>
      <p>
        Demo bắt đầu lúc 02:00 với giao dịch {formatVnd(state.transaction.amountVnd)} tại{" "}
        {state.transaction.merchantName}.
      </p>
      <div className="signal-strip" aria-label="Tín hiệu demo">
        <span>Risk score {state.riskAssessment.score}/1000</span>
        <span>{state.riskAssessment.signals.length} tín hiệu</span>
        <span>Mock data</span>
      </div>
      <PrimaryButton icon={<Play size={18} />} onClick={onStart}>
        Bắt đầu
      </PrimaryButton>
      <p className="microcopy">
        <Bell size={14} aria-hidden="true" /> Không dùng push thật, Face ID thật hoặc API ngân hàng thật.
      </p>
    </section>
  );
}
