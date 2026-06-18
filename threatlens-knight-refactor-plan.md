# Kế hoạch phân rã repo `coopbank-knight-prototype`

## Nhánh áp dụng

Tài liệu này áp dụng cho nhánh:

```txt
feature/threatlens-knight-integration
```

Không áp dụng cho `main`.

---

## 1. Bối cảnh hiện tại

Nhánh `feature/threatlens-knight-integration` đã tích hợp **ThreatLens Decision Intelligence** vào KNIGHT.

Trọng tâm của nhánh này gồm:

- ThreatLens chấm điểm rủi ro giao dịch.
- Mock scoring engine gồm 5 agent.
- Có nhiều scenario demo.
- Flow chuyển tiền tự phân mức AI:
  - `safe`
  - `watch`
  - `verify`
  - `hold`
  - `critical`
- KNIGHT tiếp nhận quyết định rủi ro để thực hiện bảo vệ khách hàng.
- Sau khi bảo vệ tài khoản xong mới hiển thị recovery/support package.

Vì vậy, việc phân rã repo không nên chỉ xoay quanh `App.css` hay `components`, mà phải phân rã theo **2 lõi nghiệp vụ chính**:

```txt
ThreatLens = quyết định rủi ro
KNIGHT       = hành động bảo vệ + audit + recovery
```

---

## 2. Vấn đề hiện tại

### 2.1. `src/components` đang quá phẳng

Hiện tại nhiều component có vai trò khác nhau đang nằm chung trong `src/components`, ví dụ:

```txt
BankDashboard.tsx
ThreatLensPanel.tsx
CriticalAlertSurface.tsx
FraudReviewScreen.tsx
BiometricStepUp.tsx
VirtualCardScreen.tsx
AuditTimeline.tsx
KnightAgentVisual.tsx
```

Vấn đề:

- Component nhỏ, màn hình nghiệp vụ, widget demo đang bị trộn chung.
- AI Agent khó biết file nào là business feature, file nào là UI dùng chung.
- Dễ sửa nhầm flow bảo mật khi chỉ muốn chỉnh giao diện.
- Khó mở rộng thêm scenario mới.

---

### 2.2. `BankDashboard.tsx` đang ôm quá nhiều trách nhiệm

`BankDashboard.tsx` không chỉ là dashboard. Nó đang có nhiều phần:

- UI mobile banking.
- Flow chuyển tiền.
- ThreatLens demo.
- Scenario selector.
- Risk meter.
- Agent console.
- Action state.
- Logic tab và form.

Đây là file nên tách sớm nhất.

---

### 2.3. `src/domain` đang để phẳng

Hiện tại domain đang có dạng:

```txt
src/domain/
  audit.ts
  format.ts
  threatLens.ts
  knightStateMachine.ts
  mockKnightServices.ts
  policy.ts
  trustRecovery.ts
  types.ts
```

Vấn đề:

- ThreatLens và KNIGHT đang nằm chung tầng.
- Khó phân biệt đâu là logic chấm điểm rủi ro, đâu là logic hành động bảo vệ.
- Adapter chuyển điểm ThreatLens sang KNIGHT chưa có vùng riêng rõ ràng.
- Nếu sửa policy hoặc risk score, dễ ảnh hưởng dây chuyền.

---

### 2.4. `App.tsx` đang có quá nhiều orchestration

`App.tsx` không nên giữ toàn bộ:

- Demo sequence.
- SSE integration.
- Alarm control.
- Capture mode.
- Scenario state.
- Chọn màn hình hiển thị.
- Điều phối KNIGHT flow.

`App.tsx` chỉ nên là app shell, còn logic điều phối nên đưa vào hook riêng.

---

### 2.5. CSS vẫn còn thiên hướng global

Hiện có các file như:

```txt
src/styles/
  app.css
  knight-agent.css
  cyber-attack.css
  tokens.css
```

Vấn đề:

- `app.css` dễ phình to.
- Style của màn này có thể ảnh hưởng màn khác.
- Khó xóa CSS chết.
- Khó để AI Agent refactor an toàn.

---

### 2.6. Backend `server/index.js` đang gom quá nhiều việc

Backend hiện có ít file:

```txt
server/
  demoFlows.js
  demoFlows.test.js
  explain.js
  explain.test.js
  index.js
```

`server/index.js` không nên ôm chung:

