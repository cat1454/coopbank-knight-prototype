import type {
  CustomerProfile,
  FraudCase,
  RecoveryOffer,
  RiskAssessment,
  TransactionEvent,
  VirtualCard,
} from "../domain/types";

export const demoCustomer: CustomerProfile = {
  id: "CID-001",
  name: "Huỳnh Phước Phú",
  personalizationConsent: true,
};

export const demoTransaction: TransactionEvent = {
  id: "TXN-20250601-001",
  cardId: "CARD-001",
  merchantName: "ShopMall Global",
  merchantCategory: "E-commerce",
  amountVnd: 4800000,
  occurredAt: "2025-06-01T02:00:00+07:00",
  deviceFingerprint: "new-ios-device-demo",
  ipCountry: "Singapore",
  ipRisk: "vpn",
  channel: "ecommerce",
};

export const demoRiskAssessment: RiskAssessment = {
  id: "RISK-20250601-001",
  score: 847,
  threshold: 800,
  level: "high",
  recommendedAction: "suspend",
  assessedAt: "2025-06-01T02:00:01+07:00",
  signals: [
    {
      code: "NEW_DEVICE",
      label: "Thiết bị mới",
      severity: "high",
      customerText: "Thiết bị này chưa từng dùng thẻ số của bạn.",
      auditText: "New device fingerprint for card CARD-001",
    },
    {
      code: "VPN_SG",
      label: "IP VPN Singapore",
      severity: "medium",
      customerText: "Địa chỉ mạng có dấu hiệu ẩn vị trí.",
      auditText: "IP country SG with vpn risk flag",
    },
    {
      code: "VELOCITY_4X",
      label: "4 giao dịch trong 3 phút",
      severity: "high",
      customerText: "Nhiều giao dịch diễn ra liên tiếp lúc 02:00.",
      auditText: "Four transactions in three minutes after midnight",
    },
  ],
};

export const demoCard: VirtualCard = {
  id: "CARD-001",
  customerId: demoCustomer.id,
  maskedPan: "4532 **** **** 1088",
  status: "active",
  label: "Thẻ số Co-opBank",
  issuedAt: "2025-03-01T08:00:00+07:00",
  isDemo: true,
};

export const demoNewCard: VirtualCard = {
  id: "CARD-NEW-001",
  customerId: demoCustomer.id,
  maskedPan: "4532 **** **** 7291",
  status: "active",
  label: "Thẻ số Co-opBank mới",
  issuedAt: "2025-06-01T02:03:19+07:00",
  isDemo: true,
};

export const demoFraudCase: FraudCase = {
  id: "FR-20250601-001",
  customerId: demoCustomer.id,
  cardId: demoCard.id,
  amountVnd: demoTransaction.amountVnd,
  status: "created",
  createdAt: "2025-06-01T02:03:20+07:00",
  expectedReviewWindow: "3-5 ngày làm việc",
  transactions: [demoTransaction.id],
};

export const demoRecoveryOffer: RecoveryOffer = {
  id: "OFFER-20250601-001",
  customerId: demoCustomer.id,
  trigger: "post_fraud_incident",
  title: "Một ưu đãi an tâm dành riêng cho bạn",
  body: "Nhận 5% cashback cho điện, nước, internet và nhu yếu phẩm trong 90 ngày.",
  cashbackRatePercent: 5,
  durationDays: 90,
  categories: ["Điện", "Nước", "Internet", "Nhu yếu phẩm"],
  consentBasis: "personalization_consent",
  status: "ready",
};

export const demoTimelineBase = {
  observedAt: "2025-06-01T02:00:00+07:00",
  reasonedAt: "2025-06-01T02:00:01+07:00",
  suspendedAt: "2025-06-01T02:00:02+07:00",
  customerConfirmedAt: "2025-06-01T02:03:17+07:00",
  biometricVerifiedAt: "2025-06-01T02:03:18+07:00",
  cardIssuedAt: "2025-06-01T02:03:19+07:00",
  caseCreatedAt: "2025-06-01T02:03:20+07:00",
  offerGeneratedAt: "2025-06-01T02:05:02+07:00",
  timeoutAt: "2025-06-01T02:05:00+07:00",
  smsSentAt: "2025-06-01T02:05:01+07:00",
  escalatedAt: "2025-06-01T02:05:02+07:00",
};
