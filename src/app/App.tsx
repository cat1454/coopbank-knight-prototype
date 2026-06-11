import { useCallback, useMemo, useState } from "react";
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
import {
  createInitialKnightState,
  getVisibleScreen,
  runScenarioEvents,
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

  const applyEvents = useCallback((events: KnightEventType[]) => {
    setState((currentState) => runScenarioEvents(currentState, events));
  }, []);

  const reset = useCallback(() => {
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
  }, []);

  const startScenario = useCallback(() => {
    setState((currentState) => {
      const baseState = currentState.currentState === "idle_monitoring" ? currentState : createInitialKnightState();
      return runScenarioEvents(baseState, startEvents);
    });
  }, []);

  const openFraudReview = useCallback(() => {
    applyEvents(reviewEvents);
  }, [applyEvents]);

  const requestBiometric = useCallback(
    (intent: "fraud" | "legitimate") => {
      applyEvents([intent === "fraud" ? "CUSTOMER_TAPS_FRAUD" : "CUSTOMER_TAPS_LEGIT", "REQUEST_BIOMETRIC"]);
    },
    [applyEvents],
  );

  const verifyBiometric = useCallback(
    (intent: CustomerIntent) => {
      if (intent === "fraud") {
        applyEvents(fraudResolutionEvents);
      }

      if (intent === "legitimate") {
        applyEvents(legitimateResolutionEvents);
      }
    },
    [applyEvents],
  );

  const showTimeline = useCallback(() => {
    applyEvents(["AUDIT_COMPLETE"]);
  }, [applyEvents]);

  const jumpFraud = useCallback(() => {
    setState(
      runScenarioEvents(createInitialKnightState(), [
        ...startEvents,
        ...reviewEvents,
        "CUSTOMER_TAPS_FRAUD",
        "REQUEST_BIOMETRIC",
        ...fraudResolutionEvents,
      ]),
    );
  }, []);

  const jumpLegitimate = useCallback(() => {
    setState(
      runScenarioEvents(createInitialKnightState(), [
        ...startEvents,
        ...reviewEvents,
        "CUSTOMER_TAPS_LEGIT",
        "REQUEST_BIOMETRIC",
        ...legitimateResolutionEvents,
      ]),
    );
  }, []);

  const jumpTimeout = useCallback(() => {
    setState(runScenarioEvents(createInitialKnightState(), timeoutEvents));
  }, []);

  const screen = useMemo(() => {
    switch (visibleScreen) {
      case "guard":
        return !isLoggedIn ? (
          <BankLoginScreen
            onLogin={() => setIsLoggedIn(true)}
            onStartDemo={startScenario}
            selectedQtdnd={selectedQtdnd}
            setSelectedQtdnd={setSelectedQtdnd}
          />
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
        return <CriticalAlertSurface state={state} onOpenApp={openFraudReview} />;
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
          />
        );
      case "virtual-card":
        return <VirtualCardScreen state={state} onShowOffer={() => applyEvents(["GENERATE_OFFER_SUCCESS"])} />;
      case "recovery-offer":
        return <RecoveryOfferScreen state={state} onShowTimeline={showTimeline} />;
      case "audit-timeline":
        return <AuditTimeline state={state} onReset={reset} />;
      case "legitimate-resolution":
        return <LegitimateResolutionScreen state={state} onReset={reset} onShowTimeline={showTimeline} />;
      case "timeout-escalation":
        return <TimeoutEscalationScreen state={state} onReset={reset} />;
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
  ]);

  return (
    <main className="app-shell">
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
    </main>
  );
}
