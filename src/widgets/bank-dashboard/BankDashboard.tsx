import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import type { KnightScenarioState } from "../../domain/types";
import type { BankTransaction } from "../../entities/bank-account/model/bankingDemo";
import { disablePushNotifications, enablePushNotifications } from "../../shared/api/pushNotifications";
import { BottomTabs, type BankDashboardTab } from "./BottomTabs";
import { useBankTransferFlow } from "./useBankTransferFlow";
import { BankPickerSheet } from "./ui/BankPickerSheet";
import { CardTab } from "./ui/CardTab";
import { HomeTab } from "./ui/HomeTab";
import { KnightTab } from "./ui/KnightTab";
import { SettingsTab } from "./ui/SettingsTab";
import { TransferTab } from "./ui/TransferTab";
import type { GuardianLevelSetting } from "./model/dashboardCopy";
import { fetchTwinExplain, type TwinExplainResponse } from "../../shared/api/twin";
import { TwinProfileModal } from "../../features/guardianflow-decision/ui/TwinProfileModal";
import { transferBanks } from "../../entities/bank/model/transferBanks";
import "./BankDashboard.css";

interface BankDashboardProps {
  state: KnightScenarioState;
  selectedQtdnd: string;
  onStartDemo: () => void;
  onLogout: () => void;
  balance: number;
  setBalance: Dispatch<SetStateAction<number>>;
  transactions: BankTransaction[];
  setTransactions: Dispatch<SetStateAction<BankTransaction[]>>;
  guardianDemoEnabled?: boolean;
}

