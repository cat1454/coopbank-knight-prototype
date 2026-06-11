import { ShieldAlert, Bell } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";

interface CriticalAlertSurfaceProps {
  state: KnightScenarioState;
  onOpenApp: () => void;
}

export function CriticalAlertSurface({ state, onOpenApp }: CriticalAlertSurfaceProps) {
  return (
    <section className="screen screen--lockscreen" aria-labelledby="critical-alert-title">
      {/* Time & Date Display */}
      <div className="lockscreen-clock">
        <span className="lockscreen-time">02:00</span>
        <span className="lockscreen-date">Chủ Nhật, 11 tháng 6</span>
      </div>

      {/* iOS-style Notification Card */}
      <div className="ios-notification" onClick={onOpenApp} role="button" tabIndex={0} aria-label="Nhấn để xem cảnh báo bảo mật">
        <div className="ios-notification__header">
          <div className="ios-notification__app-info">
            <span className="ios-notification__logo">🛡️</span>
            <span className="ios-notification__app-name">Co-opBank</span>
          </div>
          <span className="ios-notification__time">Vừa xong</span>
        </div>
        <div className="ios-notification__body">
          <strong className="ios-notification__merchant" id="critical-alert-title">
            {state.transaction.merchantName} · {formatVnd(state.transaction.amountVnd)}
          </strong>
          <h2 className="ios-notification__message" style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "normal" }}>
            Giao dịch bất thường vừa bị chặn. Thẻ số đã được tạm khóa để bảo vệ tài khoản.
          </h2>
          <div className="ios-notification__status">
            <ShieldAlert size={14} />
            <span>Thẻ số đã được tạm khóa</span>
          </div>
        </div>
      </div>

      {/* Unlock / Open CTA Pill */}
      <button
        type="button"
        className="lockscreen-cta-pill"
        onClick={onOpenApp}
      >
        Mở Co-opBank
      </button>

      <div className="lockscreen-footer">
        <Bell size={12} />
        <span>Nhấn vào thông báo hoặc nút để mở và xem xét rủi ro</span>
      </div>
    </section>
  );
}