- HTTP server.
- CORS.
- SSE.
- Web Push.
- Incident orchestration.
- Keyboard demo controls.
- API explain.
- Demo flow trigger.

---

## 3. Kiến trúc đề xuất

Cấu trúc nên hướng đến:

```txt
src/
  app/
  pages/
  widgets/
  features/
  entities/
  domain/
    threat-lens/
    knight/
    shared/
  shared/
    ui/
    lib/
    api/
    styles/
```

Ý nghĩa từng tầng:

```txt
app       = khởi tạo app, providers, orchestration hooks
pages     = màn hình cấp trang
widgets   = khối UI lớn ghép nhiều feature
features  = chức năng nghiệp vụ người dùng thao tác
entities  = model nghiệp vụ ổn định như customer, card, transaction, incident
domain    = luật nghiệp vụ lõi, state machine, risk scoring, policy
shared    = UI/lib/api/style dùng chung, không biết nghiệp vụ
```

---

## 4. Phân rã `domain`

### 4.1. Cấu trúc đề xuất

```txt
src/domain/
  threat-lens/
    scoring/
      threatLens.ts
      threatLens.test.ts
    explain/
      explainMapper.ts
    adapters/
      threatLensToKnightRisk.ts
    types.ts
    index.ts

  knight/
    state-machine/
      knightStateMachine.ts
      knightStateMachine.test.ts
    policy/
      policy.ts
    audit/
      audit.ts
      audit.test.ts
    recovery/
      trustRecovery.ts
      trustRecovery.test.ts
    services/
      mockKnightServices.ts
    types.ts
    index.ts

  shared/
    format.ts
```

---

### 4.2. Lý do tách `threat-lens`

ThreatLens là phần **ra quyết định rủi ro**.

Nó nên chứa:

- Risk score `0-100`.
- 5 agent phân tích.
- Explainability.
- Decision level:
  - `safe`
  - `watch`
  - `verify`
  - `hold`
  - `critical`
- Mapping kết quả phân tích sang UI demo.

---

### 4.3. Lý do tách `knight`

KNIGHT là phần **hành động bảo vệ khách hàng**.

Nó nên chứa:

- State machine.
- Policy threshold.
- Audit trail.
- Trust recovery.
- Mock service phục vụ demo.
- Guardrail bảo mật.

Các nguyên tắc KNIGHT cần giữ:

- Timeout không được xem là đồng ý.
- Hành động rủi ro cao phải có xác nhận.
- Recovery package chỉ hiển thị sau khi tài khoản đã được bảo vệ.
- Không đưa cashback/ưu đãi trước khi xử lý rủi ro.
- Audit phải giải thích được vì sao hệ thống hành động.

---

### 4.4. Adapter ThreatLens sang KNIGHT

Nếu ThreatLens dùng risk score `0-100`, còn KNIGHT policy dùng thang `0-1000`, thì phần chuyển đổi nên có file riêng:

```txt
src/domain/threat-lens/adapters/threatLensToKnightRisk.ts
```

Không nên để logic này trong:

```txt
BankDashboard.tsx
App.tsx
ThreatLensPanel.tsx
```

Vì đó là business mapping, không phải UI logic.

---

## 5. Phân rã `BankDashboard.tsx`

### 5.1. Cấu trúc đề xuất

```txt
src/widgets/bank-dashboard/
  BankDashboard.tsx
  BankDashboard.module.css

  ui/
    DashboardHomeTab.tsx
    TransferTab.tsx
    TransactionHistoryTab.tsx
    KnightGuardTab.tsx
    DashboardBottomNav.tsx
    AccountBalanceCard.tsx
    DigitalCardPreview.tsx

  model/
    useDashboardTabs.ts
    useTransferForm.ts
    useThreatLensDecision.ts
```

---

### 5.2. Trách nhiệm từng phần

#### `BankDashboard.tsx`

Chỉ nên làm nhiệm vụ lắp dashboard:

```txt
- nhận props từ app
- render tab hiện tại
- render bottom navigation
- truyền callback xuống feature
```

Không nên chứa toàn bộ logic transfer hoặc ThreatLens demo.

---

#### `DashboardHomeTab.tsx`

Chứa phần trang chủ ngân hàng:

```txt
- số dư
- thẻ
- giao dịch gần đây
- shortcut dịch vụ
```

