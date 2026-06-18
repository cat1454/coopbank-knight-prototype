# Co-opBank KNIGHT

Co-opBank KNIGHT là prototype mobile/PWA mô phỏng một lớp bảo vệ giao dịch ngân hàng số. Ứng dụng cho thấy cách một AI agent có thể quan sát tín hiệu rủi ro, suy luận mức đe dọa, yêu cầu xác minh bổ sung, khóa/tạm giữ giao dịch nhạy cảm và ghi lại audit trail cho từng quyết định.

ThreatLens là decision intelligence engine bên trong KNIGHT. ThreatLens chấm điểm rủi ro giao dịch theo thang `0-100`, sau đó adapter chuyển sang policy score của KNIGHT để giữ các ngưỡng xử lý hiện có.

Prototype này chỉ phục vụ demo kỹ thuật và nghiên cứu sản phẩm. Core banking, Face ID, phát hành thẻ, Fraud Ops, LLM và Web Push production đều đang được mock hoặc chạy ở mức demo.

## Điểm Chính

- KNIGHT vẫn là app/brand chính; ThreatLens là lớp AI đánh giá rủi ro giao dịch.
- ThreatLens dùng 5 nhóm agent mô phỏng: transaction, device/session, behavioral, beneficiary và scam.
- Flow chuyển tiền tự phân mức AI: `safe`, `watch`, `verify`, `hold`, `critical`.
- Các bước nhạy cảm như xác minh Face ID, checklist chống lừa đảo, tạm giữ giao dịch và fraud review đều có audit event.
- Demo panel cho tester/presenter được bật bằng `?demo=true`; luồng khách hàng bình thường không cần thao tác với scenario selector.
- Backend demo có native HTTP server, SSE, Web Push mock và endpoint `POST /api/explain`.

## Luồng Demo

KNIGHT có 3 hướng xử lý chính sau khi phát hiện rủi ro cao:

| Nhánh | Khách hàng làm gì | Kết quả |
| --- | --- | --- |
| Gian lận | Chọn "Không phải tôi" và xác minh Face ID | Khóa thẻ cũ, phát hành thẻ số mới, tạo fraud case và mở recovery journey |
| Hợp lệ | Chọn "Đây là giao dịch của tôi" và xác minh Face ID | Mở lại thẻ, whitelist session và tăng giám sát tạm thời |
| Không phản hồi | Không trả lời cảnh báo | Giữ trạng thái tạm khóa và escalate Fraud Ops |

Guardrails:

- Không có Face ID thì không thực hiện hành động L3.
- Timeout không tự động terminate card.
- Không hiển thị full PAN, CVV hoặc token thật.
- Mọi hành động nhạy cảm phải có audit event.

## Chạy Local

Yêu cầu: Node.js 18+ và npm.

```bash
npm install
```

Chạy backend demo:

```bash
npm run server
```

Backend mặc định chạy tại `http://localhost:5000`.

Chạy frontend:

```bash
npm run dev
```

Vite sẽ in URL local, thường là `http://localhost:5173` hoặc port kế tiếp nếu port đang bận.

## URL Demo Nhanh

Mở app ở chế độ test:

```text
http://localhost:5173/?env=test
```

Thử ThreatLens trong flow chuyển tiền:

1. Mở URL test.
2. Vào tab **Chuyển tiền**.
3. Chọn người nhận gợi ý hoặc nhập giao dịch mới.
4. KNIGHT sẽ tự đánh giá và đưa giao dịch vào mức an toàn, cảnh báo, xác thực bổ sung hoặc tạm giữ.

Mở demo panel cho presenter/tester:

```text
http://localhost:5173/?env=test&capture=phone&shot=case&demo=true
```

Sau đó vào tab **Hộ vệ AI**, bật consent, chọn scenario và bấm **Chạy scenario**.

Một số shot dùng để quay demo:

```text
?env=test&capture=phone&shot=reason
?env=test&capture=phone&shot=fraud-review
?env=test&capture=phone&shot=faceid
?env=test&capture=phone&shot=card
?env=test&capture=phone&shot=case
?env=test&capture=phone&shot=assessment
?env=test&capture=agent&shot=recovery
?env=test&capture=phone&shot=case&demo=true
```

## Backend API

Health check:

```bash
curl http://localhost:5000/health
```

Lấy VAPID public key:

