import {
  demoFraudCase,
  demoNewCard,
  demoReassurancePackage,
  demoRiskAssessment,
} from "../data/demoScenario";
import type {
  AuditEvent,
  CreateFraudCaseInput,
  CustomerIntent,
  ReassurancePackage,
  RiskAssessment,
  TransactionEvent,
  VirtualCard,
} from "./types";

export interface KnightServices {
  evaluateRisk(events: TransactionEvent[]): Promise<RiskAssessment>;
  suspendCard(cardId: string, reason: string): Promise<VirtualCard>;
  unsuspendCard(cardId: string, reason: string): Promise<VirtualCard>;
  terminateCard(cardId: string, reason: string): Promise<VirtualCard>;
  issueNewVirtualCard(customerId: string): Promise<VirtualCard>;
  verifyBiometric(intent: CustomerIntent): Promise<{ verified: boolean }>;
  createFraudCase(input: CreateFraudCaseInput): Promise<ReturnType<typeof createCase>>;
  generateReassurancePackage(customerId: string): Promise<ReassurancePackage | null>;
  writeAudit(event: Omit<AuditEvent, "id">): Promise<AuditEvent>;
}

function createCase(input: CreateFraudCaseInput) {
  return {
    ...demoFraudCase,
    customerId: input.customerId,
    cardId: input.cardId,
    amountVnd: input.amountVnd,
    transactions: input.transactions,
    status: input.status ?? demoFraudCase.status,
  };
}

export const mockKnightServices: KnightServices = {
  async evaluateRisk() {
    return demoRiskAssessment;
  },
  async suspendCard(cardId) {
    return {
      ...demoNewCard,
      id: cardId,
      maskedPan: "4532 **** **** 1088",
      status: "suspended",
      label: "Thẻ số Co-opBank",
    };
  },
  async unsuspendCard(cardId) {
    return {
      ...demoNewCard,
      id: cardId,
      maskedPan: "4532 **** **** 1088",
      status: "active",
      label: "Thẻ số Co-opBank",
    };
  },
  async terminateCard(cardId) {
    return {
      ...demoNewCard,
      id: cardId,
      maskedPan: "4532 **** **** 1088",
      status: "terminated",
      label: "Thẻ số Co-opBank cũ",
    };
  },
  async issueNewVirtualCard(customerId) {
    return { ...demoNewCard, customerId };
  },
  async verifyBiometric(intent) {
    return { verified: intent === "fraud" || intent === "legitimate" };
  },
  async createFraudCase(input) {
    return createCase(input);
  },
  async generateReassurancePackage(customerId) {
    return customerId ? demoReassurancePackage : null;
  },
  async writeAudit(event) {
    return event as AuditEvent;
  },
};
