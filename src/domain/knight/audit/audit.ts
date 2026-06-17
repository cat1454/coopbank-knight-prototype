import { demoTimelineBase } from "../../../data/demoScenario";
import type { AuditEvent } from "../types";

let auditSequence = 0;

const eventTimestampByAction: Record<string, string> = {
  "risk.evaluate": demoTimelineBase.reasonedAt,
  "card.suspend": demoTimelineBase.suspendedAt,
  "notification.pushSent": demoTimelineBase.suspendedAt,
  "customer.confirmFraud": demoTimelineBase.customerConfirmedAt,
  "customer.confirmLegitimate": demoTimelineBase.customerConfirmedAt,
  "auth.requestBiometric": demoTimelineBase.customerConfirmedAt,
  "auth.verifyBiometric": demoTimelineBase.biometricVerifiedAt,
  "card.terminate": demoTimelineBase.cardIssuedAt,
  "card.issueNewVirtualCard": demoTimelineBase.cardIssuedAt,
  "case.createFraudCase": demoTimelineBase.caseCreatedAt,
  "recovery.openNextMorningWindow": demoTimelineBase.nextMorningAt,
  "account.confirmSecured": demoTimelineBase.behaviorObservedAt,
  "behavior.observePostIncident": demoTimelineBase.behaviorObservedAt,
  "trustRecovery.calculate": demoTimelineBase.trustAssessedAt,
  "trustRecovery.checkThreshold": demoTimelineBase.trustAssessedAt,
  "reassurance.selectBenefits": demoTimelineBase.packageActivatedAt,
  "reassurance.activateSafetySupport": demoTimelineBase.packageActivatedAt,
  "customer.consentEssentialCashback": demoTimelineBase.cashbackActivatedAt,
  "cashback.activateEssential": demoTimelineBase.cashbackActivatedAt,
  "recovery.observe": demoTimelineBase.recoveryObservedAt,
  "react.complete": demoTimelineBase.reactCompletedAt,
  "card.unsuspend": demoTimelineBase.biometricVerifiedAt,
  "session.whitelist": demoTimelineBase.biometricVerifiedAt,
  "monitoring.enhanced30m": demoTimelineBase.biometricVerifiedAt,
  "customer.timeout": demoTimelineBase.timeoutAt,
  "notification.voiceCall": demoTimelineBase.voiceCallAt,
  "notification.voiceNoAnswer": demoTimelineBase.voiceNoAnswerAt,
  "notification.voiceAnswered": demoTimelineBase.voiceAnsweredAt,
  "notification.smsFallback": demoTimelineBase.smsSentAt,
  "fraudOps.escalate": demoTimelineBase.escalatedAt,
  "card.keepSuspended": demoTimelineBase.escalatedAt,
};

export function resetAuditSequence() {
  auditSequence = 0;
}

export function createAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
  auditSequence += 1;

  return {
    ...event,
    id: `AUD-${auditSequence.toString().padStart(3, "0")}`,
    timestamp: eventTimestampByAction[event.action] ?? new Date().toISOString(),
  };
}

export function appendAuditEvent(
  auditEvents: AuditEvent[],
  event: Omit<AuditEvent, "id" | "timestamp">,
) {
  return [...auditEvents, createAuditEvent(event)];
}

export function getCustomerVisibleAuditEvents(auditEvents: AuditEvent[]) {
  return auditEvents.filter((event) => event.customerVisible);
}
