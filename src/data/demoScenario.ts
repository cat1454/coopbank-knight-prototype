import type {
  CustomerProfile,
  EssentialSpendingCategory,
  FraudCase,
  PostIncidentBehaviorSignal,
  ReassurancePackage,
  RecoveryObservation,
  RiskAssessment,
  TransactionEvent,
  TrustRecoveryAssessment,
  VirtualCard,
} from "../domain/types";
import { calculateTrustRecoveryScore } from "../domain/trustRecovery";

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
  amountVnd: 10000000,
  occurredAt: "2026-06-01T02:00:00+07:00",
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
  assessedAt: "2026-06-01T02:00:01+07:00",
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
  issuedAt: "2026-03-01T08:00:00+07:00",
  isDemo: true,
};

export const demoNewCard: VirtualCard = {
  id: "CARD-NEW-001",
  customerId: demoCustomer.id,
  maskedPan: "4532 **** **** 7291",
  status: "active",
  label: "Thẻ số Co-opBank mới",
  issuedAt: "2026-06-01T02:03:19+07:00",
  isDemo: true,
};

export const demoFraudCase: FraudCase = {
  id: "FR-20250601-001",
  customerId: demoCustomer.id,
  cardId: demoCard.id,
  amountVnd: demoTransaction.amountVnd,
  status: "created",
  createdAt: "2026-06-01T02:03:20+07:00",
  expectedReviewWindow: "3-5 ngày làm việc",
  transactions: [demoTransaction.id],
};

export const demoBehaviorSignals: PostIncidentBehaviorSignal[] = [
  {
    id: "balance_checks",
    label: "Kiểm tra số dư nhiều lần",
    observedAt: "2026-06-02T08:30:12+07:00",
    occurrenceCount: 6,
    weight: 22,
    evidence: "6 lần từ sáng sớm sau khi mở lại ứng dụng",
  },
  {
    id: "transaction_history_views",
    label: "Mở lịch sử giao dịch liên tục",
    observedAt: "2026-06-02T08:31:05+07:00",
    occurrenceCount: 4,
    weight: 18,
    evidence: "4 lượt xem, tập trung vào giao dịch không nhận ra",
  },
  {
    id: "account_protection_views",
    label: "Truy cập bảo vệ tài khoản",
    observedAt: "2026-06-02T08:31:48+07:00",
    occurrenceCount: 3,
    weight: 16,
    evidence: "Mở mục khóa thẻ và thiết bị đăng nhập",
  },
  {
    id: "support_channel_opens",
    label: "Mở kênh hỗ trợ",
    observedAt: "2026-06-02T08:32:20+07:00",
    occurrenceCount: 2,
    weight: 14,
    evidence: "Mở chat và hotline ưu tiên",
  },
  {
    id: "essential_payment_pause",
    label: "Tạm dừng thanh toán thiết yếu",
    observedAt: "2026-06-02T08:33:02+07:00",
    occurrenceCount: 1,
    weight: 12,
    evidence: "Dừng thao tác thanh toán điện sau cảnh báo",
  },
];

export const demoEssentialSpendingCategories: EssentialSpendingCategory[] = [
  { id: "electricity", label: "Điện", amountVnd: 1250000, usagePattern: "Thanh toán hàng tháng" },
  { id: "water", label: "Nước", amountVnd: 420000, usagePattern: "Thanh toán hàng tháng" },
  { id: "supermarket", label: "Siêu thị", amountVnd: 3850000, usagePattern: "Chi tiêu thường xuyên" },
];

export const demoTrustRecoveryAssessment: TrustRecoveryAssessment = {
  id: "TRUST-20260601-001",
  customerId: demoCustomer.id,
  generatedAt: "2026-06-02T08:34:00+07:00",
  score: calculateTrustRecoveryScore(demoBehaviorSignals),
  threshold: 70,
  level: "high",
  decision: "activate_reassurance_package",
  explanation:
    "Năm tín hiệu hành vi sau sự cố cho thấy nhu cầu hỗ trợ cao. Đây là suy luận từ hành vi quan sát được, không phải kết luận cảm xúc.",
  signals: demoBehaviorSignals,
  essentialSpendingCategories: demoEssentialSpendingCategories,
};

