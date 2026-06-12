# Co-opBank KNIGHT Mobile Prototype

Prototype cho đề tài Co-opBank "Hiệp sĩ số": một AI Agent theo mô hình ReAct giám sát giao dịch thẻ số, đánh giá rủi ro thời gian thực, tạm khóa thẻ khi risk cao, đánh thức khách hàng bằng Web Push, và giữ ranh giới an toàn trước khi thực hiện các hành động không thể đảo ngược.

Ứng dụng này là demo kỹ thuật và trải nghiệm. Việc khóa thẻ, Face ID, thẻ mới và Fraud Ops đều là mô phỏng trong prototype; Web Push hoạt động thật thông qua chuẩn Web Push API.

## Tính Năng Chính

- Mobile banking/PWA demo với màn đăng nhập, dashboard, tab bảo vệ AI và luồng cảnh báo khẩn cấp.
- State machine rõ ràng cho ba nhánh: xác nhận gian lận, xác nhận giao dịch hợp lệ, và không phản hồi (timeout).
- High-risk escalation: Web Push ngay lập tức, nếu khách hàng không phản hồi thì hồ sơ tự động chuyển tiếp sang hàng chờ Fraud Ops để nhân viên hỗ trợ kiểm tra và thẻ số tiếp tục được giữ tạm khóa.
- Audit timeline cho các hành động nhạy cảm: đánh giá rủi ro, tạm khóa thẻ, đẩy thông báo push, Face ID xác thực, khóa vĩnh viễn thẻ cũ, phát hành thẻ mới và chuyển tiếp Fraud Ops.
- Playwright viewport checks cho iPhone/mobile và Vitest cho state machine, UI và server.

## Luồng Demo

1. Risk score đạt 847/1000 với các tín hiệu bất thường.
2. KNIGHT tạm khóa thẻ số theo policy L2 vì đây là hành động có thể đảo ngược.
3. KNIGHT gửi Web Push khẩn cấp đến PWA.
4. Nếu khách mở app và chọn "Không phải tôi":
   - App yêu cầu Face ID.
   - Sau Face ID thành công, thẻ cũ mới bị khóa vĩnh viễn.
   - Thẻ số mới được phát hành và case Fraud Ops được tạo.
5. Nếu khách chọn "Đây là giao dịch của tôi":
   - App yêu cầu Face ID.
   - Thẻ được mở lại.
   - Session được whitelist tạm thời và tăng giám sát 30 phút.
6. Nếu khách không phản hồi:
   - Hệ thống ghi nhận hết thời gian chờ phản hồi từ khách hàng.
   - Chuyển tiếp hồ sơ giao dịch sang hàng chờ Fraud Ops để xử lý thủ công.
   - Thẻ số vẫn tiếp tục được giữ ở trạng thái tạm khóa để bảo vệ tài sản.

## Cài Đặt

Yêu cầu:

- Node.js 18 trở lên
- npm

```bash
npm install
```

## Chạy Local

Terminal 1, backend:

```bash
npm run server
```

Terminal backend hỗ trợ:

- `Space`, `Enter`, hoặc `S`: kích hoạt high-risk incident.
- `R`: reset app state.
- `Q`: thoát backend.

Terminal 2, frontend:

```bash
npm run dev
```

Mở `http://localhost:5173/`. Để test flow không cần backend thật, thêm query `?env=test`.

## Cấu Hình Env

Copy `.env.example` thành `.env` nếu cần chạy backend/PWA với cấu hình riêng.

Các biến chính:

```bash
VITE_BACKEND_URL=https://knight-api.danangtoiiu.live
PORT=5000
ALLOWED_ORIGINS=https://knight.danangtoiiu.live,http://localhost:5173,http://127.0.0.1:5173
SEND_PUSH_SECRET=replace-with-a-long-random-secret
```

Web Push:

```bash
VAPID_PUBLIC_KEY=replace-with-generated-public-key
VAPID_PRIVATE_KEY=replace-with-generated-private-key
VAPID_SUBJECT=mailto:you@example.com
PUSH_SUBSCRIPTIONS_FILE=server/push-subscriptions.json
```

## API Backend

High-risk chain đầy đủ:

```bash
curl -X POST "https://knight-api.danangtoiiu.live/api/incidents/high-risk" \
  -H "Authorization: Bearer PASTE_LONG_RANDOM_SECRET"
```

Push-only:

```bash
curl -X POST "https://knight-api.danangtoiiu.live/api/push/send" \
  -H "Authorization: Bearer PASTE_LONG_RANDOM_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"CẢNH BÁO KHẨN\",\"message\":\"Phát hiện giao dịch bất thường.\",\"url\":\"/?alert=1\"}"
```

## Policy Levels

| Level | Vai trò | Hành động chính |
| --- | --- | --- |
| L0 | Observe | Theo dõi giao dịch, tính risk score, ghi audit. |
| L1 | Notify | Gửi Web Push cảnh báo. |
| L2 | Protect | Tạm khóa thẻ số, hành động reversible. |
| L3 | Customer-approved action | Chỉ terminate card/issue card sau xác nhận của khách và Face ID. |
| L4 | Human review | Fraud Ops/Compliance xử lý chargeback, hoàn tiền, khóa tài khoản rộng hơn. |

Các invariant quan trọng:

- Timeout không bao giờ tự terminate card.
- Không có xác nhận khách hàng và Face ID thì không issue thẻ mới.
- Không lưu/hiển thị full PAN hoặc CVV.

## Kiểm Thử

```bash
npm test
npm run build
npm run test:e2e
npm audit
```

Lint toàn repo:

```bash
npm run lint
```

Lưu ý: hiện full lint có thể bị chặn bởi nợ cũ ở một số component không thuộc slice telephony. Các file thay đổi trong slice này đã được kiểm bằng focused ESLint trong quá trình phát triển.

## Cấu Trúc Repo

```text
coopbank-knight-prototype/
├── docs/                         # Tài liệu business rules, state machine, deployment
├── server/
│   └── index.js                  # Backend SSE, Web Push, incident orchestration
├── src/
│   ├── app/                      # App shell, demo sequencing, integration tests
│   ├── components/               # Mobile screens and AI visualization
│   ├── data/                     # Demo customer/card/risk/case data
│   ├── domain/                   # State machine, policy guards, audit helpers
│   ├── services/                 # Backend and Web Push client helpers
│   └── styles/                   # App CSS and design tokens
├── tests/e2e/                    # Playwright tests across mobile viewports
├── package.json
└── vite.config.ts
```

## Tài Liệu Liên Quan

- Local frontend + backend + iPhone PWA: [`docs/deploy-frontend-local-backend.md`](docs/deploy-frontend-local-backend.md)
- Product capability: [`docs/knight-mobile/01-product-capability.md`](docs/knight-mobile/01-product-capability.md)
- Business rules: [`docs/knight-mobile/02-business-rules-and-guardrails.md`](docs/knight-mobile/02-business-rules-and-guardrails.md)
- State machine: [`docs/knight-mobile/05-state-machine.md`](docs/knight-mobile/05-state-machine.md)
- Test plan: [`docs/knight-mobile/08-test-and-verification-plan.md`](docs/knight-mobile/08-test-and-verification-plan.md)
