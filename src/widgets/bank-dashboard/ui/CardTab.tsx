
import { CreditCard } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { formatVnd } from "../../../domain/format";
import type { BankTransaction } from "../../../entities/bank-account/model/bankingDemo";
import "./CardTab.css";
import "./DashboardUtilityViews.css";

interface CardTabProps {
  state: KnightScenarioState;
  transactions: BankTransaction[];
}

export function CardTab({ state, transactions }: CardTabProps) {
    const hasNewCard = !!state.newCard;
    const displayCard = state.newCard || state.card;
    const displayStatus = hasNewCard ? "active" : state.card.status;
    const isSuspendedOrTerminated = state.card.status !== "active";

    return (
      <div className="tab-content dashboard-card">
        <h2 className="section-title">Thẻ số của tôi</h2>
        <div className={`my-card-widget ${displayStatus}`} style={{ marginBottom: "var(--space-4)" }}>
          <div className="my-card-header">
            <CreditCard size={20} />
            <span>Thẻ Ghi Nợ Số</span>
          </div>
          <strong className="my-card-number">
            {displayCard.maskedPan}
          </strong>
          <div className="my-card-footer">
            <span>Trạng thái:</span>
            <span className={`card-badge card-badge--${displayStatus}`}>
              {displayStatus === "active"
                ? "Đang hoạt động"
                : displayStatus === "suspended"
                ? "Đang tạm khóa"
                : "Đã khóa vĩnh viễn"}
            </span>
          </div>
        </div>

        <h2 className="section-title" style={{ marginTop: "var(--space-5)" }}>Lịch sử giao dịch</h2>
        <div className="history-list">
          {isSuspendedOrTerminated && (
            <div className="history-item pending">
              <div className="history-item__left">
                <span className="history-item__icon alert">⚠️</span>
                <div>
                  <strong className="history-merchant">{state.transaction.merchantName}</strong>
                  <span className="history-time">02:00 sáng - Thẻ bị chặn</span>
                </div>
              </div>
              <strong className="history-amount negative">
                -{formatVnd(state.transaction.amountVnd)}
              </strong>
            </div>
          )}
          {transactions.map((txn) => (
            <div className="history-item" key={txn.id}>
              <div className="history-item__left">
                <span className={`history-item__icon ${txn.type === "receive" ? "receive" : ""}`}>
                  {txn.type === "receive" ? "💸" : "☕"}
                </span>
                <div>
                  <strong className="history-merchant">{txn.merchantName}</strong>
                  <span className="history-time">{txn.time}</span>
                </div>
              </div>
              <strong className={`history-amount ${txn.type === "receive" ? "positive" : "negative"}`}>
                {txn.type === "receive" ? "+" : "-"}{formatVnd(txn.amountVnd)}
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
}
