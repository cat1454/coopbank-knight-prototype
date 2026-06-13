# Co-opBank KNIGHT — Hiệp Sĩ Số

> **Prototype kỹ thuật và trải nghiệm** cho đề tài nghiên cứu Co-opBank.  
> Mô phỏng một AI Agent theo kiến trúc **ReAct (Reason → Act → Observe)** giám sát giao dịch thẻ số, đánh giá rủi ro thời gian thực, và thực hiện các hành động bảo vệ theo phân tầng policy có kiểm soát con người.

---

## Tổng Quan

**KNIGHT** là "Hiệp sĩ số" của Co-opBank — AI Agent đứng giữa giao dịch bất thường và tài sản của khách hàng. Điểm cốt lõi là nguyên tắc **không bao giờ thực hiện hành động không thể đảo ngược mà không có xác nhận của khách hàng và xác thực sinh trắc học**. Mọi quyết định đều được ghi vào Audit Timeline với phase ReAct rõ ràng.

Prototype bao gồm ba nhánh xử lý chính:

| Nhánh | Kịch bản | Kết quả |
|---|---|---|
| 🔴 **Gian lận** | Khách xác nhận bị tấn công + Face ID | Khóa thẻ vĩnh viễn · Phát hành thẻ mới · Thẻ khẩn cấp 1 lần · Tạo hồ sơ Fraud Ops |
| 🟢 **Hợp lệ** | Khách xác nhận giao dịch của mình + Face ID | Mở khóa thẻ · Whitelist session · Tăng giám sát 30 phút |
| 🟡 **Không phản hồi** | Khách không phản hồi trong thời gian chờ | Giữ thẻ tạm khóa · Chuyển hồ sơ sang hàng chờ Fraud Ops thủ công |

---

## Tính Năng

### Bảo Vệ Thời Gian Thực
- **Risk Scoring** — 12 tín hiệu bất thường (IP quốc gia, fingerprint thiết bị, lịch sử hành vi, VPN/Tor, giờ giao dịch…)
- **Tạm khóa thẻ (L2)** — hành động khả hoàn, thực hiện ngay khi risk ≥ ngưỡng, không cần xác nhận
- **Web Push khẩn cấp** — thông báo thật qua Web Push API chuẩn, hoạt động kể cả khi app đóng
- **Face ID / Biometric Step-Up** — bắt buộc trước mọi hành động L3 không thể đảo ngược

### Sau Sự Cố (Post-Incident Recovery)
- **Thẻ ảo khẩn cấp 1 lần** — phát hành tức thì sau khi thẻ cũ bị terminate, hạn mức 5 triệu VNĐ, hiệu lực 24h, để khách chuyển khoản trong khi thẻ chính chờ giao
- **Gói Reassurance Package** — tự động kích hoạt khi Trust Recovery Score vượt ngưỡng: bảo vệ tài khoản, cảnh báo real-time, hỗ trợ ưu tiên, hoàn phí có điều kiện, báo cáo an toàn
- **Essential Cashback** — hoàn tiền tự động cho các danh mục chi tiêu thiết yếu (điện, nước, siêu thị) với cơ sở đồng thuận cá nhân hóa rõ ràng
- **Recovery Observation** — KNIGHT theo dõi hành vi khôi phục (kiểm tra số dư, xem lịch sử, mở kênh hỗ trợ) và hoàn thành vòng ReAct

### Giao Diện
- **Mobile banking PWA** — màn hình đăng nhập, dashboard 5 tab (Trang chủ, Chuyển khoản, Hộ vệ AI, Lịch sử, Cài đặt)
- **AI Security Cockpit** — bảng điều khiển bảo mật tối (glassmorphism) hiển thị 6 chỉ số thời gian thực: lõi bảo vệ, phản ứng 250ms, policy level, thiết bị tin cậy, số sự kiện audit, trạng thái mạng/IP
- **KNIGHT Agent Visual** — nhân vật hoạt hình với các trạng thái: tuần tra, cảnh báo, phân tích, hành động, nâng cấp v2.0
- **Audit Timeline** — timeline toàn bộ sự kiện OBSERVE → REASON → ACT theo thứ tự thời gian thực, có thể xem chi tiết từng bước

---

## Cấu Trúc State Machine

