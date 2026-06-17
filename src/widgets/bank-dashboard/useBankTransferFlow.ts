import { useState, useRef, type Dispatch, type SetStateAction } from "react";
import type { GuardianRiskDecision } from "../../domain/types";
import { evaluateGuardianTransaction } from "../../domain/guardianFlow";
import type { BankTransaction } from "../../entities/bank-account/model/bankingDemo";
import { defaultTransferBank, transferBanks, type TransferBank } from "../../entities/bank/model/transferBanks";
import {
  buildGuardianTransactionInput,
  countTransferIntakeSignals,
  getGuardianLevelSetting,
  getKnownRecipientName,
  getRecipientSignal,
  getTransferAmountSignal,
  getTransferContentSignal,
  isGuardianConsentOff,
  markDecisionAllowed,
  normalizeBankSearchText,
  transferChecklistItems,
  type TransferStep,
} from "./model/transferFormModel";

export { transferChecklistItems } from "./model/transferFormModel";

interface UseBankTransferFlowOptions {
  setBalance: Dispatch<SetStateAction<number>>;
  setTransactions: Dispatch<SetStateAction<BankTransaction[]>>;
}

export function useBankTransferFlow({ setBalance, setTransactions }: UseBankTransferFlowOptions) {
  const [transferStep, setTransferStep] = useState<TransferStep>("input_recipient");
  const [transferBank, setTransferBank] = useState(defaultTransferBank.displayName);
  const [bankSearch, setBankSearch] = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [transferAccount, setTransferAccount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferContent, setTransferContent] = useState("");
  const [latestGuardianDecision, setLatestGuardianDecision] = useState<GuardianRiskDecision | null>(null);
  const [transferChecklist, setTransferChecklist] = useState<boolean[]>(() => transferChecklistItems.map(() => false));
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [isRecipientVerified, setIsRecipientVerified] = useState(false);
  const [cachedGuardianDecision, setCachedGuardianDecision] = useState<GuardianRiskDecision | null>(null);
  const [isTransferAiPending, setIsTransferAiPending] = useState(false);
  const [isTransferFaceIdOpen, setIsTransferFaceIdOpen] = useState(false);

  // Human Review Simulator states
  const [isHumanReviewing, setIsHumanReviewing] = useState(false);
  const [humanReviewStep, setHumanReviewStep] = useState<"idle" | "connecting" | "chatting" | "approved" | "rejected">("idle");


  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cachedGuardianDecisionRef = useRef<GuardianRiskDecision | null>(null);
  const pendingGuardianDecisionRef = useRef<Promise<GuardianRiskDecision | null> | null>(null);
  const guardianDecisionRequestRef = useRef(0);

  const updateCachedGuardianDecision = (decision: GuardianRiskDecision | null) => {
    cachedGuardianDecisionRef.current = decision;
    setCachedGuardianDecision(decision);
  };

  const clearGuardianDecision = () => {
    guardianDecisionRequestRef.current += 1;
    pendingGuardianDecisionRef.current = null;
    setIsTransferAiPending(false);
    updateCachedGuardianDecision(null);
  };

  const handleAccountChange = (val: string) => {
    setTransferAccount(val);
    setLatestGuardianDecision(null);
    clearGuardianDecision();

    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length < 6) {
      setIsRecipientVerified(false);
      setTransferRecipient("");
      setIsResolvingName(false);
      return;
    }

    setIsResolvingName(true);
    setIsRecipientVerified(false);
    setTransferRecipient("");

    const expectedName = getKnownRecipientName(trimmed);

    resolveTimerRef.current = setTimeout(() => {
      setTransferRecipient(expectedName);
      setIsRecipientVerified(true);
      setIsResolvingName(false);
    }, 800);
  };

  const transferAmountNumber = Number(transferAmount) || 0;
  const hasTransferAmount = transferAmountNumber > 0;
  const normalizedTransferContent = transferContent.trim();
  const normalizedBankSearch = normalizeBankSearchText(bankSearch.trim());
  const selectedBank = transferBanks.find((bank) => bank.displayName === transferBank);
  const filteredTransferBanks = transferBanks
    .filter((bank) => {
      if (!normalizedBankSearch) return true;
      return [bank.displayName, bank.listTitle, bank.legalName, bank.code].some((value) =>
        normalizeBankSearchText(value).includes(normalizedBankSearch),
      );
    })
    .slice(0, 8);
  const amountSignal = getTransferAmountSignal(hasTransferAmount, transferAmountNumber);
  const contentSignal = getTransferContentSignal(normalizedTransferContent);
  const recipientSignal = getRecipientSignal(transferAccount, transferRecipient);
  const intakeSignalCount = countTransferIntakeSignals([
    transferBank,
    transferAccount,
    transferRecipient,
    hasTransferAmount,
    normalizedTransferContent,
  ]);

  const selectTransferBank = (bank: TransferBank) => {
    setTransferBank(bank.displayName);
    setBankSearch("");
    setBankPickerOpen(false);
    setLatestGuardianDecision(null);
    clearGuardianDecision();
    if (transferAccount.trim().length >= 6) {
      handleAccountChange(transferAccount);
    }
  };

  const handleSelectSuggestion = (type: "safe" | "fraud") => {
    setLatestGuardianDecision(null);
    clearGuardianDecision();
    if (type === "safe") {
      selectTransferBank(defaultTransferBank);
      setTransferAccount("19038472910");
      setTransferRecipient("NGUYỄN VĂN B");
      setTransferAmount("200000");
      setTransferContent("Huynh Phuoc Phu chuyen tien");
      setIsRecipientVerified(true);
      setIsResolvingName(false);
    } else {
      selectTransferBank(defaultTransferBank);
      setTransferAccount("88884920412");
      setTransferRecipient("SHOPMALL GLOBAL");
      setTransferAmount("10000000");
      setTransferContent("Thanh toan don hang");
      setIsRecipientVerified(true);
      setIsResolvingName(false);
    }
  };

  const triggerBackgroundAiScoring = async (
    recipientNameVal: string,
    recipientAccountVal: string,
    amountVal: number,
    contentVal: string,
    requestId = guardianDecisionRequestRef.current,
  ) => {
    try {
      const { decision } = await evaluateGuardianTransaction(
        buildGuardianTransactionInput({
          amountVal,
          contentVal,
          recipientAccountVal,
          recipientNameVal,
          transferBank,
        }),
      );
      if (requestId === guardianDecisionRequestRef.current) {
        updateCachedGuardianDecision(decision);
      }
      return decision;
    } catch (e) {
      console.error("Early background scoring error", e);
      return null;
    }
  };

  const beginGuardianDecisionRequest = (
    recipientNameVal: string,
    recipientAccountVal: string,
    amountVal: number,
    contentVal: string,
  ) => {
    const requestId = guardianDecisionRequestRef.current + 1;
    guardianDecisionRequestRef.current = requestId;
    updateCachedGuardianDecision(null);
    setIsTransferAiPending(true);

    const decisionPromise = triggerBackgroundAiScoring(
      recipientNameVal,
      recipientAccountVal,
      amountVal,
      contentVal,
      requestId,
    ).finally(() => {
      if (requestId === guardianDecisionRequestRef.current) {
        setIsTransferAiPending(false);
      }
    });

    pendingGuardianDecisionRef.current = decisionPromise;
    return decisionPromise;
  };

  const resolveGuardianDecisionForConfirmation = async () => {
    if (cachedGuardianDecisionRef.current) {
      return cachedGuardianDecisionRef.current;
    }

    if (pendingGuardianDecisionRef.current) {
      return pendingGuardianDecisionRef.current;
    }

    return beginGuardianDecisionRequest(transferRecipient, transferAccount, Number(transferAmount), transferContent);
  };

  const handleNextToDetails = () => {
    if (transferBank && transferAccount && transferRecipient && isRecipientVerified) {
      setTransferStep("input_details");
      if (!isGuardianConsentOff()) {
        // Kích hoạt AI chạy ngầm với số tiền 0 để phân tích rủi ro người nhận trước
        void beginGuardianDecisionRequest(transferRecipient, transferAccount, 0, transferContent);
      }
    }
  };

  const handleNextStep = () => {
    if (transferBank && transferAccount && transferRecipient && transferAmount && transferContent) {
      setTransferStep("confirm");
      if (!isGuardianConsentOff()) {
        // Cập nhật lại kết quả AI chạy ngầm với số tiền và nội dung thực tế
        void beginGuardianDecisionRequest(transferRecipient, transferAccount, Number(transferAmount), transferContent);
      }
    }
  };

  const completeTransfer = () => {
    const amountNum = Number(transferAmount);

    setIsTransferFaceIdOpen(false);
    setBalance((prev) => prev - amountNum);
    setTransactions((prev) => [
      {
        id: `TXN-${Date.now()}`,
        merchantName: transferRecipient,
        amountVnd: amountNum,
        time: "Vừa xong",
        status: "success",
        type: "transfer",
      },
      ...prev,
    ]);
    setTransferStep("success");
  };

  const completeCompanionReviewedTransfer = () => {
    if (latestGuardianDecision?.requiresChecklist) {
      setLatestGuardianDecision(
        markDecisionAllowed(
          latestGuardianDecision,
          "Đã xác thực Face ID, giao dịch đã được cho phép sau checklist Đồng hành.",
          "companion_checklist_confirmed",
        ),
      );
    }

    completeTransfer();
  };

  const markDecisionAllowedAfterFaceId = (decision: GuardianRiskDecision) =>
    markDecisionAllowed(decision, "Đã xác thực Face ID, giao dịch đã được cho phép.", "face_id_verified");

  const finalizeDecision = (decision: GuardianRiskDecision, identityVerified = false) => {
    const amountNum = Number(transferAmount);
    const levelSetting = getGuardianLevelSetting();

    // Minimal protection (min)
    if (levelSetting === "min") {
      if (amountNum >= 10_000_000) {
        // Still mandatory by state law
        const adjustedDecision = {
          ...decision,
          aiLevel: "verify" as const,
          action: "step_up" as const,
          explanation: "Hệ thống phát hiện rủi ro. Vì giao dịch từ 10 triệu đồng trở lên, quy định Quyết định 2345/QĐ-NHNN bắt buộc thực hiện xác thực sinh trắc học khuôn mặt.",
        };
        setLatestGuardianDecision(adjustedDecision);
        if (identityVerified) {
          setLatestGuardianDecision(markDecisionAllowedAfterFaceId(adjustedDecision));
          completeTransfer();
        } else {
          setTransferStep("confirm");
          setIsTransferFaceIdOpen(true);
        }
        return;
      }

      // Below 10M: downgrade locks/blocks to soft warnings, allowing instant bypass
      if (decision.aiLevel !== "safe") {
        const adjustedDecision = {
          ...decision,
          aiLevel: "watch" as const,
          action: "warn" as const,
          explanation: "Hộ vệ AI phát hiện điểm rủi ro cao (" + decision.riskScore + "/100). Do bạn cài đặt cấu hình bảo vệ Giám sát tối thiểu, bạn có thể tự xác nhận để chuyển tiền ngay mà không cần xác minh.",
        };
        setLatestGuardianDecision(adjustedDecision);
        setTransferStep("warning");
      } else {
        completeTransfer();
      }
      return;
    }

    // Maximum protection (max)
    if (levelSetting === "max") {
      if (decision.aiLevel === "watch") {
        const adjustedDecision = {
          ...decision,
          aiLevel: "verify" as const,
          action: "step_up" as const,
          explanation: "[Chế độ bảo vệ Tối đa] Phát hiện giao dịch lệch thói quen chi tiêu thông thường. Yêu cầu xác thực checklist và Face ID bổ sung để đảm bảo an toàn.",
        };
        setLatestGuardianDecision(adjustedDecision);
        if (identityVerified) {
          setLatestGuardianDecision(markDecisionAllowedAfterFaceId(adjustedDecision));
          completeTransfer();
        } else {
          setTransferStep("confirm");
          setIsTransferFaceIdOpen(true);
        }
        return;
      }
      if (decision.aiLevel === "verify" || decision.aiLevel === "hold" || decision.aiLevel === "critical") {
          const adjustedDecision = {
            ...decision,
            aiLevel: "hold" as const,
            action: "block" as const,
            explanation: "[Chế độ bảo vệ Tối đa] Phát hiện rủi ro cao lệch baseline. Giao dịch bị tạm giữ ngay lập tức để bảo vệ tài sản của bạn.",
          };
          setLatestGuardianDecision(adjustedDecision);
          setTransferStep("held");
          return;
        }
    }

    if (decision.aiLevel === "safe") {
      setLatestGuardianDecision(decision);
      completeTransfer();
      return;
    }

    // Standard protection ("Dong hanh"): keep the customer in control, but require
    // a guided checklist or operator support before money leaves the account.
    if (decision.aiLevel === "watch" || decision.aiLevel === "verify") {
      if (decision.aiLevel === "verify" && !identityVerified) {
        setLatestGuardianDecision(decision);
        setTransferStep("confirm");
        setIsTransferFaceIdOpen(true);
        return;
      }

      const adjustedDecision = {
        ...decision,
        action: (decision.aiLevel === "verify" ? "step_up" : "warn") as GuardianRiskDecision["action"],
        requiresStepUp: decision.aiLevel === "verify" || decision.requiresStepUp,
        requiresChecklist: true,
        explanation:
          decision.aiLevel === "verify"
            ? `Chế độ Đồng hành: Face ID đã xác thực, nhưng KNIGHT vẫn cần bạn hoàn tất checklist trước khi tiền rời tài khoản. ${decision.explanation}`
            : `Chế độ Đồng hành: KNIGHT không tự khóa giao dịch này, nhưng yêu cầu bạn rà lại checklist an toàn hoặc gọi Tổng đài nếu còn nghi ngờ. ${decision.explanation}`,
      };
      setLatestGuardianDecision(adjustedDecision);
      setTransferStep("warning");
      return;
    }

    setLatestGuardianDecision(decision);
    setTransferStep("held");
  };

  const handleConfirmTransfer = () => {
    setIsTransferFaceIdOpen(true);
    setTransferChecklist(transferChecklistItems.map(() => false));
    setHumanReviewStep("idle");
    setIsHumanReviewing(false);

    if (isGuardianConsentOff()) {
      pendingGuardianDecisionRef.current = null;
      setIsTransferAiPending(false);
      updateCachedGuardianDecision(null);
      return;
    }

    void resolveGuardianDecisionForConfirmation();
  };

  const handleTransferFaceIdSuccess = async () => {
    if (isGuardianConsentOff()) {
      completeTransfer();
      return;
    }

    setIsTransferAiPending(true);
    const decision = await resolveGuardianDecisionForConfirmation();
    setIsTransferAiPending(false);
    setIsTransferFaceIdOpen(false);

    if (decision) {
      finalizeDecision(decision, true);
    } else {
      setTransferStep("input_recipient");
    }
  };

  const cancelTransferVerification = () => {
    setIsTransferFaceIdOpen(false);
    setTransferStep("input_details");
    setIsTransferAiPending(false);
  };

  const startHumanReview = () => {
    setIsHumanReviewing(true);
    setHumanReviewStep("connecting");
    setTimeout(() => {
      setHumanReviewStep("chatting");
    }, 1500);
  };

  const completeHumanReview = (approved: boolean) => {
    if (approved) {
      setHumanReviewStep("approved");
      setTimeout(() => {
        setIsHumanReviewing(false);
        setHumanReviewStep("idle");
        completeTransfer();
      }, 2000);
    } else {
      setHumanReviewStep("rejected");
      setTimeout(() => {
        setIsHumanReviewing(false);
        setHumanReviewStep("idle");
        setTransferStep("input_details");
      }, 2000);
    }
  };


  const resetTransferFields = () => {
    setTransferStep("input_recipient");
    selectTransferBank(defaultTransferBank);
    setTransferAccount("");
    setTransferRecipient("");
    setTransferAmount("");
    setTransferContent("");
    setTransferChecklist(transferChecklistItems.map(() => false));
    setIsRecipientVerified(false);
    setIsResolvingName(false);
    setIsTransferFaceIdOpen(false);
    clearGuardianDecision();
    setLatestGuardianDecision(null);
  };

  return {
    amountSignal,
    bankPickerOpen,
    bankSearch,
    completeCompanionReviewedTransfer,
    completeTransfer,
    contentSignal,
    filteredTransferBanks,
    handleConfirmTransfer,
    handleTransferFaceIdSuccess,
    handleNextStep,
    handleNextToDetails,
    handleSelectSuggestion,
    hasTransferAmount,
    intakeSignalCount,
    latestGuardianDecision,
    recipientSignal,
    resetTransferFields,
    selectTransferBank,
    selectedBank,
    setBankPickerOpen,
    setBankSearch,
    handleAccountChange,
    setTransferAmount,
    setTransferChecklist,
    setTransferContent,
    setTransferRecipient,
    setTransferStep,
    transferAccount,
    transferAmount,
    transferAmountNumber,
    transferBank,
    transferChecklist,
    transferContent,
    transferRecipient,
    transferStep,
    isResolvingName,
    isRecipientVerified,
    cachedGuardianDecision,
    isTransferAiPending,
    isTransferFaceIdOpen,
    cancelTransferVerification,
    isHumanReviewing,
    humanReviewStep,
    startHumanReview,
    completeHumanReview,
  };
}

export type BankTransferFlow = ReturnType<typeof useBankTransferFlow>;
