import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { AuditTimeline } from "../components/AuditTimeline";
import { BiometricStepUp } from "../components/BiometricStepUp";
import { CriticalAlertSurface } from "../components/CriticalAlertSurface";
import { FraudCaseSubmittedScreen } from "../components/FraudCaseSubmittedScreen";
import { FraudReviewScreen } from "../components/FraudReviewScreen";
import { GuardScreen } from "../components/GuardScreen";
import { LegitimateResolutionScreen } from "../components/LegitimateResolutionScreen";
import { NextMorningRecoveryScreen } from "../components/NextMorningRecoveryScreen";
import { PostIncidentBehaviorScreen } from "../components/PostIncidentBehaviorScreen";
import { ReassurancePackageScreen } from "../components/ReassurancePackageScreen";
import { TrustRecoveryAssessmentScreen } from "../components/TrustRecoveryAssessmentScreen";
import { TimeoutEscalationScreen } from "../components/TimeoutEscalationScreen";
import { UnlockedCriticalAlertPopup } from "../components/UnlockedCriticalAlertPopup";
import { VirtualCardScreen } from "../components/VirtualCardScreen";
import { BankLoginScreen } from "../components/BankLoginScreen";
import { BankDashboard } from "../components/BankDashboard";
import { KnightAgentVisual } from "../components/KnightAgentVisual";
import { KnightLogoMini } from "../components/KnightLogoMini";
import { useAlarmAudio } from "../hooks/useAlarmAudio";
import { CyberAttackDashboard } from "../components/CyberAttackDashboard";
import { buildBackendUrl } from "../services/backend";
import {
  createInitialKnightState,
  getVisibleScreen,
  runScenarioEvents,
  dispatchScenarioEvent,
} from "../domain/knightStateMachine";
import type { CustomerIntent, KnightEventType } from "../domain/types";
import {
  fraudResolutionEvents,
  getShotEvents,
  highRiskEvents,
  legitimateResolutionEvents,
  reviewEvents,
} from "./demoEventSequences";
import { createInitialBankTransactions, initialBankBalance } from "../data/bankingDemo";