```
idle_monitoring
  └── risk_detected
        └── card_suspended_l2
              └── awaiting_customer_response
                    ├── [Fraud path]
                    │     customer_confirms_fraud
                    │       └── biometric_required → biometric_verified
                    │             └── card_terminated_l3
                    │                   └── new_card_issued
                    │                         └── fraud_case_created
                    │                               └── next_morning_recovery_ready
                    │                                     └── post_incident_behavior_observed
                    │                                           └── trust_recovery_assessed
                    │                                                 └── reassurance_package_active
                    │                                                       └── cashback_activated
                    │                                                             └── recovery_observed
                    │                                                                   └── react_cycle_completed
                    │                                                                         └── audit_complete
                    │
                    ├── [Legit path]
                    │     customer_confirms_legit
                    │       └── biometric_required → biometric_verified
                    │             └── card_unsuspended
                    │                   └── device_session_whitelisted
                    │                         └── enhanced_monitoring_30m
                    │                               └── audit_complete
                    │
                    └── [Timeout path]
                          customer_timeout
                            └── fraud_ops_escalated
                                  └── card_remains_suspended
```

---

## Policy Levels

| Level | Vai trò | Điều kiện thực thi |
|---|---|---|
| **L0** — Observe | Theo dõi, tính risk score, ghi audit | Luôn chạy |
| **L1** — Notify | Gửi Web Push cảnh báo | Risk ≥ ngưỡng L1 |
| **L2** — Protect | Tạm khóa thẻ (reversible) | Risk ≥ ngưỡng L2 |
| **L3** — Act | Terminate thẻ / phát hành thẻ mới | Xác nhận khách hàng **+** Face ID thành công |
| **L4** — Human Review | Fraud Ops / Compliance xử lý | Timeout hoặc leo thang |

**Invariants cứng — không bao giờ vi phạm:**
- Timeout ≠ tự terminate thẻ
- Không có Face ID → không L3
- Không lưu hoặc hiển thị full PAN / CVV thật
- Thẻ khẩn cấp 1 lần chỉ được hiển thị sau khi thẻ cũ đã bị terminate

---

## Cài Đặt & Chạy Local

**Yêu cầu:** Node.js ≥ 18, npm

```bash
git clone https://github.com/cat1454/coopbank-knight-prototype.git
cd coopbank-knight-prototype
npm install
```

**Terminal 1 — Backend:**
```bash
npm run server
```

Phím tắt trong terminal backend:
- `Space` / `Enter` / `S` — kích hoạt high-risk incident
- `R` — reset toàn bộ state
- `Q` — thoát

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Mở `http://localhost:5174/`

> **Không cần backend:** Thêm `?env=test` vào URL để chạy toàn bộ demo flow trực tiếp trong trình duyệt, không cần Terminal 1.

---

## Cấu Hình Môi Trường

Copy `.env.example` thành `.env`:

```bash
# Frontend
VITE_BACKEND_URL=https://knight-api.danangtoiiu.live

# Backend
PORT=5000
ALLOWED_ORIGINS=https://knight.danangtoiiu.live,http://localhost:5173,http://127.0.0.1:5173
SEND_PUSH_SECRET=replace-with-a-long-random-secret

# Web Push (VAPID)
VAPID_PUBLIC_KEY=replace-with-generated-public-key
VAPID_PRIVATE_KEY=replace-with-generated-private-key
VAPID_SUBJECT=mailto:you@example.com
PUSH_SUBSCRIPTIONS_FILE=server/push-subscriptions.json
```

---

## API Backend

Kích hoạt high-risk incident (đầy đủ chain: risk → suspend → push):
```bash
curl -X POST "https://knight-api.danangtoiiu.live/api/incidents/high-risk" \
  -H "Authorization: Bearer YOUR_SEND_PUSH_SECRET"
```

Gửi push thông báo tùy chỉnh:
```bash
curl -X POST "https://knight-api.danangtoiiu.live/api/push/send" \
  -H "Authorization: Bearer YOUR_SEND_PUSH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"title":"CẢNH BÁO KHẨN","message":"Phát hiện giao dịch bất thường.","url":"/?alert=1"}'
```

---

## Kiểm Thử

```bash
# Unit tests & state machine (Vitest)
npm test

# Unit test với coverage
npm run test:coverage

# E2E tests (Playwright, mobile viewport)
npm run test:e2e

# TypeScript check
npx tsc --noEmit

# Build production
npm run build

# Security audit
npm audit

# Lint
npm run lint
```

> Bộ test bao gồm: state machine transitions, policy guards, trust recovery scoring, demo scenario data, và Playwright viewport checks cho iPhone/mobile.