```bash
curl http://localhost:5000/api/push/public-key
```

Mock explain cho ThreatLens:

```bash
curl -X POST http://localhost:5000/api/explain \
  -H "Content-Type: application/json" \
  -d "{\"reasonCodes\":[\"new_device\",\"new_recipient\"],\"riskScore\":72,\"action\":\"delay\"}"
```

Kích hoạt high-risk incident:

```bash
curl -X POST http://localhost:5000/api/incidents/high-risk \
  -H "Authorization: Bearer YOUR_SEND_PUSH_SECRET"
```

Phím tắt trong terminal backend:

- `Space`, `Enter`, `S`: kích hoạt high-risk incident.
- `R`: reset scenario.
- `Q`: thoát server.

## Cấu Hình

Copy `.env.example` thành `.env` nếu cần backend/push:

```bash
VITE_BACKEND_URL=http://localhost:5000
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SEND_PUSH_SECRET=replace-with-a-long-random-secret
VAPID_PUBLIC_KEY=replace-with-generated-public-key
VAPID_PRIVATE_KEY=replace-with-generated-private-key
VAPID_SUBJECT=mailto:you@example.com
PUSH_SUBSCRIPTIONS_FILE=server/push-subscriptions.json
```

## Kiểm Thử

Chạy bộ kiểm tra chính:

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Chỉ kiểm tra phần ThreatLens:

```bash
npx vitest run src/domain/threat-lens/scoring/threatLens.test.ts src/widgets/bank-dashboard/BankDashboard.threatLens.test.tsx server/explain/explain.test.js
npx playwright test tests/e2e/knight-mobile.spec.ts -g "ThreatLens"
```

Ghi chú: `npm run test:coverage` có thể fail ngưỡng global 80% vì một số component demo chưa có coverage đầy đủ. Test logic chính vẫn được cover bằng Vitest và Playwright.

## Cấu Trúc Repo

```text
src/
  app/                         App shell, query params, demo launch state
  domain/
    threatLens.ts              Public export cho ThreatLens
    threat-lens/               Scoring engine, scenarios, adapters
    knight/                    KNIGHT state machine, policy, audit, digital twin
  features/
    threatlens-decision/       ThreatLens panel, console, checklist, consent UI
    biometric-step-up/         Face ID step-up mock
    card-protection/           Card lock/reissue flows
    fraud-review/              Fraud review surface
    recovery-support/          Post-incident recovery screens
    risk-alert/                Critical alert surfaces
  widgets/
    bank-dashboard/            Mobile banking dashboard and transfer flow
    knight-agent-visual/       KNIGHT visual agent surface
    audit-timeline/            Audit trail UI
  shared/                      API clients, UI primitives, styles

server/
  app.js                       Native HTTP app
  routes/                      API routes
  explain/                     Mock explain endpoint
  services/                    Incident, push, SSE services
  twin/                        Digital twin demo store/routes

tests/e2e/
  knight-mobile.spec.ts        Mobile/PWA journey coverage
```

## Tài Liệu Liên Quan

- `threatlens-vibecode-guide.md` - blueprint gốc cho ThreatLens mock demo.
- `threatlens-knight-refactor-plan.md` - refactor plan cho việc tách ThreatLens khỏi KNIGHT.
- `docs/knight-mobile/01-product-capability.md` - capability và scope.
- `docs/knight-mobile/02-business-rules-and-guardrails.md` - policy và invariants.
- `docs/knight-mobile/05-state-machine.md` - state machine.
- `docs/knight-mobile/06-data-and-api-contracts.md` - data/API contracts.
- `docs/knight-mobile/08-test-and-verification-plan.md` - verification plan.
- `docs/deploy-frontend-local-backend.md` - deploy frontend với backend local.

## Tech Stack

| Layer | Công nghệ |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Vanilla CSS, CSS custom properties |
| Icons | Lucide React |
| Backend demo | Node.js native HTTP, SSE, web-push |
| Tests | Vitest, Testing Library, Playwright |
| PWA | Web manifest, service worker, Web Push |

## Disclaimer

Prototype này không xử lý giao dịch thật, không lưu sinh trắc học, không kết nối core banking và không thay thế Fraud Ops/Compliance. Mọi dữ liệu trong demo là mock data để trình bày hướng sản phẩm và kiểm chứng UX.
