# Co-opBank KNIGHT Video UI Refactor Roadmap

Source brief: `h:\Knight\coopbank_knight_video_ui_recommendations.md`

Repo target: `h:\Knight\coopbank-knight-prototype`

## Goal

Refactor the React/Vite prototype so the final 4-minute video can show the full story:

```text
AI detects risk
-> customer confirms fraud
-> Face ID verifies
-> old card is terminated
-> new virtual card is issued
-> fraud case is created
-> spending need is analyzed
-> personalized cashback offer is accepted
-> KNIGHT observes positive sentiment and completes the ReAct loop
```

The security flow is already strong. The missing work is the post-incident personalization loop, a cleaner video capture mode, and copy/data consistency.

## Non-Negotiable Invariants

- Keep the animated AI character. `src/components/KnightAgentVisual.tsx` must remain live and animated, not replaced by a static image.
- Keep both AI placements: the desktop side panel in `App.tsx` and the compact/mobile use in `BankDashboard.tsx` / `CriticalAlertSurface.tsx`.
- Video capture can crop or choose a layout, but the default demo surface should still include the animated AI panel.
- Do not show full PAN, CVV, secrets, API keys, or real banking credentials.
- Keep old card `4532 **** **** 1088`, new card `4532 **** **** 7291`, and Risk Score `847/1000`.
- Keep the customer name as `Huynh Phuoc Phu` / `Huỳnh Phước Phú` consistently.
- Use repo-local React + TypeScript + CSS. Do not add backend services, databases, migrations, or new packages unless a later request explicitly expands scope.
- Prefer small state-machine changes with tests before broad UI polish.

## Current Repo Evidence

- `src/app/App.tsx` owns the main demo shell, phone frame, `KnightAgentVisual`, `DemoControls`, and visible screen routing.
- `src/domain/knightStateMachine.ts` currently ends the fraud recovery branch at `recovery_offer_ready -> audit_complete`.
- `src/domain/types.ts` has no offer acceptance, offer activation, spending insight, or sentiment completion states.
- `src/data/demoScenario.ts` still uses `amountVnd: 4800000`, `5%`, `90 days`, and categories including Internet / essentials.
- `src/components/RecoveryOfferScreen.tsx` uses `Xem timeline` as the primary CTA.
- `src/components/BiometricStepUp.tsx` is functional but visually simple: fingerprint/ring, no camera preview or liveness steps.
- `src/components/VirtualCardScreen.tsx` already shows old-card termination, new-card issuing, and fraud case summary, but the case does not get its own clear 2-3 second screen.
- `src/components/BankDashboard.tsx` has the suspicious transfer seeded as `4800000` and detects `4800000` as the fraud trigger.
- `tests/e2e/knight-mobile.spec.ts` and `src/app/App.test.tsx` cover the existing fraud, legitimate, timeout, sensitive-data, and overflow basics.

## Target State Machine

Keep existing states and add a second ReAct loop after `fraud_case_created`.

```text
fraud_case_created
-> spending_insight_ready
-> recovery_offer_ready
-> offer_activated
-> sentiment_positive
-> react_cycle_completed
-> audit_complete
```

Add events:

```text
ANALYZE_SPENDING_SUCCESS
GENERATE_PERSONALIZED_OFFER_SUCCESS
CUSTOMER_ACCEPTS_OFFER
ACTIVATE_OFFER_SUCCESS
UPDATE_SENTIMENT_SUCCESS
COMPLETE_REACT_CYCLE
AUDIT_COMPLETE
```

Implementation note:

- Either keep `GENERATE_OFFER_SUCCESS` as an alias for `GENERATE_PERSONALIZED_OFFER_SUCCESS`, or migrate tests/UI to the new event name in one slice.
- Prefer keeping `recovery_offer_ready` to reduce churn, but change its data/copy to the 10% offer.
- `sentiment_positive` is the state where `KnightAgentVisual` must show `[OBSERVE]`, `Sentiment Score: 100%`, `Offer status: ACCEPTED`, and `ReAct Cycle Complete`.

## Visible Screen Routing

Recommended `VisibleScreen` additions:

```text
fraud-case-submitted
spending-insight
recovery-offer
offer-activated
audit-timeline
```

Recommended mapping:

```text
card_terminated_l3       -> virtual-card
new_card_issued          -> virtual-card
fraud_case_created       -> fraud-case-submitted
spending_insight_ready   -> spending-insight
recovery_offer_ready     -> recovery-offer
offer_activated          -> offer-activated
sentiment_positive       -> offer-activated, with agent panel showing OBSERVE
react_cycle_completed    -> audit-timeline or offer-activated with completion banner
audit_complete           -> audit-timeline
```

