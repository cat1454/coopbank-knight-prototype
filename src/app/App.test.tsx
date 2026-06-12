import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("KNIGHT mobile app", () => {
  it("walks the customer through the confirmed fraud recovery flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^start$/i }));
    expect(screen.getByRole("heading", { name: /giao dịch bất thường vừa bị chặn/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /mở co-opbank/i }));
    expect(screen.getByText(/KNIGHT đã tạm khóa thẻ số/i)).toBeInTheDocument();
    expect(screen.getByText(/847\/1000/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /không phải tôi/i }));
    expect(screen.getByRole("heading", { name: /xác thực để khóa thẻ cũ/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /xác thực/i }));
    expect(screen.getByText(/Thẻ số mới đã sẵn sàng/i)).toBeInTheDocument();
    expect(screen.getByText(/FR-20250601-001/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /xem ưu đãi/i }));
    expect(screen.getByText(/dựa trên danh mục chi tiêu đã được bạn cho phép/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /xem timeline/i }));
    expect(screen.getByText(/Tạm khóa thẻ/i)).toBeInTheDocument();
    expect(screen.getByText(/Terminate \+ issue new card/i)).toBeInTheDocument();
  });

  it("supports the legitimate transaction branch", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^start$/i }));
    await user.click(screen.getByRole("button", { name: /mở co-opbank/i }));
    await user.click(screen.getByRole("button", { name: /đây là giao dịch của tôi/i }));
    await user.click(screen.getByRole("button", { name: /xác thực/i }));

    expect(screen.getByText(/Thẻ đã được mở lại/i)).toBeInTheDocument();
    expect(screen.getAllByText(/giám sát tăng cường trong 30 phút/i)[0]).toBeInTheDocument();
    expect(screen.queryByText(/FR-20250601-001/i)).not.toBeInTheDocument();
  });

  it("keeps L3 actions blocked when biometric verification fails", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^start$/i }));
    await user.click(screen.getByRole("button", { name: /mở co-opbank/i }));
    await user.click(screen.getByRole("button", { name: /không phải tôi/i }));
    await user.click(screen.getByRole("button", { name: /mô phỏng thất bại/i }));

    expect(screen.getByText(/chưa có hành động L3 nào/i)).toBeInTheDocument();
    expect(screen.queryByText(/Thẻ số mới đã sẵn sàng/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /xác thực/i }));
    await user.click(screen.getByRole("button", { name: /xem ưu đãi/i }));
    await user.click(screen.getByRole("button", { name: /xem timeline/i }));
    expect(screen.getByText(/Face ID failed/i)).toBeInTheDocument();
  });

  it("lets the presenter jump to fraud and reset from demo controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^fraud$/i }));
    expect(screen.getByRole("heading", { name: /thẻ số mới đã sẵn sàng/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^reset$/i }));
    expect(screen.getByRole("heading", { name: /Co-opBank luôn canh gác/i })).toBeInTheDocument();
  });

  it("supports the timeout branch from demo controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /timeout/i }));

    expect(screen.getByText(/Fraud Ops đang xem xét/i)).toBeInTheDocument();
    expect(screen.getByText(/Thẻ vẫn đang tạm khóa/i)).toBeInTheDocument();
    expect(screen.queryByText(/Thẻ số mới đã sẵn sàng/i)).not.toBeInTheDocument();
  });
});
