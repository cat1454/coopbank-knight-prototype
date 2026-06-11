# CO-OPBANK "HIỆP SĨ SỐ TOÀN NĂNG"
## Báo cáo Nghiên cứu & Đề xuất Giải pháp AI Agent Bảo vệ Thẻ Kỹ thuật số

> **Phiên bản:** 1.0 — Tháng 6/2025
> **Phân loại:** Nội bộ / Tài liệu thi
> **Vai trò soạn thảo:** AI Solution Architect × Fraud Detection Expert × ReAct/Agentic AI Specialist

---

## A. EXECUTIVE SUMMARY

Bài toán bảo vệ thẻ kỹ thuật số trong tình huống gian lận ban đêm **đã được giải quyết từng phần**, nhưng chưa có ngân hàng nào — kể cả các tên tuổi lớn toàn cầu — triển khai thành công một **AI Agent tự động điều phối toàn bộ chuỗi hành động nhạy cảm trong production banking** có đầy đủ guardrail, audit log và human override theo chuẩn mực quản trị rủi ro ngân hàng.

Các năng lực như **risk scoring realtime** (FICO, Feedzai, NICE Actimize), **khóa thẻ tức thời, push notification, virtual card và xác thực sinh trắc học** đã ở mức mature và được Visa, Mastercard, Revolut, Monzo, Capital One triển khai rộng. Tuy nhiên, **lớp điều phối thông minh end-to-end** — nơi một AI Agent gom tất cả tín hiệu, ra quyết định có giải thích được, giao tiếp với khách hàng đang ngủ, phát hành lại thẻ số và ngay sau đó cá nhân hóa hành trình phục hồi niềm tin — vẫn là **khoảng trắng chưa ai lấp đầy trọn vẹn**.

**Điểm mới hợp lý của Co-opBank** không nằm ở việc phát minh lại risk scoring, mà ở:
1. **Agentic orchestration** — AI Agent dùng vòng lặp ReAct để điều phối toàn bộ chuỗi từ phát hiện đến phục hồi.
2. **Customer Recovery Journey** — biến sự cố thành điểm chạm tích cực.
3. **Hyper-Personalization có kiểm soát** — đề xuất ưu đãi độc bản dựa trên hành vi chi tiêu thiết yếu của từng khách ngay sau sự cố.

Agent không thay thế con người; Agent là lớp điều phối thông minh trong biên giới chính sách ngân hàng.

---

## B. CURRENT STATE — ĐÁNH GIÁ NĂNG LỰC HIỆN CÓ TOÀN CẦU

| Năng lực | Mức độ Mature | Đại diện tiêu biểu | Ghi chú cho Co-opBank |
|---|---|---|---|
| Real-time transaction monitoring | ★★★★★ Mature | NICE Actimize, SAS, Feedzai | Nền tảng sẵn có; nên dùng như input đầu vào. |
| Risk scoring realtime | ★★★★★ Mature | FICO Falcon, Featurespace ARIC, AWS Fraud Detector | Không nên claim là phát minh; định vị là nguyên liệu đầu vào. |
| Card freeze / card lock tức thời | ★★★★★ Mature | Revolut, Monzo, Capital One, Visa Token Service | Khả thi kỹ thuật; cần expose qua API nội bộ. |
| Push notification khẩn cấp | ★★★★★ Mature | Apple APNs, FCM, Twilio | Cần cấu hình ưu tiên "critical alert" vượt qua chế độ im lặng. |
| Virtual card / thẻ số phát hành lại | ★★★★☆ Mature | Marqeta, Visa Token Service, Mastercard MDES | Thời gian phát hành <30 giây là feasible. |
| Biometric authentication | ★★★★★ Mature | Apple Face ID, Android Biometric API, FIDO2 | Cần tích hợp vào app mobile; là bước xác thực trước khi khóa vĩnh viễn. |
| Step-up / adaptive authentication | ★★★★☆ Mature | FIDO2, Jumio, iProov, Ping Identity | Kích hoạt khi risk score cao; OTP + Face ID kết hợp. |
| Chatbot hỗ trợ | ★★★★☆ Mature | Nuance, IBM Watson, Google CCAI | Phản ứng thụ động; không chủ động; không gọi API. |
| ReAct Agent gọi API | ★★★☆☆ Emerging | LangChain, AWS Bedrock Agents, Microsoft Copilot Studio | Khả thi kỹ thuật; chưa có production banking blueprint rõ ràng. |
| Hyper-personalization hậu sự cố | ★★★☆☆ Emerging | Salesforce Financial Services Cloud, Pega | Đã có nhưng thường là batch/offline; realtime sau sự cố là khoảng trắng. |
| Audit log & model governance | ★★★★☆ Mature | FFIEC guidance, OCC SR 11-7, EBA MLOps | Framework có sẵn; cần implement đúng trong agentic context. |
| End-to-end autonomous banking agent | ★★☆☆☆ Unsolved | — | Chưa ai làm trọn trong production. Đây là điểm co-opbank nên chiếm. |

**Nguồn tham chiếu:** FICO Falcon Platform (2024), Feedzai RiskOps (2023), NICE Actimize Financial Crime Solutions, Visa Token Service Whitepaper, Mastercard MDES, Featurespace ARIC documentation, FFIEC Cybersecurity Assessment Tool, OCC SR 11-7 Model Risk Management, EBA Guidelines on ICT Risk, ReAct paper (Yao et al., 2022).

---

## C. GAP ANALYSIS — CÁC KHOẢNG TRỐNG CHƯA ĐƯỢC GIẢI QUYẾT

