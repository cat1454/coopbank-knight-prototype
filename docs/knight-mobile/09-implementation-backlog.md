# 09 - Implementation Backlog

## Phase 0 - Freeze Direction

Deliverable:

- Presentation/demo direction is approved from `knight_ai_agent_animated.html`.
- Docs in `docs/knight-mobile/` are confirmed as Phase 2 productization inputs.
- Report section L remains high-level product direction, not the current submission artifact.
- Phase 2 implementation stack is frozen in [10-tech-stack-and-foundation.md](10-tech-stack-and-foundation.md): React + TypeScript + Vite, CSS thuần, typed mock services, no real banking backend.

Acceptance:

- Dev can start mobile productization without rereading full report.
- Business can approve guardrails from one file.

## Phase 1 - Mobile Shell

Tasks:

- Create mobile app shell.
- Add iPhone-safe layout tokens.
- Add design tokens for color, type, spacing.
- Build bottom CTA area.
- Build demo controls hidden from customer flow.

Acceptance:

- Works at 390x844.
- No text overflow.
- CTA target >= 44px.

## Phase 2 - State Machine

Tasks:

- Implement scenario state.
- Implement events and transitions from [05-state-machine.md](05-state-machine.md).
- Implement audit append on sensitive transitions.
- Add reset and branch jump controls.

Acceptance:

- State machine can run 3 branches.
- No L3 action without Face ID success.
- Timeout does not terminate card.

## Phase 3 - Fraud Core Flow UI

Tasks:

- Build critical alert surface.
- Build fraud review screen.
- Build risk signal list.
- Build card suspended status.
- Build primary/secondary CTA.

Acceptance:

- Customer understands risk in 5 seconds.
- Both fraud and legitimate CTA route correctly.

## Phase 4 - Face ID And Resolution

Tasks:

- Build Face ID simulation.
- Build new virtual card screen.
- Build legitimate transaction resolution screen.
- Build timeout/escalation screen.

Acceptance:

- Fraud branch issues new virtual card.
- Legit branch restores card.
- Timeout branch escalates and keeps card suspended.

## Phase 5 - Recovery Offer And Audit

Tasks:

- Build recovery offer screen.
- Add consent explanation.
- Build audit timeline.
- Add expandable reason text if needed.

Acceptance:

- Offer feels reassuring, not salesy.
- Timeline shows phase, policy, action, timestamp.

## Phase 6 - Verification

Tasks:

- Check viewport QA.
- Check reduced motion.
- Check sensitive data absence.
- Run available build/test/lint if project tooling exists.
- Capture screenshots if Playwright is available.

Acceptance:

- [08-test-and-verification-plan.md](08-test-and-verification-plan.md) passes.

## Chosen File Structure When Coding Starts

```text
src/
  app/
    App.tsx
  components/
    CriticalAlertSurface.tsx
    FraudReviewScreen.tsx
    BiometricStepUp.tsx
    VirtualCardScreen.tsx
    RecoveryOfferScreen.tsx
    AuditTimeline.tsx
    DemoControls.tsx
  domain/
    knightStateMachine.ts
    mockKnightServices.ts
    policy.ts
    audit.ts
  data/
    demoScenario.ts
  styles/
    tokens.css
    app.css
```

## Legacy Single HTML Option

```text
knight_mobile_banking_prototype.html
```

Inside the file, keep sections separated:

```text
1. CSS tokens
2. Layout styles
3. Component styles
4. Demo seed data
5. State machine
6. Mock services
7. Render functions
8. Event handlers
```

This option is only a fallback for a very short throwaway demo. The chosen Phase 2 productization path is React + TypeScript + Vite.

## Recommended Next Action

Keep `knight_ai_agent_animated.html` as the current Đề 02 presentation/demo artifact. The docs foundation was accepted on 2026-06-11, and the React + TypeScript + Vite mobile/PWA implementation has started under `src/`. Continue future slices against this app and verify with [08-test-and-verification-plan.md](08-test-and-verification-plan.md).
