import { useState } from "react";
import { CreditCard, FileCheck2, ShieldCheck, Loader2, Copy } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface VirtualCardScreenProps {
  state: KnightScenarioState;
  onShowOffer: () => void;
  isProcessing?: boolean;
}

export function VirtualCardScreen({ state, onShowOffer, isProcessing = false }: VirtualCardScreenProps) {
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedCvv, setCopiedCvv] = useState(false);

  const newCard = state.newCard;
  const fraudCase = state.fraudCase;
  const curState = state.currentState;

  // Determine stage flags
  const isTerminatedOnly = curState === "card_terminated_l3";
  const isIssuedOnly = curState === "new_card_issued";
  const isCaseCreated = curState === "fraud_case_created" || !!fraudCase;

  const handleCopyCard = () => {
    navigator.clipboard.writeText("4221098273618839");
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const handleCopyCvv = () => {
    navigator.clipboard.writeText("173");
    setCopiedCvv(true);
    setTimeout(() => setCopiedCvv(false), 2000);
  };

  return (
    <section className="screen" aria-labelledby="virtual-card-title">
      <div className="screen-kicker">
        <CreditCard size={18} aria-hidden="true" />
        <span>Resolution</span>
      </div>

      <h1 id="virtual-card-title">
        {isTerminatedOnly ? "Đang xử lý thu hồi thẻ..." : isIssuedOnly ? "Đang cấp lại thẻ số..." : "Thẻ số mới đã sẵn sàng."}
      </h1>
      <p className="screen-lead">
        {isTerminatedOnly 
          ? "Đã xác nhận Face ID. Đang tiến hành hủy vĩnh viễn thẻ bị lộ thông tin trên hệ thống..." 
          : isIssuedOnly 
          ? "Thẻ cũ đã hủy. Hệ thống đang tạo lập thẻ ảo mới thay thế..." 
          : "Thẻ cũ đã khóa vĩnh viễn sau Face ID. Case fraud đang chờ Fraud Ops xem xét hoàn tiền."}
      </p>

      {/* Card Display */}
      <div className="cards-stack-wrapper" style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
        {newCard ? (
          <>
            <div className="virtual-card virtual-card-new-issued" aria-label="Demo virtual card">
              <span>Co-opBank (Thẻ chính mới)</span>
              <strong>{newCard.maskedPan}</strong>
              <small>Thẻ chính ảo - Đang hoạt động</small>
            </div>
            
            {/* Thẻ tạm thời dùng 1 lần */}
            <div className="disposable-card-container" style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              borderRadius: "20px",
              padding: "16px 20px",
              color: "#ffffff",
              boxShadow: "0 8px 24px rgba(124, 58, 237, 0.22)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              position: "relative",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              animation: "card-slide-up-in 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.1) both"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", opacity: 0.9, fontWeight: 700, background: "rgba(255, 255, 255, 0.2)", padding: "2px 8px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Thẻ ảo dùng 1 lần</span>
                <span style={{ fontSize: "10px", color: "#fcd34d", fontWeight: 800, background: "rgba(245, 158, 11, 0.25)", padding: "2px 6px", borderRadius: "6px" }}>KHẨN CẤP</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0" }}>
                <strong style={{ fontSize: "20px", letterSpacing: "1.5px", fontFamily: "monospace", color: "#ffffff", textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)" }}>
                  4221 0982 7361 8839
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", opacity: 0.9 }}>
                <span>Hạn dùng: <strong style={{ color: "#a5f3fc" }}>24h</strong></span>
                <span>CVV: <strong style={{ color: "#a5f3fc", letterSpacing: "1px" }}>173</strong></span>
                <span>Hạn mức: <strong style={{ color: "#a5f3fc" }}>5.000.000 ₫</strong></span>
              </div>
              
              {/* Copy actions */}
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleCopyCard}
                  style={{
                    flex: 1,
                    background: copiedCard ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.18)",
                    border: copiedCard ? "1px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "12px",
                    padding: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <Copy size={12} />
                  {copiedCard ? "✓ Đã sao chép!" : "Sao chép số thẻ"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCvv}
                  style={{
                    background: copiedCvv ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.18)",
                    border: copiedCvv ? "1px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "12px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s ease"
                  }}
                >
                  {copiedCvv ? "✓ Đã chép!" : "Sao chép CVV"}
                </button>
              </div>
              <div style={{ fontSize: "10px", opacity: 0.8, textAlign: "center", marginTop: "4px", fontStyle: "italic" }}>
                Dùng để chuyển khoản hoặc mua sắm khẩn cấp. Thẻ tự hủy sau khi dùng.
              </div>
            </div>
          </>
        ) : (
          <div className="virtual-card virtual-card-terminated" aria-label="Card under replacement" style={{ background: "linear-gradient(135deg, #475467 0%, #1d2939 100%)" }}>
            <span>Co-opBank</span>
            <strong>{state.card.maskedPan}</strong>
            <small>Thẻ cũ đang khóa & hủy...</small>
          </div>
        )}
      </div>

      {/* Case Summary Display */}
      {fraudCase ? (
        <div className="case-summary" style={{ animation: "tab-slide-fade-in 0.5s ease-out both" }}>
          <FileCheck2 size={18} aria-hidden="true" style={{ color: "var(--color-success)" }} />
          <div>
            <span>Case ID</span>
            <strong style={{ color: "var(--color-success)" }}>{fraudCase.id}</strong>
            <p>{formatVnd(state.transaction.amountVnd)} đang được review trong 3-5 ngày làm việc.</p>
          </div>
        </div>
      ) : (
        <div className="case-summary" style={{ borderStyle: "dashed", opacity: 0.6 }}>
          <Loader2 className="spin" size={18} style={{ color: "var(--color-muted)" }} />
          <div>
            <span>Hồ sơ tra soát</span>
            <strong>Đang khởi tạo...</strong>
            <p>Đang chuẩn bị dữ liệu giao dịch bất thường gửi phòng nghiệp vụ.</p>
          </div>
        </div>
      )}

      {/* Status Pills */}
      <div className="status-row status-row--wrap">
        <StatusPill tone="success">Old card terminated</StatusPill>
        <StatusPill tone={isTerminatedOnly ? "info" : "success"}>
          {isTerminatedOnly ? "Issuing card..." : "New card issued"}
        </StatusPill>
        <StatusPill tone={isCaseCreated ? "success" : "info"}>
          {isCaseCreated ? "Fraud case created" : "Creating case..."}
        </StatusPill>
      </div>

      <PrimaryButton 
        icon={isProcessing && !isCaseCreated ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />} 
        onClick={onShowOffer}
        disabled={isProcessing || !isCaseCreated}
      >
        {isProcessing && !isCaseCreated ? "Đang xử lý..." : "Tiếp tục phục hồi niềm tin"}
      </PrimaryButton>
    </section>
  );
}