export function App() {
  const isTestMode = useMemo(() => {
    return import.meta.env.MODE === "test" || 
           (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("env") === "test");
  }, []);

  const queryParams = useMemo(() => {
    return typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  }, []);

  const captureMode = useMemo<"split" | "phone" | "agent">(() => {
    const requestedMode = queryParams.get("capture");
    return requestedMode === "phone" || requestedMode === "agent" ? requestedMode : "split";
  }, [queryParams]);

  const requestedShot = queryParams.get("shot");

  // Pre-create and unlock alarm audio during normal usage so it auto-plays on iOS
  const alarmAudio = useAlarmAudio();

  const initialScenarioState = useMemo(() => {
    const shotEvents = getShotEvents(requestedShot);
    return shotEvents ? runScenarioEvents(createInitialKnightState(), shotEvents) : createInitialKnightState();
  }, [requestedShot]);

  const [state, setState] = useState(initialScenarioState);
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [showUnlockedAlert, setShowUnlockedAlert] = useState(false);
  const [showCyberSimulation, setShowCyberSimulation] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return requestedShot !== null && initialScenarioState.currentState !== "idle_monitoring";
  });
  const [selectedQtdnd, setSelectedQtdnd] = useState("QTDND Đà Nẵng");
  const [bankBalance, setBankBalance] = useState(initialBankBalance);
  const [normalTransactions, setNormalTransactions] = useState(createInitialBankTransactions);
  const visibleScreen = getVisibleScreen(state);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const activeSequenceId = useRef(0);

  const cancelActiveSequence = useCallback(() => {
    activeSequenceId.current++;
    setIsProcessing(false);
  }, []);

  const applyEvents = useCallback((events: KnightEventType[]) => {
    setState((currentState) => runScenarioEvents(currentState, events));
  }, []);

  const cancelServerEscalation = useCallback(() => {
    const cancelUrl = buildBackendUrl("/api/incidents/current/cancel");

    if (!cancelUrl) {
      return;
    }

    fetch(cancelUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "customer_response" }),
    }).catch(() => {
      // Ignore cancellation failures; local customer flow should continue.
    });
  }, []);

  const applyEventsSequentially = useCallback(async (events: KnightEventType[], delayMs = 1500) => {
    cancelActiveSequence();
    const seqId = ++activeSequenceId.current;
    
    // Check if we are in testing environment
    const actualDelay = isTestMode ? 0 : delayMs;
    
    setIsProcessing(true);
    
    for (const event of events) {
      if (seqId !== activeSequenceId.current) break;
      setState((currentState) => dispatchScenarioEvent(currentState, event));
      if (actualDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, actualDelay));
      }
    }
    
    if (seqId === activeSequenceId.current) {
      setIsProcessing(false);
    }
  }, [cancelActiveSequence, isTestMode]);

  const reset = useCallback(() => {
    cancelActiveSequence();
    setShowCriticalAlert(false);
    setShowUnlockedAlert(false);
    setShowCyberSimulation(false);
    setState(createInitialKnightState());
    setIsLoggedIn(false);
    setBankBalance(initialBankBalance);
    setNormalTransactions(createInitialBankTransactions());
  }, [cancelActiveSequence]);

  const startScenario = useCallback(() => {
    cancelActiveSequence();
    setShowCriticalAlert(true);
    setShowUnlockedAlert(false);
    setState((currentState) => {
      const baseState = currentState.currentState === "idle_monitoring" ? currentState : createInitialKnightState();
      return runScenarioEvents(baseState, highRiskEvents);
    });
  }, [cancelActiveSequence]);

  const openUnlockedAlert = useCallback(() => {
    setShowCriticalAlert(false);
    setIsLoggedIn(true);
    setShowUnlockedAlert(true);
  }, []);

  const openFraudReview = useCallback(() => {
    setShowCriticalAlert(false);
    setShowUnlockedAlert(false);
    setIsLoggedIn(true);
    setState((currentState) => {
      if (currentState.currentState === "risk_detected" || currentState.currentState === "card_suspended_l2") {
        return runScenarioEvents(currentState, reviewEvents);
      }

      return currentState;
    });
  }, []);

  const requestBiometric = useCallback(
    (intent: "fraud" | "legitimate") => {
      setShowCriticalAlert(false);
      setShowUnlockedAlert(false);
      cancelServerEscalation();
      applyEventsSequentially([intent === "fraud" ? "CUSTOMER_TAPS_FRAUD" : "CUSTOMER_TAPS_LEGIT", "REQUEST_BIOMETRIC"]);
    },
    [applyEventsSequentially, cancelServerEscalation],
  );

  const verifyBiometric = useCallback(
    (intent: CustomerIntent) => {
      if (intent === "fraud") {
        applyEventsSequentially(fraudResolutionEvents);
      }

      if (intent === "legitimate") {
        applyEventsSequentially(legitimateResolutionEvents);
      }
    },
    [applyEventsSequentially],
  );

  const showTimeline = useCallback(() => {
    applyEvents(["AUDIT_COMPLETE"]);
  }, [applyEvents]);

  const completeScenarioFlow = useCallback(() => {
    setIsTransitioning(true);
    const delay = isTestMode ? 0 : 600;
    if (delay === 0) {
      applyEvents(["AUDIT_COMPLETE"]);
      setIsTransitioning(false);
    } else {
      setTimeout(() => {
        applyEvents(["AUDIT_COMPLETE"]);
        setIsTransitioning(false);
      }, delay);
    }
  }, [applyEvents, isTestMode]);

  const observePostIncidentBehavior = useCallback(() => {
    applyEvents(["OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS"]);
  }, [applyEvents]);

  const returnToBankHomeAfterCardReview = useCallback(() => {
    applyEvents(["CREATE_CASE_SUCCESS"]);
  }, [applyEvents]);

  const openNextMorningRecovery = useCallback(() => {
    applyEvents(["OPEN_NEXT_MORNING_RECOVERY"]);
  }, [applyEvents]);

  const assessTrustRecovery = useCallback(() => {
    applyEvents(["ASSESS_TRUST_RECOVERY_SUCCESS"]);
  }, [applyEvents]);

  const activateReassurancePackage = useCallback(() => {
    applyEvents(["ACTIVATE_REASSURANCE_PACKAGE_SUCCESS"]);
  }, [applyEvents]);

  const activateEssentialCashback = useCallback(() => {
    applyEventsSequentially([
      "CUSTOMER_ACCEPTS_ESSENTIAL_CASHBACK",
      "ACTIVATE_ESSENTIAL_CASHBACK_SUCCESS",
      "OBSERVE_RECOVERY_SUCCESS",
      "COMPLETE_REACT_CYCLE",
    ], 900);
  }, [applyEventsSequentially]);

  // Connect to backend server SSE stream
  useEffect(() => {
    const isTestMode = import.meta.env.MODE === "test" || 
                       new URLSearchParams(window.location.search).get("env") === "test";

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
  }, [applyEvents, cancelActiveSequence, isTestMode, reset]);


  useEffect(() => {
    if (isTestMode) {
      return;
    }

    const url = new URL(window.location.href);

    if (url.searchParams.get("alert") !== "1") {
      return;
    }

    url.searchParams.delete("alert");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    const timeoutId = window.setTimeout(() => {
      startScenario();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isTestMode, startScenario]);


  // Centralized siren alarm playback and gesture unlocking control
  useEffect(() => {
    if (isTestMode) return;

    const alarmStates = [
      "risk_detected",
      "card_suspended_l2",
      "awaiting_customer_response",
      "customer_confirms_fraud",
      "customer_confirms_legit",
      "biometric_required",
    ];
    const shouldPlay =
      (showCriticalAlert || showUnlockedAlert || alarmStates.includes(state.currentState)) &&
      state.currentState !== "idle_monitoring";

    if (shouldPlay) {
      // Attempt to play immediately (works if context is already unlocked)
      alarmAudio.startAlarm();

      // Register window gesture listeners to start the alarm on first user interaction
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
    } else {
      alarmAudio.stopAlarm();
    }
  }, [showCriticalAlert, showUnlockedAlert, state.currentState, alarmAudio, isTestMode]);

  // Synchronize state updates to backend for real-time terminal logs
  useEffect(() => {
    const reportStateUrl = buildBackendUrl("/api/report-state");

    if (!reportStateUrl) {
      return;
    }

    fetch(reportStateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentState: state.currentState,
        auditEvents: state.auditEvents,
      }),
    }).catch(() => {
      // Ignore errors when server is not running
    });
  }, [state.currentState, state.auditEvents]);

  const screen = useMemo(() => {
    if (showCriticalAlert && state.currentState !== "idle_monitoring") {
      return <CriticalAlertSurface state={state} onOpenApp={openUnlockedAlert} />;
    }

    const dashboardScreen = (
      <BankDashboard
        state={state}
        selectedQtdnd={selectedQtdnd}
        onStartDemo={startScenario}
        onLogout={() => setIsLoggedIn(false)}
        balance={bankBalance}
        setBalance={setBankBalance}
        transactions={normalTransactions}
        setTransactions={setNormalTransactions}
      />
    );

    if (showUnlockedAlert && state.currentState !== "idle_monitoring") {
      return (
        <>
          {dashboardScreen}
          <UnlockedCriticalAlertPopup state={state} onContinue={openFraudReview} />
        </>
      );
    }

    switch (visibleScreen) {
      case "guard":
        return !isLoggedIn ? (
          isTestMode ? (
            <GuardScreen state={state} onStart={startScenario} />
          ) : (
            <BankLoginScreen
              onLogin={() => setIsLoggedIn(true)}
              selectedQtdnd={selectedQtdnd}
              setSelectedQtdnd={setSelectedQtdnd}
            />
          )
        ) : (
          dashboardScreen
        );
      case "critical-alert":
        return <CriticalAlertSurface state={state} onOpenApp={openUnlockedAlert} />;
      case "fraud-review":
        return (
          <FraudReviewScreen
            state={state}
            onConfirmFraud={() => requestBiometric("fraud")}
            onConfirmLegitimate={() => requestBiometric("legitimate")}
          />
        );
      case "biometric-step-up":
        return (
          <BiometricStepUp
            state={state}
            onFail={() => applyEvents(["BIOMETRIC_FAILED"])}
            onVerify={verifyBiometric}
            isProcessing={isProcessing}
          />
        );
      case "virtual-card":
        return (
          <VirtualCardScreen
            state={state}
            onShowOffer={returnToBankHomeAfterCardReview}
            isProcessing={isProcessing}
          />
        );
      case "fraud-case-submitted":
        return <FraudCaseSubmittedScreen state={state} onOpenNextMorning={openNextMorningRecovery} />;
      case "next-morning-recovery":
        return <NextMorningRecoveryScreen state={state} onObserveBehavior={observePostIncidentBehavior} />;
      case "post-incident-behavior":
        return <PostIncidentBehaviorScreen state={state} onAssessTrustRecovery={assessTrustRecovery} />;
      case "trust-recovery-assessment":
        return <TrustRecoveryAssessmentScreen state={state} onActivatePackage={activateReassurancePackage} />;
      case "reassurance-package":
        return (
          <ReassurancePackageScreen
            state={state}
            onActivateCashback={activateEssentialCashback}
            onComplete={completeScenarioFlow}
          />
        );
      case "audit-timeline":
        return <AuditTimeline state={state} onReset={reset} />;
      case "legitimate-resolution":
        return (
          <LegitimateResolutionScreen
            state={state}
            onReset={reset}
            onShowTimeline={showTimeline}
            isProcessing={isProcessing}
          />
        );
      case "timeout-escalation":
        return <TimeoutEscalationScreen state={state} onReset={reset} isProcessing={isProcessing} />;
      default:
        return <GuardScreen state={state} onStart={startScenario} />;
    }
  }, [
    applyEvents,
    activateEssentialCashback,
    activateReassurancePackage,
    assessTrustRecovery,
    bankBalance,
    isLoggedIn,
    normalTransactions,
    openNextMorningRecovery,
    observePostIncidentBehavior,
    openUnlockedAlert,
    openFraudReview,
    returnToBankHomeAfterCardReview,
    requestBiometric,
    reset,
    selectedQtdnd,
    showTimeline,
    showCriticalAlert,
    showUnlockedAlert,
    startScenario,
    state,
    verifyBiometric,
    visibleScreen,
    isProcessing,
    isTestMode,
    completeScenarioFlow,
  ]);

  const renderPhoneFrame = () => {
    const isVibrating = showCriticalAlert && state.currentState === "risk_detected";
    const isLoginFrame = !isLoggedIn && visibleScreen === "guard" && !isTestMode;
    const accountStatus =
      state.card.status === "terminated" && state.newCard?.status === "active"
        ? "protected"
        : state.card.status;
    return (
      <section
        className={`phone-frame ${isVibrating ? "phone-frame-vibrate" : ""} ${isLoginFrame ? "phone-frame--login" : ""}`}
        aria-label="Co-opBank KNIGHT mobile prototype"
      >
        <header className="app-header">
          <div className="app-brand">
            <KnightLogoMini size={36} className="app-brand__mark" />
            <div>
              <span>Co-opBank</span>
              <strong>KNIGHT</strong>
            </div>
          </div>
          <div className="header-status" aria-label={`Account ${accountStatus}`}>
            <ShieldCheck size={16} aria-hidden="true" />
            <span>{accountStatus}</span>
          </div>
        </header>
        <div className={`screen-host ${isTransitioning ? "screen-exit" : "screen-enter"}`}>{screen}</div>
      </section>
    );
  };

  const renderDemoContent = () => {
    const isCyberAttack = queryParams.get("capture") === "cyber-attack" || 
                         queryParams.get("shot") === "cyber-attack" ||
                         showCyberSimulation;
    if (isCyberAttack) {
      return (
        <div className="cyber-sim-frame" style={{ width: "100%", height: "100%" }}>
          <CyberAttackDashboard state={state} alarmAudio={alarmAudio} />
        </div>
      );
    }

    if (captureMode === "agent") {
      return (
        <div className="agent-capture-frame">
          <KnightAgentVisual state={state} />
        </div>
      );
    }

    if (captureMode === "phone") {
      return (
        <div className="demo-content-grid demo-content-grid--phone-only">
          <div className="phone-panel-wrapper">{renderPhoneFrame()}</div>
        </div>
      );
    }

    return (
      <div className="demo-content-grid">
        <div className="phone-panel-wrapper">{renderPhoneFrame()}</div>
        <div className="agent-panel-wrapper">
          <KnightAgentVisual state={state} />
        </div>
      </div>
    );
  };

  return (
    <main className={`platform-container ${isTestMode ? "is-test-mode" : ""} capture-${captureMode}`}>
      <div className="platform-content">
        <div className="workspace-layout">{renderDemoContent()}</div>
      </div>
      {!isTestMode && queryParams.get("capture") !== "cyber-attack" && queryParams.get("shot") !== "cyber-attack" && (
        <button
          className="cyber-toggle-btn"
          onClick={() => setShowCyberSimulation((prev) => !prev)}
          title="Chuyển chế độ xem"
        >
          <ShieldCheck size={16} />
          {showCyberSimulation ? "Mobile View" : "Cyber Control Room"}
        </button>
      )}
    </main>
  );
}