---

#### `TransferTab.tsx`

Chứa flow chuyển tiền:

```txt
- form người nhận
- số tiền
- nội dung chuyển khoản
- xác nhận
- trạng thái processing/success
```

Logic form nên đưa vào:

```txt
model/useTransferForm.ts
```

---

#### `KnightGuardTab.tsx`

Chứa phần bảo vệ tài khoản:

```txt
- trạng thái bảo vệ
- card status
- cảnh báo gần đây
- cài đặt bảo mật
```

---

#### `useThreatLensDecision.ts`

Hook này chỉ nên bridge UI dashboard với ThreatLens decision:

```txt
- nhận transaction draft
- gọi scoring
- trả về decision level
- trả về reason/explanation
```

Không nên tự quyết định hành động KNIGHT ở đây.

---

## 6. Tách ThreatLens demo thành feature riêng

### 6.1. Cấu trúc đề xuất

```txt
src/features/threatlens-decision/
  ui/
    RiskMeter.tsx
    AgentConsole.tsx
    ScamChecklist.tsx
    ActionCenter.tsx
    ScenarioSelector.tsx

  model/
    useThreatLensScenario.ts
    decisionLevel.ts

  lib/
    mapRiskToUiState.ts
```

---

### 6.2. Quy tắc quan trọng

Các UI sau chỉ nên phục vụ demo/test mode:

```txt
RiskMeter
AgentConsole
ScamChecklist
ActionCenter
ScenarioSelector
```

Không nên để các UI này lẫn vào flow khách hàng bình thường.

Nếu cần hiển thị demo, dùng điều kiện:

```txt
?demo=true
```

Hoặc state tương đương từ app.

---

## 7. Tách `components` thành `features`, `widgets`, `shared`

### 7.1. `shared/ui`

Các component dùng lại, không biết nghiệp vụ:

```txt
src/shared/ui/
  primary-button/
    PrimaryButton.tsx
  status-pill/
    StatusPill.tsx
  knight-logo-mini/
    KnightLogoMini.tsx
    KnightLogoMini.test.tsx
```

Move từ:

```txt
PrimaryButton.tsx
StatusPill.tsx
KnightLogoMini.tsx
```

---

### 7.2. `features/risk-alert`

```txt
src/features/risk-alert/
  ui/
    CriticalAlertSurface.tsx
    UnlockedCriticalAlertPopup.tsx
  model/
    alertActions.ts
```

---

### 7.3. `features/fraud-review`

```txt
src/features/fraud-review/
  ui/
    FraudReviewScreen.tsx
  model/
    fraudReviewEvents.ts
```

---

### 7.4. `features/biometric-step-up`

```txt
src/features/biometric-step-up/
  ui/
    BiometricStepUp.tsx
  model/
    biometricEvents.ts
```

---

### 7.5. `features/card-protection`

```txt
src/features/card-protection/
  ui/
    VirtualCardScreen.tsx
    LegitimateResolutionScreen.tsx
    TimeoutEscalationScreen.tsx
```

---

### 7.6. `features/recovery-support`

```txt
src/features/recovery-support/
  ui/
    NextMorningRecoveryScreen.tsx
    PostIncidentBehaviorScreen.tsx
    TrustRecoveryAssessmentScreen.tsx
    ReassurancePackageScreen.tsx
    FraudCaseSubmittedScreen.tsx
```

---

### 7.7. `widgets`

Các khối lớn ghép nhiều feature:

```txt
src/widgets/
  bank-dashboard/
  audit-timeline/
  knight-agent-visual/
  cyber-attack-dashboard/
  threatlens-panel/
  demo-controls/
```

Nguyên tắc:

```txt
features = màn/flow xử lý nghiệp vụ
widgets  = khối lớn để trình diễn hoặc ghép nhiều feature
shared   = thành phần dùng lại, không biết nghiệp vụ
```

---

## 8. Tách `App.tsx`

### 8.1. Cấu trúc đề xuất

```txt
src/app/
  App.tsx
  App.test.tsx
  demoEventSequences.ts

  model/
    useKnightScenario.ts
    useBackendSse.ts
    useAlarmController.ts
    useCaptureMode.ts
    useDemoShot.ts

  providers/
    AppProviders.tsx
```

---

### 8.2. Trách nhiệm từng hook

#### `useKnightScenario.ts`

