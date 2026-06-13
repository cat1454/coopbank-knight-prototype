import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

function setTestUrl(search = "?env=test") {
  window.history.pushState({}, "", `${window.location.pathname}${search}`);
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

  it("walks the customer through the confirmed fraud recovery and personalization flow", async () => {
    const user = userEvent.setup();
    setTestUrl();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^start$/i }));
    expect(screen.getByRole("heading", { name: /giao dịch bất thường vừa bị chặn/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /mở co-opbank/i }));
    expect(screen.getByText(/KNIGHT đã tạm khóa thẻ số/i)).toBeInTheDocument();
    expect(screen.getByText(/847\/1000/i)).toBeInTheDocument();
    expect(screen.getByText(/10\.000\.000/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /không phải tôi/i }));
    expect(screen.getByRole("heading", { name: /xác thực để khóa thẻ cũ/i })).toBeInTheDocument();
    expect(screen.getByText(/kiểm tra liveness/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /xác thực face id/i }));
    expect(screen.getByRole("heading", { name: /hồ sơ tra soát đã gửi/i })).toBeInTheDocument();
    expect(screen.getByText(/FR-20250601-001/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /phân tích nhu cầu/i }));
    expect(screen.getByRole("heading", { name: /nhu cầu thiết yếu tháng này/i })).toBeInTheDocument();
    expect(screen.getAllByText(/siêu thị/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cao hơn 24%/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /tạo ưu đãi cashback/i }));
    expect(screen.getByRole("heading", { name: /đặc quyền riêng bạn/i })).toBeInTheDocument();
    expect(screen.getAllByText(/hoàn tiền 10%/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /nhận ưu đãi/i }));
    expect(screen.getByRole("heading", { name: /ưu đãi đã được kích hoạt/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Sentiment Score: 100%/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /xem timeline/i }));
    expect(screen.getByText(/Tạm khóa thẻ/i)).toBeInTheDocument();
    expect(screen.getByText(/personalization\.generateRecoveryOffer/i)).toBeInTheDocument();
    expect(screen.getByText(/sentiment\.update/i)).toBeInTheDocument();
  });

  it("supports the legitimate transaction branch", async () => {
    const user = userEvent.setup();
    setTestUrl();
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
    setTestUrl();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^start$/i }));
    await user.click(screen.getByRole("button", { name: /mở co-opbank/i }));
    await user.click(screen.getByRole("button", { name: /không phải tôi/i }));
    await user.click(screen.getByRole("button", { name: /mô phỏng thất bại/i }));

    expect(screen.getByText(/chưa có hành động L3 nào/i)).toBeInTheDocument();
    expect(screen.queryByText(/hồ sơ tra soát đã gửi/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /xác thực face id/i }));
    await user.click(screen.getByRole("button", { name: /phân tích nhu cầu/i }));
    await user.click(screen.getByRole("button", { name: /tạo ưu đãi cashback/i }));
    await user.click(screen.getByRole("button", { name: /nhận ưu đãi/i }));
    await user.click(screen.getByRole("button", { name: /xem timeline/i }));
    expect(screen.getByText(/Face ID failed/i)).toBeInTheDocument();
  });

  it("lets the presenter jump to fraud, full story, and reset from demo controls", async () => {
    const user = userEvent.setup();
    setTestUrl();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^fraud$/i }));
    expect(screen.getByRole("heading", { name: /hồ sơ tra soát đã gửi/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^full$/i }));
    expect(screen.getByRole("heading", { name: /ưu đãi đã được kích hoạt/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Sentiment Score: 100%/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /^reset$/i }));
    expect(screen.getByRole("heading", { name: /Co-opBank luôn canh gác/i })).toBeInTheDocument();
  });

  it("supports the timeout branch from demo controls", async () => {
    const user = userEvent.setup();
    setTestUrl();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /timeout/i }));

    expect(screen.getByText(/Fraud Ops đang xem xét/i)).toBeInTheDocument();
    expect(screen.getByText(/Thẻ vẫn đang tạm khóa/i)).toBeInTheDocument();
    expect(screen.queryByText(/hồ sơ tra soát đã gửi/i)).not.toBeInTheDocument();
  });

  it("supports capture mode shots without demo controls", () => {
    setTestUrl("?env=test&capture=phone&shot=offer&controls=0");
    render(<App />);

    expect(screen.getByRole("heading", { name: /đặc quyền riêng bạn/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/demo controls/i)).not.toBeInTheDocument();
  });

  it("renders a full-frame animated agent sentiment shot", () => {
    setTestUrl("?env=test&capture=agent&shot=sentiment&controls=0");
    render(<App />);

    expect(screen.getByLabelText(/KNIGHT animated agent/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sentiment Score: 100%/i).length).toBeGreaterThan(0);
  });
});
