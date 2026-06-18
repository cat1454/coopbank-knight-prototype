import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialKnightState, runScenarioEvents } from "../../../domain/knightStateMachine";
import { BiometricStepUp } from "./BiometricStepUp";

function createBiometricRequiredState() {
  return runScenarioEvents(createInitialKnightState(), [
    "RISK_EVENT_RECEIVED",
    "AUTO_SUSPEND_ALLOWED",
    "PUSH_SENT",
    "CUSTOMER_TAPS_FRAUD",
    "REQUEST_BIOMETRIC",
  ]);
}

describe("BiometricStepUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps Face ID on visible scan states before resolving verification", () => {
    const onVerify = vi.fn();
    render(<BiometricStepUp state={createBiometricRequiredState()} onVerify={onVerify} onFail={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /xác thực face id/i }));

    expect(screen.getByText(/đang tìm khuôn mặt/i)).toBeInTheDocument();
    expect(onVerify).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(screen.getByText(/kiểm tra liveness \(nháy mắt\)/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(screen.getByText(/đang đối chiếu dữ liệu/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(260);
    });
    expect(screen.getByText(/xác thực thành công/i)).toBeInTheDocument();
    expect(onVerify).toHaveBeenCalledWith("fraud");
  });
});