```txt
- quản lý scenario state
- applyEvents
- applyEventsSequentially
- reset scenario
- start scenario
- xác định visible screen
```

#### `useBackendSse.ts`

```txt
- connect tới backend SSE
- nhận trigger từ backend
- report state về backend nếu cần
```

#### `useAlarmController.ts`

```txt
- bật/tắt âm thanh cảnh báo
- xử lý giới hạn autoplay/iOS gesture
```

#### `useCaptureMode.ts`

```txt
- đọc query params
- xác định mode quay demo
- phone / agent / split / cyber-attack
```

#### `useDemoShot.ts`

```txt
- điều khiển demo shot
- phục vụ screenshot/video capture
```

---

### 8.3. Mục tiêu sau khi tách

`App.tsx` chỉ nên còn vai trò app shell:

```tsx
export function App() {
  const scenario = useKnightScenario();
  const capture = useCaptureMode();

  useBackendSse(scenario);
  useAlarmController(scenario);

  return <AppShell scenario={scenario} capture={capture} />;
}
```

---

## 9. Phân rã CSS

### 9.1. Cấu trúc hiện tại nên chuyển đổi

Từ:

```txt
src/styles/
  app.css
  knight-agent.css
  cyber-attack.css
  tokens.css
```

Thành:

```txt
src/shared/styles/
  tokens.css
  globals.css
  animations.css
  risk-theme.css
  banking-theme.css
```

---

### 9.2. CSS riêng component

CSS riêng nên đặt cạnh component:

```txt
src/widgets/bank-dashboard/BankDashboard.module.css
src/features/risk-alert/ui/CriticalAlertSurface.module.css
src/features/threatlens-decision/ui/RiskMeter.module.css
src/widgets/knight-agent-visual/KnightAgentVisual.module.css
```

---

### 9.3. Nguyên tắc CSS

```txt
shared/styles = biến màu, reset, typography, animation dùng chung
module.css    = style riêng của component
app.css       = không nhét thêm CSS mới
```

Không dùng class global quá chung như:

```css
.card {}
.title {}
.table {}
.form {}
.btn {}
.container {}
```

Nếu dùng CSS Modules thì có thể đặt ngắn:

```css
.card {}
.title {}
.table {}
```

Vì class đã được scope theo file.

---

## 10. Phân rã backend

### 10.1. Cấu trúc đề xuất

```txt
server/
  index.js
  app.js

  config/
    env.js
    cors.js
    vapid.js

  routes/
    health.routes.js
    push.routes.js
    incidents.routes.js
    explain.routes.js
    sse.routes.js

  controllers/
    push.controller.js
    incidents.controller.js
    explain.controller.js

  services/
    push.service.js
    sse.service.js
    incident.service.js
    keyboardDemo.service.js

  flows/
    demoFlows.js
    highRiskIncident.flow.js
    recovery.flow.js

  explain/
    explain.js
    explain.test.js

  tests/
    demoFlows.test.js
```

---

### 10.2. Thứ cần tách trước ở backend

```txt
1. explain.js giữ riêng
2. demoFlows.js giữ riêng
3. SSE tách khỏi index.js
4. push notification tách khỏi index.js
5. keyboard controls tách khỏi core server
```

---

### 10.3. Nguyên tắc backend

```txt
index.js      = chỉ start server
app.js        = cấu hình app/server chính
routes        = định nghĩa endpoint
controllers   = parse request/response
services      = xử lý nghiệp vụ/kỹ thuật
flows         = kịch bản demo
storage       = nơi lưu subscriptions/session/demo state nếu có
```

Keyboard demo controls không nên nằm chung với core incident service.

---

## 11. Thứ tự refactor an toàn

Không nên refactor một phát toàn bộ repo.

Làm theo thứ tự sau:

```txt
Bước 1: Move shared UI
- PrimaryButton
- StatusPill
- KnightLogoMini

Bước 2: Tách domain
- threat-lens
- knight
- shared format

Bước 3: Tách BankDashboard
- HomeTab
- TransferTab
- KnightGuardTab
- BottomNav
- ThreatLens demo panel

Bước 4: Tách ThreatLens UI
- RiskMeter
- AgentConsole
- ScamChecklist
- ActionCenter
- ScenarioSelector

Bước 5: Tách incident/recovery features
- risk-alert
- fraud-review
- biometric-step-up
- card-protection
- recovery-support

Bước 6: Tách App orchestration
- useKnightScenario
- useBackendSse
- useAlarmController
- useCaptureMode

Bước 7: Tách CSS
- shared/styles
- module.css cạnh component

Bước 8: Tách backend index.js
- routes
- controllers
- services
- flows
```

