# AGENTS.md

This file defines the operating rules for any AI Agent, coding assistant, or contributor working on this repository.

The goal is to make the project easier to upgrade, extend, refactor, and maintain without breaking the KNIGHT prototype behavior.

---

## 1. Project Identity

This repository is the **Co-opBank KNIGHT Prototype**.

It demonstrates an AI-assisted banking protection flow for:

- Detecting suspicious card transactions.
- Explaining risk decisions using observable evidence.
- Intervening before financial harm happens.
- Protecting the customer account and card.
- Supporting emotional recovery after a risky incident.
- Demonstrating AI Agent reasoning through observable UI and audit logs.

This is a prototype, but its business logic must be treated as important and intentional.

---

## 2. Core Product Principles

AI Agents must preserve these principles:

- Customer protection comes before promotion or cashback.
- A customer must be protected before recovery offers are shown.
- High-risk actions must have clear reasoning and audit evidence.
- Irreversible financial actions must require customer confirmation.
- Timeout, silence, or no response must never be treated as customer consent.
- Recovery support must feel justified, timely, and need-based.
- The system must avoid looking like it is bribing the customer to ignore a security incident.

---

## 3. Non-Negotiable Safety Rules

Do not break or remove these rules:

- Do not expose real card numbers, CVV, OTP, passwords, access tokens, or secrets in UI, logs, mocks, or tests.
- Do not simulate fraud in a way that teaches real financial abuse.
- Do not add flows that bypass authentication, biometric verification, or customer confirmation.
- Do not automatically terminate a card only because the user timed out.
- Do not let cashback, gifts, or rewards appear before the protection flow is complete.
- Do not replace explainable reasoning with generic labels such as `high risk` without evidence.
- Do not remove audit events from important security actions.
- Do not remove fallback behavior unless a safer alternative is implemented.

---

## 4. Business Flow Rules

The normal incident flow should remain conceptually consistent:

1. Observe suspicious activity.
2. Explain why it is suspicious.
3. Alert the customer.
4. Ask for fraud confirmation.
5. Use step-up verification when needed.
6. Protect the account or card.
7. Confirm the customer is safe.
8. Only then offer recovery support.
9. Log the reasoning and actions.

Recovery flow must follow this order:

1. Protection completed.
2. Customer context analyzed.
3. Essential needs identified.
4. Support package generated.
5. Explanation shown to the customer.
6. Customer may accept or ignore.

Do not reorder these steps without updating tests and documentation.

---

## 5. Architecture Direction

Prefer a **Feature-Sliced + Domain-First** architecture.

Target frontend structure:

```txt
src/
  app/
  pages/
  widgets/
  features/
  entities/
  domain/
    knight/
  shared/
    ui/
    lib/
    api/
    styles/
```

Layer meaning:

- `app`: app bootstrapping, providers, global config.
- `pages`: route-level screens.
- `widgets`: large composed UI sections.
- `features`: user actions and business interactions.
- `entities`: business objects such as customer, card, transaction, incident.
- `domain`: pure business rules, state machine, policy, recovery logic.
- `shared`: reusable UI, helpers, API clients, styles.

Dependency rule:

```txt
app -> pages -> widgets -> features -> entities -> domain/shared
```

Lower layers must not import from higher layers.

Examples:

- `shared/ui` must not import from `features`.
- `domain` must not import React components.
- `features` may use `entities`, `domain`, and `shared`.
- `pages` may compose widgets and features.

---

## 6. Domain Rules

The `domain` layer is the most important layer.

When editing domain logic:

- Keep functions as pure as possible.
- Avoid UI dependencies.
- Avoid browser-only APIs.
- Keep input/output types explicit.
- Add or update tests for every behavior change.
- Prefer small functions over large hidden condition blocks.
- Preserve KNIGHT reasoning phases such as observe, reason, act, verify, recover, and audit.

Do not move important business rules into random UI components.

---

## 7. UI Rules

When refactoring UI:

- Preserve the current demo behavior unless the task says otherwise.
- Keep the mobile/PWA banking feel.
- Keep security states visually clear.
- Do not make the interface look like a generic SaaS dashboard.
- Prefer clear status, strong contrast, and banking/security language.
- Avoid excessive rounded corners, decorative clutter, or vague marketing copy.
- Important actions must have clear labels and visible consequences.

Common reusable UI should move into:

```txt
src/shared/ui
```

Feature-specific UI should stay inside its feature folder.

---

## 8. Styling Rules

Prefer centralized design tokens:

```txt
src/shared/styles/tokens.css
src/shared/styles/globals.css
src/shared/styles/animations.css
```

Rules:

- Do not scatter unrelated global CSS across many files.
- Do not duplicate colors and spacing repeatedly.
- Prefer semantic tokens such as `--color-risk-critical` instead of raw color names.
- Keep animation purposeful, especially for alerts and agent reasoning.
- Do not remove accessibility states such as focus, disabled, and error.

---

## 9. Backend Rules

If editing the demo server, prefer this direction:

```txt
server/
  app.js
  config/
  routes/
  controllers/
  services/
  flows/
  storage/
  demo/
  tests/
```

Rules:

- Routes should be thin.
- Business/demo flows should live in `flows` or `services`.
- Push/SSE logic should be isolated.
- Do not hardcode secrets.
- Do not log sensitive banking information.
- Do not mix keyboard demo controls with core service logic.

---

## 10. Refactor Rules

Refactor in small safe steps.

Allowed:

- Move files to better folders.
- Rename components for clarity.
- Extract shared UI.
- Extract pure business logic.
- Improve naming.
- Remove dead code after verifying it is unused.
- Add tests for existing behavior.

Avoid:

- Full rewrite in one commit.
- Changing UI and business behavior at the same time.
- Adding heavy dependencies without clear benefit.
- Replacing working logic with abstract patterns just to look clean.
- Changing demo flow order without documenting why.

Every meaningful refactor should answer:

- What changed?
- Why is it safer or clearer?
- What behavior stayed the same?
- What tests/build commands passed?

---

## 11. Testing Rules

Before and after major changes, run the available checks:

```bash
npm run lint
npm test
npm run build
```

If E2E behavior is affected, also run:

```bash
npm run test:e2e
```

If a command fails:

- Stop feature work.
- Fix the failure.
- Explain the cause.
- Do not continue stacking unrelated changes.

---

## 12. Documentation Rules

Update documentation when changing:

- Project architecture.
- Folder structure.
- Business flow.
- Demo commands.
- Environment variables.
- Security assumptions.
- Testing commands.

Recommended docs:

```txt
docs/architecture.md
docs/demo-flow.md
docs/security-rules.md
docs/refactor-plan.md
```

---

## 13. Commit Rules

Prefer small commits.

Good commit examples:

```txt
refactor: move shared ui components
refactor: split incident recovery feature
test: cover trust recovery package rules
docs: add agent maintenance rules
```

Bad commit examples:

```txt
update stuff
fix all
refactor project
change everything
```

---

## 14. AI Agent Working Mode

Before changing code, an AI Agent should:

1. Read `README.md`.
2. Read this `AGENTS.md`.
3. Inspect `package.json` scripts.
4. Inspect `src/domain`.
5. Inspect the target files.
6. Make a short plan.
7. Apply one small change.
8. Run checks.
9. Summarize the diff.

The agent should not claim success unless the repository builds or it clearly states which check failed.

---

## AI Agent Scope Control

AI Agents must keep changes small, reviewable, and tied to the requested task.

Rules:

* Do not refactor the whole repository in one pass.
* Do not modify unrelated features just because they look messy.
* Do not change UI behavior and business logic in the same step unless explicitly requested.
* Do not move many files at once without first explaining the migration plan.
* Do not rename public functions, routes, events, mock fields, or test selectors unless all usages are updated.
* Do not delete mock/demo data unless it is proven unused or unsafe.
* Prefer one feature slice, one domain flow, or one UI area per change.

Before editing, the agent should state:

* The exact files likely to change.
* The behavior expected to remain unchanged.
* The validation commands it will run.

After editing, the agent should state:

* What changed.
* What did not change.
* Which checks passed.
* Which checks failed or were not run.
## 15. Expansion Rules

When adding a new feature, create it as a feature slice.

Example:

```txt
src/features/new-feature-name/
  ui/
  model/
  lib/
  api/
  index.ts
```

A new feature should define:

- User goal.
- Trigger condition.
- Input data.
- Output/result.
- Failure state.
- Audit event if it affects safety, finance, or trust.
- Tests for important decisions.

---

## 16. Maintenance Goal

The long-term goal is to make the repository:

- Easy to demo.
- Easy to explain.
- Easy to extend.
- Safe to refactor.
- Clear enough for an AI Agent to modify without destroying the product logic.

Prefer clarity over cleverness. Prefer explicit flow over hidden magic. Prefer tested business rules over beautiful but fragile abstractions.