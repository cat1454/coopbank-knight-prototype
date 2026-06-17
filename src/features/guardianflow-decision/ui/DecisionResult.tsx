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
  const getPolicyLabel = (policy: string) => {
    const lower = policy.toLowerCase();
    if (lower.includes("l2")) return "Tự động khóa thẻ";
    if (lower.includes("l3")) return "Khóa thẻ & Chặn GD lạ";
    return policy;
  };

  return (
    <div className="guardian-reasons">
      <span className="guardian-reason">Hệ thống AI: {aiLevelLabel(decision.aiLevel)}</span>
      <span className="guardian-reason">Cách xử lý: {getPolicyLabel(decision.policyLevel)}</span>
      <span className="guardian-reason">Đơn vị quét: {decision.source}</span>
    </div>
  );
}

export function DecisionResult({
  decision,
  detailedMode,
  isConsoleOpen,
  onToggleConsole,
  onEscalateToKnight,
  onStartHumanReview,
}: {
  decision: GuardianRiskDecision;
  detailedMode: boolean;
  isConsoleOpen: boolean;
  onToggleConsole: () => void;
  onEscalateToKnight: () => void;
  onStartHumanReview?: () => void;
}) {
  if (decision.action === "allow") {
    return (
      <article className="guardian-result guardian-result--safe">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={22} style={{ color: "var(--color-success)" }} />
          <h3 style={{ margin: 0 }}>Giao dịch an toàn</h3>
        </div>
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={22} style={{ color: "var(--color-amber)" }} />
          <h3 style={{ margin: 0 }}>Cảnh báo giao dịch</h3>
        </div>
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={22} style={{ color: "var(--color-trust)" }} />
          <h3 style={{ margin: 0 }}>KNIGHT cần xác thực bổ sung</h3>
        </div>
        <RiskMeter score={decision.riskScore} />
        <DecisionMeta decision={decision} />
        <p>{decision.explanation}</p>
        <ReasonList decision={decision} />
        {onStartHumanReview && (
          <div className="guardian-actions" style={{ marginTop: "12px" }}>
            <PrimaryButton onClick={onStartHumanReview} variant="secondary">
              Gặp tổng đài viên (Human Review)
            </PrimaryButton>
          </div>
        )}
        {detailedMode && <AgentConsole decision={decision} expanded={isConsoleOpen} onToggle={onToggleConsole} />}
      </article>
    );
  }

  return (
    <article className="guardian-result guardian-result--critical">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <LockKeyhole size={22} style={{ color: "var(--color-fraud)" }} />
        <h3 style={{ margin: 0 }}>Giao dịch tạm thời bị giữ lại</h3>
      </div>
      <RiskMeter score={decision.riskScore} />
      <DecisionMeta decision={decision} />
      <ReasonList decision={decision} />
      <p>{decision.explanation}</p>
      <p className="guardian-reference">Mã tham chiếu: {decision.transactionId}</p>
      <div className="guardian-actions" style={{ display: "grid", gap: "8px", width: "100%" }}>
        <PrimaryButton onClick={onEscalateToKnight}>Mở luồng xác minh KNIGHT</PrimaryButton>
        {onStartHumanReview && (
          <PrimaryButton onClick={onStartHumanReview} variant="secondary">
            Gặp tổng đài viên (Human Review)
          </PrimaryButton>
        )}
        <a className="guardian-call-link" href="tel:19001234" style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Liên hệ Tổng đài 19001234</a>
      </div>
      {detailedMode && <AgentConsole decision={decision} expanded={isConsoleOpen} onToggle={onToggleConsole} />}
    </article>
  );
}
