import { Activity, ArrowRight, ShieldCheck } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { formatTime } from "../../../domain/format";
import { PrimaryButton, StatusPill } from "../../../shared/ui";

interface PostIncidentBehaviorScreenProps {
  state: KnightScenarioState;
  onAssessTrustRecovery: () => void;
}

export function PostIncidentBehaviorScreen({
  state,
  onAssessTrustRecovery,
}: PostIncidentBehaviorScreenProps) {
  const signals = state.postIncidentBehaviorSignals!;

  return (
    <section className="screen screen--behavior" aria-labelledby="behavior-title">
      <div className="screen-kicker">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>[GOAL] Tài khoản đã được bảo vệ</span>
      </div>

      <h1 id="behavior-title">[OBSERVE] Hành vi sau sự cố</h1>
      <p className="screen-lead">
        KNIGHT chỉ đánh giá nhu cầu hỗ trợ sau khi thẻ cũ đã khóa, thẻ mới hoạt động và hồ sơ tra soát đã được tạo.
      </p>

      <div className="behavior-signal-list" aria-label="Tín hiệu hành vi sau sự cố">
        {signals.map((signal) => (
          <article className="behavior-signal" key={signal.id}>
            <Activity size={17} aria-hidden="true" />
            <div>
              <strong>{signal.label}</strong>
              <span>{signal.evidence}</span>
            </div>
            <time>{formatTime(signal.observedAt)}</time>
            <StatusPill tone="info">{signal.occurrenceCount} lần</StatusPill>
          </article>
        ))}
      </div>

      <p className="reasoning-note">
        AI suy luận từ tín hiệu có thể kiểm chứng, không khẳng định đang “đọc” cảm xúc của khách hàng.
      </p>

      <PrimaryButton icon={<ArrowRight size={18} />} onClick={onAssessTrustRecovery}>
        Đánh giá nhu cầu phục hồi niềm tin
      </PrimaryButton>
    </section>
  );
}
