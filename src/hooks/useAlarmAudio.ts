import { useRef, useEffect, useCallback } from "react";

// ── Build repeating ding-dong WAV Blob URL ───────────────────────────────────
function buildAlarmBlobUrl(): string {
  const SR = 22050;
  const DING = 1050, DONG = 740;
  const dingN  = Math.floor(SR * 0.28);
  const gapN   = Math.floor(SR * 0.11);
  const dongN  = Math.floor(SR * 0.22);
  const pauseN = Math.floor(SR * 0.52);
  const cycleN = dingN + gapN + dongN + pauseN;
  const CYCLES = 7;
  const total  = cycleN * CYCLES;

  const ab = new ArrayBuffer(44 + total * 2);
  const v  = new DataView(ab);
  const ws = (off: number, s: string) => { for (let i=0;i<s.length;i++) v.setUint8(off+i, s.charCodeAt(i)); };

  ws(0,"RIFF"); v.setUint32(4, 36+total*2, true); ws(8,"WAVE");
  ws(12,"fmt "); v.setUint32(16, 16, true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,SR,true); v.setUint32(28,SR*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true);
  ws(36,"data"); v.setUint32(40, total*2, true);

  const env = (i: number, n: number) => Math.min(1, (i/SR)*30) * Math.min(1, ((n-i)/SR)*30);

  for (let c = 0; c < CYCLES; c++) {
    const base = c * cycleN;
    for (let i = 0; i < dingN; i++) {
      const s = Math.sin(2*Math.PI*DING*(i/SR)) * env(i,dingN) * 0.82;
      v.setInt16(44+(base+i)*2, Math.round(s*32767), true);
    }
    const d2 = base + dingN + gapN;
    for (let i = 0; i < dongN; i++) {
      const s = Math.sin(2*Math.PI*DONG*(i/SR)) * env(i,dongN) * 0.72;
      v.setInt16(44+(d2+i)*2, Math.round(s*32767), true);
    }
  }
  return URL.createObjectURL(new Blob([ab], { type:"audio/wav" }));
}

/**
 * useAlarmAudio
 * 
 * Pre-creates and unlocks an <audio> element during normal app interaction
 * so that CriticalAlertSurface can call .play() automatically on mount,
 * bypassing iOS Safari's "user gesture required" restriction.
 *
 * Strategy:
 *  1. Create audio element on first mount.
 *  2. On first user tap anywhere (touchstart / click), silently play+pause
 *     with audio.muted = true — this "unlocks" the audio session on iOS.
 *  3. When CriticalAlertSurface mounts, it calls audioRef.current.play()
 *     which now succeeds immediately (no tap needed).
 */
export function useAlarmAudio() {
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef  = useRef<string | null>(null);
  const unlockedRef = useRef(false);

  // Create audio element once
  useEffect(() => {
    if (import.meta.env.MODE === "test") return;
    const url = buildAlarmBlobUrl();
    blobUrlRef.current = url;

    const audio = new Audio(url);
    audio.loop   = true;
    audio.volume = 1.0;
    audio.setAttribute("playsinline",        "");
    audio.setAttribute("webkit-playsinline", "");
    audioRef.current = audio;

    // Try immediate autoplay (Chrome / desktop)
    audio.play().then(() => {
      // Desktop: playing immediately — pause, rewind. Alert will resume.
      audio.pause();
      audio.currentTime = 0;
      unlockedRef.current = true;
    }).catch(() => {
      // iOS: will be unlocked on first user interaction below
    });

    return () => {
      audio.pause();
      audio.src = "";
      URL.revokeObjectURL(url);
      blobUrlRef.current = null;
    };
  }, []);

  // Unlock on first user gesture (muted play → pause → unmute trick)
  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = true;
    audio.play()
      .then(() => {
        audio.pause();
        audio.muted  = false;
        audio.currentTime = 0;
        unlockedRef.current = true;
      })
      .catch(() => {
        audio.muted = false;
        // Even if this fails, mark as attempted
      });
  }, []);

  useEffect(() => {
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("click",      unlock);
    return () => {
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("click",      unlock);
    };
  }, [unlock]);

  return audioRef;
}