| Khoảng trống | Mô tả vấn đề | Rủi ro nếu bỏ qua |
|---|---|---|
| **False positive rate cao** | Risk model có thể khóa nhầm thẻ khách hàng đang giao dịch hợp lệ. Ngưỡng quá thấp → too many false alarms; quá cao → bỏ sót fraud. | Mất niềm tin, khiếu nại, NPS giảm. |
| **Agent autonomy boundary** | Chưa có chuẩn mực rõ ràng trong ngân hàng Việt Nam về hành động nào AI được phép làm tự động. | Rủi ro pháp lý, audit fail. |
| **Explainability / XAI** | Agent phải giải thích được tại sao quyết định như vậy cho cả khách hàng lẫn kiểm toán viên. | Vi phạm GDPR-equivalent, mất tin tưởng. |
| **Audit & legal liability** | Nếu Agent gây thiệt hại (khóa nhầm, phát hành sai), ai chịu trách nhiệm? | Rủi ro pháp lý không rõ ràng. |
| **Privacy & data residency** | Dữ liệu hành vi chi tiêu dùng để cá nhân hóa có thể vi phạm quyền riêng tư nếu không có consent đúng cách. | Rủi ro tuân thủ PDPA/GDPR. |
| **Model drift** | Risk model huấn luyện từ dữ liệu lịch sử có thể lỗi thời khi pattern fraud thay đổi. | Bỏ sót fraud mới, false positive mới. |
| **Prompt injection / tool misuse** | Nếu AI Agent có tool gọi API, kẻ tấn công có thể inject prompt để kích hoạt hành động sai. | Mất kiểm soát Agent, security breach. |
| **Core banking integration** | API khóa thẻ, phát hành thẻ số, điều chỉnh hạn mức cần kết nối realtime với core banking vốn thường legacy. | Độ trễ cao, không realtime được. |
| **Customer recovery journey** | Sau sự cố, hầu hết ngân hàng chỉ xử lý kỹ thuật, không có journey phục hồi cảm xúc và lòng tin của khách. | Churn rate cao sau sự cố fraud. |

**Nguồn:** BIS Working Paper No. 1180 on AI in Banking (2023), NIST AI RMF 1.0 (2023), Federal Reserve SR 11-7 (Model Risk), OCC Comptroller's Handbook on Operational Risk, EBA Guidelines on Internal Governance.

---

## D. PROPOSED SOLUTION ARCHITECTURE — KIẾN TRÚC ĐỀ XUẤT

```
┌─────────────────────────────────────────────────────────────────┐
│                    CO-OPBANK DIGITAL CARD                       │
│                  AI AGENT PROTECTION PLATFORM                   │
└─────────────────────────────────────────────────────────────────┘

[1] EVENT STREAM LAYER
    ├── Transaction Event Bus (Kafka/Kinesis)
    ├── Login/Device Signal Collector
    ├── IP/Geo Anomaly Detector
    └── Network Behavior Sensor

         ↓

[2] RISK SCORING ENGINE
    ├── FICO-compatible ML Model (realtime, <100ms)
    ├── Rule-based Policy Engine (velocity, amount, time, geo)
    ├── Behavioral Biometric Scorer
    └── Composite Risk Score (0–1000)

         ↓

[3] CUSTOMER CONTEXT ENGINE
    ├── Spending Pattern Profile (30/90/180 ngày)
    ├── Device & Channel History
    ├── Emotional/Event Context (ví dụ: vừa bị fraud)
    └── Preference & Consent Registry

         ↓

[4] POLICY & GUARDRAIL ENGINE
    ├── Action Permission Matrix (L0–L4)
    ├── Regulatory Compliance Rules (NHNN, PDPA)
    ├── Conflict Resolution Logic
    └── Human Override Triggers

         ↓

[5] AI AGENT ORCHESTRATOR
    ├── ReAct Reasoning Layer (LLM-based, structured prompt)
    ├── Action Planner
    ├── State Machine / Context Window Manager
    └── Fallback & Escalation Handler

         ↓

[6] TOOL / API LAYER
    ├── card.suspend()        — tạm khóa thẻ
    ├── card.terminate()      — khóa vĩnh viễn (sau xác nhận)
    ├── card.issue_new()      — phát hành thẻ số mới
    ├── alert.send()          — push notification
    ├── auth.request()        — yêu cầu biometric/OTP
    ├── case.create()         — tạo case fraud
    ├── log.audit()           — ghi audit log
    └── personalization.push() — đẩy ưu đãi độc bản

         ↓

[7] NOTIFICATION & CONVERSATION LAYER
    ├── Critical Push Alert (bypass silent mode)
    ├── In-App Chat Agent (ngôn ngữ tự nhiên)
    ├── SMS fallback
    └── Voice Call Escalation (nếu không phản hồi)

         ↓

[8] BIOMETRIC / STEP-UP AUTH LAYER
    ├── Face ID / Fingerprint (FIDO2)
    ├── OTP (SMS/Email/Authenticator)
    ├── Challenge Question (last transaction)
    └── Video Verification (cho thay đổi lớn)

         ↓

[9] CASE MANAGEMENT & AUDIT LOG
    ├── Immutable Audit Trail (timestamp + action + reasoning)
    ├── Evidence Package (transaction data, risk score, decision log)
    ├── Dispute Management
    └── Regulatory Report Generator

         ↓

[10] PERSONALIZATION / NEXT BEST ACTION ENGINE
    ├── Post-Incident Sentiment Analyzer
    ├── Spending Pattern Matcher
    ├── Offer Generator (độc bản / personalized)
    └── Engagement Tracker

         ↓

[11] HUMAN-IN-THE-LOOP CONSOLE
    ├── Fraud Ops Dashboard (realtime alert)
    ├── Case Review Queue
    ├── Override Panel (approve/reject Agent decision)
    └── Model Performance Monitor
```

---

## E. REACT FLOW CHI TIẾT

### Giai đoạn 1 — Phát hiện rủi ro & Phản ứng tức thời

