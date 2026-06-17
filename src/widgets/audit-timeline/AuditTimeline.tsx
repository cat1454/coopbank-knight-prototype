import { Clock3, RotateCcw } from "lucide-react";
import type { KnightScenarioState } from "../../domain/types";
import { formatTime } from "../../domain/format";
import { getCustomerVisibleAuditEvents } from "../../domain/audit";
import { PrimaryButton, StatusPill } from "../../shared/ui";

interface AuditTimelineProps {
  state: KnightScenarioState;
  onReset: () => void;
}

export function AuditTimeline({ state, onReset }: AuditTimelineProps) {
  return (
    <section className="screen" aria-labelledby="audit-title">
      <div className="screen-kicker">
        <Clock3 size={18} aria-hidden="true" />
        <span>Audit trail</span>
      </div>
      <h1 id="audit-title">Mọi bước nhạy cảm đều có dấu vết.</h1>
      <p className="screen-lead">Timeline cho thấy action nào do KNIGHT làm, action nào cần khách hoặc Fraud Ops.</p>
      <div className="timeline" aria-label="Audit timeline">
        {getCustomerVisibleAuditEvents(state.auditEvents)
          .map((event) => (
            <article className="timeline-item" key={event.id}>
              <time>{formatTime(event.timestamp)}</time>
              <div>
                <strong>{event.label}</strong>
                <code>{event.action}</code>
                <p>{event.reason}</p>
              </div>
              <StatusPill tone={event.result === "failed" ? "danger" : "success"}>{event.policyLevel}</StatusPill>
            </article>
          ))}
      </div>
      <PrimaryButton icon={<RotateCcw size={18} />} onClick={onReset} variant="secondary">
        Reset
      </PrimaryButton>
    </section>
  );
}
