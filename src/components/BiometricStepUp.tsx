import { Fingerprint, RotateCcw } from "lucide-react";
import type { CustomerIntent, KnightScenarioState } from "../domain/types";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface BiometricStepUpProps {
  state: KnightScenarioState;
  onVerify: (intent: CustomerIntent) => void;
  onFail: () => void;
}

export function BiometricStepUp({ state, onVerify, onFail }: BiometricStepUpProps) {
  const isFraudIntent = state.customerIntent === "fraud";

  return (
    <section className="screen screen--biometric" aria-labelledby="biometric-title">
      <StatusPill tone="info">Policy L3 unlock</StatusPill>
      <div className={`face-id-ring ${state.biometricStatus === "failed" ? "face-id-ring--failed" : ""}`}>
        <Fingerprint size={74} strokeWidth={1.45} aria-hidden="true" />
      </div>
      <h1 id="biometric-title">{isFraudIntent ? "Xác thực để khóa thẻ cũ" : "Xác thực để mở lại thẻ"}</h1>
      <p>
        Face ID giúp xác nhận chính bạn đang yêu cầu{" "}
        {isFraudIntent ? "khóa vĩnh viễn và phát hành thẻ mới." : "khôi phục thẻ và tăng giám sát phiên."}
      </p>
      {state.biometricStatus === "failed" ? (
        <p className="inline-alert">Face ID chưa thành công. Chưa có hành động L3 nào được chạy.</p>
      ) : null}
      <div className="action-stack">
        <PrimaryButton icon={<Fingerprint size={18} />} onClick={() => onVerify(state.customerIntent)}>
          Xác thực Face ID
        </PrimaryButton>
        <PrimaryButton icon={<RotateCcw size={18} />} onClick={onFail} variant="ghost">
          Mô phỏng thất bại
        </PrimaryButton>
      </div>
    </section>
  );
}