```
02:00:00  [Observe]
          Hệ thống ghi nhận:
          - 4 giao dịch liên tiếp trong 3 phút tại 2 website TMĐT lạ
          - Thiết bị: không khớp device fingerprint đã đăng ký
          - IP: Singapore (địa chỉ VPN thương mại phổ biến)
          - Địa lý: không tương đồng với lịch sử 90 ngày
          - Giờ: 2:00 sáng — ngoài pattern chi tiêu thông thường
          - Tổng số tiền: 4,800,000 VND trong 180 giây

          ↓

02:00:01  [Reason — Độc thoại nội tâm của Agent]
          "Risk score: 847/1000. Tôi quan sát thấy 5 tín hiệu bất thường
          đồng thời: thiết bị lạ, IP VPN, giờ khuya, website không có trong
          lịch sử, tốc độ giao dịch cao bất thường. Tôi chưa thể kết luận
          100% đây là fraud — có thể khách hàng đang du lịch và mua sắm online.
          Nhưng xác suất gian lận đủ cao để tôi cần hành động phòng ngừa ngay.
          Tôi sẽ tạm khóa thẻ (không vĩnh viễn), gửi cảnh báo khẩn, và chờ
          phản hồi từ khách hàng trước khi leo thang. Policy L2 cho phép tôi
          làm điều này tự động."

          ↓

02:00:02  [Act — L2]
          → card.suspend(card_id="XXXX-VIRTUAL-001", reason="HIGH_RISK_SCORE_847")
          → log.audit(action="CARD_SUSPENDED", agent_reasoning="risk_score_847_5_signals", timestamp=02:00:02)
          → alert.send(channel="CRITICAL_PUSH", priority="HIGH",
                       message="⚠️ Phát hiện giao dịch bất thường trên thẻ số của bạn.
                               Thẻ đã được tạm khóa để bảo vệ. Mở app để xác nhận.")

          ↓

02:00:03  [Observe]
          Thẻ đã khóa → 2 giao dịch tiếp theo của kẻ tấn công bị từ chối.
          Push notification đã gửi thành công.
          Chờ phản hồi từ khách hàng (timeout: 5 phút).
```

---

### Giai đoạn 2 — Khách hàng phản hồi (3 nhánh)

#### Nhánh A — Khách hàng xác nhận gian lận

```
02:03:17  [Observe]
          Khách hàng Nguyễn Minh An mở app, bấm "Đây là giao dịch lạ — Tôi không thực hiện".
          Xác thực Face ID thành công.

02:03:18  [Reason]
          "Khách hàng đã xác nhận gian lận qua biometric. Tôi có quyền leo thang
          lên L3: khóa vĩnh viễn thẻ cũ và phát hành thẻ số mới. Policy yêu cầu
          biometric trước khi thực hiện; đã có. Tôi cũng cần tạo case fraud để
          đội fraud ops xử lý hoàn tiền."

02:03:19  [Act — L3]
          → card.terminate(card_id="XXXX-VIRTUAL-001", reason="CONFIRMED_FRAUD_BY_CUSTOMER")
          → card.issue_new(customer_id="CID-001", card_type="VIRTUAL_DIGITAL", delivery="IN_APP")
          → case.create(type="FRAUD_DISPUTE", amount=4800000, transactions=["TXN-A","TXN-B"])
          → alert.send(message="✅ Thẻ cũ đã khóa. Thẻ số mới đã sẵn sàng trong app.
                               Chúng tôi sẽ xem xét hoàn tiền trong 3–5 ngày làm việc.")

02:03:20  [Observe]
          Thẻ mới phát hành thành công. Case fraud đã tạo. Audit log đầy đủ.
          → Chuyển sang Giai đoạn 3: Hyper-Personalization.
```

#### Nhánh B — Khách hàng xác nhận giao dịch hợp lệ

```
02:03:17  [Observe]
          Khách hàng bấm "Đây là giao dịch của tôi — Vui lòng mở khóa".
          Xác thực Face ID thành công.

02:03:18  [Reason]
          "Khách hàng xác nhận giao dịch là của họ. Xác thực biometric thành công.
          Tôi sẽ mở khóa thẻ, cập nhật whitelist thiết bị này, giảm mức cảnh báo
          cho session hiện tại nhưng vẫn giữ giám sát tăng cường trong 30 phút."

02:03:19  [Act]
          → card.unsuspend(card_id="XXXX-VIRTUAL-001")
          → context.whitelist_device(device_id="DEVICE-XYZ", duration="SESSION")
          → monitoring.elevate(level="ENHANCED", duration=30)
          → alert.send(message="✅ Thẻ đã được mở. Chúng tôi đã cập nhật profile
                               bảo mật của bạn để tránh cảnh báo tương tự.")

02:03:20  [Observe]
          Thẻ mở, giao dịch tiếp tục bình thường. False positive xử lý sạch.
```

#### Nhánh C — Khách hàng không phản hồi trong 5 phút

```
02:05:02  [Observe]
          Timeout 5 phút — không có phản hồi từ khách hàng.
          Thẻ vẫn đang tạm khóa.

02:05:02  [Reason]
          "Khách hàng không phản hồi. Không thể kết luận fraud hay hợp lệ.
          Tôi không có quyền L3 mà không có xác nhận của khách. Nhưng tôi phải
          tiếp tục bảo vệ tài sản. Tôi sẽ gửi SMS fallback và leo thang lên
          Human-in-the-loop console để nhân viên fraud ops xem xét."

02:05:03  [Act — Escalate]
          → alert.send(channel="SMS", message="Co-opBank: Phát hiện giao dịch
            bất thường 2:00AM. Thẻ tạm khóa. Gọi 1800-xxxx ngay nếu cần hỗ trợ.")
          → human_console.escalate(case_id="CASE-001", priority="HIGH",
                                   note="Customer unresponsive >5min, risk score 847")

02:05:04  [Observe]
          Nhân viên fraud ops nhận cảnh báo. Có thể gọi điện trực tiếp cho khách hàng.
          Thẻ vẫn tạm khóa cho đến khi có xác nhận.
```

---

### Giai đoạn 3 — Khôi phục & Cá nhân hóa hậu sự cố (Hyper-Personalization)

