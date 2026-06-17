import { useState, type Dispatch, type SetStateAction } from "react";
import type { GuardianRiskDecision } from "../../domain/types";
import { evaluateGuardianTransaction } from "../../domain/guardianFlow";
import type { BankTransaction } from "../../entities/bank-account/model/bankingDemo";
import { defaultTransferBank, transferBanks, type TransferBank } from "../../entities/bank/model/transferBanks";

export const transferChecklistItems = [
  "Tôi biết rõ người nhận và đã kiểm tra số tài khoản.",
  "Không ai yêu cầu tôi chuyển tiền gấp hoặc giữ bí mật.",
  "Nội dung giao dịch không liên quan đầu tư, thưởng hoặc hoàn tiền bất thường.",
];

const riskyTransferContentPattern = /dau tu|đầu tư|gap|gấp|bi mat|bí mật|hoan tien|hoàn tiền|thuong|thưởng|otp|crypto/i;

function normalizeBankSearchText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type TransferStep = "input" | "confirm" | "processing" | "warning" | "verification" | "held" | "success";

interface UseBankTransferFlowOptions {
  setBalance: Dispatch<SetStateAction<number>>;
  setTransactions: Dispatch<SetStateAction<BankTransaction[]>>;
}

export function useBankTransferFlow({ setBalance, setTransactions }: UseBankTransferFlowOptions) {
  const [transferStep, setTransferStep] = useState<TransferStep>("input");
  const [transferBank, setTransferBank] = useState(defaultTransferBank.displayName);
  const [bankSearch, setBankSearch] = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [transferAccount, setTransferAccount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferContent, setTransferContent] = useState("");
  const [latestGuardianDecision, setLatestGuardianDecision] = useState<GuardianRiskDecision | null>(null);
  const [transferChecklist, setTransferChecklist] = useState<boolean[]>(() => transferChecklistItems.map(() => false));

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
  const hasRiskyTransferContent = riskyTransferContentPattern.test(normalizedTransferContent);
  const amountSignal =
    !hasTransferAmount
      ? { tone: "neutral", label: "Đang khớp với thói quen chuyển tiền", detail: "Chưa có số tiền để so với nhịp thường ngày." }
      : transferAmountNumber >= 30_000_000
        ? { tone: "danger", label: "Vượt nhịp thường ngày", detail: "Cần giữ lại hoặc mở xác minh KNIGHT trước khi tiền rời tài khoản." }
        : transferAmountNumber >= 10_000_000
          ? { tone: "warning", label: "Cao hơn giao dịch quen thuộc", detail: "KNIGHT sẽ yêu cầu thêm tín hiệu người nhận và phiên đăng nhập." }
          : { tone: "success", label: "Trong nhịp thường ngày", detail: "Số tiền gần vùng giao dịch quen thuộc của tài khoản." };
  const contentSignal =
    !normalizedTransferContent
      ? { tone: "neutral", label: "Đang quét nội dung", detail: "Nội dung chuyển khoản sẽ được quét theo dấu hiệu lừa đảo phổ biến." }
      : hasRiskyTransferContent
        ? { tone: "danger", label: "Từ khóa cần kiểm tra", detail: "Nội dung giống mẫu gấp, đầu tư, hoàn tiền hoặc yêu cầu giữ bí mật." }
        : { tone: "success", label: "Nội dung ổn định", detail: "Không thấy cụm từ rủi ro trong note giao dịch." };
  const recipientSignal = transferAccount
    ? transferAccount === "88884920412" || transferRecipient.toLowerCase().includes("shopmall")
      ? "Người nhận cần xác minh"
      : "Người nhận có thể đối chiếu"
    : "Chưa có người nhận";
  const intakeSignalCount = [
    transferBank,
    transferAccount,
    transferRecipient,
    hasTransferAmount,
    normalizedTransferContent,
  ].filter(Boolean).length;

  const selectTransferBank = (bank: TransferBank) => {
    setTransferBank(bank.displayName);
    setBankSearch("");
    setBankPickerOpen(false);
  };

  const handleSelectSuggestion = (type: "safe" | "fraud") => {
    if (type === "safe") {
      selectTransferBank(defaultTransferBank);
      setTransferAccount("19038472910");
      setTransferRecipient("Nguyễn Văn B");
      setTransferAmount("200000");
      setTransferContent("Huynh Phuoc Phu chuyen tien");
    } else {
      selectTransferBank(defaultTransferBank);
      setTransferAccount("88884920412");
      setTransferRecipient("ShopMall Global");
      setTransferAmount("10000000");
      setTransferContent("Thanh toan don hang");
    }
  };

  const handleNextStep = () => {
    if (transferBank && transferAccount && transferRecipient && transferAmount && transferContent) {
      setTransferStep("confirm");
    }
  };

  const completeTransfer = () => {
    const amountNum = Number(transferAmount);

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

  const handleConfirmTransfer = () => {
    setTransferStep("processing");
    setTransferChecklist(transferChecklistItems.map(() => false));

    setTimeout(async () => {
      const amountNum = Number(transferAmount);
      const isRiskRecipient = transferAccount === "88884920412" || transferRecipient.toLowerCase().includes("shopmall");
      const isCriticalShape = isRiskRecipient && amountNum >= 30_000_000;
      const { decision } = await evaluateGuardianTransaction({
        amountVnd: amountNum,
        recipientName: transferRecipient,
        recipientAccount: transferAccount,
        recipientBank: transferBank,
        content: transferContent,
        location: isCriticalShape ? "Singapore" : "Da Nang",
        deviceTrust: isRiskRecipient || amountNum >= 10_000_000 ? "new" : "trusted",
        ipReputation: isCriticalShape ? "bad" : isRiskRecipient ? "suspicious" : "normal",
        loginMethod: "password",
        priorActions: isRiskRecipient
          ? ["login_password", "add_new_recipient", ...(isCriticalShape ? ["increase_limit"] : []), "open_transfer"]
          : ["login_password", "view_balance", "open_transfer"],
      });

      setLatestGuardianDecision(decision);

      if (decision.aiLevel === "safe") {
        completeTransfer();
        return;
      }

      if (decision.aiLevel === "watch") {
        setTransferStep("warning");
        return;
      }

      if (decision.aiLevel === "verify") {
        setTransferStep("verification");
        return;
      }

      setTransferStep("held");
    }, 1200);
  };

  const resetTransferFields = () => {
    setTransferStep("input");
    selectTransferBank(defaultTransferBank);
    setTransferAccount("");
    setTransferRecipient("");
    setTransferAmount("");
    setTransferContent("");
    setTransferChecklist(transferChecklistItems.map(() => false));
  };

  return {
    amountSignal,
    bankPickerOpen,
    bankSearch,
    completeTransfer,
    contentSignal,
    filteredTransferBanks,
    handleConfirmTransfer,
    handleNextStep,
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
    setTransferAccount,
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
  };
}
