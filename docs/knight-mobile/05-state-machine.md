# 05 - State Machine

## State Model

The implementation should model KNIGHT as an event-driven state machine, not as a purely timed animation.

## States

| State | Description | Visible Screen |
|---|---|---|
| `idle_monitoring` | No active fraud event | Optional home/guarding screen |
| `risk_detected` | Risk score and signals received | Critical alert |
| `card_suspended_l2` | Card temporarily suspended | Fraud review |
| `awaiting_customer_response` | Waiting for customer decision | Fraud review |
| `customer_confirms_fraud` | Customer says transaction is not theirs | Face ID step-up |
| `customer_confirms_legit` | Customer says transaction is legitimate | Face ID step-up |
| `biometric_required` | App asks Face ID | Face ID step-up |
| `biometric_verified` | Face ID success | Transition |
| `card_terminated_l3` | Old virtual card terminated | New card progress |
| `new_card_issued` | New virtual card is active | New virtual card |
| `fraud_case_created` | Fraud case opened | New virtual card |
| `recovery_offer_ready` | Offer generated | Recovery offer |
| `audit_complete` | Timeline complete | Audit timeline |
| `card_unsuspended` | Card restored after legitimate confirmation | Resolution screen |
| `device_session_whitelisted` | Device/session whitelisted temporarily | Resolution screen |
| `enhanced_monitoring_30m` | Monitoring elevated for 30 minutes | Resolution screen |
| `customer_timeout` | No response in 5 minutes | Timeout/escalation screen |
| `sms_fallback_sent` | SMS fallback sent | Timeout/escalation screen |
| `fraud_ops_escalated` | Human review created | Timeout/escalation screen |
| `card_remains_suspended` | Card stays suspended | Timeout/escalation screen |

## Events

| Event | Allowed From | To |
|---|---|---|
| `RISK_EVENT_RECEIVED` | `idle_monitoring` | `risk_detected` |
| `AUTO_SUSPEND_ALLOWED` | `risk_detected` | `card_suspended_l2` |
| `PUSH_SENT` | `card_suspended_l2` | `awaiting_customer_response` |
| `CUSTOMER_TAPS_FRAUD` | `awaiting_customer_response` | `customer_confirms_fraud` |
| `CUSTOMER_TAPS_LEGIT` | `awaiting_customer_response` | `customer_confirms_legit` |
| `REQUEST_BIOMETRIC` | `customer_confirms_fraud`, `customer_confirms_legit` | `biometric_required` |
| `BIOMETRIC_SUCCESS_FRAUD` | `biometric_required` | `biometric_verified` |
| `BIOMETRIC_SUCCESS_LEGIT` | `biometric_required` | `biometric_verified` |
| `TERMINATE_CARD_SUCCESS` | `biometric_verified` with fraud intent | `card_terminated_l3` |
| `ISSUE_CARD_SUCCESS` | `card_terminated_l3` | `new_card_issued` |
| `CREATE_CASE_SUCCESS` | `new_card_issued` | `fraud_case_created` |
| `GENERATE_OFFER_SUCCESS` | `fraud_case_created` | `recovery_offer_ready` |
| `AUDIT_COMPLETE` | `recovery_offer_ready` | `audit_complete` |
| `UNSUSPEND_CARD_SUCCESS` | `biometric_verified` with legit intent | `card_unsuspended` |
| `WHITELIST_SESSION_SUCCESS` | `card_unsuspended` | `device_session_whitelisted` |
| `ENHANCED_MONITORING_STARTED` | `device_session_whitelisted` | `enhanced_monitoring_30m` |
| `CUSTOMER_RESPONSE_TIMEOUT` | `awaiting_customer_response` | `customer_timeout` |
| `SMS_SENT` | `customer_timeout` | `sms_fallback_sent` |
| `ESCALATE_FRAUD_OPS` | `sms_fallback_sent` | `fraud_ops_escalated` |
| `KEEP_CARD_SUSPENDED` | `fraud_ops_escalated` | `card_remains_suspended` |
| `RESET_SCENARIO` | any | `idle_monitoring` |

## Transition Guards

```text
canAutoSuspend =
  riskScore >= 800
  and action == "card.suspend"
  and actionIsReversible == true

canTerminateCard =
  customerIntent == "fraud"
  and biometricStatus == "verified"
  and action == "card.terminate"

canIssueNewCard =
  oldCardStatus == "terminated"
  and customerIntent == "fraud"
  and biometricStatus == "verified"

canShowRecoveryOffer =
  fraudCaseStatus == "created"
  and personalizationConsent == true

canUnsuspend =
  customerIntent == "legitimate"
  and biometricStatus == "verified"
```

## Audit Requirements

Every transition that changes card, auth, case, offer or escalation state must write audit:

```json
{
  "id": "AUD-001",
  "caseId": "FR-20250601-001",
  "timestamp": "2025-06-01T02:00:02+07:00",
  "phase": "ACT",
  "policyLevel": "L2",
  "actor": "KNIGHT",
  "action": "card.suspend",
  "result": "success",
  "reason": "Risk score 847 with device, IP, velocity and time anomalies"
}
```

## Failure States For Prototype

The first prototype can handle failures as visible error panels:

| Failure | UI behavior |
|---|---|
| Biometric failed | Stay on Face ID screen, allow retry, do not terminate card |
| Issue card failed | Show retry/escalate, old card remains terminated only if terminate already succeeded |
| Audit write failed | Show system issue, keep action result visible, flag audit incomplete |
| Offer failed | Skip offer, show audit timeline |

For demo safety, happy path failures can be hidden behind demo controls.
