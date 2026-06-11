# 01 - Product Capability

## Capability

Sau khi ship, khách hàng dùng app ngân hàng trên iPhone có thể xử lý cảnh báo gian lận thẻ số ngay trong app: nhận cảnh báo lúc 2AM, xem lý do rủi ro, xác nhận giao dịch có phải gian lận hay không, xác thực Face ID, nhận thẻ số mới, xem case fraud, và nhận ưu đãi phục hồi niềm tin nếu phù hợp.

Năng lực mới không phải là chatbot. KNIGHT là lớp điều phối agentic ở phía sau, có thể gọi hành động bảo vệ trong policy đã định, ghi audit trail, và leo thang cho con người khi vượt quyền.

## User-visible Promise

- App phát hiện giao dịch bất thường và chủ động bảo vệ thẻ.
- Khách hàng thấy thẻ đã được tạm khóa trước khi thiệt hại lan rộng.
- Khách hàng có thể xác nhận fraud bằng Face ID.
- Thẻ số mới có thể sẵn sàng trong dưới 30 giây sau xác nhận fraud.
- Mọi bước nhạy cảm đều có giải thích ngắn, timestamp và trạng thái rõ ràng.

## Scope

In scope cho prototype:

- iPhone-first mobile UI.
- Mock critical alert.
- Fraud review screen.
- Face ID simulation.
- 3 nhánh xử lý: confirmed fraud, legitimate transaction, no response timeout.
- New virtual card mock.
- Fraud case mock.
- Recovery offer mock.
- Audit timeline.
- State machine có thể kiểm thử.

Out of scope cho prototype đầu:

- Kết nối core banking thật.
- Push notification thật qua APNs.
- Face ID thật qua native biometric API.
- Chargeback thật.
- Tích hợp ví Apple Wallet thật.
- Huấn luyện risk model thật.
- Dashboard vận hành Fraud Ops đầy đủ.

## Actors

| Actor | Vai trò |
|---|---|
| Customer | Khách hàng đang dùng app trên iPhone, cần xử lý cảnh báo nhanh |
| KNIGHT Agent | Lớp điều phối, nhận risk event, quyết định hành động trong policy |
| Risk Scoring Engine | Trả risk score và tín hiệu rủi ro |
| Policy Engine | Kiểm tra action nào được phép |
| Card Service | Tạm khóa, mở khóa, khóa vĩnh viễn, phát hành thẻ số |
| Auth Service | Yêu cầu xác thực Face ID hoặc OTP |
| Case Service | Tạo case fraud và trạng thái dispute |
| Personalization Engine | Tạo recovery offer dựa trên profile đã consent |
| Fraud Ops | Nhân sự xử lý các bước L4 và timeout/escalation |

## Constraints

- Prototype phải chạy tốt trên viewport iPhone: 390x844, 393x852, 430x932.
- Tap target tối thiểu 44px.
- Không hiển thị số thẻ thật, CVV thật, token thật.
- Không lưu dữ liệu nhạy cảm trong `localStorage`.
- Không để agent tự động làm hành động irreversible.
- Mỗi action phải có audit event.
- Mỗi transition state phải có event rõ ràng.
- Copy phải ngắn, bình tĩnh, phù hợp lúc khách đang hoảng.

## Implementation Contract

Frontend phải expose các surface:

- `CriticalAlertSurface`
- `FraudReviewScreen`
- `BiometricStepUp`
- `VirtualCardScreen`
- `RecoveryOfferScreen`
- `AuditTimeline`
- `ScenarioControls` cho demo/test

Logic phải expose các nhóm:

- `scenarioState`
- `dispatchScenarioEvent(event)`
- `deriveAllowedActions(state, policy)`
- `appendAuditEvent(action)`
- `getVisibleScreen(state)`

Mock API hoặc service layer phải expose:

- `risk.evaluateTransactionBatch()`
- `card.suspend()`
- `card.unsuspend()`
- `card.terminate()`
- `card.issueNewVirtualCard()`
- `auth.verifyBiometric()`
- `case.createFraudCase()`
- `personalization.generateRecoveryOffer()`
- `audit.write()`

## Non-goals

- Không chứng minh model fraud tốt hơn FICO/Feedzai.
- Không xây full mobile banking app.
- Không xây core banking backend thật.
- Không xử lý pháp lý chargeback production.
- Không thay thế Fraud Ops.

## Decisions Closed

| Câu hỏi | Quyết định |
|---|---|
| Tên thương hiệu trong app dùng "Co-opBank" hay "CoopBank"? | Dùng "Co-opBank" trong UI khách hàng. |
| Recovery offer có được hiển thị ngay sau fraud không, hay cần consent riêng? | Hiển thị sau khi case fraud được tạo và chỉ khi có personalization consent. |
| Có cần mô phỏng branch khách xác nhận giao dịch hợp lệ trong demo chính không? | Có trong demo controls/test plan; không phải nhánh trình bày chính. |
| Prototype dùng single HTML hay React/Vite? | Phase 2 product hóa dùng React + TypeScript + Vite. Artifact Đề 02 hiện tại vẫn là single HTML deck. |
| Có cần tiếng Anh song song không? | Không. UI Vietnamese-first; technical identifiers có thể dùng English khi code sau. |

## Operational Defaults Before Code

| Câu hỏi | Quyết định mặc định |
|---|---|
| Có cần gói docs-only handoff cho báo cáo không? | Có. Giai đoạn hiện tại là docs-only foundation/handoff; chưa scaffold code. |
| Có cần asset/logo chính thức cho mobile prototype không? | Chưa cần. Dùng text brand "Co-opBank" và shield mark/icon đơn giản; không tự bịa logo chính thức. |
| Có cần chụp screenshot viewport sau khi implement không? | Chưa cần ở giai đoạn docs. Khi đã code UI, screenshot QA là bắt buộc cho 390x844, 393x852, 430x932, 360x780. |

## Handoff

Trạng thái: sẵn sàng triển khai prototype sau khi user xác nhận chuyển từ docs foundation sang code. Dữ liệu mock, Face ID simulation, React + TypeScript + Vite đã được chốt cho Phase 2.

Lane tiếp theo:

1. Dùng [10-tech-stack-and-foundation.md](10-tech-stack-and-foundation.md) để xác nhận ready-to-code gate.
2. Dùng [09-implementation-backlog.md](09-implementation-backlog.md) để chia task.
3. Dùng [05-state-machine.md](05-state-machine.md) để code logic.
4. Dùng [08-test-and-verification-plan.md](08-test-and-verification-plan.md) để kiểm tra trước demo.
