import { describe, expect, it } from "vitest";
import { getCustomerVisibleAuditEvents } from "./audit";
import type { AuditEvent } from "./types";

const baseAuditEvent: AuditEvent = {
  id: "AUD-001",
  timestamp: "2026-06-01T02:00:01+07:00",
  phase: "OBSERVE",
  policyLevel: "L0",
  actor: "KNIGHT",
  action: "risk.evaluate",
  result: "success",
  reason: "Risk score evaluated with explainable evidence",
  customerVisible: true,
  label: "Risk evaluated",
};

describe("audit event helpers", () => {
  it("keeps only customer-visible audit events in their original order", () => {
    const hiddenEvent: AuditEvent = {
      ...baseAuditEvent,
      id: "AUD-002",
      action: "notification.pushSent",
      customerVisible: false,
    };
    const laterVisibleEvent: AuditEvent = {
      ...baseAuditEvent,
      id: "AUD-003",
      action: "card.suspend",
      label: "Card suspended",
    };

    expect(getCustomerVisibleAuditEvents([baseAuditEvent, hiddenEvent, laterVisibleEvent])).toEqual([
      baseAuditEvent,
      laterVisibleEvent,
    ]);
  });
});
