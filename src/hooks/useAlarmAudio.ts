import { useCallback, useEffect, useMemo, useRef } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface AlarmAudioController {
  startAlarm: () => void;
  stopAlarm: () => void;
  unlock: () => void;
  isUnlocked: () => boolean;
}

export function useAlarmAudio(): AlarmAudioController {
  const contextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sweepTimerRef = useRef<number | undefined>(undefined);
  const unlockedRef = useRef(false);

  const getContext = useCallback(() => {
    if (import.meta.env.MODE === "test") return null;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!contextRef.current) {
      contextRef.current = new AudioContextClass();
    }

    return contextRef.current;
  }, []);

  const unlock = useCallback(() => {
    const context = getContext();
    if (!context) return;

    const markUnlocked = () => {
      const now = context.currentTime;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.00001, now);
      gain.connect(context.destination);

      const oscillator = context.createOscillator();
      oscillator.frequency.setValueAtTime(1, now);
      oscillator.connect(gain);
      oscillator.start(now);
      oscillator.stop(now + 0.03);
      oscillator.onended = () => gain.disconnect();
      unlockedRef.current = true;
    };

    if (context.state === "suspended") {
      void context.resume().catch(() => {});
    }

    markUnlocked();
  }, [getContext]);

  const stopAlarm = useCallback(() => {
    if (sweepTimerRef.current) {
      window.clearInterval(sweepTimerRef.current);
      sweepTimerRef.current = undefined;
    }

    const oscillator = oscillatorRef.current;
    const gain = gainRef.current;
    const context = contextRef.current;

    oscillatorRef.current = null;
    gainRef.current = null;

    if (!oscillator || !gain || !context) return;

    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, 0.04);

    window.setTimeout(() => {
      try {
        oscillator.stop();
      } catch {
        // The browser may already have stopped it while suspending audio.
      }
      gain.disconnect();
    }, 120);
  }, []);

  const startWithRunningContext = useCallback((context: AudioContext) => {
    if (oscillatorRef.current) return;

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.05);
    gain.connect(context.destination);

    const oscillator = context.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.connect(gain);
    oscillator.start(now);

    gainRef.current = gain;
    oscillatorRef.current = oscillator;

    let highTone = false;
    sweepTimerRef.current = window.setInterval(() => {
      if (!oscillatorRef.current || !gainRef.current || !contextRef.current) return;

      highTone = !highTone;
      const tickNow = contextRef.current.currentTime;
      oscillatorRef.current.frequency.cancelScheduledValues(tickNow);
      oscillatorRef.current.frequency.setTargetAtTime(highTone ? 1400 : 720, tickNow, 0.04);
      gainRef.current.gain.cancelScheduledValues(tickNow);
      gainRef.current.gain.setTargetAtTime(highTone ? 0.08 : 0.048, tickNow, 0.035);
    }, 240);
  }, []);

  const startAlarm = useCallback(() => {
    const context = getContext();
    if (!context) return;

    if (context.state === "suspended") {
      // First, unlock the context synchronously using a short beep
      unlock();

      // Then, resume and play the siren asynchronously.
      // Since the context is now unlocked (by the synchronous beep above),
      // the asynchronous start will be allowed by iOS Safari!
      void context.resume().then(() => {
        unlockedRef.current = true;
        startWithRunningContext(context);
      }).catch(() => {});

      return;
    }

    unlockedRef.current = true;
    startWithRunningContext(context);
  }, [getContext, unlock, startWithRunningContext]);

  useEffect(() => {
    window.addEventListener("pointerdown", unlock, { passive: true, capture: true });
    window.addEventListener("touchstart", unlock, { passive: true, capture: true });
    window.addEventListener("click", unlock, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("touchstart", unlock, { capture: true });
      window.removeEventListener("click", unlock, { capture: true });
      stopAlarm();
      void contextRef.current?.close();
      contextRef.current = null;
    };
  }, [stopAlarm, unlock]);

  return useMemo(() => ({
    startAlarm,
    stopAlarm,
    unlock,
    isUnlocked: () => unlockedRef.current,
  }), [startAlarm, stopAlarm, unlock]);
}