```
02:05:00  [Observe — Context Engine kích hoạt song song]
          Sau khi xử lý khủng hoảng (Nhánh A):
          - Khách hàng đã xác nhận fraud, nhận thẻ mới, đang online trong app.
          - Tâm lý: vừa trải qua lo lắng, đang cần cảm giác an toàn và được quan tâm.
          - Dữ liệu lịch sử 90 ngày: 68% chi tiêu là tiện ích (điện, nước, internet),
            nhu yếu phẩm và tạp hóa. Chỉ dùng thẻ số cho payment online.

02:05:01  [Reason — Hyper-Personalization]
          "Khách hàng Nguyễn Minh An vừa trải qua trải nghiệm lo lắng. Họ đang
          cần được reassure. Tôi thấy 3 điểm quan trọng từ spending profile:
          (1) Chi tiêu thiết yếu chiếm 68% — đây là nhu cầu thực sự, không phải
          luxury spending.
          (2) Họ dùng thẻ số cho online payment — phù hợp để tặng ưu đãi online bill.
          (3) Chưa bao giờ dùng tính năng cashback — cơ hội giới thiệu.

          Tôi sẽ không đơn thuần tặng voucher. Tôi sẽ đóng khung đây là một phần
          của cam kết bảo vệ từ Co-opBank: 'Vì bạn đã tin tưởng chúng tôi ngay
          cả trong lúc khó khăn nhất, đây là ưu đãi độc bản dành riêng cho bạn.'"

02:05:02  [Act — Personalization Engine]
          → personalization.generate_offer(
               customer_id="CID-001",
               trigger="POST_FRAUD_INCIDENT",
               spending_focus=["utilities", "groceries", "internet_bill"],
               offer_type="CASHBACK_EXCLUSIVE",
               cashback_rate=5%,
               duration_days=90,
               messaging_tone="REASSURING_WARM"
            )
          → personalization.push(
               screen="HOME_BANNER_EXCLUSIVE",
               title="🛡️ Ưu đãi Độc bản — Dành riêng cho bạn",
               body="Cảm ơn bạn đã tin tưởng Co-opBank. Chúng tôi hiểu bạn cần
                    sự an tâm hơn bao giờ hết. Nhận ngay 5% cashback cho mọi
                    thanh toán hóa đơn điện, nước, internet và mua sắm nhu yếu
                    phẩm trong 90 ngày tới — chỉ dành cho bạn.",
               cta="Kích hoạt ngay"
            )

02:05:10  [Observe]
          Khách hàng Nguyễn Minh An nhìn thấy banner.
          → "Ủa, sao họ biết tôi hay trả tiền điện nước? Hay thật!"
          → Kích hoạt ưu đãi sau 8 giây.
          → Trạng thái: chuyển từ lo lắng → an tâm → thích thú → gắn kết.
          → NPS dự kiến: +40 điểm so với kịch bản không có personalization.
```

---

## F. GUARDRAIL MATRIX — MA TRẬN QUYỀN HÀNH ĐỘNG

| Mức | Loại hành động | Ví dụ cụ thể | Điều kiện Agent được làm | Ai phê duyệt |
|---|---|---|---|---|
| **L0** | Giám sát thụ động | Ghi log, tăng sampling rate | Agent tự động luôn | Không cần |
| **L0** | Tạo cảnh báo nội bộ | Ghi flag lên dashboard | Agent tự động luôn | Không cần |
| **L1** | Gửi thông báo rủi ro | Push notification cảnh báo | Agent tự làm theo policy | Không cần |
| **L1** | Yêu cầu xác minh | Gửi OTP, yêu cầu biometric | Agent tự làm khi risk score > 700 | Không cần |
| **L2** | Tạm khóa thẻ | Suspend card (reversible) | Agent tự làm khi risk score > 800 | Không cần |
| **L2** | Whitelist/blacklist tạm | Block merchant trong session | Agent tự làm theo rule | Không cần |
| **L3** | Khóa vĩnh viễn thẻ | Terminate card (irreversible) | **Cần khách xác nhận + biometric** | Khách hàng |
| **L3** | Phát hành thẻ số mới | Issue new virtual card | **Cần khách xác nhận + biometric** | Khách hàng |
| **L3** | Tạo case fraud | Open dispute | Agent tự làm sau khi khách xác nhận fraud | Không cần thêm |
| **L4** | Thay đổi hạn mức | Tăng/giảm credit limit | **Cần nhân viên risk phê duyệt** | Fraud Ops |
| **L4** | Hoàn tiền tranh chấp | Chargeback processing | **Cần nhân viên phê duyệt** | Fraud Ops / Compliance |
| **L4** | Khóa toàn bộ tài khoản | Account freeze (không chỉ thẻ) | **Cần nhân viên cấp cao** | Manager |
| **L4** | Báo cáo cơ quan chức năng | STR / SAR report | **Cần Compliance Officer** | Compliance |

> **Nguyên tắc bất biến:** Bất kỳ hành động không thể đảo ngược nào (terminate, chargeback, account freeze) đều cần ít nhất một lớp xác nhận của người dùng hoặc nhân sự. Agent chỉ **đề xuất và điều phối**, không **quyết định đơn phương** ở L3–L4.

---

## G. DEMO SCENARIO SÂN KHẤU HÓA

### Nhân vật
- 🧑 **Nguyễn Minh An** — Khách hàng hoang mang, đang ngủ say
- 🕵️ **Shadow** — Hacker bóng đêm, đang tìm cách rút tiền
- 🤖 **KNIGHT** — AI Agent tinh nhuệ của Co-opBank
- 🏦 **Core Banking System** — Hệ thống ngân hàng nền tảng
- 👩‍💼 **Chị Lan** — Nhân viên Fraud Ops trực ca đêm

---

### Timeline

**02:00:00 — Màn 1: Bóng tối lén vào**

```
[Sân khấu: màn hình tối, tiếng gõ phím]

SHADOW (thì thầm): "Thẻ số của cậu... dễ quá. Mua trước,
                   cậu sẽ biết sau."

[3 giao dịch flash lên màn hình: 1,200,000 VND... 1,800,000 VND... 1,800,000 VND]

HỆ THỐNG: [Còi báo động nhỏ] "Event received. Processing..."
```

**02:00:01 — Màn 2: KNIGHT thức dậy**

