# 08 - Test And Verification Plan

## Test Strategy

Test theo hành vi người dùng và invariant nghiệp vụ. Không chỉ test animation.

## Required User Journey Tests

### TC-001 - Happy Path Fraud Confirmed

Given:

- Risk score is 847.
- Card is active.
- Customer has personalization consent.

When:

- Risk event arrives.
- Customer taps "Không phải tôi".
- Face ID succeeds.

Then:

- Card is suspended first.
- Old card is terminated only after Face ID.
- New virtual card is issued.
- Fraud case is created.
- Recovery offer is shown.
- Audit timeline includes all critical actions.

### TC-002 - Legitimate Transaction

Given:

- Card is suspended due to high risk.

When:

- Customer taps "Đây là giao dịch của tôi".
- Face ID succeeds.

Then:

- Card is unsuspended.
- Session is whitelisted temporarily.
- Enhanced monitoring starts.
- No new card is issued.
- No fraud case is created.

### TC-003 - Timeout

Given:

- Card is suspended.
- Customer does not respond to Web Push within the urgent 3-5 second window.

When:

- Timeout event fires, automated call is placed, and the call is not answered.

Then:

- SMS fallback is marked sent only after the call no-answer event.
- Fraud Ops escalation is created.
- Card remains suspended.
- Card is not terminated.
- No new card is issued.

### TC-004 - Biometric Failure

Given:

- Customer selected fraud or legitimate.

When:

- Face ID fails.

Then:

- No L3 action runs.
- App allows retry or fallback.
- Audit logs failed biometric attempt.

### TC-005 - GuardianFlow Automatic AI Levels

Given:

- Customer opens the normal transfer flow.
- GuardianFlow demo mode is not enabled.

When:

- Customer enters a safe, warning, verification, or critical transfer.

Then:

- Customer does not see scenario controls.
- KNIGHT evaluates the transfer from transaction input.
- Safe transfers complete normally.
- Warning and verification levels stay inline in the transfer flow.
- Hold or critical levels do not debit the balance before KNIGHT/Fraud Review confirmation.

## Viewport QA

Run or manually inspect:

| Viewport | Must pass |
|---|---|
| 390x844 | No overflow, CTA visible |
| 393x852 | No overlap with safe area |
| 430x932 | Layout not overly sparse |
| 360x780 | Long Vietnamese text still fits |

## Accessibility QA

- All buttons have readable labels.
- Tap target >= 44px.
- Important state is not color-only.
- Reduced motion works.
- Text contrast passes visually for primary surfaces.
- Modal/step-up flow does not trap user without a path.

## Security QA

Search source for forbidden terms:

- `cvv`
- `fullPan`
- `localStorage`
- `api_key`
- `secret`
- real-looking card numbers

Allowed only if part of a test asserting absence or docs explaining rule.

## Definition Of Done

- 3 core branches implemented.
- State machine drives screen state.
- No timed-only animation required for business logic.
- Audit event exists for every sensitive action.
- iPhone viewport QA completed.
- No sensitive demo data.
- Copy matches business/security rules.
- Docs index links updated.

## Manual Demo Script

1. Open prototype at iPhone viewport.
2. Start scenario.
3. Show critical alert.
4. Tap into fraud review.
5. Point out risk score and signals.
6. Tap "Không phải tôi".
7. Show Face ID success.
8. Show old card terminated and new card issued.
9. Show case ID.
10. Show recovery offer.
11. Open audit timeline.
12. Reset and briefly show legitimate branch.
13. Reset and briefly show timeout branch.
