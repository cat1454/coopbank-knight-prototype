# 10 - Tech Stack And Foundation

## Purpose

This file freezes the implementation direction for the Phase 2 KNIGHT mobile/PWA productization work. It exists so the next coding pass can start from a clear foundation instead of re-deciding framework, scope, data boundary, and verification rules.

The current submission artifact remains `knight_ai_agent_animated.html`. This Phase 2 stack is for the later iPhone-first mobile web/PWA prototype.

## Chosen Direction

- Build a focused **mobile web/PWA prototype**, not a full native banking app.
- Use **React + TypeScript + Vite** when coding starts.
- Keep `knight_ai_agent_animated.html` unchanged as the approved staged presentation/demo artifact.
- Use **mock data and mock service boundaries only**. Do not connect to real banking APIs.
- Simulate Face ID in the web prototype. Native Face ID, APNs, and Apple Wallet are out of scope until a native app phase is approved.
- Keep the product flow iPhone-first: Critical Alert -> Fraud Review -> Face ID -> Resolution -> Recovery Offer -> Audit Timeline.

## Stack Baseline

| Layer | Decision | Reason |
|---|---|---|
| Frontend runtime | React | Component surfaces map directly to the documented screens |
| Language | TypeScript | State machine, policy, card, case, offer, and audit contracts need typed boundaries |
| Build tool | Vite | Lightweight SPA/PWA tooling, static deployment, fast local iteration |
| Styling | Plain CSS | Preserve exact banking tokens, viewport rules, and no framework lock-in |
| Icons | lucide-react | Small, clear icons for shield, alert, check, card, timeline |
| State | Reducer/state machine in TypeScript | Business flow must be event-driven, not animation-driven |
| Data | Local demo scenario + async mock services | Matches API contracts without creating backend scope |
| PWA | Manifest + static service worker later | Cache shell/assets only, never card/customer/audit data |
| Tests | Vitest + React Testing Library + Playwright | Unit guardrails, UI behavior, and viewport QA |

## Explicit Non-Choices

- No Next.js for Phase 2: no SSR, server routes, or backend are needed yet.
- No Expo/React Native for Phase 2: native biometric and app-store packaging are not in scope.
- No Tailwind or component UI kit: the visual spec already defines exact tokens and layout rules.
- No production auth, database, Fraud Ops dashboard, chargeback workflow, or real card issuance.
- No `localStorage` for sensitive state. Demo state can live in memory.

## Foundation File Set

The current markdown set is sufficient as a foundation. Implementation should start only after the ready-to-code gate is explicitly accepted.

| File | Status | Role |
|---|---|---|
| `README.md` | Enough | Repo entrypoint and current artifact |
| `docs/README.md` | Enough | Project docs index and priority order |
| `docs/knight-mobile/README.md` | Enough | Phase 2 docs index |
| `01-product-capability.md` | Enough | Capability, scope, actors, contracts |
| `02-business-rules-and-guardrails.md` | Enough | Business rules, permissions, invariants |
| `03-user-journeys-and-screens.md` | Enough | Happy path, branches, required screens |
| `04-mobile-ux-spec.md` | Enough | iPhone viewport, layout, tokens, motion |
| `05-state-machine.md` | Enough | States, events, guards, audit requirements |
| `06-data-and-api-contracts.md` | Enough | Type contracts and mock service shape |
| `07-security-and-compliance.md` | Enough | Sensitive data, threat model, copy boundaries |
| `08-test-and-verification-plan.md` | Enough | Acceptance, viewport, security, demo checks |
| `09-implementation-backlog.md` | Enough | Build phases and chosen file structure |
| `10-tech-stack-and-foundation.md` | New foundation | Tech stack and no-code baseline |

## Decisions Closed Here

- Brand copy in app: use **Co-opBank** in user-facing UI unless a later brand review says otherwise.
- Recovery offer: show after fraud case creation only when `personalizationConsent = true`; include visible consent explanation and allow "Để sau".
- Legitimate branch: required in demo controls and test plan, but not the primary spoken demo path.
- Implementation stack: React + TypeScript + Vite for productized Phase 2; no coding until docs foundation is accepted.
- Language: Vietnamese-first. English-only technical identifiers are allowed in code later; no bilingual UI unless requested.

## Implementation Status

Ready-to-code gate was accepted on 2026-06-11. The mobile/PWA implementation now exists under `src/` with React + TypeScript + Vite, typed mock services, and Playwright viewport checks.

Keep `knight_ai_agent_animated.html` unchanged as the approved staged presentation/demo artifact. Continue Phase 2 work in the React/Vite app unless a later decision explicitly changes direction.

## Operational Defaults Before Coding

- The original docs-only gate has been opened by explicit user request. Further code changes should stay inside the React + TypeScript + Vite mobile/PWA path.
- Branding should stay conservative: use text brand "Co-opBank" and a simple shield/icon mark. Do not invent or scrape an official bank logo.
- Screenshot QA is not required for the docs-only handoff. Once UI implementation starts, capture viewport evidence for 390x844, 393x852, 430x932, and 360x780.

## Ready-To-Code Gate

Do not start code until these are true:

- This file is linked from the mobile docs README.
- `01-product-capability.md` no longer lists stack as an open question.
- `09-implementation-backlog.md` names React + TypeScript + Vite as the chosen Phase 2 path.
- The operational defaults above are still accepted or have been explicitly overridden.
- The user explicitly asks to implement the mobile/PWA app, not just the foundation.

Status on 2026-06-11: satisfied; implementation has started.
