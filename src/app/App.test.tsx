import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

function setTestUrl(search = "?env=test") {
  window.history.pushState({}, "", `${window.location.pathname}${search}`);
}

async function openFraudReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /bắt đầu/i }));
  await user.click(screen.getByRole("button", { name: /mở co-opbank/i }));
  await user.click(screen.getByRole("button", { name: /xem cảnh báo/i }));
}

async function confirmFraudAndVerifyFaceId(user: ReturnType<typeof userEvent.setup>) {
  await openFraudReview(user);
  await user.click(screen.getByRole("button", { name: /không phải tôi/i }));
  expect(screen.getByRole("heading", { name: /xác thực để khóa thẻ cũ/i })).toBeInTheDocument();
  expect(screen.getByText(/kiểm tra liveness/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /xác thực face id/i }));
}

describe("KNIGHT mobile app", () => {
  afterEach(() => {
    setTestUrl("?env=test");
  });

  it("keeps presenter controls out of the customer interface", () => {
    setTestUrl();
    render(<App />);

    expect(screen.queryByLabelText(/demo controls/i)).not.toBeInTheDocument();
  });

  it("keeps the new one-time card visible before returning to the bank home screen", async () => {
    const user = userEvent.setup();
    setTestUrl();
    render(<App />);

    await confirmFraudAndVerifyFaceId(user);

    expect(screen.getByRole("heading", { name: /thẻ số mới đã sẵn sàng/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Demo virtual card/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/One-time emergency virtual card/i)).toBeInTheDocument();
    expect(screen.getByText(/4221 0982 7361 8839/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /bắt đầu phục hồi/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /trang chủ ngân hàng/i }));

    expect(screen.getByText(/Thẻ Ghi Nợ Số/i)).toBeInTheDocument();
    expect(screen.getByText(/4532 \*\*\*\* \*\*\*\* 7291/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /bắt đầu phục hồi/i })).not.toBeInTheDocument();
  });

  it("supports the legitimate transaction branch", async () => {
    const user = userEvent.setup();
    setTestUrl();
    render(<App />);

    await openFraudReview(user);
    await user.click(screen.getByRole("button", { name: /đây là giao dịch của tôi/i }));
    await user.click(screen.getByRole("button", { name: /xác thực/i }));

    expect(screen.getByText(/Thẻ đã được mở lại/i)).toBeInTheDocument();
    expect(screen.getAllByText(/giám sát tăng cường trong 30 phút/i)[0]).toBeInTheDocument();
    expect(screen.queryByText(/FR-20250601-001/i)).not.toBeInTheDocument();
  });

  it("keeps L3 actions blocked when biometric verification fails", async () => {
    const user = userEvent.setup();
    setTestUrl();
    render(<App />);

    await openFraudReview(user);
    await user.click(screen.getByRole("button", { name: /không phải tôi/i }));
    await user.click(screen.getByRole("button", { name: /mô phỏng thất bại/i }));

    expect(screen.getByText(/chưa có hành động L3 nào/i)).toBeInTheDocument();
    expect(screen.queryByText(/FR-20250601-001/i)).not.toBeInTheDocument();

    expect(screen.getByText(/Face ID failed/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /xác thực face id/i }));
    expect(screen.getByLabelText(/One-time emergency virtual card/i)).toBeInTheDocument();
  });

  it("supports direct capture of the secured bank home after fraud case creation", () => {
    setTestUrl("?env=test&capture=phone&shot=case");
    render(<App />);

    expect(screen.getByText(/Thẻ Ghi Nợ Số/i)).toBeInTheDocument();
    expect(screen.getByText(/4532 \*\*\*\* \*\*\*\* 7291/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /bắt đầu phục hồi/i })).not.toBeInTheDocument();
  });

  it("supports direct capture of the timeout branch", () => {
    setTestUrl("?env=test&capture=phone&shot=timeout");
    render(<App />);

    expect(screen.getByText(/Fraud Ops đang xem xét/i)).toBeInTheDocument();
    expect(screen.getByText(/Thẻ vẫn đang tạm khóa/i)).toBeInTheDocument();
  });

  it("supports capture mode shots without demo controls", () => {
    setTestUrl("?env=test&capture=phone&shot=assessment&controls=0");
    render(<App />);

    expect(screen.getByRole("heading", { name: /điểm nhu cầu phục hồi: 82\/100/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/demo controls/i)).not.toBeInTheDocument();
  });

  it("renders a full-frame animated agent recovery shot", () => {
    setTestUrl("?env=test&capture=agent&shot=recovery&controls=0");
    render(<App />);

    expect(screen.getByLabelText(/KNIGHT animated agent/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Recovery evidence observed/i).length).toBeGreaterThan(0);
  });
});
