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

  it("walks the customer through explainable trust recovery after the account is secured", async () => {
    const user = userEvent.setup();
    setTestUrl();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /bắt đầu/i }));
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

    await user.click(screen.getByRole("button", { name: /chuyển sang sáng hôm sau/i }));
    expect(screen.getByRole("heading", { name: /bắt đầu phục hồi niềm tin đúng thời điểm/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /mở phiên phục hồi buổi sáng/i }));
    expect(screen.getByRole("heading", { name: /\[observe\] hành vi sau sự cố/i })).toBeInTheDocument();
    expect(screen.getByText(/6 lần từ sáng sớm/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /đánh giá nhu cầu phục hồi niềm tin/i }));
    expect(screen.getByRole("heading", { name: /điểm nhu cầu phục hồi: 82\/100/i })).toBeInTheDocument();
    expect(screen.getByText(/ngưỡng kích hoạt/i)).toBeInTheDocument();
    expect(screen.getAllByText(/siêu thị/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /kích hoạt gói phục hồi an tâm/i }));
    expect(screen.getByRole("heading", { name: /gói phục hồi an tâm đã được kích hoạt/i })).toBeInTheDocument();
    expect(screen.getByText(/bảo vệ tài khoản 30 ngày/i)).toBeInTheDocument();
    expect(screen.getByText(/hoàn phí giao dịch bị ảnh hưởng nếu đủ điều kiện/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /kích hoạt hoàn tiền thiết yếu/i }));
    expect(screen.getAllByText(/khách hàng quay lại thanh toán điện/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/recovery react cycle complete/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hoàn tất & về trang chủ/i }));
    expect(screen.getByRole("heading", { name: /Hiệp sĩ số bảo vệ thẻ/i })).toBeInTheDocument();
    expect(screen.getByText(/KNIGHT AI v2\.0/i)).toBeInTheDocument();
  });

  it("supports the legitimate transaction branch", async () => {
    const user = userEvent.setup();
    setTestUrl();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /bắt đầu/i }));
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

    await user.click(screen.getByRole("button", { name: /bắt đầu/i }));
    await user.click(screen.getByRole("button", { name: /mở co-opbank/i }));
    await user.click(screen.getByRole("button", { name: /không phải tôi/i }));
    await user.click(screen.getByRole("button", { name: /mô phỏng thất bại/i }));

    expect(screen.getByText(/chưa có hành động L3 nào/i)).toBeInTheDocument();
    expect(screen.queryByText(/hồ sơ tra soát đã gửi/i)).not.toBeInTheDocument();

    expect(screen.getByText(/Face ID failed/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /xác thực face id/i }));
    await user.click(screen.getByRole("button", { name: /chuyển sang sáng hôm sau/i }));
    await user.click(screen.getByRole("button", { name: /mở phiên phục hồi buổi sáng/i }));
    await user.click(screen.getByRole("button", { name: /đánh giá nhu cầu phục hồi/i }));
    await user.click(screen.getByRole("button", { name: /kích hoạt gói phục hồi an tâm/i }));
    await user.click(screen.getByRole("button", { name: /kích hoạt hoàn tiền thiết yếu/i }));
    await user.click(screen.getByRole("button", { name: /hoàn tất & về trang chủ/i }));
    expect(screen.getByRole("heading", { name: /Hiệp sĩ số bảo vệ thẻ/i })).toBeInTheDocument();
  });

  it("supports direct capture of the submitted fraud case", () => {
    setTestUrl("?env=test&capture=phone&shot=case");
    render(<App />);

    expect(screen.getByRole("heading", { name: /hồ sơ tra soát đã gửi/i })).toBeInTheDocument();
  });

  it("supports direct capture of the timeout branch", () => {
    setTestUrl("?env=test&capture=phone&shot=timeout");
    render(<App />);

    expect(screen.getByText(/Fraud Ops đang xem xét/i)).toBeInTheDocument();
    expect(screen.getByText(/Thẻ vẫn đang tạm khóa/i)).toBeInTheDocument();
    expect(screen.queryByText(/hồ sơ tra soát đã gửi/i)).not.toBeInTheDocument();
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
