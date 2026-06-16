import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialKnightState } from "../domain/knightStateMachine";
import { createInitialBankTransactions, initialBankBalance } from "../data/bankingDemo";
import { BankDashboard } from "./BankDashboard";

function renderDashboard() {
  const state = createInitialKnightState();
  const setBalance = vi.fn();
  const setTransactions = vi.fn();

  render(
    <BankDashboard
      state={state}
      selectedQtdnd="QTDND Đà Nẵng"
      onStartDemo={vi.fn()}
      onLogout={vi.fn()}
      balance={initialBankBalance}
      setBalance={setBalance}
      transactions={createInitialBankTransactions()}
      setTransactions={setTransactions}
      guardianDemoEnabled
    />,
  );

  return { setBalance, setTransactions };
}

describe("BankDashboard GuardianFlow Decision Intelligence", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("shows consent before the Decision Intelligence surfaces", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: /hộ vệ ai/i }));

    expect(screen.getByRole("heading", { name: /KNIGHT Decision Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bắt đầu/i })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /đồng ý/i }));
    await user.click(screen.getByRole("button", { name: /bắt đầu/i }));

    expect(screen.getByRole("button", { name: /Demo/i })).toBeInTheDocument();
    expect(screen.getByText(/low_risk/i)).toBeInTheDocument();
  });

  it("runs a medium scenario as warning with agent console details", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: /hộ vệ ai/i }));
    await user.click(screen.getByRole("checkbox", { name: /đồng ý/i }));
    await user.click(screen.getByRole("button", { name: /bắt đầu/i }));

    await user.selectOptions(screen.getByLabelText(/scenario/i), "medium_risk");
    await user.click(screen.getByRole("button", { name: /chạy scenario/i }));

    expect(screen.getByRole("heading", { name: /cảnh báo giao dịch/i })).toBeInTheDocument();
    expect(screen.getByText(/42\/100/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Số tiền cao hơn/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /xem chi tiết phân tích/i }));

    const consoleRegion = screen.getByLabelText(/GuardianFlow agent console/i);
    expect(within(consoleRegion).getByText(/Transaction/i)).toBeInTheDocument();
    expect(within(consoleRegion).getByText(/Decision/i)).toBeInTheDocument();
  });

  it("routes critical risk to ActionCenter and preserves KNIGHT escalation entry", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: /hộ vệ ai/i }));
    await user.click(screen.getByRole("checkbox", { name: /đồng ý/i }));
    await user.click(screen.getByRole("button", { name: /bắt đầu/i }));

    await user.selectOptions(screen.getByLabelText(/scenario/i), "critical_risk");
    await user.click(screen.getByRole("button", { name: /chạy scenario/i }));

    expect(screen.getByRole("heading", { name: /giao dịch tạm thời bị giữ lại/i })).toBeInTheDocument();
    expect(screen.getByText(/Mã tham chiếu: GF-CRITICAL_RISK-001/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mở luồng xác minh KNIGHT/i })).toBeInTheDocument();
  });
});
