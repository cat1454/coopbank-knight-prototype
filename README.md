# CoopBank KNIGHT Prototype

Prototype cho **Đề 02: Ngân hàng Co-opBank - "Hiệp sĩ số" toàn năng**.

## Source Of Truth

1. Nội dung Đề 02 do người dùng cung cấp: sân khấu hóa AI Agent ReAct cho bảo mật và cá nhân hóa thẻ ngân hàng.
2. [CoopBank_Hiep_Si_So_AI_Agent_Report.md](CoopBank_Hiep_Si_So_AI_Agent_Report.md): nghiên cứu, kịch bản, guardrail và thông điệp.
3. [knight_ai_agent_animated.html](knight_ai_agent_animated.html): artifact chính để thuyết trình/demo.
4. [docs/knight-mobile](docs/knight-mobile/README.md): Phase 2 nếu cần product hóa thành mobile/PWA thật.

## Current Deliverable

Mở `knight_ai_agent_animated.html` trong browser để trình chiếu deck và live demo KNIGHT.

## Phase 2 Mobile/PWA Prototype

Mobile/PWA implementation đã được scaffold sau khi ready-to-code gate được chấp nhận:

```bash
npm install
npm run dev
npm test
npm run test:e2e
```

App nằm trong `src/` và bám theo `docs/knight-mobile/`: React + TypeScript + Vite, CSS thuần, typed mock services, PWA shell, không backend ngân hàng thật.

## Phase 2 Foundation

Nếu product hóa thành mobile web/PWA, đọc `docs/knight-mobile/10-tech-stack-and-foundation.md` trước khi code. Hướng đã chốt: React + TypeScript + Vite, CSS thuần, typed mock services, PWA shell, không backend ngân hàng thật.
