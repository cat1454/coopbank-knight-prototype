import { BarChart3, ChevronDown } from "lucide-react";
import type { ThreatLensRiskDecision } from "../../../domain/types";
import { actionLabel, displayAgentName } from "../model/threatLensUi";

export function AgentConsole({
  decision,
  expanded,
  onToggle,
}: {
  decision: ThreatLensRiskDecision;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="threatlens-console-wrap">
      <button type="button" className="threatlens-link-button" onClick={onToggle}>
        <BarChart3 size={16} />
        Xem chi tiết phân tích
        <ChevronDown size={16} className={expanded ? "is-open" : ""} />
      </button>
      {expanded && (
        <div className="threatlens-agent-console" aria-label="ThreatLens agent console">
          {decision.agentResults.map((agent) => (
            <article className="threatlens-agent-card" key={agent.agentName}>
              <header>
                <span>{displayAgentName(agent.agentName)}</span>
                <strong>{agent.score}</strong>
              </header>
              <div className="threatlens-agent-card__bar">
                <span style={{ width: `${agent.score}%` }} />
              </div>
              <p>{agent.reasoning}</p>
            </article>
          ))}
          <article className="threatlens-agent-card threatlens-agent-card--decision">
            <header>
              <span>Decision</span>
              <strong>{actionLabel(decision.action)}</strong>
            </header>
            <p>{decision.explanation}</p>
          </article>
        </div>
      )}
    </section>
  );
}
