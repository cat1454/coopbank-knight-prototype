
import { RotateCcw } from "lucide-react";
import { guardianScenarios } from "../../../domain/guardianFlow";
import type { GuardianScenarioId } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import { PrimaryButton } from "../../../shared/ui";
import type { GuardianFlowScenarioViewModel } from "../model/useGuardianFlowScenario";

interface GuardianDemoControlsProps {
  guardianFlow: GuardianFlowScenarioViewModel;
}

export function GuardianDemoControls({ guardianFlow }: GuardianDemoControlsProps) {
  return (
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
  );
}
