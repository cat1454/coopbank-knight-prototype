
import { ShieldAlert } from "lucide-react";
import type { GuardianFlowScenarioViewModel } from "../model/useGuardianFlowScenario";

interface WithdrawConsentModalProps {
  isOpen: boolean;
  guardianFlow: GuardianFlowScenarioViewModel;
  onClose: () => void;
}

export function WithdrawConsentModal({ isOpen, guardianFlow, onClose }: WithdrawConsentModalProps) {
  if (!isOpen) return null;

  return (
<div style={{ position: "absolute", inset: 0, background: "var(--color-card)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 120, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-line)", textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <ShieldAlert size={40} style={{ color: "var(--color-fraud)" }} />
            <h3 style={{ fontSize: "var(--text-md)", color: "var(--color-ink)", fontWeight: "bold", margin: 0 }}>Ngừng sử dụng Hộ vệ AI?</h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: "1.4", margin: 0 }}>
              Bạn có chắc chắn muốn rút lại đồng ý và ngừng chia sẻ dữ liệu? Tài khoản của bạn sẽ mất đi lớp bảo vệ tự động của KNIGHT trước các cuộc gọi lừa đảo giả mạo và ứng dụng mã độc điều khiển từ xa.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%", marginTop: "12px" }}>
              <button
                type="button"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: "8px", color: "var(--color-ink)", fontWeight: "bold", padding: "10px", cursor: "pointer", fontSize: "var(--text-xs)" }}
                onClick={() => {
                  onClose();
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                style={{ background: "var(--color-fraud)", border: "none", borderRadius: "8px", color: "white", fontWeight: "bold", padding: "10px", cursor: "pointer", fontSize: "var(--text-xs)" }}
                onClick={() => {
                  guardianFlow.withdrawConsent();
                  onClose();
                }}
              >
                Tắt bảo vệ
              </button>
            </div>
          </div>
        </div>
  );
}
