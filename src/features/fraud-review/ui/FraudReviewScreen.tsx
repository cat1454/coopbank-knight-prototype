import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import { PrimaryButton, StatusPill } from "../../../shared/ui";

interface FraudReviewScreenProps {
  state: KnightScenarioState;
  onConfirmFraud: () => void;
  onConfirmLegitimate: () => void;
}

export function FraudReviewScreen({
  state,
  onConfirmFraud,
  onConfirmLegitimate,
}: FraudReviewScreenProps) {
  return (
    <section className="screen" aria-labelledby="fraud-review-title">
      <div className="screen-kicker">
        <ShieldAlert size={18} aria-hidden="true" />
        <span>Policy L2 reversible action</span>
      </div>
      <h1 id="fraud-review-title">KNIGHT đã tạm khóa thẻ số của bạn.</h1>
      <p className="screen-lead">
        Có giao dịch {formatVnd(state.transaction.amountVnd)} tại {state.transaction.merchantName}. Bạn vẫn kiểm soát
        mọi bước khóa vĩnh viễn.
      </p>

      <div className="risk-score" aria-label={`Risk score ${state.riskAssessment.score}/1000`}>
        <span>{state.riskAssessment.score}/1000</span>
        <strong>Nguy cơ cao</strong>
      </div>

      <div className="signal-list" aria-label="Tín hiệu rủi ro">
        {state.riskAssessment.signals.map((signal) => (
          <article className="signal-item" key={signal.code}>
            <AlertCircle size={17} aria-hidden="true" />
            <div>
              <h2>{signal.label}</h2>
              <p>{signal.customerText}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="status-row">
        <StatusPill tone="warning">Card: Suspended</StatusPill>
        <StatusPill tone="info">Audit đang ghi</StatusPill>
      </div>

      <div className="action-stack">
        <PrimaryButton icon={<ShieldAlert size={18} />} onClick={onConfirmFraud} variant="danger">
          Không phải tôi - Báo gian lận
        </PrimaryButton>
        <PrimaryButton icon={<CheckCircle2 size={18} />} onClick={onConfirmLegitimate} variant="secondary">
          Đây là giao dịch của tôi
        </PrimaryButton>
      </div>
    </section>
  );
}
