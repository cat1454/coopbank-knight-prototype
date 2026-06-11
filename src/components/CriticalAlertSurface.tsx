import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldAlert, Bell, Volume2, VolumeX, ShieldCheck, AlertTriangle } from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import { KnightAgentVisual } from "./KnightAgentVisual";

interface CriticalAlertSurfaceProps {
  state: KnightScenarioState;
  onOpenApp: () => void;
  /** Pre-unlocked audio element from useAlarmAudio() — plays automatically on mount */
  alarmAudio: React.RefObject<HTMLAudioElement | null>;
}

export function CriticalAlertSurface({ state, onOpenApp, alarmAudio }: CriticalAlertSurfaceProps) {
  const [isMuted,   setIsMuted]   = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isMutedRef = useRef(false);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // ── Auto-start alarm on mount ─────────────────────────────────────────────
  // alarmAudio was pre-unlocked during login interactions (see useAlarmAudio).
  // So play() here succeeds automatically on iOS — no tap needed.
  useEffect(() => {
    if (import.meta.env.MODE === "test") return;
    const audio = alarmAudio.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.muted = false;
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        // Edge case: audio not yet unlocked — global touch listener below handles it
        console.warn("[KNIGHT alarm] autoplay blocked; waiting for tap");
      });

    return () => {
      // Stop alarm when user opens the app (screen unmounts)
      audio.pause();
      audio.currentTime = 0;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fallback: tap anywhere to start if autoplay was blocked ───────────────
  const tryPlay = useCallback(() => {
    if (isMutedRef.current) return;
    const audio = alarmAudio.current;
    if (!audio || !audio.paused) return;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [alarmAudio]);

  useEffect(() => {
    window.addEventListener("touchstart", tryPlay, { passive: true });
    window.addEventListener("click",      tryPlay);
    return () => {
      window.removeEventListener("touchstart", tryPlay);
      window.removeEventListener("click",      tryPlay);
    };
  }, [tryPlay]);

  // ── Mute / unmute ─────────────────────────────────────────────────────────
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = alarmAudio.current;
    if (!audio) return;

    if (isMuted) {
      isMutedRef.current = false;
      setIsMuted(false);
      audio.muted = false;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      isMutedRef.current = true;
      setIsMuted(true);
      audio.pause();
      setIsPlaying(false);
    }
  };

  const needsTap  = !isMuted && !isPlaying;
  const isRinging = !isMuted &&  isPlaying;

  return (
    <section
      className="screen screen--lockscreen"
      aria-labelledby="critical-alert-title"
    >
      {/* ── Lockscreen clock ── */}
      <div className="lockscreen-clock">
        <span className="lockscreen-time">02:00</span>
        <span className="lockscreen-date">Chủ Nhật, 11 tháng 6</span>
      </div>

      {/* ── Background iOS notification card (E2E / a11y) ── */}
      <div
        className="ios-notification"
        onClick={onOpenApp}
        role="button"
        tabIndex={0}
        aria-label="Nhấn để xem cảnh báo bảo mật"
      >
        <div className="ios-notification__header">
          <div className="ios-notification__app-info">
            <span className="ios-notification__logo">🛡️</span>
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

          {/* Header: live badge + mute button */}
          <div className="ca-header">
            <div className="ca-live-badge">
              <span className="ca-live-dot" />
              KNIGHT · CẢNH BÁO KHẨN
            </div>
            <button
              type="button"
              id="mute-btn"
              className={`ca-mute-btn${isMuted ? " is-muted" : ""}${needsTap ? " is-pulsing" : ""}`}
              onClick={toggleMute}
              aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>

          {/* Animated AI Agent — text hidden via CSS */}
          <div className="popup-agent-wrap">
            <KnightAgentVisual state={state} variant="mobile" />
            <div className="popup-bell-overlay" aria-hidden="true">
              <Bell size={20} strokeWidth={2.2} />
            </div>
          </div>

          {/* Title */}
          <h2 id="critical-alert-title" className="ca-title">
            Giao dịch bất thường<br />vừa bị chặn
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
            <div className="ca-txn-row">
              <span className="ca-txn-label">Dấu hiệu</span>
              <span className="ca-txn-value">Thiết bị mới · IP VPN · 02:00</span>
            </div>
          </div>

          {/* Protection notice */}
          <div className="ca-protection">
            <ShieldCheck size={13} />
            <span>KNIGHT đã tự động tạm khóa thẻ số của bạn (Policy L2)</span>
          </div>

          {/* Sound status */}
          {needsTap && (
            <p className="ca-sound-hint">🔔 Chạm bất kỳ đâu để bật còi báo</p>
          )}
          {isRinging && (
            <p className="ca-sound-hint ca-sound-hint--active">🔔 Còi báo đang phát…</p>
          )}

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
  );
}