export const demoReassurancePackage: ReassurancePackage = {
  id: "REASSURANCE-20260601-001",
  customerId: demoCustomer.id,
  trigger: "trust_recovery_threshold",
  title: "Gói Phục Hồi An Tâm",
  activatedAt: "2026-06-02T08:35:00+07:00",
  protectionDurationDays: 30,
  status: "active",
  benefits: [
    {
      id: "account_protection",
      title: "Bảo vệ tài khoản 30 ngày",
      description: "Tăng cường giám sát tài khoản sau sự cố.",
      activation: "automatic",
      status: "active",
    },
    {
      id: "realtime_alerts",
      title: "Cảnh báo bất thường thời gian thực",
      description: "Thông báo ngay khi có tín hiệu giao dịch hoặc đăng nhập đáng ngờ.",
      activation: "automatic",
      status: "active",
    },
    {
      id: "priority_support",
      title: "Hỗ trợ ưu tiên 24/7",
      description: "Kết nối hotline hoặc hỗ trợ viên ưu tiên khi cần.",
      activation: "automatic",
      status: "active",
    },
    {
      id: "conditional_fee_refund",
      title: "Hoàn phí giao dịch bị ảnh hưởng nếu đủ điều kiện",
      description: "Được xem xét theo kết quả tra soát và chính sách áp dụng.",
      activation: "automatic",
      status: "active",
    },
    {
      id: "safety_report",
      title: "Báo cáo an toàn tài khoản",
      description: "Tóm tắt biện pháp bảo vệ sau khi xử lý hoàn tất.",
      activation: "automatic",
      status: "active",
    },
  ],
  essentialCashback: {
    ratePercent: 10,
    categories: ["Điện", "Nước", "Siêu thị"],
    durationLabel: "trong tháng này",
    validThroughLabel: "30/06/2026",
    consentBasis: "personalization_consent",
    status: "pending_consent",
  },
};

export const demoRecoveryObservation: RecoveryObservation = {
  observedAt: "2026-06-02T08:42:00+07:00",
  essentialPaymentResumed: true,
  repeatedBalanceChecksChangePercent: -60,
  supportCaseStatus: "priority_support_active",
  summary: "Khách hàng quay lại thanh toán điện; số lần kiểm tra số dư lặp lại giảm 60%.",
  reactCycleStatus: "COMPLETE",
};

export const demoTimelineBase = {
  observedAt: "2026-06-01T02:00:00+07:00",
  reasonedAt: "2026-06-01T02:00:01+07:00",
  suspendedAt: "2026-06-01T02:00:02+07:00",
  customerConfirmedAt: "2026-06-01T02:03:17+07:00",
  biometricVerifiedAt: "2026-06-01T02:03:18+07:00",
  cardIssuedAt: "2026-06-01T02:03:19+07:00",
  caseCreatedAt: "2026-06-01T02:03:20+07:00",
  nextMorningAt: "2026-06-02T08:30:00+07:00",
  behaviorObservedAt: "2026-06-02T08:33:02+07:00",
  trustAssessedAt: "2026-06-02T08:34:00+07:00",
  packageActivatedAt: "2026-06-02T08:35:00+07:00",
  cashbackActivatedAt: "2026-06-02T08:36:00+07:00",
  recoveryObservedAt: "2026-06-02T08:42:00+07:00",
  reactCompletedAt: "2026-06-02T08:42:01+07:00",
  timeoutAt: "2026-06-01T02:05:00+07:00",
  voiceCallAt: "2026-06-01T02:05:05+07:00",
  voiceNoAnswerAt: "2026-06-01T02:05:18+07:00",
  voiceAnsweredAt: "2026-06-01T02:05:12+07:00",
  smsSentAt: "2026-06-01T02:05:19+07:00",
  escalatedAt: "2026-06-01T02:05:20+07:00",
};