---

## Cấu Trúc Repo

```
coopbank-knight-prototype/
├── docs/
│   ├── deploy-frontend-local-backend.md
│   └── knight-mobile/
│       ├── 01-product-capability.md
│       ├── 02-business-rules-and-guardrails.md
│       ├── 03-user-journeys-and-screens.md
│       ├── 04-mobile-ux-spec.md
│       ├── 05-state-machine.md
│       ├── 06-data-and-api-contracts.md
│       ├── 07-security-and-compliance.md
│       ├── 08-test-and-verification-plan.md
│       ├── 09-implementation-backlog.md
│       └── 10-tech-stack-and-foundation.md
├── server/
│   ├── index.js              # Backend SSE, Web Push, incident orchestration
│   └── demoFlows.js          # Demo flow helpers và keyboard input handler
├── src/
│   ├── app/
│   │   ├── App.tsx           # App shell, demo sequencing, SSE integration
│   │   └── App.test.tsx      # Integration tests
│   ├── components/
│   │   ├── BankLoginScreen.tsx
│   │   ├── BankDashboard.tsx           # Dashboard 5-tab + AI Security Cockpit
│   │   ├── KnightAgentVisual.tsx       # Animated KNIGHT agent
│   │   ├── CriticalAlertSurface.tsx    # Màn hình cảnh báo khẩn
│   │   ├── FraudReviewScreen.tsx       # Xác nhận gian lận / hợp lệ
│   │   ├── BiometricStepUp.tsx         # Face ID step-up
│   │   ├── VirtualCardScreen.tsx       # Thẻ mới + thẻ khẩn cấp 1 lần
│   │   ├── FraudCaseSubmittedScreen.tsx
│   │   ├── NextMorningRecoveryScreen.tsx
│   │   ├── PostIncidentBehaviorScreen.tsx
│   │   ├── TrustRecoveryAssessmentScreen.tsx
│   │   ├── ReassurancePackageScreen.tsx
│   │   ├── AuditTimeline.tsx           # Audit timeline OBSERVE/REASON/ACT
│   │   ├── LegitimateResolutionScreen.tsx
│   │   ├── GuardScreen.tsx
│   │   └── ...
│   ├── data/
│   │   └── demoScenario.ts   # Demo customer/card/risk/case/recovery data
│   ├── domain/
│   │   ├── types.ts                # Toàn bộ TypeScript interfaces & type defs
│   │   ├── knightStateMachine.ts   # State machine + event dispatcher
│   │   ├── policy.ts               # Policy guards cho từng level L0–L4
│   │   ├── audit.ts                # Audit event builder
│   │   ├── trustRecovery.ts        # Trust Recovery scoring engine
│   │   └── mockKnightServices.ts   # Mock services (suspend, issue card…)
│   ├── services/
│   │   └── pushNotifications.ts   # Web Push subscribe/unsubscribe
│   └── styles/
│       ├── app.css           # Design system & component styles
│       └── knight-agent.css  # KNIGHT agent animation & visual styles
├── tests/e2e/
│   └── knight-mobile.spec.ts  # Playwright mobile viewport tests
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 19 · TypeScript · Vite 8 |
| Styling | Vanilla CSS · CSS Custom Properties |
| Icons | Lucide React |
| Testing | Vitest · Testing Library · Playwright |
| Backend | Node.js · Express · SSE |
| Push | Web Push API (VAPID) |
| PWA | Service Worker · Web App Manifest |

---

## Tài Liệu Liên Quan

- [Hướng dẫn deploy local + backend](docs/deploy-frontend-local-backend.md)
- [Product capability](docs/knight-mobile/01-product-capability.md)
- [Business rules & guardrails](docs/knight-mobile/02-business-rules-and-guardrails.md)
- [User journeys & screens](docs/knight-mobile/03-user-journeys-and-screens.md)
- [State machine](docs/knight-mobile/05-state-machine.md)
- [Security & compliance](docs/knight-mobile/07-security-and-compliance.md)
- [Test & verification plan](docs/knight-mobile/08-test-and-verification-plan.md)

---

> *Prototype này phục vụ mục đích demo kỹ thuật và nghiên cứu. Việc khóa thẻ, Face ID, phát hành thẻ, và các thao tác Fraud Ops đều là mô phỏng. Web Push hoạt động thật thông qua chuẩn Web Push API.*