```
KNIGHT (độc thoại nội tâm):
"[OBSERVE] Tôi nhận được 3 transaction events trong 90 giây.
Device fingerprint: không khớp. IP address: Singapore VPN.
Time: 2 giờ sáng. Website: lần đầu xuất hiện trong profile khách hàng.
Risk score engine trả về: 847/1000.

[REASON] Tôi có 5 tín hiệu đỏ cùng lúc. Xác suất gian lận cao.
Nhưng tôi không được phép kết luận vội — có thể khách đang du lịch.
Policy L2 cho phép tôi tạm khóa thẻ mà không cần xin phép.
Tôi phải hành động ngay để ngăn thiệt hại, nhưng không được hành động
không thể đảo ngược khi chưa có xác nhận của khách.

[ACT] Tôi sẽ:
1. Gọi card.suspend() — tạm khóa ngay.
2. Ghi audit log đầy đủ.
3. Gửi critical push notification.
4. Chờ phản hồi 5 phút."

[KNIGHT gọi API — animation trên màn hình]
→ card.suspend("CARD-001") ✅
→ log.audit("SUSPEND", "risk_847", "02:00:01") ✅
→ alert.send("CRITICAL_PUSH", "Giao dịch bất thường...") ✅
```

**02:00:02 — Màn 3: Shadow thất bại**

```
SHADOW: [cố gõ tiếp] "Sao bị từ chối rồi? Thử lại..."

[Màn hình: TRANSACTION DECLINED — CARD SUSPENDED]

SHADOW: "Chết! Bị chặn rồi. Rút lui."
```

**02:03:17 — Màn 4: Minh An tỉnh giấc**

```
[Điện thoại rung dữ dội — critical alert vượt qua silent mode]

MINH AN (hoang mang, ngái ngủ): "Gì vậy... 2 giờ sáng rồi..."

[Đọc notification]

MINH AN: "GIAO DỊCH BẤT THƯỜNG?! KHÔNG PHẢI TÔI LÀM!"

[Mở app, bấm "Đây là giao dịch lạ"]

KNIGHT (trong app):
"Cảm ơn bạn đã xác nhận. Để bảo vệ tài khoản,
vui lòng xác thực Face ID để chúng tôi tiến hành
khóa vĩnh viễn thẻ cũ và phát hành thẻ số mới."

[Face ID: ✅ Thành công]
```

**02:03:19 — Màn 5: KNIGHT leo thang L3**

```
KNIGHT (độc thoại nội tâm):
"[OBSERVE] Khách hàng đã xác nhận fraud. Biometric thành công.
Policy L3 đã được unlock bởi customer consent + biometric.

[REASON] Tôi có đủ điều kiện để: terminate thẻ cũ, issue thẻ mới,
tạo case fraud. Tôi không cần thêm phê duyệt nào nữa.

[ACT] Thực hiện ngay."

→ card.terminate("CARD-001") ✅ — "Thẻ cũ đã khóa vĩnh viễn"
→ card.issue_new("CID-001", "VIRTUAL") ✅ — "Thẻ số mới: XXXX-XXXX-XXXX-7291"
→ case.create("FRAUD_DISPUTE", 4800000) ✅ — "Case #FR-20250601-001"
→ log.audit("TERMINATE+ISSUE+CASE", "customer_confirmed+biometric", "02:03:19") ✅

MINH AN: "Ôi trời... thẻ mới rồi. Nhanh quá!"
```

**02:05:00 — Màn 6: Chị Lan nhận báo cáo**

```
[Console của Fraud Ops]

CHỊ LAN: "Case #FR-001 vừa tạo. KNIGHT đã xử lý
          suspend → confirm → terminate → issue trong 3 phút 19 giây.
          Audit log đầy đủ. Tôi chỉ cần review và approve chargeback."

[Chị Lan click "Approve Chargeback Review"]
```

**02:05:02 — Màn 7: Surprise — Ưu đãi Độc bản**

```
KNIGHT (độc thoại nội tâm):
"[REASON] Minh An vừa trải qua 5 phút kinh hoàng lúc 2 giờ sáng.
Nhìn vào spending profile 90 ngày: 68% là điện, nước, internet, tạp hóa.
Chưa dùng cashback bao giờ.

Đây không phải lúc để bán hàng. Đây là lúc để nói:
'Co-opBank ở đây với bạn, ngay cả lúc 2 giờ sáng.'

Tôi sẽ tạo ưu đãi phù hợp với cuộc sống thực của Minh An,
không phải ưu đãi generic.
Và tôi sẽ gói nó trong thông điệp: 'Vì bạn xứng đáng được an tâm.'"

→ personalization.generate_offer(utilities+groceries, cashback 5%, 90 ngày) ✅
→ personalization.push("HOME_BANNER_EXCLUSIVE") ✅

[Màn hình Minh An: banner xuất hiện]

MINH AN (bất ngờ): "Ủa... 5% cashback tiền điện, nước, tạp hóa?
                    Sao họ biết đúng thứ tôi cần vậy?!
                    Thôi kích hoạt luôn!"

[KÍCH HOẠT ✅]

KNIGHT (cuối kịch): "Nhiệm vụ hoàn thành.
                     Tài sản: bảo vệ. ✅
                     Thẻ mới: phát hành. ✅
                     Niềm tin: phục hồi. ✅
                     Khách hàng: từ hoang mang → an tâm → gắn kết. ✅"
```

---

## H. HYPER-PERSONALIZATION — CHI TIẾT

### Cơ chế hoạt động

| Bước ReAct | Nội dung chi tiết |
|---|---|
| **Reason** | Sau khi xử lý khủng hoảng, Agent truy vấn Customer Context Engine: lấy 90 ngày lịch sử giao dịch. Phân tích: 68% chi tiêu là tiện ích (điện, nước, internet) và nhu yếu phẩm. Kết luận: đây là khách hàng có nhu cầu chi tiêu thiết yếu cao và ổn định; chưa từng dùng cashback feature; vừa trải qua sự cố cảm xúc. Suy luận: ưu đãi cashback cho đúng danh mục chi tiêu thực của họ, được đóng khung như "phần thưởng an tâm" thay vì "bán hàng", sẽ tạo cảm xúc được lắng nghe và quan tâm. |
| **Act** | Agent gọi personalization.generate_offer() với parameters: spending_focus=["utilities","groceries","internet"], cashback_rate=5%, duration=90 ngày, messaging_tone="REASSURING". Engine tạo ra offer object độc bản. Sau đó gọi personalization.push() để hiển thị banner trực tiếp trên homescreen của app ngay khi khách đang online. |
| **Observe** | Khách hàng thấy banner trong vòng 8 giây sau khi nhận thẻ mới. Reaction: bất ngờ tích cực ("sao biết đúng thứ mình cần"). Kích hoạt ưu đãi ngay lập tức. Trạng thái cảm xúc: lo lắng → an tâm → thích thú → gắn kết. Engagement metric: conversion rate T+0 của offer = cao hơn 3–5 lần so với batch offer thông thường. |

