# KNIGHT Mobile Implementation Docs

Đây là bộ tài liệu **Phase 2 / product hóa** cho prototype **Co-opBank KNIGHT - iPhone-first mobile banking security flow**.

Trong bài nộp Đề 02 hiện tại, artifact chính là:

- [knight_ai_agent_animated.html](../../knight_ai_agent_animated.html)
- [CoopBank_Hiep_Si_So_AI_Agent_Report.md](../../CoopBank_Hiep_Si_So_AI_Agent_Report.md)

Bộ docs này dùng khi demo sân khấu hóa đã được duyệt và nhóm muốn chuyển ý tưởng thành mobile web/PWA thật. Khi có conflict, thứ tự ưu tiên là:

1. Nội dung Đề 02 và deck/demo hiện tại.
2. `02-business-rules-and-guardrails.md`.
3. `05-state-machine.md`.
4. `06-data-and-api-contracts.md`.
5. `03-user-journeys-and-screens.md`.
6. `04-mobile-ux-spec.md`.
7. Report gốc.

## Thứ tự đọc

| File | Người đọc chính | Mục đích |
|---|---|---|
| [01-product-capability.md](01-product-capability.md) | Product, Tech Lead | Chốt capability, phạm vi, non-goal, open question |
| [02-business-rules-and-guardrails.md](02-business-rules-and-guardrails.md) | Business, Risk, Compliance, Dev | Luật nghiệp vụ, quyền hạn agent, KPI |
| [03-user-journeys-and-screens.md](03-user-journeys-and-screens.md) | Product, UI, Frontend | Hành trình người dùng và màn hình bắt buộc |
| [04-mobile-ux-spec.md](04-mobile-ux-spec.md) | UI, Frontend | Quy chuẩn iPhone UI, layout, copy, motion |
| [05-state-machine.md](05-state-machine.md) | Frontend, Backend, QA | State machine, event, transition, invariant |
| [06-data-and-api-contracts.md](06-data-and-api-contracts.md) | Frontend, Backend | Mock data model, API contract, audit payload |
| [07-security-and-compliance.md](07-security-and-compliance.md) | Security, Backend, Frontend | Ranh giới bảo mật, dữ liệu nhạy cảm, threat model |
| [08-test-and-verification-plan.md](08-test-and-verification-plan.md) | QA, Dev | Test journey, viewport QA, Definition of Done |
| [09-implementation-backlog.md](09-implementation-backlog.md) | PM, Dev | Backlog theo phase để product hóa |
| [10-tech-stack-and-foundation.md](10-tech-stack-and-foundation.md) | Tech Lead, Dev | Chốt tech stack, ranh giới no-code, ready-to-code gate |

## Quyết định đã chốt

- Hướng chính của bài nộp hiện tại: presentation/demo Đề 02.
- Mobile web/PWA là bước sau, không phải artifact chính của lần nộp này.
- Khi product hóa Phase 2, stack đã chốt là React + TypeScript + Vite, CSS thuần, mock services, PWA static shell.
- Luồng mobile vẫn giữ guardrail: Critical Alert -> Fraud Review -> Face ID -> New Virtual Card -> Recovery Offer -> Audit Timeline.
- Dữ liệu dùng mock. Không gọi banking API thật.
- Agent chỉ được tự động làm hành động reversible. Hành động irreversible cần xác nhận khách hoặc nhân sự.
