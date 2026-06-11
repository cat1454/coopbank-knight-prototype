import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { AuditTimeline } from "../components/AuditTimeline";
import { BiometricStepUp } from "../components/BiometricStepUp";
import { CriticalAlertSurface } from "../components/CriticalAlertSurface";
import { DemoControls } from "../components/DemoControls";
import { FraudReviewScreen } from "../components/FraudReviewScreen";
import { GuardScreen } from "../components/GuardScreen";
import { LegitimateResolutionScreen } from "../components/LegitimateResolutionScreen";
import { RecoveryOfferScreen } from "../components/RecoveryOfferScreen";
import { TimeoutEscalationScreen } from "../components/TimeoutEscalationScreen";
import { VirtualCardScreen } from "../components/VirtualCardScreen";
import { BankLoginScreen } from "../components/BankLoginScreen";
import { BankDashboard } from "../components/BankDashboard";
import { KnightAgentVisual } from "../components/KnightAgentVisual";
import { useAlarmAudio } from "../hooks/useAlarmAudio";
import {
  createInitialKnightState,
  getVisibleScreen,
  runScenarioEvents,
  dispatchScenarioEvent,
} from "../domain/knightStateMachine";
import type { CustomerIntent, KnightEventType } from "../domain/types";

const startEvents: KnightEventType[] = ["RISK_EVENT_RECEIVED"];
const reviewEvents: KnightEventType[] = ["AUTO_SUSPEND_ALLOWED", "PUSH_SENT"];

const fraudResolutionEvents: KnightEventType[] = [
  "BIOMETRIC_SUCCESS_FRAUD",
  "TERMINATE_CARD_SUCCESS",
  "ISSUE_CARD_SUCCESS",
  "CREATE_CASE_SUCCESS",
];

const legitimateResolutionEvents: KnightEventType[] = [
  "BIOMETRIC_SUCCESS_LEGIT",
  "UNSUSPEND_CARD_SUCCESS",
  "WHITELIST_SESSION_SUCCESS",
  "ENHANCED_MONITORING_STARTED",
];

const timeoutEvents: KnightEventType[] = [
  ...startEvents,
  ...reviewEvents,
  "CUSTOMER_RESPONSE_TIMEOUT",
  "SMS_SENT",
  "ESCALATE_FRAUD_OPS",
  "KEEP_CARD_SUSPENDED",
];

export interface BankTransaction {
  id: string;
  merchantName: string;
  amountVnd: number;
  time: string;
  status: "success" | "pending";
  type: "transfer" | "receive";
}

