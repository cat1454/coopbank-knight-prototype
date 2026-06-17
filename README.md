# Co-opBank KNIGHT - Hiệp Sĩ Số

Co-opBank KNIGHT là prototype mobile/PWA cho lớp bảo vệ giao dịch ngân hàng số. App mô phỏng một AI agent theo ReAct (Observe -> Reason -> Act), có thể phát hiện giao dịch bất thường, tạm khóa thẻ số, yêu cầu khách xác minh, và ghi audit trail cho từng hành động nhạy cảm.

Prototype này phục vụ demo kỹ thuật và nghiên cứu sản phẩm. Core banking, Face ID, phát hành thẻ, Fraud Ops, Claude/LLM và Web Push production đều được mô phỏng hoặc chạy ở mức demo.

## Điểm mới trên nhánh này

- Tích hợp **GuardianFlow Decision Intelligence** vào KNIGHT, giữ Co-opBank KNIGHT là brand/app chính.
- Thêm mock scoring engine 5 agents: transaction, device/session, behavioral, beneficiary, scam.
- Hỗ trợ 6 scenario demo: `low_risk`, `medium_risk`, `high_risk`, `critical_risk`, `false_positive`, `feedback_attack`.
- Tích hợp Decision Intelligence vào flow **Chuyển tiền**: user nhập giao dịch bình thường, KNIGHT tự phân mức AI `safe/watch/verify/hold/critical` và chỉ yêu cầu thêm bước khi cần.
- Giữ scenario selector, fake latency, RiskMeter, AgentConsole, ScamChecklist và ActionCenter trong chế độ demo/test qua `?demo=true`, không hiện như thao tác bắt buộc cho khách hàng.
- Chuẩn hóa risk score: GuardianFlow tính `0-100`, adapter sang KNIGHT `0-1000` để giữ policy threshold `800`.
- Thêm mock `POST /api/explain`, không gọi Claude thật.

## Luồng demo chính

KNIGHT có 3 nhánh xử lý sau khi phát hiện risk cao:

| Nhánh | Khách hàng làm gì | Kết quả |
|---|---|---|
| Gian lận | Xác nhận "Không phải tôi" + Face ID | Khóa thẻ cũ, phát hành thẻ số mới, tạo fraud case, mở recovery journey |
| Hợp lệ | Xác nhận "Đây là giao dịch của tôi" + Face ID | Mở lại thẻ, whitelist session, tăng giám sát 30 phút |
| Không phản hồi | Khách không trả lời cảnh báo | Giữ thẻ tạm khóa, escalate Fraud Ops |

Policy bắt buộc:

- Không có Face ID thì không có hành động L3.
- Timeout không được tự động terminate card.
- Không hiển thị full PAN, CVV, token thật.
- Mọi hành động nhạy cảm phải có audit event.

## Chạy local

Yêu cầu: Node.js 18+ và npm.

```bash
npm install
```

Terminal 1 - backend demo:

```bash
npm run server
```

Backend mặc định chạy ở `http://localhost:5000`.

Terminal 2 - frontend:

```bash
npm run dev
```

Vite sẽ in URL local, thường là `http://localhost:5173` hoặc port kế tiếp nếu port bận.

## URL demo nhanh

Chạy app không cần backend:

```text
http://localhost:5173/?env=test
```

Mở app và thử GuardianFlow tự phân mức trong flow chuyển tiền:

```text
http://localhost:5173/?env=test
```

Sau đó vào **Chuyển tiền**, chọn người nhận gợi ý hoặc nhập giao dịch. KNIGHT sẽ tự đánh giá và đưa giao dịch vào mức an toàn, cảnh báo, xác thực bổ sung hoặc tạm giữ.

Mở demo panel dành cho tester/presenter:

```text
http://localhost:5173/?env=test&capture=phone&shot=case&demo=true
```

Sau đó vào tab **Hộ vệ AI**, tick consent, chọn scenario và bấm **Chạy scenario**.

Một vài shot dùng để quay video:

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

Backend hiện dùng Node.js native `http`, SSE và Web Push VAPID.

Kiểm tra health:

```bash
curl http://localhost:5000/health
```

Lấy VAPID public key:

```bash
curl http://localhost:5000/api/push/public-key
```

Mock explain GuardianFlow:

```bash
curl -X POST http://localhost:5000/api/explain \
  -H "Content-Type: application/json" \
  -d "{\"reasonCodes\":[\"new_device\",\"new_recipient\"],\"riskScore\":72,\"action\":\"delay\"}"
```

Kích hoạt high-risk incident qua backend:

```bash
curl -X POST http://localhost:5000/api/incidents/high-risk \
  -H "Authorization: Bearer YOUR_SEND_PUSH_SECRET"
```

Phím tắt trong terminal backend:

- `Space`, `Enter`, `S`: kích hoạt high-risk incident.
- `R`: reset scenario.
- `Q`: thoát server.

## Cấu hình môi trường

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

## Kiểm thử

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

Lệnh hữu ích khi chỉ muốn kiểm tra phần GuardianFlow:

```bash
npx vitest run src/domain/guardianFlow.test.ts src/components/BankDashboard.guardianFlow.test.tsx server/explain.test.js
npx playwright test tests/e2e/knight-mobile.spec.ts -g "GuardianFlow"
```

Ghi chú hiện tại: `npm run test:coverage` có thể fail ngưỡng coverage global 80% vì nhiều component demo cũ chưa được cover đầy đủ. Test logic vẫn pass.

## Cấu trúc repo

```text
src/
  app/
    App.tsx
    demoEventSequences.ts
  components/
    BankDashboard.tsx
    GuardianFlowPanel.tsx
    CriticalAlertSurface.tsx
    FraudReviewScreen.tsx
    BiometricStepUp.tsx
    VirtualCardScreen.tsx
    FraudCaseSubmittedScreen.tsx
    AuditTimeline.tsx
    KnightAgentVisual.tsx
  data/
    demoScenario.ts
    bankingDemo.ts
  domain/
    guardianFlow.ts
    knightStateMachine.ts
    policy.ts
    audit.ts
    trustRecovery.ts
    types.ts
  services/
    backend.ts
    pushNotifications.ts
  styles/
    app.css
    knight-agent.css

server/
  index.js
  explain.js
  demoFlows.js

tests/e2e/
  knight-mobile.spec.ts
```

## Tài liệu

- `guardianflow-vibecode-guide.md` - blueprint gốc cho GuardianFlow mock demo.
- `docs/knight-mobile/01-product-capability.md` - capability và scope.
- `docs/knight-mobile/02-business-rules-and-guardrails.md` - policy và invariants.
- `docs/knight-mobile/05-state-machine.md` - state machine.
- `docs/knight-mobile/08-test-and-verification-plan.md` - verification plan.
- `docs/deploy-frontend-local-backend.md` - deploy frontend với backend local.

## Tech stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Vanilla CSS, CSS custom properties |
| Icons | Lucide React |
| Backend demo | Node.js native http, SSE, web-push |
| Tests | Vitest, Testing Library, Playwright |
| PWA | Web manifest, service worker, Web Push |

## Disclaimer

Prototype này không xử lý giao dịch thật, không lưu sinh trắc học, không kết nối core banking, và không thay thế Fraud Ops/Compliance. Mọi dữ liệu trong demo là mock data để trình bày hướng sản phẩm và kiểm chứng UX.
