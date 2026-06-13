import { describe, expect, it } from "vitest";
import {
  demoBehaviorSignals,
  demoFraudCase,
  demoReassurancePackage,
  demoTrustRecoveryAssessment,
} from "./demoScenario";

describe("demo scenario timing", () => {
  it("keeps protection overnight and schedules trust recovery for the next morning", () => {
    const caseCreatedAt = new Date(demoFraudCase.createdAt);
    const firstBehaviorAt = new Date(demoBehaviorSignals[0].observedAt);
    const assessmentAt = new Date(demoTrustRecoveryAssessment.generatedAt);
    const packageActivatedAt = new Date(demoReassurancePackage.activatedAt);

    expect(caseCreatedAt.getDate()).toBe(1);
    expect(firstBehaviorAt.getDate()).toBe(2);
    expect(firstBehaviorAt.getHours()).toBe(8);
    expect(firstBehaviorAt.getMinutes()).toBe(30);
    expect(assessmentAt.getTime()).toBeGreaterThan(firstBehaviorAt.getTime());
    expect(packageActivatedAt.getTime()).toBeGreaterThan(assessmentAt.getTime());
  });
});
