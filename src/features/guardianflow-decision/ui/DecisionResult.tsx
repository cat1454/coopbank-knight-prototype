import { AlertTriangle, CheckCircle2, Clock, LockKeyhole } from "lucide-react";
import { getGuardianReasonText } from "../../../domain/guardianFlow";
import type { GuardianRiskDecision } from "../../../domain/types";
import { PrimaryButton } from "../../../shared/ui";
import { aiLevelLabel } from "../model/guardianFlowUi";
import { AgentConsole } from "./AgentConsole";
import { RiskMeter } from "./RiskMeter";

function ReasonList({ decision }: { decision: GuardianRiskDecision }) {
  return (
    <div className="guardian-reasons">
      {decision.reasonCodes.slice(0, 5).map((code) => (
        <span className="guardian-reason" key={code}>
          {getGuardianReasonText(code)}
        </span>
      ))}
    </div>
  );
}

function DecisionMeta({ decision }: { decision: GuardianRiskDecision }) {
  return (
    <div className="guardian-reasons">
      <span className="guardian-reason">AI level: {aiLevelLabel(decision.aiLevel)}</span>
      <span className="guardian-reason">Policy: {decision.policyLevel}</span>
      <span className="guardian-reason">Source: {decision.source}</span>
    </div>
  );
}

export function DecisionResult({
  decision,
  detailedMode,
  isConsoleOpen,
  onToggleConsole,
  onEscalateToKnight,
}: {
  decision: GuardianRiskDecision;
  detailedMode: boolean;
  isConsoleOpen: boolean;
  onToggleConsole: () => void;
  onEscalateToKnight: () => void;
}) {
  if (decision.action === "allow") {
    return (
      <article className="guardian-result guardian-result--safe">
        <CheckCircle2 size={22} />
        <h3>Giao dịch an toàn</h3>
        <RiskMeter score={decision.riskScore} />
        <DecisionMeta decision={decision} />
        <p>{decision.explanation}</p>
        {detailedMode && <AgentConsole decision={decision} expanded={isConsoleOpen} onToggle={onToggleConsole} />}
      </article>
    );
  }

  if (decision.action === "warn") {
    return (
      <article className="guardian-result guardian-result--warn">
        <AlertTriangle size={22} />
        <h3>Cảnh báo giao dịch</h3>
        <RiskMeter score={decision.riskScore} />
        <DecisionMeta decision={decision} />
        <p>{decision.explanation}</p>
        <ReasonList decision={decision} />
        {detailedMode && <AgentConsole decision={decision} expanded={isConsoleOpen} onToggle={onToggleConsole} />}
      </article>
    );
  }

  if (decision.action === "delay" || decision.action === "step_up") {
    return (
      <article className="guardian-result guardian-result--delay">
        <Clock size={22} />
        <h3>KNIGHT cần xác thực bổ sung</h3>
        <RiskMeter score={decision.riskScore} />
        <DecisionMeta decision={decision} />
        <p>{decision.explanation}</p>
        <ReasonList decision={decision} />
        {detailedMode && <AgentConsole decision={decision} expanded={isConsoleOpen} onToggle={onToggleConsole} />}
      </article>
    );
  }

  return (
    <article className="guardian-result guardian-result--critical">
      <LockKeyhole size={22} />
      <h3>Giao dịch tạm thời bị giữ lại</h3>
      <RiskMeter score={decision.riskScore} />
      <DecisionMeta decision={decision} />
      <ReasonList decision={decision} />
      <p>{decision.explanation}</p>
      <p className="guardian-reference">Mã tham chiếu: {decision.transactionId}</p>
      <div className="guardian-actions">
        <a className="guardian-call-link" href="tel:19001234">Liên hệ ngân hàng</a>
        <PrimaryButton onClick={onEscalateToKnight}>Mở luồng xác minh KNIGHT</PrimaryButton>
      </div>
      {detailedMode && <AgentConsole decision={decision} expanded={isConsoleOpen} onToggle={onToggleConsole} />}
    </article>
  );
}
