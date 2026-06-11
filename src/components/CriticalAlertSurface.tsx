import { TriangleAlert } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface CriticalAlertSurfaceProps {
  state: KnightScenarioState;
  onOpenApp: () => void;
}

export function CriticalAlertSurface({ state, onOpenApp }: CriticalAlertSurfaceProps) {
  return (
    <section className="screen" aria-labelledby="critical-alert-title">
      <div className="notification-sheet">
        <div className="notification-sheet__icon" aria-hidden="true">
          <TriangleAlert size={22} />
        </div>
        <div>
          <StatusPill tone="warning">02:00 Critical Alert</StatusPill>
          <h1 id="critical-alert-title">Giao dịch bất thường vừa bị chặn.</h1>
          <p>
            {state.transaction.merchantName} yêu cầu {formatVnd(state.transaction.amountVnd)}. Thẻ số đã được tạm
            khóa để bảo vệ bạn.
          </p>
        </div>
      </div>
      <PrimaryButton onClick={onOpenApp}>Mở Co-opBank</PrimaryButton>
    </section>
  );
}