This preserves the current virtual card progression while giving the fraud case and post-incident personalization their own readable shots.

## Dependency Graph

```text
Step 1 data/copy baseline
  -> Step 2 state machine expansion
      -> Step 3 app routing and demo controls
      -> Step 4 personalized offer acceptance
      -> Step 5 spending insight screen
      -> Step 6 fraud case submitted screen
  -> Step 7 Face ID visual upgrade
  -> Step 8 video capture mode
      -> Step 9 CSS/motion polish
          -> Step 10 tests, screenshots, docs
```

Parallel candidates:

- Step 5 `SpendingInsightScreen` and Step 7 Face ID visual work can be developed after the data baseline with light stubs.
- Step 6 `FraudCaseSubmittedScreen` can be developed in parallel with offer UI once state names are settled.
- Step 8 capture mode should wait until the new screens exist.

## Step 1 - Normalize Demo Data And Copy

Context:

The recommendation file asks the video to use `10.000.000 VND`, `10%`, `this month`, and categories `Dien, Nuoc, Sieu thi`. Existing code still has `4.800.000`, `5%`, `90 ngay`, and Internet / essentials.

Files:

- `src/data/demoScenario.ts`
- `src/components/BankDashboard.tsx`
- `src/components/FraudReviewScreen.tsx`
- `src/components/RecoveryOfferScreen.tsx`
- `src/components/GuardScreen.tsx`
- `src/components/KnightAgentVisual.tsx`
- `docs/knight-mobile/03-user-journeys-and-screens.md`
- Tests that assert old copy

Tasks:

- Change suspicious transaction amount to `10000000`.
- Update dashboard suspicious transfer preset and fraud trigger from `4800000` to `10000000`.
- Update recovery offer seed: `cashbackRatePercent: 10`, categories `["Điện", "Nước", "Siêu thị"]`, month-based copy.
- Replace hardcoded `5%` / `90 ngày` in UI with values derived from `state.recoveryOffer`.
- Keep customer name consistent.
- Keep Risk Score `847/1000`.

Verification:

```powershell
npm run lint
npm run test -- --run src/domain/knightStateMachine.test.ts src/app/App.test.tsx
npm run build
```

Exit criteria:

- No remaining `4800000`, `5% cashback`, or `90 ngày` in live UI except historical docs explicitly marked obsolete.
- Fraud trigger still starts the KNIGHT flow from dashboard transfer.
- Tests pass with updated copy.

Rollback:

- Revert only data/copy changes. No state or component architecture should be touched in this slice.

## Step 2 - Expand Domain Types, Policy, And State Machine

Context:

State is the backbone of the prototype. Add post-incident personalization states before UI polish so every screen is driven by real transitions.

Files:

- `src/domain/types.ts`
- `src/domain/policy.ts`
- `src/domain/knightStateMachine.ts`
- `src/domain/audit.ts`
- `src/domain/mockKnightServices.ts`
- `src/domain/knightStateMachine.test.ts`

Tasks:

- Add new `ScenarioStateName` values:
  - `spending_insight_ready`
  - `offer_activated`
  - `sentiment_positive`
  - `react_cycle_completed`
- Add new `VisibleScreen` values:
  - `fraud-case-submitted`
  - `spending-insight`
  - `offer-activated`
- Add new `KnightEventType` values:
  - `ANALYZE_SPENDING_SUCCESS`
  - `GENERATE_PERSONALIZED_OFFER_SUCCESS`
  - `CUSTOMER_ACCEPTS_OFFER`
  - `ACTIVATE_OFFER_SUCCESS`
  - `UPDATE_SENTIMENT_SUCCESS`
  - `COMPLETE_REACT_CYCLE`
- Add a small `SpendingInsight` type or reuse a typed object in state:
  - Electricity amount and growth
  - Water amount and growth
  - Supermarket amount and growth
  - Essential spending growth summary, `24%`
- Add an optional `sentiment` object:
  - response `POSITIVE`
  - offer status `ACCEPTED`
  - score `100`
- Add policies:
  - Can analyze spending only after `fraud_case_created` and personalization consent.
  - Can generate personalized offer only after `spending_insight_ready`.
  - Can activate offer only from `recovery_offer_ready`.
  - Can update sentiment only after offer activation.