Sau mỗi bước chạy:

```bash
npm run lint
npm test
npm run build
```

Nếu đụng flow E2E, chạy thêm:

```bash
npm run test:e2e
```

---

## 12. Những việc không nên làm

Không nên:

```txt
- Không rewrite toàn bộ repo một lần.
- Không đổi UI và business logic cùng lúc.
- Không đưa state machine vào React component.
- Không tách quá nhỏ kiểu mỗi div một component.
- Không thêm Redux/Zustand nếu chưa có nhu cầu rõ.
- Không đổi policy threshold khi đang refactor folder.
- Không đổi test selector khi chưa update toàn bộ test.
- Không xóa app.css hàng loạt nếu chưa map class.
- Không để ThreatLens demo UI xuất hiện trong customer flow bình thường.
```

---

## 13. Prompt cho AI Agent

Dùng prompt sau để yêu cầu AI Agent refactor repo:

```txt
You are working on branch feature/threatlens-knight-integration.

Goal:
Refactor the repository structure safely without changing KNIGHT or ThreatLens behavior.

Important context:
- ThreatLens Decision Intelligence is integrated into KNIGHT.
- ThreatLens risk score is 0-100 and adapted to KNIGHT 0-1000.
- Demo mode exposes RiskMeter, AgentConsole, ScamChecklist, ActionCenter, and ScenarioSelector only through ?demo=true.
- Do not change business behavior, policy thresholds, demo shots, or test selectors unless all usages are updated.

Architecture target:
src/
  app/
  pages/
  widgets/
  features/
  entities/
  domain/
    threat-lens/
    knight/
  shared/
    ui/
    lib/
    api/
    styles/

Refactor order:
1. Move shared UI components:
   - PrimaryButton
   - StatusPill
   - KnightLogoMini

2. Split src/domain into:
   - domain/threat-lens
   - domain/knight
   - domain/shared

3. Split BankDashboard.tsx into:
   - widgets/bank-dashboard
   - features/transfer-money
   - features/threatlens-decision

4. Move incident and recovery screens into feature slices:
   - risk-alert
   - fraud-review
   - biometric-step-up
   - card-protection
   - recovery-support

5. Extract App.tsx orchestration into app/model hooks.

6. Move global styles into:
   - shared/styles/tokens.css
   - shared/styles/globals.css
   - shared/styles/animations.css
   - component-level CSS modules

Rules:
- Do not rewrite the whole repo.
- Do not change UI behavior and business logic in the same step.
- Preserve all existing flows and tests.
- After each step, run:
  npm run lint
  npm test
  npm run build

Report after each step:
- Files moved
- Imports updated
- Behavior unchanged
- Checks passed or failed
```

---

## 14. Kết luận

Với nhánh:

```txt
feature/threatlens-knight-integration
```

Hướng đúng nhất là:

```txt
Không chỉ tách App.css.
Không chỉ tách components.
Phải tách theo 2 lõi nghiệp vụ:
ThreatLens = quyết định rủi ro
KNIGHT       = hành động bảo vệ + audit + recovery
```

Ưu tiên thực tế nhất:

```txt
1. BankDashboard.tsx
2. domain/threat-lens và domain/knight
3. ThreatLensPanel / RiskMeter / AgentConsole
4. các màn incident + recovery
5. App.tsx orchestration
6. server/index.js
7. CSS module hóa
```

Sau khi phân rã đúng, repo sẽ dễ hơn ở 3 điểm:

```txt
1. AI Agent sửa code ít phá flow hơn.
2. Khi thuyết trình dễ giải thích kiến trúc hơn.
3. Khi mở rộng ThreatLens hoặc KNIGHT sẽ không làm rối toàn bộ UI.
```

Thông điệp kiến trúc có thể dùng khi trình bày:

```txt
ThreatLens phân tích rủi ro
→ KNIGHT hành động bảo vệ
→ Audit ghi lại bằng chứng
→ Recovery hỗ trợ sau khi khách hàng đã an toàn
```
