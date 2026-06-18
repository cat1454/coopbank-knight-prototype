
import { RotateCcw } from "lucide-react";
import { threatLensScenarios } from "../../../domain/threatLens";
import type { ThreatLensScenarioId } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import { PrimaryButton } from "../../../shared/ui";
import type { ThreatLensScenarioViewModel } from "../model/useThreatLensScenario";

interface ThreatLensDemoControlsProps {
  threatLens: ThreatLensScenarioViewModel;
}

export function ThreatLensDemoControls({ threatLens }: ThreatLensDemoControlsProps) {
  return (
<>
              <div className="threatlens-demo-grid">
                <label className="threatlens-field">
                  <span>Scenario</span>
                  <select
                    value={threatLens.selectedScenario}
                    onChange={(event) => threatLens.setSelectedScenario(event.target.value as ThreatLensScenarioId)}
                  >
                    {threatLensScenarios.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="threatlens-field">
                  <span>Fake latency: {threatLens.fakeLatencyMs}ms</span>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="100"
                    value={threatLens.fakeLatencyMs}
                    onChange={(event) => threatLens.setFakeLatencyMs(Number(event.target.value))}
                  />
                </label>
                <label className="threatlens-inline-toggle">
                  <input
                    type="checkbox"
                    checked={threatLens.detailedMode}
                    onChange={(event) => threatLens.setDetailedMode(event.target.checked)}
                  />
                  <span>Chế độ giải thích chi tiết</span>
                </label>
              </div>

              <div className="threatlens-scenario-summary">
                <strong>{threatLens.scenario.label}</strong>
                <p>{threatLens.scenario.summary}</p>
                <span>{formatVnd(threatLens.scenario.transaction.amountVnd)} đến {threatLens.scenario.transaction.recipientName}</span>
              </div>

              <div className="threatlens-actions">
                <PrimaryButton onClick={() => void threatLens.runScenario()}>Chạy scenario</PrimaryButton>
                <button type="button" className="threatlens-icon-button" aria-label="Reset phiên" onClick={threatLens.reset}>
                  <RotateCcw size={16} />
                </button>
              </div>
            </>
  );
}
