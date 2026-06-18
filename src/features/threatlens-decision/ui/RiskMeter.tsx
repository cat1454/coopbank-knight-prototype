import { scoreTone } from "../model/threatLensUi";

export function RiskMeter({ score }: { score: number }) {
  const tone = scoreTone(score);

  return (
    <div className={`threatlens-risk-meter threatlens-risk-meter--${tone}`} aria-label={`Risk score ${score}/100`}>
      <div className="threatlens-risk-meter__track">
        <span style={{ width: `${score}%` }} />
      </div>
      <strong>{score}/100</strong>
    </div>
  );
}