- Append audit events for every new sensitive/business transition.
- Keep `AUDIT_COMPLETE` valid from the final new states and the legitimate branch.

Verification:

```powershell
npm run test -- --run src/domain/knightStateMachine.test.ts
npm run lint
```

Exit criteria:

- A full fraud happy path reaches `react_cycle_completed`.
- Invalid transitions are no-ops.
- L3 card actions still require Face ID.
- Offer activation cannot happen before offer generation.
- Audit events include `personalization.analyzeSpending`, `personalization.generateRecoveryOffer`, `offer.activate`, and `sentiment.update`.

Rollback:

- Remove new state/event additions and keep the old `recovery_offer_ready -> audit_complete` path.

## Step 3 - Wire App Routing And Presenter Controls

Context:

`App.tsx` currently wires one CTA from `VirtualCardScreen` to `GENERATE_OFFER_SUCCESS`, then `RecoveryOfferScreen` to timeline. This must become a sequence suitable for filming.

Files:

- `src/app/App.tsx`
- `src/components/DemoControls.tsx`
- `src/app/App.test.tsx`
- `tests/e2e/knight-mobile.spec.ts`

Tasks:

- Add handlers:
  - `showFraudCaseSubmitted` or direct transition after case creation.
  - `analyzeSpending` -> `ANALYZE_SPENDING_SUCCESS`.
  - `generatePersonalizedOffer` -> `GENERATE_PERSONALIZED_OFFER_SUCCESS`.
  - `acceptOffer` -> `CUSTOMER_ACCEPTS_OFFER`, `ACTIVATE_OFFER_SUCCESS`, `UPDATE_SENTIMENT_SUCCESS`, `COMPLETE_REACT_CYCLE`.
  - `showTimeline` from `react_cycle_completed`.
- Update `screen` switch with new visible screens.
- Update `jumpFraud` to optionally run the full video path, or add a separate `Video` / `Full` demo control.
- Keep current `Fraud`, `Legit`, `Timeout`, `Reset` controls available for tests and debugging.
- Keep the desktop `agent-panel-wrapper` with `KnightAgentVisual state={state}` unchanged by default.

Verification:

```powershell
npm run test -- --run src/app/App.test.tsx
npm run test:e2e
```

Exit criteria:

- User can click through the full story without hidden keyboard shortcuts.
- Existing legitimate and timeout paths still pass.
- Animated AI panel remains visible in the default desktop demo.

Rollback:

- Revert only `App.tsx` and control changes; state machine can remain if tests still pass.

## Step 4 - Refactor Recovery Offer Into Acceptable Personalized Offer

Context:

The offer screen should no longer treat `Xem timeline` as the main CTA. The video needs `Nhận ưu đãi` and an activation result.

Files:

- `src/components/RecoveryOfferScreen.tsx`
- Optional rename/new file: `src/components/PersonalizedOfferScreen.tsx`
- New file: `src/components/OfferActivatedScreen.tsx`
- `src/styles/app.css`
- `src/app/App.test.tsx`
- `tests/e2e/knight-mobile.spec.ts`

Tasks:

- Change offer screen copy to:
  - `Đặc quyền riêng bạn`
  - `Hoàn tiền 10%`
  - `Điện, Nước & Siêu thị`
  - `trong tháng này`
- Primary CTA: `Nhận ưu đãi`.
- Secondary CTA: `Để sau`.
- Move timeline to a secondary link or only after activation/completion.
- Create `OfferActivatedScreen`:
  - Activated title
  - 10% cashback
  - category checklist
  - validity through `30/06/2026`
  - optional CTA `Xem timeline`
- Update state with offer status `activated` when accepted.

Verification:

```powershell
npm run test -- --run src/app/App.test.tsx
npm run lint
```

Exit criteria:

- Offer acceptance is a visible user action.
- UI shows offer activated before final sentiment/timeline.
- There is no full PAN/CVV/secrets in page text.

Rollback:

- Keep `RecoveryOfferScreen` but restore CTA to old timeline behavior.

## Step 5 - Add SpendingInsightScreen

Context:

This is the biggest missing story beat: why KNIGHT offers cashback after the incident.

Files:

- New file: `src/components/SpendingInsightScreen.tsx`
- `src/data/demoScenario.ts`
- `src/domain/types.ts`
- `src/app/App.tsx`
- `src/styles/app.css`
- Tests

UI content:

```text
Nhu cầu thiết yếu tháng này

Điện       1.250.000 đ   ↑ 18%
Nước         420.000 đ   ↑ 12%
Siêu thị   3.850.000 đ   ↑ 31%

Chi tiêu thiết yếu cao hơn 24% so với tháng trước.
```

