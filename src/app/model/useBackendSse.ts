import { useEffect, type Dispatch, type SetStateAction } from "react";
import { buildBackendUrl } from "../../shared/api/backend";
import {
  createInitialKnightState,
  runScenarioEvents,
} from "../../domain/knightStateMachine";
import type { KnightEventType, KnightScenarioState } from "../../domain/types";

interface UseBackendSseOptions {
  applyEvents: (events: KnightEventType[]) => void;
  cancelActiveSequence: () => void;
  isTestMode: boolean;
  reset: () => void;
  setShowCriticalAlert: Dispatch<SetStateAction<boolean>>;
  setShowUnlockedAlert: Dispatch<SetStateAction<boolean>>;
  setState: Dispatch<SetStateAction<KnightScenarioState>>;
}

export function useBackendSse({
  applyEvents,
  cancelActiveSequence,
  isTestMode,
  reset,
  setShowCriticalAlert,
  setShowUnlockedAlert,
  setState,
}: UseBackendSseOptions) {
  useEffect(() => {
    if (isTestMode) {
      console.log("Test mode: bypassing backend SSE server connection");
      return;
    }

    const eventsUrl = buildBackendUrl("/events");

    if (!eventsUrl) {
      console.log("Backend URL is not configured for this HTTPS origin.");
      return;
    }

    const eventSource = new EventSource(eventsUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "demo-flow" && data.events) {
          const events = data.events as KnightEventType[];
          cancelActiveSequence();
          setShowCriticalAlert(Boolean(data.showCriticalAlert));
          setShowUnlockedAlert(false);
          setState(runScenarioEvents(createInitialKnightState(), events));
        } else if (data.type === "trigger" && data.events) {
          const events = data.events as KnightEventType[];

          if (events.includes("RESET_SCENARIO")) {
            reset();
          } else if (events.includes("RISK_EVENT_RECEIVED")) {
            cancelActiveSequence();
            setShowCriticalAlert(true);
            setShowUnlockedAlert(false);
            setState((currentState) => {
              const baseState = currentState.currentState === "idle_monitoring" ? currentState : createInitialKnightState();
              return runScenarioEvents(baseState, events);
            });
          } else {
            setShowCriticalAlert(false);
            setShowUnlockedAlert(false);
            applyEvents(events);
          }
        }
      } catch (err) {
        console.error("Error parsing backend event:", err);
      }
    };

    eventSource.onerror = () => {
      console.log("Disconnected from backend. Reconnecting...");
    };

    return () => {
      eventSource.close();
    };
  }, [
    applyEvents,
    cancelActiveSequence,
    isTestMode,
    reset,
    setShowCriticalAlert,
    setShowUnlockedAlert,
    setState,
  ]);
}
