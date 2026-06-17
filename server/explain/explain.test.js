import { describe, expect, it } from "vitest";
import { buildMockExplanation } from "./explain.js";

describe("GuardianFlow mock explanation", () => {
  it("keeps explanation short, Vietnamese, and independent from action decisions", () => {
    const result = buildMockExplanation({
      reasonCodes: ["amount_above_baseline", "new_device", "new_recipient"],
      riskScore: 72,
      action: "delay",
    });

    expect(result.explanation).toMatch(/KNIGHT/i);
    expect(result.explanation).toMatch(/xác minh|trì hoãn|cảnh báo/i);
    expect(result.explanation.split(".").filter(Boolean).length).toBeLessThanOrEqual(3);
    expect(result.source).toBe("mock");
  });
});
