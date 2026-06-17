import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { CheckCircle2, KeyRound, Loader2, ScanFace, XCircle } from "lucide-react";
import { formatVnd } from "../../../domain/format";
import { PrimaryButton } from "../../../shared/ui";
import "./FaceIdVerificationScreen.css";

interface FaceIdVerificationScreenProps {
  riskScore: number;
  aiLevel: string;
  explanation: string;
  recipientName: string;
  amount: number;
  onSuccess: () => void;
  onBack: () => void;
  /** When true: pre-confirm Face ID (no risk info shown), when false: triggered by AI risk detection */
  isPreCheck?: boolean;
  isAiPending?: boolean;
  autoStart?: boolean;
  isPopup?: boolean;
}

type FaceScanStep = "idle" | "detecting" | "liveness" | "matching" | "success" | "failed";

export function FaceIdVerificationScreen({
  riskScore,
  aiLevel,
  explanation,
  recipientName,
  amount,
  onSuccess,
  onBack,
  isPreCheck = false,
  isAiPending = false,
  autoStart = false,
  isPopup = false,
}: FaceIdVerificationScreenProps) {
  const [scanStep, setScanStep] = useState<FaceScanStep>("idle");
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pinDigits, setPinDigits] = useState<string[]>(["" ,"", "", "", "", ""]);
  const [pinError, setPinError] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pinBoxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const autoStartedRef = useRef(false);
  const startScanRef = useRef<() => void>(() => {});

  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  const scheduleStep = (fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timersRef.current.push(t);
  };

  const consumeForcedFaceIdFailure = () => {
    if (typeof window === "undefined") return false;
    if (window.sessionStorage.getItem("knight_transfer_faceid_result") !== "fail_once") return false;
    window.sessionStorage.removeItem("knight_transfer_faceid_result");
    return true;
  };

  const startScan = () => {
    if (scanStep !== "idle" && scanStep !== "failed") return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPinError(false);
    setScanStep("detecting");
    const delays = import.meta.env.MODE === "test"
      ? { liveness: 90, matching: 180, outcome: 300, callback: 40 }
      : { liveness: 900, matching: 1900, outcome: 2900, callback: 700 };
    scheduleStep(() => setScanStep("liveness"), delays.liveness);
    scheduleStep(() => setScanStep("matching"), delays.matching);
    scheduleStep(() => {
      if (consumeForcedFaceIdFailure()) {
        setScanStep("failed");
        return;
      }
      setScanStep("success");
      scheduleStep(() => onSuccess(), delays.callback);
    }, delays.outcome);
  };
  useEffect(() => {
    startScanRef.current = startScan;
  });

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    const timerId = setTimeout(() => startScanRef.current(), 0);
    return () => clearTimeout(timerId);
  }, [autoStart]);

  const handlePinSubmit = () => {
    const pin = pinDigits.join("");
    if (pin === "123456") {
      setScanStep("success");
      setTimeout(() => onSuccess(), 700);
    } else {
      setPinError(true);
      setPinDigits(["", "", "", "", "", ""]);
      setTimeout(() => {
        setPinError(false);
        pinBoxRefs.current[0]?.focus();
      }, 1200);
    }
  };

  const handlePinDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pinDigits];
    next[index] = digit;
    setPinDigits(next);
    setPinError(false);
    if (digit && index < 5) {
      pinBoxRefs.current[index + 1]?.focus();
    }
    // Auto-submit when last digit filled
    if (digit && index === 5) {
      const full = next.join("");
      if (full.length === 6) setTimeout(() => {
        if (full === "123456") {
          setScanStep("success");
          setTimeout(() => onSuccess(), 700);
        } else {
          setPinError(true);
          setPinDigits(["", "", "", "", "", ""]);
          setTimeout(() => {
            setPinError(false);
            pinBoxRefs.current[0]?.focus();
          }, 1200);
        }
      }, 80);
    }
  };

  const handlePinKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (pinDigits[index]) {
        const next = [...pinDigits];
        next[index] = "";
        setPinDigits(next);
      } else if (index > 0) {
        pinBoxRefs.current[index - 1]?.focus();
        const next = [...pinDigits];
        next[index - 1] = "";
        setPinDigits(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      pinBoxRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      pinBoxRefs.current[index + 1]?.focus();
    }
  };

  const handlePinPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...pinDigits];
    text.split("").forEach((ch, i) => { next[i] = ch; });
    setPinDigits(next);
    const focusIdx = Math.min(text.length, 5);
    pinBoxRefs.current[focusIdx]?.focus();
  };

  const isScanning = scanStep === "detecting" || scanStep === "liveness" || scanStep === "matching";
  const isSuccess = scanStep === "success";
  const isFailed = scanStep === "failed";

  const stepLabels = [
    { key: "detecting" as FaceScanStep, label: "Phát hiện khuôn mặt" },
    { key: "liveness" as FaceScanStep, label: "Kiểm tra liveness" },
    { key: "matching" as FaceScanStep, label: "Đối chiếu dữ liệu" },
  ];
  const stepOrder: FaceScanStep[] = ["detecting", "liveness", "matching", "success"];
  const currentStepIdx = stepOrder.indexOf(scanStep);

  return (
    <div className={isPopup ? "faceid-verify-screen faceid-verify-screen--popup" : "tab-content dashboard-transfer faceid-verify-screen"}>
      {/* Header — pre-check: clean title; post-check: risk info */}
      {isPreCheck ? (
        <div className="faceid-verify__precheck-header">
          <div className="faceid-verify__precheck-icon">
            <ScanFace size={28} />
          </div>
          <div>
            <h2 className="faceid-verify__precheck-title">Xác thực danh tính</h2>
            <p className="faceid-verify__explanation">Quét khuôn mặt để xác nhận chính bạn đang thực hiện giao dịch này.</p>
          </div>
        </div>
      ) : (
        <div className="faceid-verify__header">
          <div className="faceid-verify__risk-badge">
            <span>Rủi ro: {riskScore}/100</span>
            <span className="faceid-verify__ai-level">{aiLevel}</span>
          </div>
          <p className="faceid-verify__explanation">{explanation}</p>
        </div>
      )}

      {/* Transaction Summary — always visible */}
      <div className="faceid-verify__txn-summary">
        <div className="faceid-verify__txn-row">
          <span>Người nhận</span>
          <strong>{recipientName}</strong>
        </div>
        <div className="faceid-verify__txn-row faceid-verify__txn-amount">
          <span>Số tiền</span>
          <strong className="faceid-verify__amount-value">{formatVnd(amount)}</strong>
        </div>
      </div>

      {!showPinFallback ? (
        <>
          {/* Face Scanner */}
          <div
            className={`faceid-verify__scanner ${isScanning ? "faceid-verify__scanner--scanning" : ""} ${isSuccess ? "faceid-verify__scanner--success" : ""} ${isFailed ? "faceid-verify__scanner--failed" : ""}`}
          >
            {/* Corner brackets */}
            <div className="faceid-scan-brackets">
              <span className="fsc-bracket fsc-bracket--tl" />
              <span className="fsc-bracket fsc-bracket--tr" />
              <span className="fsc-bracket fsc-bracket--bl" />
              <span className="fsc-bracket fsc-bracket--br" />
            </div>

            {/* Sweep line */}
            {isScanning && <div className="faceid-scan-sweep" />}

            {/* Oval + icon */}
            <div className="faceid-scan-oval">
              {isSuccess ? (
                <div className="faceid-scan-icon faceid-scan-icon--success">
                  <CheckCircle2 size={52} />
                </div>
              ) : isFailed ? (
                <div className="faceid-scan-icon faceid-scan-icon--failed">
                  <XCircle size={52} />
                </div>
              ) : (
                <div className={`faceid-scan-icon ${isScanning ? "faceid-scan-icon--scanning" : "faceid-scan-icon--idle"}`}>
                  <ScanFace size={52} />
                </div>
              )}
            </div>

            {/* Status label */}
            <div className="faceid-scan-status">
              {isSuccess && <><CheckCircle2 size={14} /><span>Xác thực thành công</span></>}
              {isFailed && <><XCircle size={14} /><span>Không nhận dạng được</span></>}
              {scanStep === "idle" && <><ScanFace size={14} /><span>Nhìn thẳng vào camera</span></>}
              {scanStep === "detecting" && <><Loader2 size={14} className="spin" /><span>Đang phát hiện khuôn mặt...</span></>}
              {scanStep === "liveness" && <><Loader2 size={14} className="spin" /><span>Kiểm tra liveness...</span></>}
              {scanStep === "matching" && <><Loader2 size={14} className="spin" /><span>Đang đối chiếu eKYC...</span></>}
            </div>
          </div>

          {/* Step indicators */}
          {(isScanning || isSuccess) && (
            <div className="faceid-verify__steps">
              {stepLabels.map((step, i) => {
                const done = currentStepIdx > i || isSuccess;
                const active = stepOrder[currentStepIdx] === step.key;
                return (
                  <div key={step.key} className={`faceid-step ${done ? "faceid-step--done" : active ? "faceid-step--active" : ""}`}>
                    {done
                      ? <CheckCircle2 size={13} />
                      : active
                        ? <Loader2 size={13} className="spin" />
                        : <div className="faceid-step-dot" />
                    }
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="action-stack" style={{ marginTop: "20px" }}>
            {scanStep === "idle" && (
              <button type="button" className="faceid-scan-trigger" onClick={startScan} id="faceid-scan-btn">
                <ScanFace size={20} />
                Xác thực Face ID
              </button>
            )}
            {isScanning && (
              <button type="button" className="faceid-scan-trigger faceid-scan-trigger--scanning" disabled>
                <Loader2 size={20} className="spin" />
                Đang xác thực...
              </button>
            )}
            {isFailed && (
              <button type="button" className="faceid-scan-trigger faceid-scan-trigger--retry" onClick={startScan}>
                <ScanFace size={20} />
                Thử lại Face ID
              </button>
            )}
            {isFailed && (
              <button
                type="button"
                className="faceid-pin-fallback-link"
                onClick={() => { setShowPinFallback(true); setScanStep("idle"); }}
              >
                <KeyRound size={14} />
                Dùng mã PIN thay thế
              </button>
            )}
            {isSuccess && isAiPending && (
              <p className="faceid-pin-hint" role="status">
                KNIGHT AI đang hoàn tất xác thực giao dịch...
              </p>
            )}
            <PrimaryButton variant="secondary" onClick={onBack} disabled={isScanning || isSuccess}>
              Quay lại chỉnh sửa
            </PrimaryButton>
          </div>
        </>
      ) : (
        /* PIN Fallback */
        <div className="faceid-pin-fallback">
          <div className="faceid-pin-icon">
            <KeyRound size={36} />
          </div>
          <h3>Nhập mã PIN giao dịch</h3>
          <p>Nhập 6 số mã PIN để xác nhận chuyển tiền</p>

          <div className={`pin-boxes ${pinError ? "pin-boxes--error" : ""}`}>
            {pinDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { pinBoxRefs.current[i] = el; }}
                className="pin-box"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                autoFocus={i === 0}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                aria-label={`Số thứ ${i + 1}`}
                onChange={(e) => handlePinDigitChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                onPaste={i === 0 ? handlePinPaste : undefined}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>

          {pinError && <span className="faceid-pin-error">Mã PIN không đúng. Vui lòng thử lại.</span>}
          <p className="faceid-pin-hint">Gợi ý demo: nhập <strong>123456</strong></p>

          <div className="action-stack" style={{ marginTop: "16px" }}>
            <PrimaryButton disabled={pinDigits.join("").length < 6 || isSuccess} onClick={handlePinSubmit}>
              {isSuccess ? "Đã xác thực" : "Xác nhận PIN"}
            </PrimaryButton>
            <button type="button" className="faceid-pin-fallback-link" onClick={() => { setShowPinFallback(false); setPinDigits(["", "", "", "", "", ""]); }}>
              <ScanFace size={14} />
              Quay lại dùng Face ID
            </button>
            <PrimaryButton variant="secondary" onClick={onBack}>
              Quay lại chỉnh sửa
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── End FaceIdVerificationScreen ───────────────────────────────────────────
