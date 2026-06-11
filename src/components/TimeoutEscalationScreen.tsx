import { ClockAlert, RotateCcw } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface TimeoutEscalationScreenProps {
  state: KnightScenarioState;
  onReset: () => void;
}

export function TimeoutEscalationScreen({ state, onReset }: TimeoutEscalationScreenProps) {
  const fraudCase = state.fraudCase!;

  return (
    <section className="screen" aria-labelledby="timeout-title">
      <div className="resolution-icon resolution-icon--warning" aria-hidden="true">
        <ClockAlert size={42} />
      </div>
      <StatusPill tone="warning">Timeout branch</StatusPill>
      <h1 id="timeout-title">Fraud Ops đang xem xét.</h1>
      <p className="screen-lead">
        Khách chưa phản hồi sau 5 phút. KNIGHT đã gửi SMS fallback, escalation cho con người, và không khóa vĩnh viễn
        thẻ.
      </p>
      <div className="timeout-summary">
        <strong>Thẻ vẫn đang tạm khóa</strong>
        <span>Case: {fraudCase.id}</span>
        <p>Chargeback hoặc hoàn tiền vẫn thuộc Fraud Ops/Compliance.</p>
      </div>
      <PrimaryButton icon={<RotateCcw size={18} />} onClick={onReset} variant="secondary">
        Reset
      </PrimaryButton>
    </section>
  );
}