Design direction:

- Use a compact financial insight screen, not a marketing card.
- Show a small category bar/chart or three horizontal meter rows.
- Include a consent note, but keep it short.
- CTA: `Tạo ưu đãi Cashback`.

Verification:

```powershell
npm run test -- --run src/app/App.test.tsx
npm run lint
```

Exit criteria:

- Screen fits 390x844, 393x852, 430x932, and 360x780.
- It explains the 10% offer with data.
- It advances to the personalized offer state.

Rollback:

- Route `fraud_case_created` directly to `recovery_offer_ready` while leaving the component unused.

## Step 6 - Add FraudCaseSubmittedScreen

Context:

The current virtual card screen includes the case ID, but the video needs one clear 2-3 second beat that says the dispute was sent.

Files:

- New file: `src/components/FraudCaseSubmittedScreen.tsx`
- `src/app/App.tsx`
- `src/domain/types.ts`
- `src/domain/knightStateMachine.ts`
- `src/styles/app.css`
- Tests

UI content:

```text
Hồ sơ tra soát đã gửi

Mã hồ sơ: FR-20250601-001
Số tiền: 10.000.000 VND
Dự kiến xử lý: 3-5 ngày làm việc

Thẻ số mới đã được phát hành.
```

Tasks:

- Map `fraud_case_created` to this screen after the virtual card issuing step.
- CTA: `Phân tích nhu cầu tháng này`.
- Keep a compact case summary in `VirtualCardScreen`, but make this screen the readable shot.

Verification:

```powershell
npm run test -- --run src/app/App.test.tsx src/domain/knightStateMachine.test.ts
```

Exit criteria:

- Viewer can clearly read case ID and expected handling time.
- The screen advances to `spending_insight_ready`.

Rollback:

- Map `fraud_case_created` back to `virtual-card`.

## Step 7 - Upgrade Face ID Visuals

Context:

`BiometricStepUp.tsx` is functionally correct but visually weaker than the AI-generated Face ID shot. Improve it without changing security semantics.

Files:

- `src/components/BiometricStepUp.tsx`
- `src/styles/app.css`
- Tests if headings/buttons change

Tasks:

- Add camera-preview style container.
- Add oval face scan frame.
- Add animated scan line.
- Add three checklist steps:
  - `Phát hiện khuôn mặt`
  - `Kiểm tra liveness`
  - `Đối chiếu dữ liệu`
- Add explicit consent copy for the fraud branch:
  - verifying Face ID means the customer agrees to terminate the old card, issue a new virtual card, and create a fraud case.
- Preserve failure path: failed Face ID must not run L3 card actions.

Verification:

```powershell
npm run test -- --run src/app/App.test.tsx
npm run lint
```

Manual viewport QA:

- 390x844
- 393x852
- 430x932
- 360x780

Exit criteria:

- Face ID looks cinematic enough for a 20-30 second video section.
- No test regression in failed biometric flow.

Rollback:

- Restore old ring markup and CSS while preserving text updates if desired.

## Step 8 - Add Video Capture Mode

Context:

The recommendation says not to film the full debug layout all the time. Add a query-driven capture mode instead of manually editing UI for recording.

Files:

- `src/app/App.tsx`
- `src/components/DemoControls.tsx`
- `src/styles/app.css`
- `tests/e2e/knight-mobile.spec.ts`
- Optional docs: `docs/knight-mobile/video-capture-guide.md`

Query proposal:

```text
?env=test&capture=split       default phone + animated AI
?env=test&capture=phone       phone only, no demo controls
?env=test&capture=agent       animated KNIGHT only
?env=test&controls=0          hide demo controls
?env=test&shot=fraud-review   preload a target state
?env=test&shot=offer          preload recovery_offer_ready
?env=test&shot=sentiment      preload sentiment_positive
```

Rules:

- `capture=split` remains the recommended default for proof-of-system shots.
- `capture=agent` is for AI Control Room close-ups and must render `KnightAgentVisual` full-frame.
- `capture=phone` can hide the side panel, but should not delete or break the AI component in the codebase.
- `controls=0` hides `DemoControls`.
- Shot preloading should use existing event sequences, not hardcoded partial objects.

Verification:

```powershell
npm run test:e2e
npm run build
```

Manual screenshot set:

