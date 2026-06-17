import { BellRing, CalendarDays, CheckCircle2, Headphones, ShieldCheck } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { PrimaryButton, StatusPill } from "../../../shared/ui";
import "./RecoverySupport.css";

interface ReassurancePackageScreenProps {
  state: KnightScenarioState;
  onActivateCashback: () => void;
  onComplete: () => void;
}

export function ReassurancePackageScreen({
  state,
  onActivateCashback,
  onComplete,
}: ReassurancePackageScreenProps) {
  const reassurancePackage = state.reassurancePackage!;
  const cashback = reassurancePackage.essentialCashback;
  const observation = state.recoveryObservation;
  const isCycleComplete = state.currentState === "react_cycle_completed";

  return (
    <section className="screen screen--reassurance" aria-labelledby="reassurance-title">
      <div className="screen-kicker">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>[ACTION] Hỗ trợ sau sự cố</span>
      </div>

      <h1 id="reassurance-title">{reassurancePackage.title} đã được kích hoạt</h1>
      <p className="screen-lead">
        KNIGHT đã bật các lớp hỗ trợ sau khi xác nhận tài khoản an toàn và Điểm Nhu Cầu Phục Hồi vượt ngưỡng.
      </p>

      <div className="reassurance-benefit-list">
        {reassurancePackage.benefits.map((benefit) => (
          <article key={benefit.id}>
            {benefit.id === "priority_support" ? (
              <Headphones size={18} aria-hidden="true" />
            ) : benefit.id === "realtime_alerts" ? (
              <BellRing size={18} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={18} aria-hidden="true" />
            )}
            <div>
              <strong>{benefit.title}</strong>
              <span>{benefit.description}</span>
            </div>
            <StatusPill tone="success">Đã bật</StatusPill>
          </article>
        ))}
      </div>

      <div className="essential-cashback-panel">
        <div className="essential-cashback-panel__header">
          <div>
            <span>Hỗ trợ tiếp tục chi tiêu thiết yếu</span>
            <strong>Hoàn tiền {cashback.ratePercent}%</strong>
          </div>
          <StatusPill tone={cashback.status === "activated" ? "success" : "info"}>
            {cashback.status === "activated" ? "Đã kích hoạt" : "Cần xác nhận"}
          </StatusPill>
        </div>
        <p>
          Áp dụng cho {cashback.categories.join(", ")} {cashback.durationLabel}, dựa trên danh mục khách hàng đã cho phép cá nhân hóa.
        </p>
        <div className="validity-row">
          <CalendarDays size={16} aria-hidden="true" />
          <span>Hiệu lực đến {cashback.validThroughLabel}</span>
        </div>
      </div>

      {observation && (
        <div className="recovery-observation-panel">
          <StatusPill tone="success">[OBSERVE]</StatusPill>
          <strong>Tín hiệu phục hồi có thể kiểm chứng</strong>
          <p>{observation.summary}</p>
          <span>
            Thanh toán thiết yếu: đã tiếp tục · Kiểm tra số dư lặp lại: {observation.repeatedBalanceChecksChangePercent}%
          </span>
        </div>
      )}

      {!observation && cashback.status === "pending_consent" && (
        <PrimaryButton icon={<ShieldCheck size={18} />} onClick={onActivateCashback}>
          Kích hoạt hoàn tiền thiết yếu
        </PrimaryButton>
      )}

      {cashback.status === "unavailable" && (
        <p className="reasoning-note">
          Các lớp bảo vệ vẫn đang hoạt động. Hoàn tiền thiết yếu không được bật vì chưa có consent cá nhân hóa.
        </p>
      )}

      {isCycleComplete && (
        <div className="recovery-cycle-status">
        <StatusPill tone="success">[OBSERVE]</StatusPill>
          <span>Recovery ReAct Cycle Complete</span>
        </div>
      )}

      {(isCycleComplete || cashback.status === "unavailable") && (
        <PrimaryButton icon={<ShieldCheck size={18} />} onClick={onComplete}>
          {isCycleComplete ? "Hoàn tất & Về trang chủ" : "Xác nhận an toàn & Về trang chủ"}
        </PrimaryButton>
      )}
    </section>
  );
}
