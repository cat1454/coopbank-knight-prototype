import { describe, expect, it } from "vitest";
import {
  adaptThreatLensDecisionToRiskAssessment,
  decideThreatLensAction,
  evaluateThreatLensTransaction,
  getThreatLensScenario,
  threatLensScenarios,
  runThreatLensAgents,
  toKnightRiskScore,
} from "./threatLens";

describe("ThreatLens Decision Intelligence", () => {
  it("ships the six required mock demo scenarios", () => {
    expect(threatLensScenarios.map((scenario) => scenario.id)).toEqual([
      "low_risk",
      "medium_risk",
      "high_risk",
      "critical_risk",
      "false_positive",
      "feedback_attack",
      "scam_remote_access",
      "scam_fake_job",
      "scam_phishing",
      "scam_romance",
    ]);
  });

  it("scores the low-risk scenario below the warning band", async () => {
    const scenario = getThreatLensScenario("low_risk");
    const agents = await runThreatLensAgents(scenario);
    const decision = decideThreatLensAction(scenario, agents);

    expect(decision.riskScore).toBeLessThanOrEqual(25);
    expect(decision.action).toBe("allow");
    expect(decision.reasonCodes).toContain("trusted_recipient");
  });

  it("warns for medium risk without blocking the customer", async () => {
    const scenario = getThreatLensScenario("medium_risk");
    const agents = await runThreatLensAgents(scenario);
    const decision = decideThreatLensAction(scenario, agents);

    expect(decision.riskScore).toBeGreaterThanOrEqual(36);
    expect(decision.riskScore).toBeLessThanOrEqual(55);
    expect(decision.action).toBe("warn");
    expect(decision.reasonCodes).toContain("amount_above_baseline");
  });

  it("delays high-risk transfers and requires step-up", async () => {
    const scenario = getThreatLensScenario("high_risk");
    const agents = await runThreatLensAgents(scenario);
    const decision = decideThreatLensAction(scenario, agents);

    expect(decision.riskScore).toBeGreaterThanOrEqual(66);
    expect(decision.riskScore).toBeLessThanOrEqual(78);
    expect(decision.action).toBe("delay");
    expect(decision.requiresStepUp).toBe(true);
  });

  it("blocks critical risk and maps the score into the existing KNIGHT scale", async () => {
    const scenario = getThreatLensScenario("critical_risk");
    const agents = await runThreatLensAgents(scenario);
    const decision = decideThreatLensAction(scenario, agents);
    const riskAssessment = adaptThreatLensDecisionToRiskAssessment(decision, scenario);

    expect(decision.riskScore).toBeGreaterThanOrEqual(86);
    expect(decision.action).toBe("block");
    expect(toKnightRiskScore(decision.riskScore)).toBeGreaterThanOrEqual(860);
    expect(riskAssessment.threshold).toBe(800);
    expect(riskAssessment.recommendedAction).toBe("suspend");
    expect(riskAssessment.intelligence?.scenarioId).toBe("critical_risk");
  });

  it("keeps known false positives out of the block band", async () => {
    const scenario = getThreatLensScenario("false_positive");
    const agents = await runThreatLensAgents(scenario);
    const decision = decideThreatLensAction(scenario, agents);

    expect(decision.action).toBe("warn");
    expect(decision.riskScore).toBeLessThan(66);
    expect(decision.reasonCodes).toContain("verified_travel_context");
  });

  it("does not lower risk for repeated social-engineering confirmations", async () => {
    const scenario = getThreatLensScenario("feedback_attack");
    const agents = await runThreatLensAgents(scenario);
    const decision = decideThreatLensAction(scenario, agents);

    expect(decision.action).toBe("delay");
    expect(decision.requiresStepUp).toBe(true);
    expect(decision.reasonCodes).toContain("repeated_confirm_attempts");
  });

  it("evaluates live transfer input into an automatic AI level without a scenario selector", async () => {
    const result = await evaluateThreatLensTransaction({
      amountVnd: 3_000_000,
      recipientName: "Nguyễn Văn B",
      recipientAccount: "19038472910",
      recipientBank: "Ngân hàng liên kết",
      content: "Chuyen tien sinh hoat",
      loginMethod: "password",
    });

    expect(result.decision.source).toBe("transaction");
    expect(result.decision.scenarioId).toBeUndefined();
    expect(result.decision.aiLevel).toBe("watch");
    expect(result.decision.policyLevel).toBe("L1");
    expect(result.riskAssessment.recommendedAction).toBe("notify");
  });

  it("keeps critical live transfers in the reversible hold band", async () => {
    const result = await evaluateThreatLensTransaction({
      amountVnd: 50_000_000,
      recipientName: "ShopMall Global",
      recipientAccount: "88884920412",
      recipientBank: "Co-opBank",
      content: "Dau tu gap",
      location: "Singapore",
      deviceTrust: "new",
      ipReputation: "bad",
      loginMethod: "password",
      priorActions: ["login_password", "add_new_recipient", "increase_limit", "open_transfer"],
    });
    expect(result.decision.aiLevel).toBe("critical");
    expect(result.decision.action).toBe("block");
    expect(result.decision.policyLevel).toBe("L2");
    expect(result.riskAssessment.recommendedAction).toBe("suspend");
  });
});
