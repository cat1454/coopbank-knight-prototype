import { BarChart3, ChevronDown } from "lucide-react";
import type { GuardianRiskDecision } from "../../../domain/types";
import { actionLabel, displayAgentName } from "../model/guardianFlowUi";

export function AgentConsole({
  decision,
  expanded,
  onToggle,
}: {
  decision: GuardianRiskDecision;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="guardian-console-wrap">
      <button type="button" className="guardian-link-button" onClick={onToggle}>
        <BarChart3 size={16} />
        Xem chi tiết phân tích
        <ChevronDown size={16} className={expanded ? "is-open" : ""} />
      </button>
      {expanded && (
        <div className="guardian-agent-console" aria-label="GuardianFlow agent console">
          {decision.agentResults.map((agent) => (
            <article className="guardian-agent-card" key={agent.agentName}>
              <header>
                <span>{displayAgentName(agent.agentName)}</span>
                <strong>{agent.score}</strong>
              </header>
              <div className="guardian-agent-card__bar">
                <span style={{ width: `${agent.score}%` }} />
              </div>
              <p>{agent.reasoning}</p>
            </article>
          ))}
          <article className="guardian-agent-card guardian-agent-card--decision">
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
