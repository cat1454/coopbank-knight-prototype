import { ArrowRight, FileCheck2, ShieldCheck } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import { PrimaryButton, StatusPill } from "../../../shared/ui";

interface FraudCaseSubmittedScreenProps {
  state: KnightScenarioState;
  onOpenNextMorning: () => void;
}

export function FraudCaseSubmittedScreen({ state, onOpenNextMorning }: FraudCaseSubmittedScreenProps) {
  const fraudCase = state.fraudCase!;
  const newCard = state.newCard!;

  return (
    <section className="screen screen--case" aria-labelledby="fraud-case-title">
      <div className="screen-kicker">
        <FileCheck2 size={18} aria-hidden="true" />
        <span>Hồ sơ tra soát</span>
      </div>

      <div className="resolution-icon resolution-icon--success">
        <ShieldCheck size={42} aria-hidden="true" />
      </div>

      <h1 id="fraud-case-title">Hồ sơ tra soát đã gửi</h1>
      <p className="screen-lead">
        KNIGHT đã khóa thẻ cũ, phát hành thẻ số mới và gửi hồ sơ sang Fraud Ops để bảo vệ quyền lợi của bạn.
      </p>

      <div className="case-detail-panel">
        <div>
          <span>Mã hồ sơ</span>
          <strong>{fraudCase.id}</strong>
        </div>
        <div>
          <span>Số tiền tra soát</span>
          <strong>{formatVnd(fraudCase.amountVnd)}</strong>
        </div>
        <div>
          <span>Dự kiến xử lý</span>
          <strong>{fraudCase.expectedReviewWindow}</strong>
        </div>
        <div>
          <span>Thẻ số mới</span>
          <strong>{newCard.maskedPan}</strong>
        </div>
      </div>

      <div className="status-row status-row--wrap">
        <StatusPill tone="success">Old card terminated</StatusPill>
        <StatusPill tone="success">New card issued</StatusPill>
        <StatusPill tone="success">Fraud case created</StatusPill>
      </div>

      <PrimaryButton icon={<ArrowRight size={18} />} onClick={onOpenNextMorning}>
        Chuyển sang sáng hôm sau
      </PrimaryButton>
    </section>
  );
}