### Nguyên tắc thiết kế ưu đãi độc bản

Ưu đãi không phải voucher ngẫu nhiên. Ưu đãi phải:
1. **Dựa trên dữ liệu thực** — đúng danh mục chi tiêu của khách, không phải generic.
2. **Đóng khung đúng tâm lý** — "Cảm ơn bạn đã tin tưởng Co-opBank", không phải "Mua ngay kẻo hết".
3. **Thời điểm đúng** — Xuất hiện ngay khi khách vừa trải qua sự cố và đang online trong app.
4. **Liên quan đến bảo mật** — "Thẻ số mới của bạn đã sẵn sàng + ưu đãi này dành riêng cho bạn".
5. **Có consent** — Chỉ dùng dữ liệu mà khách hàng đã đồng ý trong điều khoản dịch vụ.

---

## I. SO SÁNH CHATBOT TRUYỀN THỐNG vs AI AGENT

| Chiều | Chatbot truyền thống | AI Agent (Co-opBank KNIGHT) |
|---|---|---|
| **Khởi động** | Chờ khách hàng nhắn tin trước | Tự chủ động phát hiện tín hiệu, không cần khách làm gì |
| **Nhận thức** | Chỉ thấy nội dung cuộc chat hiện tại | Quan sát toàn bộ event stream: transaction, device, IP, geo, time |
| **Suy luận** | Dựa trên keyword matching hoặc intent classification | Dùng multi-signal risk scoring + policy reasoning + context engine |
| **Hành động** | Chỉ trả lời text, đề xuất bước tiếp theo cho người dùng | Tự gọi API: suspend card, issue card, create case, push notification |
| **Biometric** | Không thể kích hoạt xác thực | Yêu cầu Face ID / OTP như một bước trong flow tự động |
| **Tốc độ** | Phụ thuộc vào thời gian phản hồi của khách | Hành động trong vòng 1–2 giây sau khi phát hiện tín hiệu |
| **Cá nhân hóa** | Gợi ý FAQ chung chung | Sinh offer độc bản dựa trên spending profile 90 ngày của từng khách |
| **Audit** | Lưu transcript chat | Ghi audit log immutable: mỗi action kèm reasoning + timestamp + policy level |
| **Human override** | Không có cơ chế chuẩn | Có Human-in-the-loop console; Agent tự escalate khi cần |
| **Học từ kết quả** | Không | Observe phase ghi lại kết quả để cải thiện model |

---

## J. KPI — CHỈ SỐ ĐO LƯỜNG THÀNH CÔNG

| KPI | Định nghĩa | Mục tiêu | Baseline hiện tại |
|---|---|---|---|
| Fraud detection latency | Thời gian từ giao dịch đầu tiên đến khi tạm khóa thẻ | < 3 giây | ~30–120 giây (thủ công) |
| False positive rate | % thẻ bị khóa nhầm / tổng thẻ bị khóa | < 5% | ~10–20% (industry average) |
| Fraud loss reduction | % giảm tổn thất tài chính do gian lận thẻ | > 70% | Baseline cần đo |
| Customer response time | Thời gian từ khi push đến khi khách phản hồi | < 5 phút | Không có push tự động |
| Card reissue completion time | Thời gian từ xác nhận fraud đến thẻ mới sẵn sàng | < 30 giây | ~1–2 ngày làm việc |
| NPS sau sự cố | Net Promoter Score đo sau 24h | > +20 vs baseline | Không đo hiện tại |
| Automation rate | % case được xử lý đến L2 mà không cần nhân sự | > 80% | ~0% (toàn thủ công) |
| Escalation rate | % case phải leo lên human review | < 20% | 100% hiện tại |
| Audit completeness | % action có audit trail đầy đủ | 100% | Không có chuẩn hiện tại |
| Personalization conversion rate | % khách kích hoạt ưu đãi post-incident | > 30% | ~2–5% (batch offer thông thường) |

---

## K. KỊCH BẢN THUYẾT TRÌNH 5 PHÚT — SLIDE FRAMEWORK

### Cấu trúc 5 phút

```
Phút 1 — PROBLEM (Đặt vấn đề)
   Slide 1: "2 giờ sáng. Khách hàng đang ngủ. Tiền đang biến mất."
   → Dùng ảnh/animation: màn hình tối, 3 transaction flash đỏ.
   → Câu hỏi mở: "Ngân hàng của bạn đang làm gì lúc này?"

Phút 2 — CURRENT STATE + GAP (Bức tranh hiện tại)
   Slide 2: Bảng Current State — "Đã có nhiều mảnh ghép, chưa ai ghép trọn"
   → Highlight: Risk scoring ✅, Card lock ✅, Push ✅ | ReAct Agent ❌, End-to-end ❌
   → Một câu: "Thiếu lớp điều phối thông minh nối tất cả lại."

Phút 3 — SOLUTION (Giải pháp)
   Slide 3: Kiến trúc đơn giản hóa (5 lớp)
   → Event → Risk Score → AI Agent ReAct → Banking APIs → Khách hàng
   Slide 4: Guardrail Matrix — "Agent không toàn quyền"
   → L0-L1: Agent tự làm | L2: Agent + policy | L3: Cần khách | L4: Cần nhân sự

Phút 4 — DEMO (Sân khấu hóa live)
   Slide 5: Timeline 02:00:00 → 02:03:19 → 02:05:00
   → Live roleplay: Shadow cố rút tiền → KNIGHT tạm khóa → Minh An xác nhận → Thẻ mới
   → Highlight độc thoại nội tâm của KNIGHT (Reasoning)

Phút 5 — IMPACT + CALL TO ACTION
   Slide 6: KPI Table — Fraud latency 3s vs 120s; NPS +20; Reissue 30s vs 2 ngày
   Slide 7: "Điểm khác biệt: Co-opBank là ngân hàng đầu tiên ở Việt Nam
             biến sự cố bảo mật thành trải nghiệm phục hồi niềm tin realtime."
   → Kết thúc: replay khoảnh khắc Minh An nhận ưu đãi độc bản và mỉm cười.
```

