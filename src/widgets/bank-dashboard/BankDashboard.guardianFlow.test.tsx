import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialBankTransactions, initialBankBalance } from "../../entities/bank-account/model/bankingDemo";
import { createInitialKnightState } from "../../domain/knightStateMachine";
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

async function completeCompanionChecklist(user: ReturnType<typeof userEvent.setup>) {
  const checklist = await screen.findByRole("group", { name: /Checklist Đồng hành/i });
  for (const checkbox of within(checklist).getAllByRole("checkbox")) {
    await user.click(checkbox);
  }
  await user.click(screen.getByRole("button", { name: /Hoàn tất checklist và tiếp tục/i }));
}

describe("BankDashboard GuardianFlow Decision Intelligence", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("presents the transfer form as an AI-assisted intake for amount and note signals", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await openTransferTab(user);

    expect(screen.getByRole("heading", { name: /chuyển tiền nhanh 24\/7/i })).toBeInTheDocument();
    expect(screen.getByText(/KNIGHT đang nhận diện giao dịch/i)).toBeInTheDocument();
    expect(screen.getByText(/Tín hiệu số tiền/i)).toBeInTheDocument();
    expect(screen.getByText(/Tín hiệu nội dung/i)).toBeInTheDocument();
    expect(screen.getByText(/Đang khớp với thói quen chuyển tiền/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/số tiền chuyển/i), "50000000");
    await user.type(screen.getByLabelText(/nội dung chuyển/i), "Dau tu gap");

    expect(screen.getByText(/50\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Vượt nhịp thường ngày/i)).toBeInTheDocument();
    expect(screen.getByText(/Từ khóa cần kiểm tra/i)).toBeInTheDocument();
  });

  it("opens a bank picker sheet with screenshot-style copy and verified logos", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await openTransferTab(user);

    await user.click(screen.getByRole("button", { name: /ngân hàng thụ hưởng/i }));

    expect(screen.getByRole("heading", { name: /bạn muốn chuyển khoản tới ngân hàng nào/i })).toBeInTheDocument();
    const bankSearch = screen.getByRole("combobox", { name: /tìm ngân hàng/i });
    expect(bankSearch).toHaveAttribute("placeholder", "ngân hàng nào?");

    await user.type(bankSearch, "viet");

    const option = await screen.findByRole("option", {
      name: /vietcombank ngân hàng tmcp ngoại thương việt nam/i,
    });
    expect(within(option).getByRole("img", { name: /logo vietcombank/i })).toHaveAttribute(
      "src",
      "/bank-logos/VCB.png",
    );
    expect(within(option).queryByText(/970436|BIN/i)).not.toBeInTheDocument();

    await user.click(option);

    expect(screen.queryByRole("heading", { name: /bạn muốn chuyển khoản tới ngân hàng nào/i })).not.toBeInTheDocument();
    const selectedBankTrigger = screen.getByRole("button", {
      name: /ngân hàng thụ hưởng vietcombank ngân hàng tmcp ngoại thương việt nam/i,
    });
    expect(within(selectedBankTrigger).getByText("Vietcombank")).toBeInTheDocument();
    expect(within(selectedBankTrigger).getByText(/Ngân hàng TMCP Ngoại thương Việt Nam/i)).toBeInTheDocument();
    expect(within(selectedBankTrigger).queryByText(/970436|BIN/i)).not.toBeInTheDocument();
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
    
    // Step 1: Recipient info -> click Next
    const recipientCard = screen.getByText(/1\. Thông tin thụ hưởng/i).closest(".transfer-card")!;
    await user.click(within(recipientCard).getByRole("button", { name: /tiếp tục/i }));

    // Step 2: Transaction details -> click Next
    const detailsCard = screen.getByText(/2\. Chi tiết giao dịch/i).closest(".transfer-card")!;
    await user.click(within(detailsCard).getByRole("button", { name: /tiếp tục/i }));

    await user.click(screen.getByRole("button", { name: /xác nhận chuyển tiền/i }));

    expect(await screen.findByRole("heading", { name: /giao dịch thành công/i }, { timeout: 2500 })).toBeInTheDocument();
    expect(setBalance).toHaveBeenCalled();
    expect(setTransactions).toHaveBeenCalled();
  });

  it("opens one shared Face ID popup from transfer confirmation and hides PIN until Face ID fails", async () => {
    const user = userEvent.setup();
    const { setBalance, setTransactions } = renderDashboard();

    await openTransferTab(user);
    await user.click(screen.getByRole("button", { name: /ShopMall Global/i }));

    const recipientCard = screen.getByText(/1\. Thông tin thụ hưởng/i).closest(".transfer-card")!;
    await user.click(within(recipientCard).getByRole("button", { name: /tiếp tục/i }));

    const detailsCard = screen.getByText(/2\. Chi tiết giao dịch/i).closest(".transfer-card")!;
    await user.click(within(detailsCard).getByRole("button", { name: /tiếp tục/i }));

    expect(screen.getByRole("heading", { name: /xác nhận thông tin giao dịch/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /xác nhận chuyển tiền/i }));

    expect(screen.getByRole("heading", { name: /xác nhận thông tin giao dịch/i })).toBeInTheDocument();
    const faceIdDialog = await screen.findByRole("dialog", { name: /xác thực face id chuyển tiền/i });
    expect(within(faceIdDialog).getByText(/đang xác thực/i)).toBeInTheDocument();
    expect(within(faceIdDialog).queryByRole("button", { name: /dùng mã PIN thay thế/i })).not.toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: /KNIGHT cảnh báo giao dịch/i }, { timeout: 2500 })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Checklist Đồng hành/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Yêu cầu Tổng đài viên xác minh/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hoàn tất checklist và tiếp tục/i })).toBeDisabled();

    await completeCompanionChecklist(user);
    expect(await screen.findByRole("heading", { name: /giao dịch thành công/i }, { timeout: 2500 })).toBeInTheDocument();
    expect(setBalance).toHaveBeenCalled();
    expect(setTransactions).toHaveBeenCalled();
  });

  it("shows the Face ID verified approval in the AI guard panel after a protected transfer completes", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await openTransferTab(user);
    await user.click(screen.getByRole("button", { name: /ShopMall Global/i }));

    const recipientCard = screen.getByText(/1\. Thông tin thụ hưởng/i).closest(".transfer-card")!;
    await user.click(within(recipientCard).getByRole("button", { name: /tiếp tục/i }));

    const detailsCard = screen.getByText(/2\. Chi tiết giao dịch/i).closest(".transfer-card")!;
    await user.click(within(detailsCard).getByRole("button", { name: /tiếp tục/i }));

    await user.click(screen.getByRole("button", { name: /xác nhận chuyển tiền/i }));

    expect(await screen.findByRole("heading", { name: /KNIGHT cảnh báo giao dịch/i }, { timeout: 2500 })).toBeInTheDocument();
    await completeCompanionChecklist(user);

    expect(await screen.findByRole("heading", { name: /giao dịch thành công/i }, { timeout: 2500 })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hộ vệ ai/i }));

    expect(screen.getByText(/Đã xác thực Face ID, giao dịch đã được cho phép/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tiếp tục xác thực face id/i })).not.toBeInTheDocument();
  });

  it("reveals PIN fallback choices only after automatic Face ID recognition fails", async () => {
    window.sessionStorage.setItem("knight_transfer_faceid_result", "fail_once");
    const user = userEvent.setup();
    renderDashboard();

    await openTransferTab(user);
    await user.click(screen.getByRole("button", { name: /ShopMall Global/i }));

    const recipientCard = screen.getByText(/1\. Thông tin thụ hưởng/i).closest(".transfer-card")!;
    await user.click(within(recipientCard).getByRole("button", { name: /tiếp tục/i }));

    const detailsCard = screen.getByText(/2\. Chi tiết giao dịch/i).closest(".transfer-card")!;
    await user.click(within(detailsCard).getByRole("button", { name: /tiếp tục/i }));
    await user.click(screen.getByRole("button", { name: /xác nhận chuyển tiền/i }));

    const faceIdDialog = await screen.findByRole("dialog", { name: /xác thực face id chuyển tiền/i });
    expect(within(faceIdDialog).queryByRole("button", { name: /dùng mã PIN thay thế/i })).not.toBeInTheDocument();

    expect(await within(faceIdDialog).findByText(/không nhận dạng được/i, {}, { timeout: 2500 })).toBeInTheDocument();
    expect(within(faceIdDialog).getByRole("button", { name: /thử lại Face ID/i })).toBeInTheDocument();

    await user.click(within(faceIdDialog).getByRole("button", { name: /dùng mã PIN thay thế/i }));
    expect(within(faceIdDialog).getByRole("heading", { name: /nhập mã PIN giao dịch/i })).toBeInTheDocument();
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

    // Step 1: Recipient info -> click Next
    const recipientCard = screen.getByText(/1\. Thông tin thụ hưởng/i).closest(".transfer-card")!;
    await user.click(within(recipientCard).getByRole("button", { name: /tiếp tục/i }));

    // Step 2: Transaction details -> click Next
    const detailsCard = screen.getByText(/2\. Chi tiết giao dịch/i).closest(".transfer-card")!;
    await user.click(within(detailsCard).getByRole("button", { name: /tiếp tục/i }));

    await user.click(screen.getByRole("button", { name: /xác nhận chuyển tiền/i }));

    expect(
      await screen.findByRole("heading", { name: /giao dịch tạm thời bị giữ lại/i }, { timeout: 2500 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/cảnh báo cao/i)).toBeInTheDocument();
    expect(setBalance).not.toHaveBeenCalled();
    expect(setTransactions).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /mở luồng xác minh KNIGHT/i }));
    expect(onStartDemo).toHaveBeenCalled();
  });

  it("keeps scenario controls available only in explicit demo mode", async () => {
    window.sessionStorage.setItem("knight_guardianflow_consent", "withdrawn");
    const user = userEvent.setup();
    renderDashboard({ guardianDemoEnabled: true });

    await user.click(screen.getByRole("button", { name: /hộ vệ ai/i }));
    await user.click(screen.getByRole("checkbox", { name: /kích hoạt hộ vệ ai/i }));
    await user.click(screen.getByRole("checkbox", { name: /tôi xác nhận đã đọc kỹ và đồng ý kích hoạt/i }));
    await user.click(screen.getByRole("button", { name: /đồng ý và kích hoạt/i }));

    expect(screen.getByLabelText(/scenario/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chạy scenario/i })).toBeInTheDocument();
  });
});
