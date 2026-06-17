import { useEffect } from "react";
import { AlertTriangle, Bell, ShieldAlert, ShieldCheck } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import { KnightAgentVisual } from "../../../widgets/knight-agent-visual/KnightAgentVisual";
import "./CriticalAlertSurface.css";

interface UnlockedCriticalAlertPopupProps {
  state: KnightScenarioState;
  onContinue: () => void;
}

export function UnlockedCriticalAlertPopup({
  state,
  onContinue,
}: UnlockedCriticalAlertPopupProps) {
  useEffect(() => {
    // Audio is managed centrally in App.tsx to ensure a seamless transition
    // and correct iOS gesture binding.
  }, []);

  return (
    <div className="critical-alert-overlay unlocked-alert-overlay" role="dialog" aria-modal="true" aria-labelledby="unlocked-alert-title">
      <div className="critical-alert-modal unlocked-alert-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ca-header">
          <div className="ca-live-badge">
            <span className="ca-live-dot" />
            KNIGHT AI đang chặn rủi ro
          </div>
          <Bell size={18} color="#f97066" aria-hidden="true" />
        </div>

        <div className="popup-agent-wrap unlocked-alert-agent">
          <KnightAgentVisual state={state} variant="mobile" />
        </div>

        <h2 id="unlocked-alert-title" className="ca-title">
          Cảnh báo AI khẩn cấp
        </h2>

        <div className="ca-risk-badge">
          <AlertTriangle size={11} />
          Risk Score: 847 / 1000
        </div>

        <div className="ca-txn-card">
          <div className="ca-txn-row">
            <span className="ca-txn-label">Giao dịch</span>
            <span className="ca-txn-value">{state.transaction.merchantName}</span>
          </div>
          <div className="ca-txn-row">
            <span className="ca-txn-label">Số tiền</span>
            <span className="ca-txn-value ca-txn-amount">{formatVnd(state.transaction.amountVnd)}</span>
          </div>
        </div>

        <div className="ca-protection">
          <ShieldCheck size={13} />
          <span>KNIGHT đã tạm khóa thẻ số và cần bạn xác nhận ngay trong ứng dụng.</span>
        </div>

        <button
          type="button"
          className="critical-cta-btn"
          onClick={onContinue}
        >
          <ShieldAlert size={16} aria-hidden="true" />
          Xem cảnh báo
        </button>
      </div>
    </div>
  );
}
