import { useEffect } from "react";
import type { AlarmAudioController } from "../../shared/lib/audio/useAlarmAudio";
import type { ScenarioStateName } from "../../domain/types";

const alarmStates: ScenarioStateName[] = [
  "risk_detected",
  "card_suspended_l2",
  "awaiting_customer_response",
  "customer_confirms_fraud",
  "customer_confirms_legit",
  "biometric_required",
];

interface UseAlarmControllerOptions {
  alarmAudio: AlarmAudioController;
  currentState: ScenarioStateName;
  isTestMode: boolean;
  showCriticalAlert: boolean;
  showUnlockedAlert: boolean;
}

export function useAlarmController({
  alarmAudio,
  currentState,
  isTestMode,
  showCriticalAlert,
  showUnlockedAlert,
}: UseAlarmControllerOptions) {
  useEffect(() => {
    if (isTestMode) return;

    const shouldPlay =
      (showCriticalAlert || showUnlockedAlert || alarmStates.includes(currentState)) &&
      currentState !== "idle_monitoring";

    if (shouldPlay) {
      alarmAudio.startAlarm();

      const triggerAlarm = () => {
        alarmAudio.startAlarm();
      };

      window.addEventListener("pointerdown", triggerAlarm, { passive: true, capture: true });
      window.addEventListener("touchstart", triggerAlarm, { passive: true, capture: true });
      window.addEventListener("click", triggerAlarm, { capture: true });

      return () => {
        window.removeEventListener("pointerdown", triggerAlarm, { capture: true });
        window.removeEventListener("touchstart", triggerAlarm, { capture: true });
        window.removeEventListener("click", triggerAlarm, { capture: true });
      };
    }

    alarmAudio.stopAlarm();
  }, [showCriticalAlert, showUnlockedAlert, currentState, alarmAudio, isTestMode]);
}
