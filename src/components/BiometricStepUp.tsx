import { Fingerprint, RotateCcw, CheckCircle2 } from "lucide-react";
import type { CustomerIntent, KnightScenarioState } from "../domain/types";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface BiometricStepUpProps {
  state: KnightScenarioState;
  onVerify: (intent: CustomerIntent) => void;
  onFail: () => void;
  isProcessing?: boolean;
}

export function BiometricStepUp({ state, onVerify, onFail, isProcessing = false }: BiometricStepUpProps) {
  const isFraudIntent = state.customerIntent === "fraud";
  const isVerified = state.biometricStatus === "verified";

  return (
    <section className="screen screen--biometric" aria-labelledby="biometric-title">
      <StatusPill tone={isVerified ? "success" : "info"}>
        {isVerified ? "Identified verified" : "Policy L3 unlock"}
      </StatusPill>
      
      <div className={`face-id-ring ${isVerified ? "face-id-ring--success" : state.biometricStatus === "failed" ? "face-id-ring--failed" : ""}`}>
        {isVerified ? (
          <CheckCircle2 size={74} strokeWidth={1.45} aria-hidden="true" />
        ) : (
          <Fingerprint size={74} strokeWidth={1.45} aria-hidden="true" />
        )}
      </div>

      <h1 id="biometric-title">
        {isVerified
          ? "Xác thực thành công"
          : isFraudIntent
          ? "Xác thực để khóa thẻ cũ"
          : "Xác thực để mở lại thẻ"}
      </h1>

      <p>
        {isVerified ? (
          "Hệ thống đang tiến hành các bước xử lý tự động tiếp theo..."
        ) : (
          <>
            Face ID giúp xác nhận chính bạn đang yêu cầu{" "}
            {isFraudIntent ? "khóa vĩnh viễn và phát hành thẻ mới." : "khôi phục thẻ và tăng giám sát phiên."}
          </>
        )}
      </p>

      {state.biometricStatus === "failed" ? (
        <p className="inline-alert">Face ID chưa thành công. Chưa có hành động L3 nào được chạy.</p>
      ) : null}

      <div className="action-stack">
        <PrimaryButton 
          icon={isVerified ? <CheckCircle2 size={18} /> : <Fingerprint size={18} />} 
          onClick={() => onVerify(state.customerIntent)}
          disabled={isProcessing || isVerified}
        >
          {isVerified ? "Đang xử lý..." : "Xác thực Face ID"}
        </PrimaryButton>
        <PrimaryButton 
          icon={<RotateCcw size={18} />} 
          onClick={onFail} 
          variant="ghost"
          disabled={isProcessing || isVerified}
        >
          Mô phỏng thất bại
        </PrimaryButton>
      </div>
    </section>
  );
}
