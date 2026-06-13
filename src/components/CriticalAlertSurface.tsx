import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ShieldAlert, Bell, ShieldCheck, AlertTriangle } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import { KnightAgentVisual } from "./KnightAgentVisual";
import { KnightLogoMini } from "./KnightLogoMini";

// Webkit AudioContext type augmentation
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface CriticalAlertSurfaceProps {
  state: KnightScenarioState;
  onOpenApp: () => void;
  /** Pre-unlocked audio element from useAlarmAudio() — legacy prop, still accepted */
  alarmAudio: React.RefObject<HTMLAudioElement | null>;
}

// ── Web Audio siren synthesizer ──────────────────────────────────────────────
// Uses AudioContext directly — no file loading, no autoplay restriction.
// The first user interaction after mount automatically creates the context.
function useWebAudioSiren() {
  const ctxRef   = useRef<AudioContext | null>(null);
  const gainRef  = useRef<GainNode | null>(null);
  const oscRef   = useRef<OscillatorNode | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [muted,   setMuted]   = useState(false);
  const mutedRef = useRef(false);

  const getCtx = useCallback((): AudioContext | null => {
    if (import.meta.env.MODE === "test") return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) {
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const start = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx || oscRef.current) return;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.06);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.connect(gain);
    osc.start();

    gainRef.current = gain;
    oscRef.current  = osc;
    setPlaying(true);

    let hi = false;
    timerRef.current = window.setInterval(() => {
      if (!oscRef.current || !gainRef.current || !ctxRef.current) return;
      hi = !hi;
      const now = ctxRef.current.currentTime;
      oscRef.current.frequency.setTargetAtTime(hi ? 1400 : 720, now, 0.04);
      gainRef.current.gain.setTargetAtTime(hi ? 0.068 : 0.042, now, 0.035);
    }, 240);
  }, [getCtx]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    const osc  = oscRef.current;
    const gain = gainRef.current;
    const ctx  = ctxRef.current;
    if (osc && gain && ctx) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0.0001, now, 0.04);
      window.setTimeout(() => { try { osc.stop(); } catch { /* ignore */ } }, 100);
    }
    oscRef.current  = null;
    gainRef.current = null;
    setPlaying(false);
  }, []);

  // Auto-start on mount via click/touch fallback
  const tryStart = useCallback(() => {
    if (!mutedRef.current && !oscRef.current) start();
  }, [start]);

  // Attempt immediate start (works on desktop Chrome); iOS needs a tap first.
  useEffect(() => {
    if (import.meta.env.MODE === "test") return;
    // Short timeout so the browser has processed the gesture that opened the alert
    const id = window.setTimeout(start, 80);
    return () => {
      window.clearTimeout(id);
      stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: any tap starts the siren
  useEffect(() => {
    window.addEventListener("touchstart", tryStart, { passive: true });
    window.addEventListener("click",      tryStart);
    return () => {
      window.removeEventListener("touchstart", tryStart);
      window.removeEventListener("click",      tryStart);
    };
  }, [tryStart]);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (mutedRef.current) {
      mutedRef.current = false;
      setMuted(false);
      start();
    } else {
      mutedRef.current = true;
      setMuted(true);
      stop();
    }
  }, [start, stop]);

  return { playing, muted, toggle };
}

// ─────────────────────────────────────────────────────────────────────────────

export function CriticalAlertSurface({ state, onOpenApp }: CriticalAlertSurfaceProps) {
  useWebAudioSiren();

  return (
    <>
      {/* ── Full-screen danger flash — rendered outside phone frame ── */}
      {createPortal(
        <div className="screen-flash-overlay" aria-hidden="true" />,
        document.body
      )}

      <section
        className="screen screen--lockscreen"
        aria-labelledby="critical-alert-title"
      >
        {/* ── Lockscreen clock ── */}
        <div className="lockscreen-clock">
          <span className="lockscreen-time">02:00</span>
          <span className="lockscreen-date">Chủ Nhật, 11 tháng 6</span>
        </div>

        {/* ── iOS-style notification card ── */}
        <div
          className="ios-notification"
          onClick={onOpenApp}
          role="button"
          tabIndex={0}
          aria-label="Nhấn để xem cảnh báo bảo mật"
        >
          <div className="ios-notification__header">
            <div className="ios-notification__app-info">
              <KnightLogoMini size={18} className="ios-notification__logo" />
              <span className="ios-notification__app-name">Co-opBank KNIGHT</span>
            </div>
            <span className="ios-notification__time">Vừa xong</span>
          </div>
          <div className="ios-notification__body">
            <strong className="ios-notification__merchant">
              {state.transaction.merchantName} · {formatVnd(state.transaction.amountVnd)}
            </strong>
            <p className="ios-notification__message" style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "normal" }}>
              Giao dịch bất thường vừa bị chặn. Thẻ số đã được tạm khóa.
            </p>
            <div className="ios-notification__status">
              <ShieldAlert size={14} />
              <span>Thẻ số đã được tạm khóa</span>
            </div>
          </div>
        </div>

        <div className="lockscreen-cta-pill" style={{ display: "none" }} aria-hidden="true" />

        <div className="lockscreen-footer">
          <Bell size={12} />
          <span>Nhấn vào thông báo hoặc popup để mở Co-opBank</span>
        </div>

        {/* ══════════════════════════════════════════════
             Emergency Alert Popup Modal
        ══════════════════════════════════════════════ */}
        <div className="critical-alert-overlay">
          <div className="critical-alert-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header: live badge */}
            <div className="ca-header">
              <div className="ca-live-badge">
                <span className="ca-live-dot" />
                KNIGHT · CẢNH BÁO KHẨN
              </div>
            </div>

            {/* Animated AI Agent */}
            <div className="popup-agent-wrap">
              <KnightAgentVisual state={state} variant="mobile" />
              <div className="popup-bell-overlay" aria-hidden="true">
                <Bell size={20} strokeWidth={2.2} />
              </div>
            </div>

            {/* Title */}
            <h2 id="critical-alert-title" className="ca-title">
              Giao dịch bất thường<br /> vừa bị chặn
            </h2>

            <div className="ca-risk-badge">
              <AlertTriangle size={11} />
              Risk Score: 847 / 1000
            </div>

            {/* Transaction info */}
            <div className="ca-txn-card">
              <div className="ca-txn-row">
                <span className="ca-txn-label">Giao dịch</span>
                <span className="ca-txn-value">{state.transaction.merchantName}</span>
              </div>
              <div className="ca-txn-row">
                <span className="ca-txn-label">Số tiền</span>
                <span className="ca-txn-value ca-txn-amount">{formatVnd(state.transaction.amountVnd)}</span>
              </div>
              <div className="ca-txn-row" style={{ flexDirection: "column", alignItems: "stretch", marginTop: "4px" }}>
                <span className="ca-txn-label" style={{ marginBottom: "6px" }}>Dấu hiệu bất thường</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", color: "#fda29b", paddingLeft: "8px", borderLeft: "2px solid #f04438" }}>
                  {state.riskAssessment.signals.map((sig) => (
                    <div key={sig.code} style={{ lineHeight: "1.4" }}>
                      • <strong>{sig.label}:</strong> {sig.customerText}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Protection notice */}
            <div className="ca-protection">
              <ShieldCheck size={13} />
              <span>KNIGHT đã tự động tạm khóa thẻ số của bạn (Policy L2)</span>
            </div>



            {/* CTA */}
            <button
              type="button"
              id="open-coopbank-btn"
              className="critical-cta-btn"
              onClick={onOpenApp}
            >
              Mở Co-opBank
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
