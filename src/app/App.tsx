import { useCallback, useMemo, useState, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { AuditTimeline } from "../widgets/audit-timeline/AuditTimeline";
import { BiometricStepUp } from "../features/biometric-step-up/ui/BiometricStepUp";
import { CriticalAlertSurface } from "../features/risk-alert/ui/CriticalAlertSurface";
import { FraudCaseSubmittedScreen } from "../features/recovery-support/ui/FraudCaseSubmittedScreen";
import { FraudReviewScreen } from "../features/fraud-review/ui/FraudReviewScreen";
import { GuardScreen } from "../pages/demo-guard/GuardScreen";
import { LegitimateResolutionScreen } from "../features/card-protection/ui/LegitimateResolutionScreen";
import { NextMorningRecoveryScreen } from "../features/recovery-support/ui/NextMorningRecoveryScreen";
import { PostIncidentBehaviorScreen } from "../features/recovery-support/ui/PostIncidentBehaviorScreen";
import { ReassurancePackageScreen } from "../features/recovery-support/ui/ReassurancePackageScreen";
import { TrustRecoveryAssessmentScreen } from "../features/recovery-support/ui/TrustRecoveryAssessmentScreen";
import { TimeoutEscalationScreen } from "../features/card-protection/ui/TimeoutEscalationScreen";
import { UnlockedCriticalAlertPopup } from "../features/risk-alert/ui/UnlockedCriticalAlertPopup";
import { VirtualCardScreen } from "../features/card-protection/ui/VirtualCardScreen";
import { BankLoginScreen } from "../pages/bank-login/BankLoginScreen";
import { BankDashboard } from "../widgets/bank-dashboard/BankDashboard";
import { KnightAgentVisual } from "../widgets/knight-agent-visual/KnightAgentVisual";
import { KnightLogoMini } from "../shared/ui";
import { useAlarmAudio } from "../shared/lib/audio/useAlarmAudio";
import { CyberAttackDashboard } from "../widgets/cyber-attack-dashboard/CyberAttackDashboard";
import { buildBackendUrl } from "../shared/api/backend";
import "../shared/styles/screen-primitives.css";
import "../shared/styles/card-effects.css";
import "./AppTransitions.css";
import "./AppPlatform.css";
import "../widgets/bank-dashboard/ConnectionModal.css";
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
import { createInitialBankTransactions, initialBankBalance } from "../entities/bank-account/model/bankingDemo";
import { useAlarmController } from "./model/useAlarmController";
import { useAlertLaunch } from "./model/useAlertLaunch";
import { useAppQueryParams } from "./model/useAppQueryParams";
import { useBackendSse } from "./model/useBackendSse";
import { useReportState } from "./model/useReportState";

export function App() {
  const { captureMode, guardianDemoEnabled, isTestMode, queryParams, requestedShot } = useAppQueryParams();

  // Pre-create and unlock alarm audio during normal usage so it auto-plays on iOS
  const alarmAudio = useAlarmAudio({ disabled: isTestMode });

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

  useBackendSse({
    applyEvents,
    cancelActiveSequence,
    isTestMode,
    reset,
    setShowCriticalAlert,
    setShowUnlockedAlert,
    setState,
  });
  useAlertLaunch({ isTestMode, startScenario });
  useAlarmController({
    alarmAudio,
    currentState: state.currentState,
    isTestMode,
    showCriticalAlert,
    showUnlockedAlert,
  });
  useReportState(state);

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
        guardianDemoEnabled={guardianDemoEnabled}
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
    guardianDemoEnabled,
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
      {!isTestMode && queryParams.get("capture") !== "cyber-attack" && queryParams.get("shot") !== "cyber-attack" && queryParams.get("controls") !== "0" && captureMode !== "phone" && (
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