export function App() {
  const isTestMode = useMemo(() => {
    return import.meta.env.MODE === "test" || 
           (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("env") === "test");
  }, []);

  // Pre-create and unlock alarm audio during normal usage so it auto-plays on iOS
  const alarmAudio = useAlarmAudio();

  const [state, setState] = useState(() => createInitialKnightState());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedQtdnd, setSelectedQtdnd] = useState("QTDND Đà Nẵng");
  const [bankBalance, setBankBalance] = useState(36360430);
  const [normalTransactions, setNormalTransactions] = useState<BankTransaction[]>([
    {
      id: "TXN-002",
      merchantName: "Circle K Thái Hà",
      amountVnd: 85000,
      time: "Hôm qua - 19:42",
      status: "success",
      type: "transfer",
    },
    {
      id: "TXN-003",
      merchantName: "Highlands Coffee",
      amountVnd: 55000,
      time: "Hôm qua - 14:15",
      status: "success",
      type: "transfer",
    },
    {
      id: "TXN-004",
      merchantName: "Chuyển khoản từ Nguyễn Văn B",
      amountVnd: 1200000,
      time: "09/06/2026 - 10:30",
      status: "success",
      type: "receive",
    },
  ]);
  const visibleScreen = getVisibleScreen(state);

  const [isProcessing, setIsProcessing] = useState(false);
  const activeSequenceId = useRef(0);

  const cancelActiveSequence = useCallback(() => {
    activeSequenceId.current++;
    setIsProcessing(false);
  }, []);

  const applyEvents = useCallback((events: KnightEventType[]) => {
    setState((currentState) => runScenarioEvents(currentState, events));
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
  }, [cancelActiveSequence]);

  const reset = useCallback(() => {
    cancelActiveSequence();
    setState(createInitialKnightState());
    setIsLoggedIn(false);
    setBankBalance(36360430);
    setNormalTransactions([
      {
        id: "TXN-002",
        merchantName: "Circle K Thái Hà",
        amountVnd: 85000,
        time: "Hôm qua - 19:42",
        status: "success",
        type: "transfer",
      },
      {
        id: "TXN-003",
        merchantName: "Highlands Coffee",
        amountVnd: 55000,
        time: "Hôm qua - 14:15",
        status: "success",
        type: "transfer",
      },
      {
        id: "TXN-004",
        merchantName: "Chuyển khoản từ Nguyễn Văn B",
        amountVnd: 1200000,
        time: "09/06/2026 - 10:30",
        status: "success",
        type: "receive",
      },
    ]);
  }, [cancelActiveSequence]);

  const startScenario = useCallback(() => {
    cancelActiveSequence();
    setState((currentState) => {
      const baseState = currentState.currentState === "idle_monitoring" ? currentState : createInitialKnightState();
      return runScenarioEvents(baseState, startEvents);
    });
  }, [cancelActiveSequence]);

  const openFraudReview = useCallback(() => {
    applyEventsSequentially(reviewEvents);
  }, [applyEventsSequentially]);

  const requestBiometric = useCallback(
    (intent: "fraud" | "legitimate") => {
      applyEventsSequentially([intent === "fraud" ? "CUSTOMER_TAPS_FRAUD" : "CUSTOMER_TAPS_LEGIT", "REQUEST_BIOMETRIC"]);
    },
    [applyEventsSequentially],
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

  const jumpFraud = useCallback(() => {
    cancelActiveSequence();
    setState(createInitialKnightState());
    applyEventsSequentially([
      ...startEvents,
      ...reviewEvents,
      "CUSTOMER_TAPS_FRAUD",
      "REQUEST_BIOMETRIC",
      ...fraudResolutionEvents,
    ]);
  }, [cancelActiveSequence, applyEventsSequentially]);

  const jumpLegitimate = useCallback(() => {
    cancelActiveSequence();
    setState(createInitialKnightState());
    applyEventsSequentially([
      ...startEvents,
      ...reviewEvents,
      "CUSTOMER_TAPS_LEGIT",
      "REQUEST_BIOMETRIC",
      ...legitimateResolutionEvents,
    ]);
  }, [cancelActiveSequence, applyEventsSequentially]);

  const jumpTimeout = useCallback(() => {
    cancelActiveSequence();
    setState(createInitialKnightState());
    applyEventsSequentially(timeoutEvents);
  }, [cancelActiveSequence, applyEventsSequentially]);

  // Connect to backend server SSE stream
  useEffect(() => {
    const isTestMode = import.meta.env.MODE === "test" || 
                       new URLSearchParams(window.location.search).get("env") === "test";

    if (isTestMode) {
      console.log("Test mode: bypassing backend SSE server connection");
      return;
    }

    const backendHost = window.location.hostname || "localhost";
    const eventSource = new EventSource(`http://${backendHost}:5000/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "trigger" && data.events) {
          if (data.events.includes("RISK_EVENT_RECEIVED")) {
            startScenario();
          } else if (data.events.includes("RESET_SCENARIO")) {
            reset();
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
  }, [startScenario, reset]);



  // Synchronize state updates to backend for real-time terminal logs
  useEffect(() => {
    const backendHost = window.location.hostname || "localhost";
    fetch(`http://${backendHost}:5000/api/report-state`, {
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
      case "critical-alert":
        return <CriticalAlertSurface state={state} onOpenApp={openFraudReview} alarmAudio={alarmAudio} />;
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
            onShowOffer={() => applyEvents(["GENERATE_OFFER_SUCCESS"])}
            isProcessing={isProcessing}
          />
        );
      case "recovery-offer":
        return <RecoveryOfferScreen state={state} onShowTimeline={showTimeline} />;
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
    bankBalance,
    isLoggedIn,
    normalTransactions,
    openFraudReview,
    requestBiometric,
    reset,
    selectedQtdnd,
    showTimeline,
    startScenario,
    state,
    verifyBiometric,
    visibleScreen,
    isProcessing,
  ]);

  const renderDemoContent = () => {
    return (
      <div className="demo-content-grid">
        <div className="phone-panel-wrapper">
          <section className="phone-frame" aria-label="Co-opBank KNIGHT mobile prototype">
            <header className="app-header">
              <div className="app-brand">
                <img src="/knight-shield.svg" alt="" className="app-brand__mark" />
                <div>
                  <span>Co-opBank</span>
                  <strong>KNIGHT</strong>
                </div>
              </div>
              <div className="header-status" aria-label={`Card ${state.card.status}`}>
                <ShieldCheck size={16} aria-hidden="true" />
                <span>{state.card.status}</span>
              </div>
            </header>
            <div className="screen-host">{screen}</div>
            <DemoControls
              onJumpFraud={jumpFraud}
              onJumpLegitimate={jumpLegitimate}
              onJumpTimeout={jumpTimeout}
              onReset={reset}
              onStart={startScenario}
            />
          </section>
        </div>
        <div className="agent-panel-wrapper">
          <KnightAgentVisual state={state} />
        </div>
      </div>
    );
  };

  return (
    <main className={`platform-container ${isTestMode ? "is-test-mode" : ""}`}>
      <div className="platform-content">
        <div className="workspace-layout">{renderDemoContent()}</div>
      </div>
    </main>
  );
}