- `/?env=test&capture=split&shot=reason`
- `/?env=test&capture=agent&shot=sentiment`
- `/?env=test&capture=phone&shot=faceid&controls=0`
- `/?env=test&capture=phone&shot=offer&controls=0`

Exit criteria:

- Presenter can record every required shot without editing source code.
- No controls/debug chrome in phone-only capture.
- Animated AI has a dedicated full-frame recording mode.

Rollback:

- Remove query classes/shot preloading and keep normal demo controls.

## Step 9 - Motion And Visual Polish

Context:

After functional screens exist, add enough motion to make the video feel alive while staying bank-like and readable.

Files:

- `src/styles/app.css`
- `src/styles/knight-agent.css`
- New/updated components from prior steps

Tasks:

- Add subtle transitions between app screens.
- Add meter animation for spending insight.
- Add offer activation tick animation.
- Add active cashback banner on dashboard when offer is activated.
- Update `KnightAgentVisual` states:
  - `spending_insight_ready`: `[REASON]`, essential spending is high.
  - `recovery_offer_ready`: `[ACT]`, generate cashback offer.
  - `offer_activated`: offer accepted.
  - `sentiment_positive` / `react_cycle_completed`: `[OBSERVE] Sentiment Score 100%`.
- Keep the central animated KNIGHT character intact.

Verification:

```powershell
npm run lint
npm run build
```

Manual QA:

- No overlapping text in phone frame.
- No horizontal overflow.
- Animations do not resize fixed UI regions.

Exit criteria:

- The UI feels recordable without relying on AI images for main banking screens.
- `KnightAgentVisual` communicates both ReAct loops.

Rollback:

- Revert CSS and `KnightAgentVisual` copy additions; state machine can remain.

## Step 10 - Verification, Screenshots, And Handoff Docs

Context:

The final output should be ready to record. This step gathers evidence and updates docs so another agent or the user can continue.

Files:

- `tests/e2e/knight-mobile.spec.ts`
- `docs/knight-mobile/05-state-machine.md`
- `docs/knight-mobile/09-implementation-backlog.md`
- Optional new `docs/knight-mobile/video-capture-guide.md`
- README if capture mode needs a short note

Tasks:

- Update state machine docs with new states/events.
- Update backlog with the new video-ready phase.
- Add E2E assertions for:
  - Full fraud recovery + personalization path.
  - Offer accepted -> sentiment 100%.
  - Capture mode hides controls when requested.
  - Sensitive data still absent.
  - No horizontal overflow.
- Capture screenshots for:
  - Critical alert
  - Fraud review
  - Face ID
  - Virtual card
  - Fraud case
  - Spending insight
  - Offer
  - Offer activated
  - Agent sentiment 100%

Verification:

```powershell
npm run lint
npm run test
npm run build
npm run test:e2e
```

Exit criteria:

- Full app tests pass.
- E2E screenshots cover all planned video UI shots.
- Docs describe how to reproduce shots from URL query params.

Rollback:

- Docs/tests can be reverted independently from runtime code if needed.

## Recommended Implementation Order

1. Data/copy normalization.
2. State machine and tests.
3. App routing and controls.
4. Offer acceptance and activation screens.
5. Spending insight screen.
6. Fraud case submitted screen.
7. Face ID visual upgrade.
8. Video capture mode.
9. Motion polish and dashboard banner.
10. E2E screenshots and docs.

## First PR / First Session Cut

If time is limited, start with a compact first slice:

```text
Normalize data/copy
+ add state events through sentiment_positive
+ update KnightAgentVisual for sentiment 100%
+ update tests
```

That creates the backbone. UI screens can then be added without reopening the domain model every time.

## Final Acceptance Checklist

- [ ] Suspicious amount is `10.000.000 VND`.
- [ ] Customer name is consistent.
- [ ] Offer is `10%` for Electricity, Water, and Supermarket this month.
- [ ] Offer primary CTA is `Nhận ưu đãi`.
- [ ] Customer can activate the offer.
- [ ] Agent shows `[OBSERVE] Sentiment Score: 100%`.
- [ ] Spending insight screen exists.
- [ ] Fraud case submitted screen exists.
- [ ] Face ID has camera/oval/liveness scan animation.
- [ ] Demo controls can be hidden for recording.
- [ ] Query-driven capture mode exists.
- [ ] Animated `KnightAgentVisual` remains present and recordable.
- [ ] No full card number or CVV appears.
- [ ] L3 card actions still require Face ID.
- [ ] Legitimate and timeout branches still pass.
- [ ] Build, lint, unit tests, and e2e pass.
