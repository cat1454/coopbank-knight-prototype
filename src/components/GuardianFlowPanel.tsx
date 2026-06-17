import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { evaluateGuardianScenario, getGuardianReasonText, guardianScenarios } from "../domain/guardianFlow";
import type {
  GuardianAgentResult,
  GuardianRiskDecision,
  GuardianScenario,
  GuardianScenarioId,
} from "../domain/types";
import { formatVnd } from "../domain/format";
import { PrimaryButton } from "./PrimaryButton";

interface GuardianFlowPanelProps {
  demoEnabled?: boolean;
  latestDecision?: GuardianRiskDecision | null;
  onEscalateToKnight: () => void;
}

interface GuardianEvaluationState {
  scenario: GuardianScenario;
  decision: GuardianRiskDecision;
  agentUpdates: GuardianAgentResult[];
}

const CONSENT_KEY = "knight_guardianflow_consent";

const checklistItems = [
  "Tôi biết rõ người nhận là ai và đã xác minh thông tin.",
  "Không ai yêu cầu tôi chuyển tiền gấp hoặc giữ bí mật.",
  "Đây không phải giao dịch để nhận thưởng, hoàn thuế hoặc đầu tư.",
  "Tôi không bị áp lực hoặc sợ hãi khi thực hiện giao dịch này.",
  "Số tài khoản nhận đã được xác nhận qua kênh chính thức.",
  "Tôi hiểu giao dịch có thể không hoàn lại sau khi thực hiện.",
];

function actionLabel(action: GuardianRiskDecision["action"]) {
  switch (action) {
    case "allow":
      return "Cho phép";
    case "warn":
      return "Cảnh báo";
    case "delay":
      return "Trì hoãn";
    case "step_up":
      return "Xác thực bổ sung";
    case "block":
      return "Tạm giữ";
    case "review":
      return "Fraud Review";
  }
}

function aiLevelLabel(level: GuardianRiskDecision["aiLevel"]) {
  switch (level) {
    case "safe":
      return "safe";
    case "watch":
      return "watch";
    case "verify":
      return "verify";
    case "hold":
      return "hold";
    case "critical":
      return "critical";
  }
}

function scoreTone(score: number) {
  if (score <= 35) return "safe";
  if (score <= 65) return "warn";
  if (score <= 85) return "danger";
  return "critical";
}

function displayAgentName(agentName: GuardianAgentResult["agentName"]) {
  switch (agentName) {
    case "transaction":
      return "Transaction";
    case "device":
      return "Device";
    case "behavioral":
      return "Behavioral";
    case "beneficiary":
      return "Beneficiary";
    case "scam":
      return "Scam";
  }
}

