/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { CheckCircle2, RotateCcw, ScanFace, XCircle, Loader2 } from "lucide-react";
import type { CustomerIntent, KnightScenarioState } from "../domain/types";
import { PrimaryButton } from "./PrimaryButton";
import { StatusPill } from "./StatusPill";

interface BiometricStepUpProps {
  state: KnightScenarioState;
  onVerify: (intent: CustomerIntent) => void;
  onFail: () => void;
  isProcessing?: boolean;
}

export function FaceIdGlyph({ state }: { state: "idle" | "scanning" | "success" | "failed" }) {
  const isSuccess = state === "success";
  const isFailed = state === "failed";
  const isScanning = state === "scanning";

  return (
    <div className="ios-faceid-modal__glyph-wrapper" style={{ width: "90px", height: "90px", marginBottom: 0 }}>
      <svg
        viewBox="0 0 100 100"
        className="faceid-glyph-svg"
        style={{
          width: "100%",
          height: "100%",
          transform: isFailed ? "scale(0.95)" : "scale(1)",
          transition: "transform 0.2s ease",
        }}
      >
        {/* iOS style squircle focus corners if not completed */}
        {!isSuccess && !isFailed && (
          <g opacity={isScanning ? 1 : 0.6} style={{ transition: "opacity 0.3s" }}>
            <path d="M 15 25 L 15 15 L 25 15" fill="none" stroke={isScanning ? "#00d8ff" : "#8e8e93"} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 75 15 L 85 15 L 85 25" fill="none" stroke={isScanning ? "#00d8ff" : "#8e8e93"} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 15 75 L 15 85 L 25 85" fill="none" stroke={isScanning ? "#00d8ff" : "#8e8e93"} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 85 75 L 85 85 L 75 85" fill="none" stroke={isScanning ? "#00d8ff" : "#8e8e93"} strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {/* Circular background ticks / path */}
        {isSuccess && (
          <circle cx="50" cy="50" r="38" fill="none" stroke="#1fd89a" strokeWidth="4.5" />
        )}

        {isFailed && (
          <circle cx="50" cy="50" r="38" fill="none" stroke="#ff3b30" strokeWidth="4.5" />
        )}

        {/* Face ID or Check/Cross Glyphs */}
        {isSuccess ? (
          <path
            d="M 34 50 L 45 61 L 66 38"
            fill="none"
            stroke="#1fd89a"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="svg-checkmark-path"
          />
        ) : isFailed ? (
          <g>
            <path d="M 35 35 L 65 65" fill="none" stroke="#ff3b30" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 65 35 L 35 65" fill="none" stroke="#ff3b30" strokeWidth="5.5" strokeLinecap="round" />
          </g>
        ) : (
          <g className="faceid-outline-paths">
            <path
              d="M 30 42 C 30 30, 70 30, 70 42 C 70 54, 66 68, 50 72 C 34 68, 30 54, 30 42 Z"
              fill="none"
              stroke={isScanning ? "#00d8ff" : "#d1e9ff"}
              className="faceid-path"
            />
            <path
              d="M 38 46 C 38 38, 62 38, 62 46 C 62 55, 59 62, 50 64"
              fill="none"
              stroke={isScanning ? "#00d8ff" : "#d1e9ff"}
              className="faceid-path"
            />
            <circle cx="43" cy="45" r="2.5" fill={isScanning ? "#00d8ff" : "#d1e9ff"} style={{ transition: "fill 0.3s" }} />
            <circle cx="57" cy="45" r="2.5" fill={isScanning ? "#00d8ff" : "#d1e9ff"} style={{ transition: "fill 0.3s" }} />
            <path
              d="M 50 48 L 50 56 L 46 56"
              fill="none"
              stroke={isScanning ? "#00d8ff" : "#d1e9ff"}
              className="faceid-path"
              strokeWidth="3"
            />
            <path
              d="M 44 63 Q 50 67 56 63"
              fill="none"
              stroke={isScanning ? "#00d8ff" : "#d1e9ff"}
              className="faceid-path"
              strokeWidth="3"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export function BiometricStepUp({ state, onVerify, onFail, isProcessing = false }: BiometricStepUpProps) {
  const isFraudIntent = state.customerIntent === "fraud";
  const isVerified = state.biometricStatus === "verified";
  const isFailed = state.biometricStatus === "failed";

  // Scan states: "idle" | "detecting" | "liveness" | "matching" | "success" | "failed"
  const [scanState, setScanState] = useState<"idle" | "detecting" | "liveness" | "matching" | "success" | "failed">(() => {
    if (isVerified) return "success";
    if (isFailed) return "failed";
    return "idle";
  });

  const [activeStep, setActiveStep] = useState(() => {
    if (isVerified) return 4;
    if (isFailed) return 5;
    return 0;
  });

  // Track parent updates (e.g. if reset from controls)
  useEffect(() => {
    if (isVerified) {
      setScanState("success");
      setActiveStep(4);
    } else if (isFailed) {
      setScanState("failed");
      setActiveStep(5);
    } else {
      setScanState("idle");
      setActiveStep(0);
    }
  }, [isVerified, isFailed]);

  const startScanning = (failSim: boolean) => {
    if (scanState !== "idle" && scanState !== "failed") return;
    
    const isTestEnv = import.meta.env.MODE === "test";
    if (isTestEnv) {
      if (failSim) {
        onFail();
      } else {
        onVerify(state.customerIntent);
      }
      return;
    }
    
    setScanState("detecting");
    setActiveStep(1);

    // Step 2: Liveness Check
    setTimeout(() => {
      setScanState("liveness");
      setActiveStep(2);
    }, 700);

    // Step 3: Database Matching
    setTimeout(() => {
      setScanState("matching");
      setActiveStep(3);
    }, 1400);

    // Step 4: Final Outcome
    setTimeout(() => {
      if (failSim) {
        setScanState("failed");
        setActiveStep(5);
        setTimeout(() => {
          onFail();
        }, 500);
      } else {
        setScanState("success");
        setActiveStep(4);
        setTimeout(() => {
          onVerify(state.customerIntent);
        }, 850);
      }
    }, 2100);
  };

  const isScanning = scanState !== "idle" && scanState !== "success" && scanState !== "failed";

  return (
    <section className="screen screen--biometric" aria-labelledby="biometric-title">
      <StatusPill tone={isVerified ? "success" : isFailed ? "danger" : "info"}>
        {isVerified ? "Face ID verified" : isFailed ? "Face ID failed" : "Policy L3 unlock"}
      </StatusPill>

      <div 
        className={`face-scan-preview ${
          scanState === "success" ? "face-scan-preview--success" : 
          scanState === "failed" ? "face-scan-preview--failed" : 
          isScanning ? "face-scan-preview--scanning" : ""
        }`}
      >
        <div className="face-scan-preview-camera-overlay" />
        
        {/* iOS Brackets */}
        <div className="face-scan-brackets">
          <span className="face-scan-bracket face-scan-bracket--tl" />
          <span className="face-scan-bracket face-scan-bracket--tr" />
          <span className="face-scan-bracket face-scan-bracket--bl" />
          <span className="face-scan-bracket face-scan-bracket--br" />
        </div>

        {/* Scanner line sweep */}
        {isScanning && <div className="face-scan-sweep" />}

        <div className="face-scan-oval" aria-hidden="true" style={{ background: "none", border: "1px dashed rgba(209,233,255,0.15)" }}>
          <FaceIdGlyph state={scanState === "success" ? "success" : scanState === "failed" ? "failed" : isScanning ? "scanning" : "idle"} />
        </div>
        
        <div className="face-scan-status">
          {scanState === "success" ? (
            <CheckCircle2 size={16} aria-hidden="true" style={{ color: "#1fd89a" }} />
          ) : scanState === "failed" ? (
            <XCircle size={16} aria-hidden="true" style={{ color: "#ff3b30" }} />
          ) : isScanning ? (
            <Loader2 size={16} className="spin" aria-hidden="true" style={{ color: "#00d8ff" }} />
          ) : (
            <ScanFace size={16} aria-hidden="true" />
          )}
          <span>
            {scanState === "idle" && "Đang sẵn sàng quét"}
            {scanState === "detecting" && "Đang tìm khuôn mặt..."}
            {scanState === "liveness" && "Kiểm tra liveness (nháy mắt)..."}
            {scanState === "matching" && "Đang đối chiếu dữ liệu..."}
            {scanState === "success" && "Xác thực thành công"}
            {scanState === "failed" && "Xác thực thất bại"}
          </span>
        </div>
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
        ) : isFraudIntent ? (
          "Khi xác thực Face ID, bạn đồng ý khóa vĩnh viễn thẻ cũ, phát hành thẻ số mới và tạo hồ sơ tra soát."
        ) : (
          "Face ID giúp xác nhận chính bạn đang yêu cầu khôi phục thẻ và tăng giám sát phiên."
        )}
      </p>

      <div className="liveness-steps" aria-label="Các bước kiểm tra Face ID">
        {[
          { label: "Phát hiện khuôn mặt", stepIndex: 2 },
          { label: "Kiểm tra liveness", stepIndex: 3 },
          { label: "Đối chiếu dữ liệu", stepIndex: 4 },
        ].map((step, idx) => {
          const isDone = activeStep >= step.stepIndex;
          const isPending = activeStep === step.stepIndex - 1;
          const isStepFailed = activeStep === 5 && idx === 2; // last step fails
          return (
            <span 
              key={step.label} 
              className={`${isDone ? "is-complete" : ""} ${isStepFailed ? "is-failed" : ""}`}
              style={{ display: "flex", alignItems: "center", width: "100%" }}
            >
              {isStepFailed ? (
                <XCircle size={15} aria-hidden="true" style={{ color: "#ff3b30", marginRight: "8px" }} />
              ) : (
                <CheckCircle2 size={15} aria-hidden="true" style={{ marginRight: "8px", color: isDone ? "#1fd89a" : "var(--color-muted)" }} />
              )}
              <span>{step.label}</span>
              {isPending && <Loader2 size={12} className="spin" style={{ marginLeft: "auto", color: "#00d8ff" }} />}
            </span>
          );
        })}
      </div>

      {isFailed ? (
        <p className="inline-alert">Face ID chưa thành công. Chưa có hành động L3 nào được chạy.</p>
      ) : null}

      <div className="action-stack">
        <PrimaryButton
          icon={isVerified ? <CheckCircle2 size={18} /> : <ScanFace size={18} />}
          onClick={() => startScanning(false)}
          disabled={isProcessing || isVerified || isScanning}
        >
          {isVerified ? "Đã xác thực" : isScanning ? "Đang xác thực..." : "Xác thực Face ID"}
        </PrimaryButton>
        <PrimaryButton
          icon={<RotateCcw size={18} />}
          onClick={() => startScanning(true)}
          variant="ghost"
          disabled={isProcessing || isVerified || isScanning}
        >
          Mô phỏng thất bại
        </PrimaryButton>
      </div>
    </section>
  );
}
