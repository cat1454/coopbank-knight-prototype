
import type { ChangeEventHandler } from "react";
import type { GuardianFlowScenarioViewModel } from "../model/useGuardianFlowScenario";

interface ConsentToggleProps {
  guardianFlow: GuardianFlowScenarioViewModel;
  onToggleConsent: ChangeEventHandler<HTMLInputElement>;
}

export function ConsentToggle({ guardianFlow, onToggleConsent }: ConsentToggleProps) {
  return (
      <div style={{ marginTop: "12px", borderTop: "1px solid var(--color-line)", paddingTop: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-surface)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--color-line)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start", textAlign: "left" }}>
            <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--color-trust)", textTransform: "uppercase" }}>TRẠNG THÁI HỘ VỆ AI</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-ink)", fontWeight: "bold" }}>Kích hoạt Hộ vệ AI KNIGHT</span>
          </div>
          <label className="toggle-switch toggle-switch--success">
            <input
              type="checkbox"
              aria-label="Kích hoạt Hộ vệ AI KNIGHT"
              checked={guardianFlow.hasConsent}
              onChange={onToggleConsent}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
  );
}
