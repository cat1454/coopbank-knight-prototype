import { RotateCcw, ShieldCheck } from "lucide-react";
import { guardianScenarios } from "../../../domain/guardianFlow";
import type { GuardianRiskDecision, GuardianScenarioId } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import { PrimaryButton } from "../../../shared/ui";
import { checklistItems } from "../model/guardianFlowUi";
import { useGuardianFlowScenario } from "../model/useGuardianFlowScenario";
import { DecisionResult } from "./DecisionResult";

interface GuardianFlowPanelProps {
  demoEnabled?: boolean;
  latestDecision?: GuardianRiskDecision | null;
  onEscalateToKnight: () => void;
}

export function GuardianFlowPanel({
  demoEnabled = false,
  latestDecision = null,
  onEscalateToKnight,
}: GuardianFlowPanelProps) {
  const guardianFlow = useGuardianFlowScenario(latestDecision);

  if (demoEnabled && !guardianFlow.hasConsent) {
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
            checked={guardianFlow.consentChecked}
            onChange={(event) => guardianFlow.setConsentChecked(event.target.checked)}
          />
          <span>Tôi đồng ý dùng dữ liệu phiên mock cho phân tích demo.</span>
        </label>
        <PrimaryButton onClick={guardianFlow.grantConsent} disabled={!guardianFlow.consentChecked}>
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
              <select
                value={guardianFlow.selectedScenario}
                onChange={(event) => guardianFlow.setSelectedScenario(event.target.value as GuardianScenarioId)}
              >
                {guardianScenarios.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="guardian-field">
              <span>Fake latency: {guardianFlow.fakeLatencyMs}ms</span>
              <input
                type="range"
                min="0"
                max="500"
                step="100"
                value={guardianFlow.fakeLatencyMs}
                onChange={(event) => guardianFlow.setFakeLatencyMs(Number(event.target.value))}
              />
            </label>
            <label className="guardian-inline-toggle">
              <input
                type="checkbox"
                checked={guardianFlow.detailedMode}
                onChange={(event) => guardianFlow.setDetailedMode(event.target.checked)}
              />
              <span>Chế độ giải thích chi tiết</span>
            </label>
          </div>

          <div className="guardian-scenario-summary">
            <strong>{guardianFlow.scenario.label}</strong>
            <p>{guardianFlow.scenario.summary}</p>
            <span>{formatVnd(guardianFlow.scenario.transaction.amountVnd)} đến {guardianFlow.scenario.transaction.recipientName}</span>
          </div>

          <div className="guardian-actions">
            <PrimaryButton onClick={() => void guardianFlow.runScenario()}>Chạy scenario</PrimaryButton>
            <button type="button" className="guardian-icon-button" aria-label="Reset phiên" onClick={guardianFlow.reset}>
              <RotateCcw size={16} />
            </button>
          </div>
        </>
      )}

      {guardianFlow.agentUpdates.length > 0 && !guardianFlow.evaluation?.decision && (
        <p className="guardian-processing" role="status">
          Đang phân tích giao dịch... {guardianFlow.agentUpdates.length}/5 agents đã hoàn tất.
        </p>
      )}

      {guardianFlow.decision ? (
        <DecisionResult
          decision={guardianFlow.decision}
          detailedMode={guardianFlow.detailedMode}
          isConsoleOpen={guardianFlow.isConsoleOpen}
          onToggleConsole={() => guardianFlow.setIsConsoleOpen((value) => !value)}
          onEscalateToKnight={onEscalateToKnight}
        />
      ) : (
        <article className="guardian-result guardian-result--safe">
          <ShieldCheck size={22} />
          <h3>KNIGHT đang giám sát nền</h3>
          <p>Chưa có giao dịch nào cần can thiệp. Khi bạn chuyển tiền, KNIGHT sẽ tự phân mức AI và chỉ yêu cầu thêm bước nếu có tín hiệu rủi ro.</p>
        </article>
      )}

      {guardianFlow.decision?.requiresChecklist && (
        <div className="guardian-checklist">
          {checklistItems.map((item, index) => (
            <label key={item}>
              <input
                type="checkbox"
                checked={guardianFlow.checkedItems[index]}
                onChange={(event) => {
                  guardianFlow.setCheckedItems((current) =>
                    current.map((value, itemIndex) => (itemIndex === index ? event.target.checked : value)),
                  );
                }}
              />
              <span>{item}</span>
            </label>
          ))}
          <p className="guardian-progress">Đã xác nhận {guardianFlow.checkedCount}/6 mục</p>
          <PrimaryButton disabled={!guardianFlow.isChecklistComplete}>Tiếp tục xác thực Face ID</PrimaryButton>
        </div>
      )}
    </section>
  );
}