export function BankDashboard({
  state,
  selectedQtdnd,
  onStartDemo,
  onLogout,
  balance,
  setBalance,
  transactions,
  setTransactions,
  guardianDemoEnabled = false,
}: BankDashboardProps) {
  const [activeTab, setActiveTab] = useState<BankDashboardTab>("home");
  const [balanceVisible, setBalanceVisible] = useState(false);
  const transferFlow = useBankTransferFlow({ setBalance, setTransactions });
  const {
    bankPickerOpen,
    bankSearch,
    filteredTransferBanks,
    latestGuardianDecision,
    resetTransferFields,
    selectTransferBank,
    setBankPickerOpen,
    setBankSearch,
    transferBank,
  } = transferFlow;

  const [liabilityAccepted, setLiabilityAccepted] = useState(false);

  // Settings states
  const [voiceOtt, setVoiceOtt] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(true);
  const [consentBasis, setConsentBasis] = useState(state.customer.personalizationConsent);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "saving" | "enabled" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("Thêm vào Màn hình chính, mở từ biểu tượng KNIGHT, rồi bật thông báo.");

  // Sync consent state to gray out visual/cockpit panel when deactivated
  const [hasGuardianConsent, setHasGuardianConsent] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.sessionStorage.getItem("knight_guardianflow_consent");
    return stored === null ? true : stored === "granted";
  });

  const [guardianLevelSetting, setGuardianLevelSetting] = useState<GuardianLevelSetting>(() => {
    if (typeof window === "undefined") return "standard";
    return (window.sessionStorage.getItem("knight_guardian_level") as GuardianLevelSetting) || "standard";
  });

  const [twinExplain, setTwinExplain] = useState<TwinExplainResponse | null>(null);
  const [isTwinOpen, setIsTwinOpen] = useState(false);

  useEffect(() => {
    if (!hasGuardianConsent) return;

    let isMounted = true;
    void fetchTwinExplain("CID-001").then((res) => {
      if (isMounted && res) setTwinExplain(res);
    });

    return () => {
      isMounted = false;
    };
  }, [hasGuardianConsent, state.currentState, isTwinOpen]);

  useEffect(() => {
    const handleStorage = () => {
      const stored = window.sessionStorage.getItem("knight_guardianflow_consent");
      setHasGuardianConsent(stored === null ? true : stored === "granted");

      const level = window.sessionStorage.getItem("knight_guardian_level");
      setGuardianLevelSetting((level as GuardianLevelSetting) || "standard");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const resetTransferForm = () => {
    resetTransferFields();
    setActiveTab("home");
  };

  const handlePushAlertsChange = async (checked: boolean) => {
    if (!checked) {
      setPushStatus("saving");
      setPushMessage("Đang tắt thông báo trên thiết bị này...");
      await disablePushNotifications();
      setPushAlerts(false);
      setPushStatus("idle");
      setPushMessage("Thông báo đã tắt trên bản prototype này.");
      return;
    }

    setPushAlerts(true);
    setPushStatus("saving");
    setPushMessage("Đang đăng ký thiết bị với máy chủ laptop...");

    try {
      await enablePushNotifications();
      setPushStatus("enabled");
      setPushMessage("Đã bật thông báo. Hãy khóa màn hình điện thoại rồi bấm Space tại cửa sổ dòng lệnh ở máy tính để thử nghiệm.");
    } catch (error) {
      setPushAlerts(false);
      setPushStatus("error");
      setPushMessage(error instanceof Error ? error.message : "Không thể bật thông báo Push trên thiết bị này.");
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-body">
        {activeTab === "home" && (
          <HomeTab
            state={state}
            selectedQtdnd={selectedQtdnd}
            balance={balance}
            balanceVisible={balanceVisible}
            setBalanceVisible={setBalanceVisible}
            hasGuardianConsent={hasGuardianConsent}
            onLogout={onLogout}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === "card" && <CardTab state={state} transactions={transactions} />}
        {activeTab === "transfer" && (
          <TransferTab
            flow={transferFlow}
            hasGuardianConsent={hasGuardianConsent}
            liabilityAccepted={liabilityAccepted}
            setLiabilityAccepted={setLiabilityAccepted}
            resetTransferForm={resetTransferForm}
            onStartDemo={onStartDemo}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === "knight" && (
          <KnightTab
            state={state}
            hasGuardianConsent={hasGuardianConsent}
            guardianLevelSetting={guardianLevelSetting}
            latestGuardianDecision={latestGuardianDecision}
            onStartDemo={onStartDemo}
            guardianDemoEnabled={guardianDemoEnabled}
            pushAlerts={pushAlerts}
            pushStatus={pushStatus}
            handlePushAlertsChange={handlePushAlertsChange}
            pushMessage={pushMessage}
            voiceOtt={voiceOtt}
            setVoiceOtt={setVoiceOtt}
            consentBasis={consentBasis}
            setConsentBasis={setConsentBasis}
            onViewTwin={() => setIsTwinOpen(true)}
          />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            voiceOtt={voiceOtt}
            setVoiceOtt={setVoiceOtt}
            biometricAuth={biometricAuth}
            setBiometricAuth={setBiometricAuth}
            consentBasis={consentBasis}
            setConsentBasis={setConsentBasis}
          />
        )}
      </div>

      <BankPickerSheet
        bankPickerOpen={bankPickerOpen}
        bankSearch={bankSearch}
        setBankSearch={setBankSearch}
        setBankPickerOpen={setBankPickerOpen}
        filteredTransferBanks={filteredTransferBanks}
        transferBank={transferBank}
        selectTransferBank={selectTransferBank}
      />

      <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <TwinProfileModal
        isOpen={isTwinOpen}
        onClose={() => setIsTwinOpen(false)}
        twinExplain={hasGuardianConsent ? twinExplain : null}
        onRefreshTwin={() => {
          void fetchTwinExplain("CID-001").then((res) => {
            if (res) setTwinExplain(res);
          });
        }}
        onSelectScam={(scam) => {
          // 1. Select the correct bank
          const matchedBank = transferBanks.find(
            (b) => b.displayName.toLowerCase().includes(scam.bank.toLowerCase()) ||
                   b.legalName.toLowerCase().includes(scam.bank.toLowerCase())
          );
          if (matchedBank) {
            transferFlow.selectTransferBank(matchedBank);
          }

          // 2. Pre-fill the transfer fields
          transferFlow.handleAccountChange(scam.account);
          transferFlow.setTransferRecipient(scam.name);
          transferFlow.setTransferAmount(scam.amount);
          transferFlow.setTransferContent(scam.content);

          // 3. Switch to Transfer tab and details input step
          setActiveTab("transfer");
          transferFlow.setTransferStep("input_details");
        }}
      />
    </div>
  );
}
