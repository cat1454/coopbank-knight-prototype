export interface BankTransaction {
  id: string;
  merchantName: string;
  amountVnd: number;
  time: string;
  status: "success" | "pending";
  type: "transfer" | "receive";
}

export const initialBankBalance = 36360430;

export function createInitialBankTransactions(): BankTransaction[] {
  return [
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
  ];
}
