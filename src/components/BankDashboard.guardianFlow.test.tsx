import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialBankTransactions, initialBankBalance } from "../data/bankingDemo";
import { createInitialKnightState } from "../domain/knightStateMachine";
import { BankDashboard } from "./BankDashboard";

function renderDashboard(options: { guardianDemoEnabled?: boolean } = {}) {
  const state = createInitialKnightState();
  const onStartDemo = vi.fn();
  const setBalance = vi.fn();
  const setTransactions = vi.fn();

  render(
    <BankDashboard
      state={state}
      selectedQtdnd="QTDND Đà Nẵng"
      onStartDemo={onStartDemo}
      onLogout={vi.fn()}
      balance={initialBankBalance}
      setBalance={setBalance}
      transactions={createInitialBankTransactions()}
      setTransactions={setTransactions}
      guardianDemoEnabled={options.guardianDemoEnabled}
    />,
  );

  return { onStartDemo, setBalance, setTransactions };
}

async function openTransferTab(user: ReturnType<typeof userEvent.setup>) {
  const nav = screen.getByRole("navigation", { name: /thanh điều hướng chính/i });
  await user.click(within(nav).getByRole("button", { name: /chuyển tiền/i }));
}

describe("BankDashboard GuardianFlow Decision Intelligence", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("shows automatic AI status without customer-facing scenario controls", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: /hộ vệ ai/i }));

    expect(screen.getByRole("heading", { name: /KNIGHT Decision Intelligence/i })).toBeInTheDocument();
    expect(screen.getByText(/trạng thái AI tự động/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/scenario/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /chạy scenario/i })).not.toBeInTheDocument();
  });

  it("allows a safe transfer after KNIGHT evaluates it automatically", async () => {
    const user = userEvent.setup();
    const { setBalance, setTransactions } = renderDashboard();

    await openTransferTab(user);
    await user.click(screen.getByRole("button", { name: /Nguyễn Văn B/i }));
    await user.click(screen.getByRole("button", { name: /tiếp tục/i }));
    await user.click(screen.getByRole("button", { name: /xác nhận chuyển tiền/i }));

    expect(await screen.findByRole("heading", { name: /giao dịch thành công/i }, { timeout: 2500 })).toBeInTheDocument();
    expect(setBalance).toHaveBeenCalled();
    expect(setTransactions).toHaveBeenCalled();
  });

  it("holds a critical transfer inline before money leaves the account", async () => {
    const user = userEvent.setup();
    const { onStartDemo, setBalance, setTransactions } = renderDashboard();

    await openTransferTab(user);
    await user.click(screen.getByRole("button", { name: /ShopMall Global/i }));
    await user.clear(screen.getByLabelText(/số tiền chuyển/i));
    await user.type(screen.getByLabelText(/số tiền chuyển/i), "50000000");
    await user.clear(screen.getByLabelText(/nội dung chuyển/i));
    await user.type(screen.getByLabelText(/nội dung chuyển/i), "Dau tu gap");
    await user.click(screen.getByRole("button", { name: /tiếp tục/i }));
    await user.click(screen.getByRole("button", { name: /xác nhận chuyển tiền/i }));

    expect(
      await screen.findByRole("heading", { name: /giao dịch tạm thời bị giữ lại/i }, { timeout: 2500 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(setBalance).not.toHaveBeenCalled();
    expect(setTransactions).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /mở luồng xác minh KNIGHT/i }));
    expect(onStartDemo).toHaveBeenCalled();
  });

  it("keeps scenario controls available only in explicit demo mode", async () => {
    const user = userEvent.setup();
    renderDashboard({ guardianDemoEnabled: true });

    await user.click(screen.getByRole("button", { name: /hộ vệ ai/i }));
    await user.click(screen.getByRole("checkbox", { name: /đồng ý/i }));
    await user.click(screen.getByRole("button", { name: /bắt đầu/i }));

    expect(screen.getByLabelText(/scenario/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chạy scenario/i })).toBeInTheDocument();
  });
});
