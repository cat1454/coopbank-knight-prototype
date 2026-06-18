import { describe, expect, it } from "vitest";
import { DEMO_FLOW_IDS, getDemoFlow, listDemoFlows } from "../flows/demoFlows.js";

describe("server demo entry points", () => {
  it("starts the 02:00 protection flow at the urgent alert and leaves actions manual", () => {
    const flow = getDemoFlow(DEMO_FLOW_IDS.NIGHT_PROTECTION);

    expect(flow.label).toMatch(/02:00|ban đêm/i);
    expect(flow.showCriticalAlert).toBe(true);
    expect(flow.events).toEqual([
      "RISK_EVENT_RECEIVED",
      "AUTO_SUSPEND_ALLOWED",
      "PUSH_SENT",
    ]);
    expect(flow.autoAdvance).toBe(false);
  });

  it("opens the next-morning recovery scene and leaves all CTAs manual", () => {
    const flow = getDemoFlow(DEMO_FLOW_IDS.NEXT_MORNING_RECOVERY);

    expect(flow.label).toMatch(/08:30|sáng hôm sau/i);
    expect(flow.showCriticalAlert).toBe(false);
    expect(flow.events.at(-1)).toBe("OPEN_NEXT_MORNING_RECOVERY");
    expect(flow.events).not.toContain("OBSERVE_POST_INCIDENT_BEHAVIOR_SUCCESS");
    expect(flow.autoAdvance).toBe(false);
  });

  it("exposes exactly two manual recording entry points", () => {
    const flows = listDemoFlows();

    expect(flows.map((flow) => flow.id)).toEqual([
      "night-protection",
      "next-morning-recovery",
    ]);
    expect(() => getDemoFlow("unknown")).toThrow(/unknown demo flow/i);
  });
});
