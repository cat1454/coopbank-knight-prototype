# ThreatLens AI — Vibe-code Guide

> **Dự án:** ThreatLens AI — Lá chắn giao dịch thông minh cho ngân hàng số  
> **Stack:** React 19 + TypeScript + Vite · Node.js native http · Vanilla CSS · Lucide React · Vitest · Playwright  
> **Mục tiêu:** MVP demo end-to-end: scoring rủi ro realtime, 6 agents, LLM giải thích tiếng Việt, Web Push

---

## Mục lục

1. [Kiến trúc tổng thể](#1-kiến-trúc-tổng-thể)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [End-to-End Flow](#3-end-to-end-flow)
4. [6 Test Cases bắt buộc](#4-6-test-cases-bắt-buộc)
5. [Giai đoạn build](#5-giai-đoạn-build)
6. [Prompts vibe-code](#6-prompts-vibe-code)

---

## 1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE UI (PWA)                         │
│  Transfer Screen → RiskAlert → ScamChecklist → ActionCenter │
│  AgentConsole (SSE realtime) · AuditLog · RiskMeter         │
└────────────────────────┬────────────────────────────────────┘
                         │ POST /api/transaction
                         │ GET  /events (SSE)
┌────────────────────────▼────────────────────────────────────┐
│                  NODE.JS NATIVE HTTP SERVER                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AI Risk Orchestrator                    │   │
│  │                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ Transaction │  │   Device &  │  │ Behavioral  │  │   │
│  │  │   Agent     │  │   Session   │  │  Baseline   │  │   │
│  │  │   (25%)     │  │   Agent     │  │   Agent     │  │   │
│  │  │             │  │   (20%)     │  │   (20%)     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │  ┌─────────────┐  ┌─────────────┐                   │   │
│  │  │ Beneficiary │  │    Scam     │                   │   │
│  │  │   Graph     │  │  Typology   │                   │   │
│  │  │   Agent     │  │   Agent     │                   │   │
│  │  │   (20%)     │  │   (15%)     │                   │   │
│  │  └─────────────┘  └─────────────┘                   │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │    Decision Engine + Intervention & Compliance Agent  │   │
│  │    Hard-rule → Risk Score → Ma trận giá trị          │   │
│  │    → Allow / Warn / Delay / Step-up / Block / Review │   │
│  └──────────────────────┬───────────────────────────────┘   │
│              ┌──────────┼──────────┐                        │
│        SSE Events   Claude API   web-push                   │
│        (realtime)  (async LLM)  (VAPID)                     │
└─────────────────────────────────────────────────────────────┘
```

### Công thức Risk Score

```
Risk Score (0–100) =
  25% × Transaction Anomaly Score
+ 20% × Device/Session Risk Score
+ 20% × Behavioral Deviation Score
+ 20% × Beneficiary/Mule Risk Score
+ 15% × Scam Journey Signal Score
```

### Bảng quyết định theo Risk Score

| Risk Score | Mức rủi ro    | Hành động                              |
|-----------|---------------|----------------------------------------|
| 0–25      | Rất thấp      | Allow — ghi log cơ bản                 |
| 26–35     | Thấp          | Allow + theo dõi ngầm / cảnh báo nhẹ  |
| 36–55     | Trung bình    | Warn — hiển thị lý do cảnh báo         |
| 56–65     | Trung bình cao| Warn + Checklist + Step-up (nếu cao)   |
| 66–78     | Cao           | Delay + Step-up authentication          |
| 79–85     | Rất cao       | Delay + Step-up + Fraud Review trigger |
| 86–100    | Nghiêm trọng  | Block + Fraud Review                   |

---

## 2. Cấu trúc thư mục

```
threatlens-ai/
├── src/
│   ├── domain/                          # Pure TypeScript — không phụ thuộc UI
│   │   ├── types.ts                     # Tất cả interface/type toàn hệ thống
│   │   ├── scoring/
│   │   │   ├── transactionAgent.ts      # Agent 1: Transaction Anomaly (25%)
│   │   │   ├── deviceAgent.ts           # Agent 2: Device & Session Risk (20%)
│   │   │   ├── behavioralAgent.ts       # Agent 3: Behavioral Baseline (20%)
│   │   │   ├── beneficiaryAgent.ts      # Agent 4: Beneficiary Graph (20%)
│   │   │   ├── scamAgent.ts             # Agent 5: Scam Typology (15%)
│   │   │   └── orchestrator.ts          # Điều phối 5 agents song song
│   │   ├── decision/
│   │   │   ├── decisionEngine.ts        # Hard-rule + Score + Ma trận → Action
│   │   │   └── interventionAgent.ts     # Agent 6: Compliance + Audit Trail
│   │   ├── stateMachine/
│   │   │   └── transactionFlow.ts       # State machine: INIT→SCORING→DECISION→END
│   │   └── mockData/
│   │       ├── users.ts                 # 5 nhóm hành vi người dùng giả lập
│   │       ├── beneficiaries.ts         # Danh sách tài khoản nhận (mule, new, trusted)
│   │       └── scenarios.ts             # 6 test case preset
│   │
│   ├── server/                          # Node.js native http
│   │   ├── index.ts                     # HTTP server entry, router
│   │   ├── routes/
│   │   │   ├── transaction.ts           # POST /api/transaction
│   │   │   ├── events.ts                # GET /events — SSE stream
│   │   │   └── explain.ts               # POST /api/explain — Claude API async
│   │   └── push/
│   │       └── notifier.ts              # web-push với VAPID keys
│   │
│   ├── sw/
│   │   └── sw.ts                        # Service Worker: cache + push handler
│   │
│   └── ui/                              # React 19 + TypeScript
│       ├── App.tsx                      # Router + global state
│       ├── screens/
│       │   ├── Home.tsx                 # Mock mobile banking dashboard
│       │   ├── Transfer.tsx             # Form chuyển khoản
│       │   ├── RiskAlert.tsx            # Popup hiển thị risk score + lý do
│       │   ├── ScamChecklist.tsx        # Danh sách kiểm tra chống lừa đảo
│       │   ├── ActionCenter.tsx         # Nút Allow / Step-up / Hủy
│       │   ├── AgentConsole.tsx         # Realtime debug 6 agents qua SSE
│       │   └── AuditLog.tsx             # Lịch sử quyết định
│       ├── components/
│       │   ├── RiskMeter.tsx            # Visual gauge 0–100
│       │   ├── AgentCard.tsx            # Output từng agent
│       │   └── ReasonBadge.tsx          # Reason codes hiển thị người dùng
│       ├── hooks/
│       │   ├── useSSE.ts                # Subscribe SSE /events
│       │   ├── useTransaction.ts        # Submit transaction + nhận kết quả
│       │   └── usePush.ts               # Web Push subscribe/unsubscribe
│       └── styles/
│           ├── tokens.css               # CSS custom properties (màu, spacing)
│           ├── components.css           # Component styles
│           └── screens.css              # Screen-level layout
│
├── tests/
│   ├── unit/
│   │   ├── scoring.test.ts              # Test từng agent
│   │   ├── decisionEngine.test.ts       # Test logic quyết định
│   │   └── stateMachine.test.ts         # Test state transitions
│   └── e2e/
│       └── scenarios.spec.ts            # Playwright: 6 test cases mobile viewport
│
├── server.ts                            # Node entry: import src/server/index.ts
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

---

## 3. End-to-End Flow

```
[1] Người dùng nhập chuyển khoản trên Transfer Screen
         │
         ▼
[2] POST /api/transaction
    {
      userId, amount, recipientId,
      deviceInfo, sessionInfo, location,
      timestamp, priorActions[]
    }
         │
         ▼
[3] Feature Builder — trích xuất đặc trưng từ raw data
         │
         ├──▶ [Agent 1] Transaction Anomaly
         │    - So sánh amount vs lịch sử P75/P95
         │    - Tần suất giao dịch trong 24h
         │    - Loại giao dịch bất thường
         │    → transaction_score: 0–100
         │
         ├──▶ [Agent 2] Device & Session
         │    - Thiết bị mới? VPN/proxy? Emulator?
         │    - Session age, IP reputation
         │    → device_score: 0–100
         │
         ├──▶ [Agent 3] Behavioral Baseline
         │    - So với Personal Financial Digital Twin
         │    - Khung giờ quen, người nhận quen
         │    - Chuỗi hành vi trước giao dịch
         │    → behavioral_score: 0–100
         │
         ├──▶ [Agent 4] Beneficiary Graph
         │    - Người nhận mới? Từng bị report?
         │    - Liên kết mule account cluster?
         │    - Cash-out nhanh pattern?
         │    → beneficiary_score: 0–100
         │
         └──▶ [Agent 5] Scam Typology
              - Giả danh cơ quan? Đầu tư? Tuyển dụng?
              - Giao dịch khẩn cấp? Thao túng tâm lý?
              → scam_score: 0–100
         │
         ▼
[4] Decision Engine
    - Hard-rule check (bắt buộc trước)
    - Risk Score = weighted average
    - Ma trận điều chỉnh × giá trị giao dịch
    - Chọn hành động cao nhất trong 3 nguồn
    → action: Allow | Warn | Delay | StepUp | Block | Review
    → reason_codes: string[]
    → risk_score: number
         │
         ▼
[5] SSE stream → /events → AgentConsole UI (realtime)
    { agent, score, status, timestamp }
         │
         ├──▶ [6a] LLM Explain (async — không block payment path)
         │    POST /api/explain → Claude API
         │    → giải thích tiếng Việt ngắn gọn, dễ hiểu
         │
         └──▶ [6b] Web Push (nếu action = Block)
              → Push notification đến điện thoại
         │
         ▼
[7] UI Response
    - Allow  → Chuyển khoản thành công
    - Warn   → RiskAlert popup + lý do AI
    - StepUp → Yêu cầu xác thực bổ sung
    - Delay  → Màn hình chờ + ScamChecklist
    - Block  → ActionCenter: Hủy / Liên hệ ngân hàng
         │
         ▼
[8] Audit Ledger — ghi log bất đồng bộ
    { transactionId, riskScore, agentOutputs,
      action, reasonCodes, userResponse, timestamp }
```

---

## 4. 6 Test Cases bắt buộc

| # | Scenario | Điều kiện trigger | Risk Score mong đợi | Hành động |
|---|----------|-------------------|---------------------|-----------|
| 1 | `low_risk` | Thiết bị cũ, người nhận quen, số tiền bình thường, giờ quen thuộc | 0–25 | Allow |
| 2 | `medium_risk` | Số tiền cao hơn baseline ~1.5×, người nhận quen | 36–55 | Warn |
| 3 | `high_risk` | Thiết bị mới + số tiền lớn (> P95) + người nhận mới | 66–78 | Delay + Step-up |
| 4 | `critical_risk` | 02:13 sáng + thiết bị mới + vị trí lạ + người nhận mới + số tiền cao | 86–100 | Block + Fraud Review |
| 5 | `false_positive` | Vị trí lạ (du lịch) nhưng đã từng xác minh vị trí này trước đó | 36–55 → giảm sau confirm | Warn → Allow |
| 6 | `feedback_attack` | Kẻ gian cố xác nhận giao dịch rủi ro cao nhiều lần | Giữ nguyên hoặc tăng | Bắt Step-up auth |

---

## 5. Giai đoạn build

### Giai đoạn 1 — Domain Layer (Ngày 1–2)
> Mục tiêu: Logic scoring hoạt động độc lập, test được ngay bằng Vitest

**Deliverables:**
- `src/domain/types.ts` — toàn bộ interface
- `src/domain/scoring/` — 5 agent functions
- `src/domain/decision/decisionEngine.ts` — rule engine + scoring
- `src/domain/mockData/` — users, beneficiaries, scenarios
- `tests/unit/scoring.test.ts` — pass 6 test cases

**Định nghĩa hoàn thành:** `npm test` xanh hết, 6 scenario trả đúng action

---

### Giai đoạn 2 — Server (Ngày 2–3)
> Mục tiêu: API nhận giao dịch, trả kết quả, stream realtime qua SSE

**Deliverables:**
- `src/server/index.ts` — Node native http router
- `POST /api/transaction` — chạy orchestrator, trả JSON
- `GET /events` — SSE stream từng agent khi xử lý
- `POST /api/explain` — gọi Claude API, trả giải thích tiếng Việt
- `src/server/push/notifier.ts` — web-push VAPID setup

**Định nghĩa hoàn thành:** `curl POST /api/transaction` trả `{ action, riskScore, reasonCodes, explanation }`

---

### Giai đoạn 3 — UI Core (Ngày 3–4)
> Mục tiêu: Mobile UI demo được luồng chính, kết nối server thật

**Deliverables:**
- `Home.tsx` — mock mobile banking dashboard
- `Transfer.tsx` — form chuyển khoản với preset scenarios
- `RiskAlert.tsx` — popup cảnh báo + LLM explanation
- `AgentConsole.tsx` — hiển thị 6 agents realtime qua SSE
- `useSSE.ts` + `useTransaction.ts` — hooks kết nối server

**Định nghĩa hoàn thành:** Demo được 4/6 test cases end-to-end trên mobile viewport

---

### Giai đoạn 4 — Polish & PWA (Ngày 4–5)
> Mục tiêu: Demo pitch-ready, đủ tính năng theo báo cáo

**Deliverables:**
- `ScamChecklist.tsx` — danh sách kiểm tra chống lừa đảo (Delay flow)
- `ActionCenter.tsx` — Allow / Hủy / Liên hệ ngân hàng (Block flow)
- `AuditLog.tsx` — lịch sử quyết định có thể scroll
- `sw.ts` — Service Worker + Web Push handler
- `usePush.ts` — subscribe push notification
- Playwright E2E: 6 scenarios trên mobile viewport 390px

**Định nghĩa hoàn thành:** Demo 6/6 test cases, push notification hoạt động, chạy ổn định 3 lần liên tiếp

---

## 6. Prompts vibe-code

Dùng từng prompt dưới đây theo thứ tự. Mỗi prompt là một phiên làm việc độc lập.

---

### PROMPT 1 — Khởi tạo project & types

```
Tôi đang xây dựng ThreatLens AI — hệ thống phát hiện gian lận giao dịch ngân hàng số.

Stack:
- React 19 + TypeScript + Vite
- Vanilla CSS + CSS custom properties
- Lucide React icons
- Node.js native http server (không dùng Express)
- web-push VAPID
- Vitest + Testing Library + Playwright

Hãy tạo project scaffold với cấu trúc thư mục sau:
[dán cấu trúc thư mục từ mục 2]

Và tạo file src/domain/types.ts với đầy đủ các interface sau:
- TransactionEvent: { userId, amount, recipientId, deviceInfo, sessionInfo, location, timestamp, priorActions }
- DeviceInfo: { deviceId, isNew, hasVPN, isEmulator, isRooted, ipReputation }
- SessionInfo: { sessionId, ageSeconds, loginMethod }
- UserProfile: { userId, behavioralBaseline, transactionHistory }
- BehavioralBaseline: { typicalAmounts, typicalHours, knownRecipients, typicalLocations }
- AgentResult: { agentName, score, signals, reasoning }
- RiskDecision: { riskScore, action, reasonCodes, agentResults, scamScore }
- Action: enum 'allow' | 'warn' | 'delay' | 'step_up' | 'block' | 'review'
- AuditEntry: { transactionId, riskDecision, userResponse, timestamp }

Không cần implement logic, chỉ cần types và scaffold.
```

---

### PROMPT 2 — Mock data (5 nhóm người dùng + 6 scenarios)

```
Tiếp tục dự án ThreatLens AI.

Tạo src/domain/mockData/users.ts với 5 nhóm người dùng giả lập:
1. user_low_activity: Giao dịch ít, amount thường < 500k, giờ hành chính, thiết bị cũ
2. user_frequent: Chuyển khoản hàng ngày, amount 100k–2M, nhiều người nhận quen
3. user_qr_heavy: Chủ yếu thanh toán QR, amount nhỏ < 200k, rất nhiều merchant
4. user_high_value: Giao dịch giá trị cao 10M–100M, ít nhưng đều đặn
5. user_anomalous: Hành vi bất thường — sẽ dùng để test false positive

Tạo src/domain/mockData/scenarios.ts với 6 test case preset:
1. low_risk: user_frequent, thiết bị cũ, người nhận quen, 500k, 14:30
2. medium_risk: user_low_activity, thiết bị cũ, người nhận quen, 3M (cao hơn baseline)
3. high_risk: user_frequent, THIẾT BỊ MỚI, người nhận MỚI, 15M
4. critical_risk: user_low_activity, thiết bị mới, VPN=true, vị trí lạ, người nhận mới, 50M, timestamp 02:13
5. false_positive: user_anomalous, vị trí lạ nhưng đã xác minh trước, thiết bị quen, 1M
6. feedback_attack: user_frequent, thiết bị lạ, cố confirm nhiều lần

Mỗi scenario export ra object đúng type TransactionEvent từ types.ts.
```

---

### PROMPT 3 — 5 Scoring Agents

```
Tiếp tục dự án ThreatLens AI. Đã có types.ts và mockData/.

Tạo 5 agent functions trong src/domain/scoring/, mỗi file export một async function trả AgentResult.

Tất cả score trên thang 0–100. Dùng comment rõ ràng giải thích logic.

1. transactionAgent.ts
   - Input: TransactionEvent, UserProfile
   - So sánh amount với P75 và P95 của lịch sử người dùng
   - Tính bất thường về giờ (22:00–06:00 = tăng risk)
   - Tính tần suất: >3 giao dịch trong 1h = tăng risk
   - Trả: { agentName: 'transaction', score, signals: string[], reasoning: string }

2. deviceAgent.ts
   - isNew device → +40 score
   - hasVPN → +30 score
   - isEmulator → +50 score
   - isRooted → +25 score
   - ipReputation: bad → +35, suspicious → +15
   - Trả: { agentName: 'device', score, signals, reasoning }

3. behavioralAgent.ts
   - So sánh amount với behavioralBaseline.typicalAmounts (median, p75, p95)
   - Kiểm tra recipient có trong knownRecipients không
   - Kiểm tra giờ giao dịch có trong typicalHours không
   - Kiểm tra location có trong typicalLocations không
   - Trả: { agentName: 'behavioral', score, signals, reasoning }

4. beneficiaryAgent.ts
   - isNewRecipient → +35 score
   - hasBeenReported → +60 score
   - isMuleCluster → +70 score
   - Lookup từ src/domain/mockData/beneficiaries.ts
   - Trả: { agentName: 'beneficiary', score, signals, reasoning }

5. scamAgent.ts
   - Nhận thêm priorActions[] (chuỗi hành vi trước giao dịch)
   - Pattern: thêm người nhận mới + tăng hạn mức + chuyển tiền ngay = +50
   - Nội dung chuyển khoản suspicious keywords (đầu tư, gấp, khẩn) = +30
   - Giờ bất thường + người nhận mới + số tiền cao = scam signal mạnh
   - Trả: { agentName: 'scam', score, signals, reasoning }

Cuối cùng, tạo orchestrator.ts chạy 5 agent song song bằng Promise.all, emit progress qua callback onAgentComplete(agentResult).
```

---

### PROMPT 4 — Decision Engine & Intervention Agent

```
Tiếp tục ThreatLens AI. Đã có 5 agents và orchestrator.

Tạo src/domain/decision/decisionEngine.ts:

Implement logic ra quyết định theo 3 lớp (ưu tiên từ cao đến thấp):

LỚPAYER 1 — Hard Rules (override tất cả):
- device.isEmulator = true → action: 'block'
- beneficiary.isMuleCluster = true → action: 'block'
- device.isNew AND scam.score > 70 → action: 'block'
- amount > 50M AND device.isNew → action: 'step_up' tối thiểu

LỚP 2 — Risk Score (weighted):
Risk Score = 0.25×transaction + 0.20×device + 0.20×behavioral + 0.20×beneficiary + 0.15×scam

Bảng quyết định:
- 0–25   → 'allow'
- 26–35  → 'allow' (log warning)
- 36–55  → 'warn'
- 56–65  → 'warn' + checklist
- 66–78  → 'delay' + 'step_up'
- 79–85  → 'delay' + 'step_up' + flag review
- 86–100 → 'block' + 'review'

LỚP 3 — Ma trận điều chỉnh theo amount:
- amount > P95 của baseline → nâng 1 cấp hành động
- amount > 10M (fallback) → nâng 1 cấp nếu score > 36

Nguyên tắc: luôn chọn hành động bảo vệ CAO NHẤT trong 3 lớp.

Export: decideAction(agentResults[], userProfile, transactionEvent) → RiskDecision

Tạo reason_codes từ signals của các agent, deduplicate.
```

---

### PROMPT 5 — Node.js Server (API + SSE)

```
Tiếp tục ThreatLens AI. Domain layer đã xong.

Tạo Node.js native HTTP server trong src/server/:

src/server/index.ts — Router chính:
- POST /api/transaction → gọi orchestrator + decisionEngine
- GET  /events → SSE stream
- POST /api/explain → gọi Claude API (async)
- OPTIONS * → CORS headers
- Serve static từ dist/ khi production

src/server/routes/transaction.ts:
- Parse JSON body thủ công (không dùng framework)
- Validate required fields
- Chạy orchestrator với onAgentComplete callback → emit SSE event
- Trả response: { transactionId, action, riskScore, reasonCodes, agentResults }
- Response time target < 200ms cho risk decision
- Ghi audit log bất đồng bộ (không block response)

src/server/routes/events.ts — SSE:
- Headers: Content-Type: text/event-stream, Cache-Control: no-cache
- Mỗi agent hoàn thành → emit: data: { agent, score, status, timestamp }
- Emit 'complete' event khi xong
- Handle client disconnect

src/server/routes/explain.ts — Claude API (async):
- POST body: { reasonCodes, riskScore, action, transactionContext }
- Gọi Claude API với system prompt bằng tiếng Việt
- System prompt: "Bạn là trợ lý giải thích rủi ro giao dịch ngân hàng. Giải thích ngắn gọn, dễ hiểu, không quá 3 câu, tránh thuật ngữ kỹ thuật."
- Stream response về client nếu có thể
- Fallback: template cứng nếu API lỗi

Không dùng Express, body-parser, hoặc bất kỳ npm package nào ngoài web-push.
```

---

### PROMPT 6 — React UI (Transfer + RiskAlert)

```
Tiếp tục ThreatLens AI. Server đang chạy ở localhost:3001.

Tạo UI mobile-first bằng React 19 + TypeScript + Vanilla CSS:

CSS tokens (src/ui/styles/tokens.css):
- --color-safe: #10B981
- --color-warn: #F59E0B
- --color-danger: #EF4444
- --color-critical: #7C3AED
- --color-bg: #0F172A (dark banking theme)
- --color-surface: #1E293B
- --color-text: #F1F5F9
- --radius-card: 16px
- --shadow-card: 0 4px 24px rgba(0,0,0,0.3)
- Font: system-ui (không import Google Fonts)

src/ui/screens/Home.tsx:
- Mock mobile banking: balance display, recent transactions list
- Nút "Chuyển khoản" → navigate Transfer
- Dropdown chọn scenario preset (6 test cases)
- Hiển thị tên người dùng theo scenario đang chọn

src/ui/screens/Transfer.tsx:
- Form: người nhận, số tiền (format VND tự động), nội dung
- Auto-fill từ scenario preset đang chọn
- Nút "Xác nhận chuyển khoản" → POST /api/transaction
- Loading state khi đang xử lý
- Chuyển sang RiskAlert khi có kết quả

src/ui/screens/RiskAlert.tsx:
- Hiển thị risk score (số lớn, màu theo mức)
- RiskMeter component: visual gauge 0–100
- Lý do cảnh báo: render reason_codes thành tiếng Việt dễ hiểu
- LLM explanation khi load xong (có skeleton loader)
- Nút hành động theo action: Allow / Xem thêm / Hủy

src/ui/components/RiskMeter.tsx:
- SVG arc gauge, màu gradient: xanh → vàng → đỏ → tím
- Animate từ 0 đến score khi mount

src/ui/hooks/useTransaction.ts:
- submitTransaction(event: TransactionEvent) → Promise<RiskDecision>
- Trạng thái: idle | loading | success | error
- Tự fetch explanation sau khi có riskDecision

Dùng Lucide React cho icons: Shield, AlertTriangle, CheckCircle, XCircle, Clock
```

---

### PROMPT 7 — AgentConsole (SSE Realtime)

```
Tiếp tục ThreatLens AI.

Tạo src/ui/screens/AgentConsole.tsx và hook useSSE:

src/ui/hooks/useSSE.ts:
- Subscribe GET /events
- Parse SSE data: { agent, score, status, timestamp }
- State: agentUpdates: AgentResult[], isComplete: boolean
- Auto-reconnect nếu connection drop
- Cleanup EventSource khi unmount

src/ui/screens/AgentConsole.tsx:
- Layout: grid 2 cột trên mobile, 3 cột trên desktop
- Mỗi agent = 1 AgentCard component
- Hiển thị 6 cards: Transaction, Device, Behavioral, Beneficiary, Scam, Decision
- Card status: waiting (grayed) → processing (pulse animation) → done (score + color)
- Score bar: horizontal, màu theo score (0–40 xanh, 41–70 vàng, 71–100 đỏ)
- Signals list: bullet points ngắn
- Final decision card (lớn hơn): action + riskScore tổng + reasonCodes
- Timeline: thanh progress ngang cho thấy thứ tự agents xử lý

src/ui/components/AgentCard.tsx:
- Props: agentName, score, signals, status, reasoning
- Animate score từ 0 khi agent complete
- Icon theo agent: Transaction=DollarSign, Device=Smartphone, Behavioral=User, Beneficiary=Users, Scam=AlertOctagon, Decision=Shield

AgentConsole được nhúng vào RiskAlert như collapsible "Xem chi tiết phân tích"
```

---

### PROMPT 8 — ScamChecklist & ActionCenter

```
Tiếp tục ThreatLens AI.

Tạo 2 screen xử lý Delay/Block flow:

src/ui/screens/ScamChecklist.tsx (hiện khi action = 'delay'):
- Header: icon cảnh báo lớn + "Hãy kiểm tra trước khi chuyển"
- Danh sách 6 câu hỏi checkbox (người dùng phải tích tất cả để tiếp tục):
  □ Tôi biết rõ người nhận là ai và đã xác minh thông tin
  □ Không ai yêu cầu tôi chuyển tiền gấp hoặc giữ bí mật
  □ Đây không phải chuyển tiền để nhận thưởng, hoàn thuế, hoặc đầu tư
  □ Tôi không bị áp lực hoặc sợ hãi khi thực hiện giao dịch này
  □ Số tài khoản nhận đã được xác nhận qua kênh chính thức
  □ Tôi hiểu rằng giao dịch này không thể hoàn lại sau khi thực hiện
- Progress: "Đã xác nhận X/6 mục"
- Nút "Tiếp tục chuyển khoản" chỉ enable khi check đủ 6 mục → trigger step-up
- Nút "Hủy giao dịch" luôn available → về Home

src/ui/screens/ActionCenter.tsx (hiện khi action = 'block' hoặc 'review'):
- Header: icon khóa đỏ + "Giao dịch tạm thời bị giữ lại"
- Risk summary: score + top 3 reason codes
- LLM explanation (tiếng Việt)
- 3 lựa chọn:
  1. "Liên hệ ngân hàng" → tel: link (mock: 1900 1234)
  2. "Hủy giao dịch" → về Home + ghi audit
  3. "Tôi muốn xem lại" → mở AgentConsole chi tiết
- Audit reference: "Mã tham chiếu: [transactionId ngắn]"
- Timestamp: "Giao dịch được giữ lúc HH:mm DD/MM/YYYY"

Styling: ActionCenter dùng màu --color-critical (#7C3AED) làm accent
```

---

### PROMPT 9 — Web Push & Service Worker

```
Tiếp tục ThreatLens AI.

Tạo Web Push notification khi giao dịch bị block:

src/sw/sw.ts (Service Worker):
- Cache strategy: Cache First cho static assets, Network First cho API
- Push event handler:
  - Parse notification payload: { title, body, transactionId, action }
  - Hiển thị notification với icon và badge
  - Click notification → focus tab hoặc mở app tại /audit/{transactionId}
- Sync event: gửi pending audit logs khi có kết nối lại

src/ui/hooks/usePush.ts:
- checkPermission() → 'granted' | 'denied' | 'default'
- requestPermission() → boolean
- subscribe(vapidPublicKey) → PushSubscription
- unsubscribe() → boolean
- State: isSupported, isSubscribed, isLoading

src/server/push/notifier.ts:
- Load VAPID keys từ env (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL)
- sendBlockNotification(subscription, transactionData):
  - title: "⚠️ Giao dịch bị tạm khóa"
  - body: "Chuyển khoản [amount] đến [recipient] cần xem xét thêm"
  - data: { transactionId, riskScore }
- Chỉ gửi push khi action = 'block' hoặc 'review'
- Log lỗi nếu push thất bại, không throw

Thêm vào Transfer.tsx:
- Khi lần đầu dùng app: prompt subscribe push
- "Bật thông báo bảo vệ tài khoản?" với nút Bật / Bỏ qua
```

---

### PROMPT 10 — Tests (Vitest + Playwright)

```
Tiếp tục ThreatLens AI. Viết test coverage cho domain layer và E2E.

tests/unit/scoring.test.ts (Vitest):
Dùng mockData/scenarios.ts, test từng agent:

describe('TransactionAgent', () => {
  it('low_risk scenario → score < 25')
  it('critical_risk scenario → score > 75')
  it('medium_risk scenario → score 30–60')
})

describe('DecisionEngine', () => {
  it('low_risk → action: allow')
  it('medium_risk → action: warn')
  it('high_risk → action: step_up hoặc delay')
  it('critical_risk → action: block')
  it('hard rule: emulator device → action: block bất kể score')
  it('false_positive → action không phải block')
})

describe('Orchestrator', () => {
  it('chạy 5 agents song song')
  it('gọi onAgentComplete callback đúng 5 lần')
  it('tổng thời gian < 100ms với mock data')
})

tests/e2e/scenarios.spec.ts (Playwright):
- viewport: 390×844 (iPhone 14)
- Mỗi scenario: chọn preset → submit → assert UI response

test('low_risk: hiển thị màn hình thành công, không có cảnh báo')
test('medium_risk: hiển thị RiskAlert với badge "Cảnh báo"')
test('high_risk: hiển thị Step-up authentication prompt')
test('critical_risk: hiển thị ActionCenter với nút liên hệ ngân hàng')
test('false_positive: cảnh báo nhưng cho phép tiếp tục sau confirm')
test('AgentConsole: 6 agent cards xuất hiện theo thứ tự')
```

---

### PROMPT 11 — AuditLog & Consent Center

```
Tiếp tục ThreatLens AI. Thêm Audit Trail và Consent (theo yêu cầu tuân thủ MVP).

src/ui/screens/AuditLog.tsx:
- Danh sách các giao dịch đã xử lý trong session
- Mỗi entry: timestamp, amount, recipient, riskScore, action, reasonCodes
- Color coding: xanh=allow, vàng=warn, cam=delay, đỏ=block
- Click entry → expand chi tiết: agentResults đầy đủ
- Export button: "Tải log JSON" → download audit entries dưới dạng .json
- Empty state: "Chưa có giao dịch nào trong phiên này"

Consent Center (nhúng vào Home.tsx lần đầu mở app):
- Modal overlay khi chưa có consent
- Tiêu đề: "ThreatLens AI bảo vệ giao dịch của bạn"
- 3 mục giải thích:
  🔒 Phân tích hành vi giao dịch để phát hiện bất thường
  🤖 Sử dụng AI để giải thích cảnh báo bằng tiếng Việt
  📊 Lưu lịch sử phiên này để cải thiện phân tích (không lưu server)
- Checkbox: "Tôi đồng ý với điều khoản sử dụng"
- Nút "Bắt đầu" chỉ enable khi check
- Lưu consent vào sessionStorage (không localStorage)
- Nút "Xem chính sách" → modal phụ với data minimization notice

Data minimization notice:
"ThreatLens AI chỉ xử lý dữ liệu cần thiết để đánh giá rủi ro giao dịch.
Dữ liệu sinh trắc học không được thu thập. eKYC trong demo này là mô phỏng.
Mọi dữ liệu chỉ tồn tại trong phiên làm việc hiện tại."
```

---

### PROMPT 12 — Finalize & Demo Polish

```
Tiếp tục ThreatLens AI. Đây là prompt cuối, polish cho demo pitch.

1. Thêm Demo Control Panel (chỉ hiện khi ?demo=true trong URL):
   - Floating button góc dưới phải: "⚙️ Demo"
   - Drawer slide-up với:
     - Dropdown chọn scenario nhanh (6 options)
     - Toggle: "Chế độ giải thích chi tiết" (hiện reasoning của từng agent)
     - Slider: fake latency (0–500ms để demo thấy SSE streaming)
     - Nút: "Reset phiên" → xóa audit log, reset state
     - Nút: "Chạy tất cả scenarios" → tự động chạy 6 test cases liên tiếp

2. Animations:
   - RiskMeter: easing cubic-bezier khi fill
   - AgentCard: stagger appear (delay 100ms mỗi card)
   - ScamChecklist: checkmark animation khi tick
   - ActionCenter: shake animation nhẹ cho icon khóa

3. Vietnamese UX copy review:
   - Tất cả error messages → tiếng Việt
   - Loading states: "Đang phân tích giao dịch...", "Đang kiểm tra thiết bị...", "Đang xác minh người nhận..."
   - Empty states tiếng Việt
   - Số tiền: format "50.000.000 ₫" (dấu chấm phân cách nghìn, ký hiệu ₫)

4. PWA manifest (public/manifest.json):
   - name: "ThreatLens AI"
   - short_name: "ThreatLens"
   - theme_color: "#0F172A"
   - background_color: "#0F172A"
   - display: "standalone"
   - icons: dùng SVG shield icon (tạo inline, không cần file ảnh)

5. README.md ngắn gọn:
   - Cách chạy: npm install, npm run dev, npm run server
   - 6 test scenarios và cách trigger
   - Kiến trúc 1 đoạn ngắn
   - Tech stack
```

---

## Lưu ý khi vibe-code

| Điểm | Ghi chú |
|------|---------|
| **Thứ tự prompt** | Chạy đúng thứ tự 1→12. Mỗi prompt build trên output của prompt trước. |
| **Không Express** | Server chỉ dùng Node.js `http` module native. |
| **Score dedup** | Tín hiệu "người nhận mới" chỉ tính 1 lần dù nhiều agents cùng thấy. |
| **LLM không quyết định** | Claude API chỉ dùng để *giải thích* reason codes, không ảnh hưởng action. |
| **Mock eKYC** | Step-up authentication là mock flow, không cần API sinh trắc học thật. |
| **Async path** | LLM explain + audit log + push notification đều bất đồng bộ, không block risk decision. |
| **Target latency** | Risk decision < 200ms. LLM explanation có thể 2–5s, hiển thị skeleton. |
| **CSS** | Không dùng Tailwind, không import external fonts. Chỉ CSS custom properties. |
