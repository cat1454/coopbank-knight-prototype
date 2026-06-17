# 06 - Data And API Contracts

## Purpose

This file defines the mock contracts that frontend code should use. Even if the prototype is single-file HTML, keep data shaped like these contracts so it can later move to React/TypeScript or real APIs.

## Core Types

```ts
type PolicyLevel = "L0" | "L1" | "L2" | "L3" | "L4";
type ReActPhase = "OBSERVE" | "REASON" | "ACT";
type ActionResult = "success" | "failed" | "pending";
type CustomerIntent = "unknown" | "fraud" | "legitimate" | "timeout";
```

## Transaction Event

```ts
interface TransactionEvent {
  id: string;
  cardId: string;
  merchantName: string;
  merchantCategory: string;
  amountVnd: number;
  occurredAt: string;
  deviceFingerprint: string;
  ipCountry: string;
  ipRisk: "normal" | "vpn" | "tor" | "unknown";
  channel: "ecommerce" | "in_app" | "pos";
}
```

## Risk Assessment

```ts
interface RiskSignal {
  code: string;
  label: string;
  severity: "low" | "medium" | "high";
  customerText: string;
  auditText: string;
}

interface RiskAssessment {
  id: string;
  score: number;
  threshold: number;
  level: "normal" | "elevated" | "high";
  signals: RiskSignal[];
  recommendedAction: "monitor" | "notify" | "verify" | "suspend";
  assessedAt: string;
}
```

## GuardianFlow Decision Intelligence

```ts
type GuardianAiLevel = "safe" | "watch" | "verify" | "hold" | "critical";
type GuardianDecisionSource = "scenario" | "transaction";

interface GuardianRiskDecision {
  transactionId: string;
  source: GuardianDecisionSource;
  scenarioId?: GuardianScenarioId;
  aiLevel: GuardianAiLevel;
  policyLevel: PolicyLevel;
  riskScore: number;
  knightScore: number;
  action: "allow" | "warn" | "delay" | "step_up" | "block" | "review";
  reasonCodes: string[];
  explanation: string;
  requiresStepUp: boolean;
  requiresChecklist: boolean;
  requiresReview: boolean;
}

interface GuardianTransactionEvaluationInput {
  amountVnd: number;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  content: string;
  timestamp?: string;
  location?: string;
  deviceTrust?: "trusted" | "new" | "suspicious";
  ipReputation?: "normal" | "suspicious" | "bad";
  loginMethod?: "password" | "face_id" | "otp";
  priorActions?: string[];
}
```

Customer flow must use transaction-based evaluation. Scenario-based evaluation is only for demo/test mode.

## Card

```ts
interface VirtualCard {
  id: string;
  customerId: string;
  maskedPan: string;
  status: "active" | "suspended" | "terminated";
  label: string;
  issuedAt: string;
  isDemo: boolean;
}
```

Rules:

- Never store full PAN.
- Never store CVV.
- `maskedPan` only.

## Fraud Case

```ts
interface FraudCase {
  id: string;
  customerId: string;
  cardId: string;
  amountVnd: number;
  status: "created" | "under_review" | "resolved" | "escalated";
  createdAt: string;
  expectedReviewWindow: string;
  transactions: string[];
}
```

## Recovery Offer

```ts
interface RecoveryOffer {
  id: string;
  customerId: string;
  trigger: "post_fraud_incident";
  title: string;
  body: string;
  cashbackRatePercent: number;
  durationDays: number;
  categories: string[];
  consentBasis: "personalization_consent";
  status: "ready" | "activated" | "dismissed";
}
```

## Audit Event

```ts
interface AuditEvent {
  id: string;
  caseId?: string;
  timestamp: string;
  phase: ReActPhase;
  policyLevel: PolicyLevel;
  actor: "KNIGHT" | "Customer" | "FraudOps" | "System";
  action: string;
  result: ActionResult;
  reason: string;
  customerVisible: boolean;
}
```

## Mock Service Contract

```ts
interface KnightServices {
  evaluateRisk(events: TransactionEvent[]): Promise<RiskAssessment>;
  suspendCard(cardId: string, reason: string): Promise<VirtualCard>;
  unsuspendCard(cardId: string, reason: string): Promise<VirtualCard>;
  terminateCard(cardId: string, reason: string): Promise<VirtualCard>;
  issueNewVirtualCard(customerId: string): Promise<VirtualCard>;
  verifyBiometric(intent: CustomerIntent): Promise<{ verified: boolean }>;
  createFraudCase(input: CreateFraudCaseInput): Promise<FraudCase>;
  generateRecoveryOffer(customerId: string): Promise<RecoveryOffer | null>;
  writeAudit(event: Omit<AuditEvent, "id">): Promise<AuditEvent>;
}
```

## Demo Seed Data

```json
{
  "customer": {
    "id": "CID-001",
    "name": "Nguyễn Minh An",
    "personalizationConsent": true
  },
  "card": {
    "id": "CARD-001",
    "customerId": "CID-001",
    "maskedPan": "4532 **** **** 1088",
    "status": "active",
    "label": "Thẻ số Co-opBank",
    "issuedAt": "2025-03-01T08:00:00+07:00",
    "isDemo": true
  },
  "riskAssessment": {
    "score": 847,
    "threshold": 800,
    "level": "high"
  }
}
```

## API Naming

Use verb-noun names in code:

- `handleRiskEventReceived`
- `handleCustomerConfirmsFraud`
- `handleCustomerConfirmsLegitimate`
- `handleBiometricVerified`
- `createAuditEvent`
- `deriveNextScreen`

Avoid:

- `doStuff`
- `process`
- `next`
- `aiDecision`
