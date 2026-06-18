import { AlertTriangle, CheckCircle2, Clock, LockKeyhole } from "lucide-react";
import { getThreatLensReasonText } from "../../../domain/threatLens";
import type { ThreatLensRiskDecision } from "../../../domain/types";
import { PrimaryButton } from "../../../shared/ui";
import { aiLevelLabel } from "../model/threatLensUi";
import { AgentConsole } from "./AgentConsole";
import { RiskMeter } from "./RiskMeter";

function ReasonList({ decision }: { decision: ThreatLensRiskDecision }) {
  return (
    <div className="threatlens-reasons">
      {decision.reasonCodes.slice(0, 5).map((code) => (
        <span className="threatlens-reason" key={code}>
          {getThreatLensReasonText(code)}
        </span>
      ))}
    </div>
  );
}

function DecisionMeta({ decision }: { decision: ThreatLensRiskDecision }) {
  const getPolicyLabel = (policy: string) => {
    const lower = policy.toLowerCase();
    if (lower.includes("l2")) return "Tự động khóa thẻ";
    if (lower.includes("l3")) return "Khóa thẻ & Chặn GD lạ";
    return policy;
  };

  return (
    <div className="threatlens-reasons">
      <span className="threatlens-reason">Hệ thống AI: {aiLevelLabel(decision.aiLevel)}</span>
      <span className="threatlens-reason">Cách xử lý: {getPolicyLabel(decision.policyLevel)}</span>
      <span className="threatlens-reason">Đơn vị quét: {decision.source}</span>
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
  decision: ThreatLensRiskDecision;
  detailedMode: boolean;
  isConsoleOpen: boolean;
  onToggleConsole: () => void;
  onEscalateToKnight: () => void;
  onStartHumanReview?: () => void;
}) {
  if (decision.action === "allow") {
    return (
      <article className="threatlens-result threatlens-result--safe">
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
      <article className="threatlens-result threatlens-result--warn">
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
      <article className="threatlens-result threatlens-result--delay">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={22} style={{ color: "var(--color-trust)" }} />
          <h3 style={{ margin: 0 }}>KNIGHT cần xác thực bổ sung</h3>
        </div>
        <RiskMeter score={decision.riskScore} />
        <DecisionMeta decision={decision} />
        <p>{decision.explanation}</p>
        <ReasonList decision={decision} />
        {onStartHumanReview && (
          <div className="threatlens-actions" style={{ marginTop: "12px" }}>
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
    <article className="threatlens-result threatlens-result--critical">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <LockKeyhole size={22} style={{ color: "var(--color-fraud)" }} />
        <h3 style={{ margin: 0 }}>Giao dịch tạm thời bị giữ lại</h3>
      </div>
      <RiskMeter score={decision.riskScore} />
      <DecisionMeta decision={decision} />
      <ReasonList decision={decision} />
      <p>{decision.explanation}</p>
      <p className="threatlens-reference">Mã tham chiếu: {decision.transactionId}</p>
      <div className="threatlens-actions" style={{ display: "grid", gap: "8px", width: "100%" }}>
        <PrimaryButton onClick={onEscalateToKnight}>Mở luồng xác minh KNIGHT</PrimaryButton>
        {onStartHumanReview && (
          <PrimaryButton onClick={onStartHumanReview} variant="secondary">
            Gặp tổng đài viên (Human Review)
          </PrimaryButton>
        )}
        <a className="threatlens-call-link" href="tel:19001234" style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Liên hệ Tổng đài 19001234</a>
      </div>
      {detailedMode && <AgentConsole decision={decision} expanded={isConsoleOpen} onToggle={onToggleConsole} />}
    </article>
  );
}
