import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { ThreatLensRiskDecision } from "../../../domain/types";
import { useThreatLensScenario } from "../model/useThreatLensScenario";
import { ConsentContractModal } from "./ConsentContractModal";
import { ConsentToggle } from "./ConsentToggle";
import { DecisionResult } from "./DecisionResult";
import { ThreatLensChecklist } from "./ThreatLensChecklist";
import { ThreatLensDemoControls } from "./ThreatLensDemoControls";
import { OperatorReviewOverlay } from "./OperatorReviewOverlay";
import { ProtectionLevelSelector } from "./ProtectionLevelSelector";
import { WithdrawConsentModal } from "./WithdrawConsentModal";
import "./ThreatLensExtras.css";
import "./ThreatLensPanel.css";
import "./ThreatLensConsole.css";

interface ThreatLensPanelProps {
  demoEnabled?: boolean;
  latestDecision?: ThreatLensRiskDecision | null;
  onEscalateToKnight: () => void;
}

export function ThreatLensPanel({
  demoEnabled = false,
  latestDecision = null,
  onEscalateToKnight,
}: ThreatLensPanelProps) {
  const threatLens = useThreatLensScenario(latestDecision);

  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);

  const handleToggleConsent = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setIsContractOpen(true);
    } else {
      setIsWithdrawConfirmOpen(true);
    }
  };

  return (
    <section className="threatlens-panel" aria-labelledby="threatlens-title" style={{ position: "relative", overflow: "hidden" }}>
      <div className="threatlens-panel__header">
        <div>
          <span className="threatlens-kicker">Trạng thái AI tự động</span>
          <h2 id="threatlens-title">KNIGHT Decision Intelligence</h2>
        </div>
        {demoEnabled && (
          <button type="button" className="threatlens-demo-button" aria-label="Demo">
            Demo
          </button>
        )}
      </div>

      {threatLens.hasConsent ? (
        <>
          {/* Cấu hình Cấp độ Bảo vệ AI */}
          <ProtectionLevelSelector threatLens={threatLens} />

          {demoEnabled && <ThreatLensDemoControls threatLens={threatLens} />}

          {threatLens.agentUpdates.length > 0 && !threatLens.evaluation?.decision && (
            <p className="threatlens-processing" role="status" style={{ color: "var(--color-ink)" }}>
              Đang phân tích giao dịch... {threatLens.agentUpdates.length}/5 agents đã hoàn tất.
            </p>
          )}

          {threatLens.decision ? (
            <DecisionResult
              decision={threatLens.decision}
              detailedMode={threatLens.detailedMode}
              isConsoleOpen={threatLens.isConsoleOpen}
              onToggleConsole={() => threatLens.setIsConsoleOpen((value) => !value)}
              onEscalateToKnight={onEscalateToKnight}
              onStartHumanReview={threatLens.startHumanReview}
            />
          ) : (
            <article className="threatlens-result threatlens-result--safe" style={{ gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={22} style={{ color: "var(--color-success)" }} />
                <h3 style={{ color: "var(--color-ink)", margin: 0, fontSize: "var(--text-sm)", fontWeight: "bold" }}>KNIGHT đang giám sát nền</h3>
              </div>
              <p style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)", margin: 0 }}>Chưa có giao dịch nào cần can thiệp. Khi bạn chuyển tiền, KNIGHT sẽ tự phân mức AI và chỉ yêu cầu thêm bước nếu có tín hiệu rủi ro.</p>
            </article>
          )}

          <ThreatLensChecklist threatLens={threatLens} />
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 12px", gap: "12px", border: "1px dashed var(--color-line)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)", marginBottom: "8px" }}>
          <ShieldAlert size={36} style={{ color: "var(--color-muted)" }} />
          <h3 style={{ fontSize: "var(--text-sm)", color: "var(--color-ink)", fontWeight: "bold", margin: 0 }}>Hộ vệ AI đang tắt</h3>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", margin: 0, textAlign: "center", lineHeight: "1.4" }}>
            Hệ thống chưa được cấp quyền giám sát. Bật Hộ vệ AI để quét mã độc, ngăn chặn giao dịch lừa đảo công nghệ cao và bảo mật tài khoản của bạn.
          </p>
        </div>
      )}

      {/* Hộp bật tắt Hộ vệ AI */}
      <ConsentToggle threatLens={threatLens} onToggleConsent={handleToggleConsent} />

      {/* Contract Terms Modal */}
      <ConsentContractModal isOpen={isContractOpen} threatLens={threatLens} onClose={() => setIsContractOpen(false)} />

      {/* Withdraw Consent Confirmation Modal */}
      <WithdrawConsentModal isOpen={isWithdrawConfirmOpen} threatLens={threatLens} onClose={() => setIsWithdrawConfirmOpen(false)} />

      {/* Overlay giả lập cuộc gọi Tổng đài viên */}
      <OperatorReviewOverlay threatLens={threatLens} />
    </section>
  );
}