### Checklist slide thiết yếu

| # | Slide | Điểm nhấn |
|---|---|---|
| 1 | Problem Hook | Animation 3 giao dịch đỏ lúc 2AM |
| 2 | Current State | Bảng so sánh mature vs gap |
| 3 | Architecture | 5-layer flow, đơn giản, dễ hiểu |
| 4 | Guardrail | Matrix L0–L4, nhấn "không toàn quyền" |
| 5 | Demo Timeline | Screenshot hoặc live roleplay |
| 6 | KPI | Số so sánh before/after |
| 7 | Closing | Moment Minh An nhận ưu đãi độc bản |

---

## L. CHỐT HƯỚNG ĐI THỰC THI — MOBILE-FIRST IPHONE APP

### Quyết định cuối cùng

Hướng thực thi chính thức là **iPhone-first mobile banking prototype** cho tính năng **KNIGHT bảo vệ thẻ số 2AM**. Không làm desktop dashboard hay landing page làm màn hình chính. Người dùng cuối của sản phẩm là khách hàng đang dùng app ngân hàng trên điện thoại, vì vậy toàn bộ trải nghiệm phải bắt đầu từ điện thoại: nhận cảnh báo, mở app, xác nhận Face ID, khóa thẻ, nhận thẻ số mới, xem timeline xử lý và kích hoạt ưu đãi phục hồi niềm tin.

Prototype animation hiện tại chỉ nên giữ vai trò **intro / visual storytelling / presentation mode**. Artifact thực thi chính cần là một giao diện giống app ngân hàng thật trên iPhone, thao tác được bằng một tay, đọc nhanh lúc nửa đêm, và đủ tin cậy để thuyết phục rằng đây không chỉ là chatbot mà là agent có quyền hành động trong guardrail.

### Capability cần ship

Sau khi hoàn thành, khách hàng có thể xử lý một cảnh báo gian lận thẻ số trong app bằng luồng ngắn:

`Critical Alert → Fraud Review → Face ID → Card Suspended/Terminated → New Virtual Card → Recovery Offer → Audit Timeline`

Kết quả mong muốn: trong dưới 30 giây sau khi khách xác nhận fraud, app hiển thị thẻ số mới đã sẵn sàng, case fraud đã được tạo, và khách hiểu rõ KNIGHT đã làm gì, vì sao làm, hành động nào còn chờ Fraud Ops.

### Màn hình iPhone bắt buộc

| # | Màn hình | Mục tiêu | Thành phần chính |
|---|---|---|---|
| 1 | Lock Screen / Critical Alert | Tạo hook 2AM, cho thấy app chủ động bảo vệ | Notification dạng iOS, số tiền, merchant lạ, CTA mở app |
| 2 | KNIGHT Fraud Review | Cho khách hiểu rủi ro trong 5 giây | Risk score, 3 tín hiệu đỏ, trạng thái thẻ tạm khóa, 2 CTA rõ ràng |
| 3 | Face ID Step-up | Mở khóa hành động L3 bằng xác thực sinh trắc | Face ID simulation, giải thích ngắn: "cần xác thực trước khi khóa vĩnh viễn" |
| 4 | New Virtual Card | Chứng minh giá trị tức thời | Thẻ số mới, trạng thái active, masked PAN, nút thêm vào ví / copy số thẻ demo |
| 5 | Recovery Offer | Biến sự cố thành phục hồi niềm tin | Cashback đúng danh mục chi tiêu, tone trấn an, CTA kích hoạt |
| 6 | Audit Timeline | Tạo niềm tin và khả năng kiểm toán | Timeline Observe → Reason → Act, policy level, timestamp, case ID |

### Thiết kế sản phẩm

- **Tone:** calm, secure, premium banking; không sci-fi quá đà ở màn hình chính.
- **Layout:** portrait-first, tối ưu baseline iPhone 390×844 và co giãn tốt đến các viewport iPhone lớn hơn.
- **Safe area:** dùng `env(safe-area-inset-*)`, tránh nội dung bị che bởi Dynamic Island, home indicator và browser chrome.
- **Tap target:** tối thiểu 44px; CTA chính nằm gần vùng thao tác ngón cái.
- **Typography:** dùng system font iOS, heading vừa phải, không hero text lớn trong tool surface.
- **Màu:** nền sáng/tối trung tính + xanh tin cậy + xanh lá thành công + đỏ/amber chỉ dùng cho rủi ro; tránh UI một màu xanh tím hoặc neon toàn màn hình.
- **Motion:** animation phục vụ trạng thái: risk detected, card suspended, Face ID success, card issued. Có hỗ trợ `prefers-reduced-motion`.
- **Accessibility:** text không tràn trên 360px, contrast đủ cao, trạng thái quan trọng không chỉ dựa vào màu.

### State machine thực thi

```text
idle_monitoring
  → risk_detected
  → card_suspended_l2
  → awaiting_customer_response
      → customer_confirms_fraud
          → biometric_required
          → biometric_verified
          → card_terminated_l3
          → new_card_issued
          → fraud_case_created
          → recovery_offer_ready
          → audit_complete
      → customer_confirms_legit
          → biometric_required
          → card_unsuspended
          → device_session_whitelisted
          → enhanced_monitoring_30m
      → customer_timeout
          → sms_fallback_sent
          → fraud_ops_escalated
          → card_remains_suspended
```

Luồng UI phải bám state machine này thay vì chỉ chạy animation tuần tự. Mỗi action hiển thị cho khách cần có `policy_level`, `reason`, `timestamp` và kết quả rõ ràng.

