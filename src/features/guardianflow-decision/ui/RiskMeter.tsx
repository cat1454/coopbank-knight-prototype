import { scoreTone } from "../model/guardianFlowUi";

export function RiskMeter({ score }: { score: number }) {
  const tone = scoreTone(score);

  return (
    <div className={`guardian-risk-meter guardian-risk-meter--${tone}`} aria-label={`Risk score ${score}/100`}>
      <div className="guardian-risk-meter__track">
        <span style={{ width: `${score}%` }} />
      </div>
      <strong>{score}/100</strong>
    </div>
  );
}