function RiskMeter({ score }: { score: number }) {
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

function AgentConsole({
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

function DecisionResult({
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

export function GuardianFlowPanel({
  demoEnabled = false,
  latestDecision = null,
  onEscalateToKnight,
}: GuardianFlowPanelProps) {
  const [hasConsent, setHasConsent] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(CONSENT_KEY) === "granted";
  });
  const [consentChecked, setConsentChecked] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<GuardianScenarioId>("low_risk");
  const [fakeLatencyMs, setFakeLatencyMs] = useState(0);
  const [detailedMode, setDetailedMode] = useState(true);
  const [evaluation, setEvaluation] = useState<GuardianEvaluationState | null>(null);
  const [agentUpdates, setAgentUpdates] = useState<GuardianAgentResult[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(() => checklistItems.map(() => false));

  const selectedScenarioData = useMemo(() => {
    return guardianScenarios.find((scenario) => scenario.id === selectedScenario) ?? guardianScenarios[0];
  }, [selectedScenario]);

  const grantConsent = () => {
    window.sessionStorage.setItem(CONSENT_KEY, "granted");
    setHasConsent(true);
  };

  const runScenario = async (scenarioId = selectedScenario) => {
    setIsConsoleOpen(false);
    setCheckedItems(checklistItems.map(() => false));
    setAgentUpdates([]);
    const result = await evaluateGuardianScenario(scenarioId, {
      fakeLatencyMs,
      onAgentComplete: (agent) => setAgentUpdates((current) => [...current, agent]),
    });
    setEvaluation({ ...result, agentUpdates: result.agentResults });
  };

  const reset = () => {
    setEvaluation(null);
    setAgentUpdates([]);
    setCheckedItems(checklistItems.map(() => false));
    setSelectedScenario("low_risk");
  };

  const decision = evaluation?.decision ?? latestDecision;
  const scenario = evaluation?.scenario ?? selectedScenarioData;
  const checkedCount = checkedItems.filter(Boolean).length;
  const isChecklistComplete = checkedCount === checklistItems.length;

  if (demoEnabled && !hasConsent) {
    return (
      <section className="guardian-panel guardian-consent" aria-labelledby="guardian-consent-title">
        <ShieldCheck size={28} />
        <h2 id="guardian-consent-title">KNIGHT Decision Intelligence</h2>
        <p>
          KNIGHT dùng mock data trong phiên này để phân tích giao dịch, giải thích cảnh báo và hiển thị audit demo.
          Dữ liệu sinh trắc học không được thu thập.
        </p>
        <label className="guardian-consent-check">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(event) => setConsentChecked(event.target.checked)}
          />
          <span>Tôi đồng ý dùng dữ liệu phiên mock cho phân tích demo.</span>
        </label>
        <PrimaryButton onClick={grantConsent} disabled={!consentChecked}>
          Bắt đầu
        </PrimaryButton>
      </section>
    );
  }

  return (
    <section className="guardian-panel" aria-labelledby="guardian-title">
      <div className="guardian-panel__header">
        <div>
          <span className="guardian-kicker">Trạng thái AI tự động</span>
          <h2 id="guardian-title">KNIGHT Decision Intelligence</h2>
        </div>
        {demoEnabled && (
          <button type="button" className="guardian-demo-button" aria-label="Demo">
            Demo
          </button>
        )}
      </div>

      {demoEnabled && (
        <>
          <div className="guardian-demo-grid">
            <label className="guardian-field">
              <span>Scenario</span>
              <select value={selectedScenario} onChange={(event) => setSelectedScenario(event.target.value as GuardianScenarioId)}>
                {guardianScenarios.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="guardian-field">
              <span>Fake latency: {fakeLatencyMs}ms</span>
              <input
                type="range"
                min="0"
                max="500"
                step="100"
                value={fakeLatencyMs}
                onChange={(event) => setFakeLatencyMs(Number(event.target.value))}
              />
            </label>
            <label className="guardian-inline-toggle">
              <input
                type="checkbox"
                checked={detailedMode}
                onChange={(event) => setDetailedMode(event.target.checked)}
              />
              <span>Chế độ giải thích chi tiết</span>
            </label>
          </div>

          <div className="guardian-scenario-summary">
            <strong>{scenario.label}</strong>
            <p>{scenario.summary}</p>
            <span>{formatVnd(scenario.transaction.amountVnd)} đến {scenario.transaction.recipientName}</span>
          </div>

          <div className="guardian-actions">
            <PrimaryButton onClick={() => void runScenario()}>Chạy scenario</PrimaryButton>
            <button type="button" className="guardian-icon-button" aria-label="Reset phiên" onClick={reset}>
              <RotateCcw size={16} />
            </button>
          </div>
        </>
      )}

      {agentUpdates.length > 0 && !evaluation?.decision && (
        <p className="guardian-processing" role="status">
          Đang phân tích giao dịch... {agentUpdates.length}/5 agents đã hoàn tất.
        </p>
      )}

      {decision ? (
        <DecisionResult
          decision={decision}
          detailedMode={detailedMode}
          isConsoleOpen={isConsoleOpen}
          onToggleConsole={() => setIsConsoleOpen((value) => !value)}
          onEscalateToKnight={onEscalateToKnight}
        />
      ) : (
        <article className="guardian-result guardian-result--safe">
          <ShieldCheck size={22} />
          <h3>KNIGHT đang giám sát nền</h3>
          <p>Chưa có giao dịch nào cần can thiệp. Khi bạn chuyển tiền, KNIGHT sẽ tự phân mức AI và chỉ yêu cầu thêm bước nếu có tín hiệu rủi ro.</p>
        </article>
      )}

      {decision?.requiresChecklist && (
        <div className="guardian-checklist">
          {checklistItems.map((item, index) => (
            <label key={item}>
              <input
                type="checkbox"
                checked={checkedItems[index]}
                onChange={(event) => {
                  setCheckedItems((current) => current.map((value, itemIndex) => (itemIndex === index ? event.target.checked : value)));
                }}
              />
              <span>{item}</span>
            </label>
          ))}
          <p className="guardian-progress">Đã xác nhận {checkedCount}/6 mục</p>
          <PrimaryButton disabled={!isChecklistComplete}>Tiếp tục xác thực Face ID</PrimaryButton>
        </div>
      )}
    </section>
  );
}
