import { ArrowRight, BrainCircuit, ShieldCheck } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import { PrimaryButton, StatusPill } from "../../../shared/ui";

interface TrustRecoveryAssessmentScreenProps {
  state: KnightScenarioState;
  onActivatePackage: () => void;
}

export function TrustRecoveryAssessmentScreen({
  state,
  onActivatePackage,
}: TrustRecoveryAssessmentScreenProps) {
  const assessment = state.trustRecoveryAssessment!;

  return (
    <section className="screen screen--assessment" aria-labelledby="assessment-title">
      <div className="screen-kicker">
        <BrainCircuit size={18} aria-hidden="true" />
        <span>[ANALYSIS] Trust Recovery Need Score</span>
      </div>

      <h1 id="assessment-title">Điểm nhu cầu phục hồi: {assessment.score}/100</h1>
      <p className="screen-lead">{assessment.explanation}</p>

      <div className="trust-score-panel">
        <div>
          <span>Điểm hiện tại</span>
          <strong>{assessment.score}</strong>
        </div>
        <div>
          <span>Ngưỡng kích hoạt</span>
          <strong>{assessment.threshold}</strong>
        </div>
        <StatusPill tone="success">Nhu cầu hỗ trợ cao</StatusPill>
      </div>

      <div className="reasoning-breakdown" aria-label="Giải thích điểm nhu cầu phục hồi">
        {assessment.signals.map((signal) => (
          <div key={signal.id}>
            <span>{signal.label}</span>
            <strong>+{signal.weight}</strong>
          </div>
        ))}
      </div>

      {assessment.essentialSpendingCategories?.length ? (
        <div className="essential-context">
          <strong>[REASONING] Nhu cầu chi tiêu thực tế</strong>
          {assessment.essentialSpendingCategories.map((category) => (
            <div key={category.id}>
              <span>{category.label}</span>
              <span>{category.usagePattern}</span>
              <strong>{formatVnd(category.amountVnd)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="reasoning-note">Không dùng lịch sử chi tiêu vì khách hàng chưa bật cá nhân hóa.</p>
      )}

      <div className="decision-panel">
        <StatusPill tone="info">[DECISION]</StatusPill>
        <p>
          Điểm vượt ngưỡng. Kích hoạt hỗ trợ an toàn phù hợp sau sự cố; đây không phải chương trình khuyến mãi đại trà.
        </p>
      </div>

      <PrimaryButton icon={<ArrowRight size={18} />} onClick={onActivatePackage}>
        Kích hoạt Gói Phục Hồi An Tâm
      </PrimaryButton>

      <div className="security-footnote">
        <ShieldCheck size={15} aria-hidden="true" />
        Gói chỉ được kích hoạt sau khi tài khoản đã an toàn.
      </div>
    </section>
  );
}