### Guardrail không được phá vỡ

| Hành động | Có được tự động không? | Điều kiện |
|---|---:|---|
| Gửi cảnh báo | Có | Risk score vượt ngưỡng policy |
| Tạm khóa thẻ | Có | L2, reversible, audit đầy đủ |
| Khóa vĩnh viễn thẻ | Không tự ý | Chỉ sau khách xác nhận fraud + Face ID |
| Phát hành thẻ số mới | Không tự ý | Chỉ sau xác nhận fraud + Face ID |
| Hoàn tiền / chargeback | Không | Chỉ Fraud Ops / Compliance phê duyệt |
| Khóa toàn bộ tài khoản | Không | Chỉ human escalation cấp cao |

Nguyên tắc chốt: **KNIGHT được quyền hành động nhanh ở các bước có thể đảo ngược; các bước không thể đảo ngược phải có xác nhận người dùng hoặc nhân sự.**

### Hướng kỹ thuật

Vì repo hiện là prototype nhẹ, hướng tối ưu là đi theo 2 bước:

1. **Sprint demo:** tạo một mobile web/PWA prototype bằng HTML/CSS/JS hoặc React/Vite nếu cần component hóa nhanh. Dữ liệu dùng mock, không gọi banking API thật.
2. **Sprint product hóa:** nếu cần mở rộng, chuyển sang React + TypeScript với state machine rõ ràng, Playwright E2E, component hóa các surface: alert, fraud review, Face ID, virtual card, offer, audit timeline.

Không hardcode dữ liệu nhạy cảm thật. Không lưu token hoặc thông tin thẻ vào `localStorage`. Mọi số thẻ chỉ dùng masked PAN. Nếu prototype có API mock, tất cả input phải validate bằng schema và response lỗi không lộ stack trace.

### Kế hoạch triển khai

| Phase | Việc làm | Output |
|---|---|---|
| 0 | Freeze direction | Section này là source of truth cho hướng mobile-first |
| 1 | Mobile shell | Khung iPhone, safe area, navigation, design tokens, trạng thái responsive |
| 2 | Fraud core flow | Critical alert, risk review, 2 CTA, L2 suspend, Face ID simulation |
| 3 | Resolution flow | Issue new virtual card, create case, recovery offer, audit timeline |
| 4 | Verification | iPhone viewport QA, reduced motion, text overflow, Lighthouse/a11y smoke test |
| 5 | Presentation polish | Demo script 5 phút chuyển từ slide sang live mobile interaction |

### Definition of Done

- Mở prototype trên iPhone viewport không cần zoom, không có text tràn hoặc overlap.
- Luồng happy path fraud chạy hoàn chỉnh trong dưới 90 giây demo.
- Có đủ 3 nhánh: fraud confirmed, legitimate transaction, no response timeout.
- Mỗi action nhạy cảm đều có reason + policy level + audit timestamp.
- CTA chính rõ ràng, thao tác được bằng một tay.
- Reduced motion hoạt động.
- Không có secret, số thẻ thật, token thật hoặc API ngân hàng thật trong source.
- Có Playwright screenshot hoặc manual QA cho ít nhất 3 viewport: 390×844, 393×852, 430×932.

### ECC skill áp dụng

| Skill ECC | Cách áp dụng vào hướng này |
|---|---|
| `frontend-design-direction` | Chọn UI banking mobile thật, không dùng landing/desktop dashboard làm sản phẩm chính |
| `frontend-patterns` | Component hóa surface và quản lý state theo flow thay vì animation rời rạc |
| `coding-standards` | Giữ code đơn giản, dữ liệu mock rõ tên, tránh over-engineering |
| `security-review` | Không để agent vượt quyền, không hardcode secret/card data, validate mọi input |
| `tdd-workflow` | Test theo user journey: fraud confirmed, legitimate, timeout |
| `verification-loop` | Build/type/lint/test/security/diff trước khi coi prototype sẵn sàng trình diễn |

### Kết luận thực thi

**Chốt:** Co-opBank KNIGHT sẽ được triển khai như một **mobile banking security flow tối ưu cho iPhone**, trong đó AI Agent là lớp điều phối phía sau còn trải nghiệm chính là hành trình khách hàng phục hồi an toàn trong app. Đây là hướng phù hợp nhất với hành vi người dùng ngân hàng hiện nay, giữ được điểm mới agentic orchestration, đồng thời đủ thực tế để demo và tiến tới product hóa.

---

## PHẦN PHỤ LỤC: NGUỒN THAM CHIẾU QUAN TRỌNG

| Nguồn | Nội dung liên quan |
|---|---|
| FICO Falcon Fraud Manager Platform (2024) | Risk scoring realtime, behavioral analytics |
| Feedzai RiskOps (2023) | Real-time fraud detection, explainability |
| Featurespace ARIC Risk Hub | Adaptive behavioral analytics |
| NICE Actimize Financial Crime Solutions | Transaction monitoring, case management |
| Visa Token Service Whitepaper | Virtual card, tokenization, instant issuance |
| Mastercard MDES Documentation | Digital Enablement Service, card lifecycle |
| Revolut / Monzo Engineering Blog | Card lock/unlock API, push notification design |
| Capital One Tech Blog | ML fraud detection, autonomous card controls |
| Yao et al. (2022) "ReAct: Synergizing Reasoning and Acting in Language Models" | ReAct framework foundational paper |
| NIST AI RMF 1.0 (2023) | AI Risk Management Framework |
| OCC SR 11-7 / Federal Reserve SR 11-7 | Model Risk Management guidance |
| FFIEC Cybersecurity Assessment Tool | Bank security framework |
| EBA Guidelines on ICT and Security Risk | European banking AI governance |
| BIS Working Paper No. 1180 (2023) | AI in Banking: opportunities and risks |
| FIDO Alliance — FIDO2 Specification | Biometric authentication standard |

---

*Tài liệu này được soạn thảo cho mục đích thi và nghiên cứu nội bộ. Mọi con số KPI là mục tiêu tham chiếu dựa trên industry benchmark, không phải số đã được kiểm chứng trong production Co-opBank.*
