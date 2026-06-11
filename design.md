# Tài liệu Hướng dẫn Thiết kế UI/UX (Design Brief)

## Dự án: Ứng dụng Co-opBank Mobile Banking

---

Tài liệu này được biên soạn dựa trên phân tích sản phẩm và định vị thương hiệu của Ngân hàng Hợp tác xã Việt Nam (Co-opBank). Đây là cẩm nang định hướng thiết kế (Design Guide) dành cho Đội ngũ Thiết kế UI/UX để xây dựng/cập nhật giao diện ứng dụng.

---

## 0. Tài liệu Liên quan & Nguồn Tham chiếu

Tài liệu này là **Design Brief tổng thể**. Khi triển khai prototype KNIGHT, đọc song song với:

| Tài liệu | Nội dung | Ưu tiên |
|---|---|---|
| [`01-product-capability.md`](docs/knight-mobile/01-product-capability.md) | Scope, actors, implementation contract | Bắt buộc |
| [`02-business-rules-and-guardrails.md`](docs/knight-mobile/02-business-rules-and-guardrails.md) | Business rules, invariants, KPI | Bắt buộc |
| [`03-user-journeys-and-screens.md`](docs/knight-mobile/03-user-journeys-and-screens.md) | 3 user journeys, content từng màn hình | Bắt buộc |
| [`04-mobile-ux-spec.md`](docs/knight-mobile/04-mobile-ux-spec.md) | Layout rules, typography tokens, motion | Bắt buộc |
| [`05-state-machine.md`](docs/knight-mobile/05-state-machine.md) | 19 states, events, transition guards | Bắt buộc |
| [`06-data-and-api-contracts.md`](docs/knight-mobile/06-data-and-api-contracts.md) | Mock data, API surface | Tham khảo |
| [`07-security-and-compliance.md`](docs/knight-mobile/07-security-and-compliance.md) | Sensitive data rules, threat model | Bắt buộc |
| [`08-test-and-verification-plan.md`](docs/knight-mobile/08-test-and-verification-plan.md) | QA checklist trước demo | Bắt buộc |
| [`09-implementation-backlog.md`](docs/knight-mobile/09-implementation-backlog.md) | Phase plan, file structure | Tham khảo |

### Chốt Xung đột Giữa Tài liệu

Khi có mâu thuẫn giữa `design.md` và `docs/knight-mobile/`, giá trị dưới đây là **chính thức** cho KNIGHT prototype:

| Chủ đề | Giá trị chốt | Nguồn |
|---|---|---|
| Tap target tối thiểu | **44px** | `01-product-capability.md` · `09-implementation-backlog.md` |
| Font stack | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif` | `04-mobile-ux-spec.md` |
| Trust blue (nút chính KNIGHT) | `#175CD3` | `04-mobile-ux-spec.md` |
| Viewport baseline | 390×844 (iPhone) | `04-mobile-ux-spec.md` |
| Risk score ngưỡng high-risk | ≥ 800 / 1000 | `02-business-rules-and-guardrails.md` |
| Demo risk score mock | 847 / 1000 | `03-user-journeys-and-screens.md` |

> **Lưu ý:** Bảng màu ở Section 3 áp dụng cho **banking app chung** (Co-opBank Mobile). KNIGHT prototype dùng design tokens riêng được định nghĩa ở Section 8.

---

## 1. Tổng quan & Định vị Sản phẩm

- **Tên ứng dụng:** Co-opBank Mobile Banking
- **Định vị:** Cổng thanh toán số kết nối nông thôn và thành thị, đồng thời là hạ tầng chuyển đổi số cho hệ thống các Quỹ Tín dụng Nhân dân (QTDND) trên toàn quốc.
- **Triết lý thiết kế:** **Thực dụng - Thân thiện - Địa phương hóa**. Ưu tiên tối đa tính khả dụng (Usability), độ tương phản cao và thao tác đơn giản, loại bỏ hoàn toàn các hiệu ứng rườm rà không cần thiết.

---

## 2. Đối tượng Mục tiêu & Nỗi đau (User Pain Points)

Thiết kế cần giải quyết trực tiếp các vấn đề của 3 nhóm người dùng chiến lược:

1. **Thành viên QTDND (Khu vực nông thôn, nông nghiệp):** Người lớn tuổi, mắt kém, ít tiếp xúc với công nghệ cao.
   - *Nỗi đau:* Chữ quá nhỏ, giao diện quá nhiều tính năng gây rối, sợ thao tác sai dẫn đến mất tiền.
2. **Hộ kinh doanh, tiểu thương, chủ cửa hàng:** Cần xử lý giao dịch liên tục, nhanh chóng.
   - *Nỗi đau:* Đang bận làm hàng không thể chạm tay vào điện thoại để kiểm tra xem khách đã chuyển tiền chưa; nhân viên không biết tiền đã về tài khoản chủ chưa.
3. **Khách hàng cá nhân phổ thông:** Cần một ứng dụng ngân hàng ổn định, bảo mật và miễn phí.

---

## 3. Hệ thống Màu sắc & Chữ viết (Design System)

### 3.1. Bảng màu (Color Palette)

Hệ màu cần mang lại cảm giác an toàn, tin cậy của ngành tài chính, kết hợp với các yếu tố bản địa thân thuộc.

| Thành phần | Màu sắc | Mã Hex (Gợi ý) | Ứng dụng cụ thể |
| --- | --- | --- | --- |
| **Primary (Chủ đạo)** | Xanh dương đậm (Navy) | `#003B73` | Thanh tiêu đề (Header), Nút bấm chính (CTA), Khung viền quan trọng |
| **Accent (Điểm nhấn)** | Đỏ thương hiệu | `#E31B23` | Logo, Icon thông báo quan trọng, Badge cảnh báo |
| **Background (Nền)** | Trắng / Xám siêu nhẹ | `#FFFFFF` / `#F8F9FA` | Nền ứng dụng xuyên suốt, nền các khối tính năng |
| **Nature (Hỗ trợ)** | Xanh lá mượt (Soft Green) | `#2E7D32` | Thể hiện qua hình ảnh cover (Ruộng bậc thang, phong cảnh đồng quê) |
| **Text Primary** | Đen than | `#212121` | Chữ hiển thị chính, số tiền, tiêu đề tính năng |
| **Text Secondary** | Xám | `#757575` | Chữ phụ, chú thích, thời gian giao dịch |

### 3.2. Chữ viết (Typography)

- **Font family:** Các font không chân (Sans-serif) có độ bo tròn nhẹ, độ dày nét tốt để hiển thị rõ trên mọi loại màn hình. Ưu tiên: `Inter`, `Roboto` hoặc `San Francisco / Segoe UI`.
- **Kích thước chữ (Font Size):** Thiết kế lớn hơn tiêu chuẩn thông thường từ 1 - 2pt. Chữ nhỏ nhất trên màn hình (caption) không được dưới `12pt`. Tiêu đề tính năng tối thiểu `14pt`. Số tiền giao dịch hiển thị từ `18pt` đến `24pt` (Bold).

---

## 4. Nguyên tắc Sắp xếp Bố cục (Layout Architecture)

### 4.1. Cấu trúc Khối phẳng (Flat & Block-based Design)

- Sử dụng lưới (Grid) 4 cột cho menu tính năng.
- Các tính năng được gom cụm rõ ràng trong các khối bo góc nhẹ (border-radius: `8px` - `12px`), có khoảng cách (margin) rộng rãi để tránh bấm nhầm.

### 4.2. Thiết kế chi tiết các màn hình chủ chốt

#### Màn hình Đăng nhập (Login Screen)

- **Nửa trên (Visual Area):** Khu vực hiển thị Banner phong cảnh nông thôn Việt Nam (hoặc ruộng bậc thang). Phải có một slot động để đổi Logo theo từng Quỹ Tín dụng Nhân dân địa phương khi người dùng chọn khu vực.
- **Nửa dưới (Action Area):** Ô nhập mật khẩu rõ ràng, nút Đăng nhập bằng Sinh trắc học (FaceID/Vân tay) lớn.
- **Tính năng Tiện ích nhanh:** Đặt nút **"QR Pay"** và **"Mã QR của tôi"** ở góc dưới cùng màn hình (Floating hoặc Sticky). Người dùng không cần đăng nhập vẫn có thể quét mã mua hàng nhanh hoặc đưa mã cho người khác quét.

#### Màn hình Trang chủ (Home Dashboard)

- **Khu vực Header:** Lời chào cá nhân hóa + Số dư tài khoản (kèm icon Mắt để Ẩn/Hiện số dư). Nền Header dùng màu Xanh dương chủ đạo (`#003B73`) chữ trắng để tạo sự phân tách rõ rệt.
- **Khu vực Menu chính (Quick Access):** 4 tính năng quan trọng nhất phải nằm ở hàng đầu tiên: Chuyển tiền, Nạp tiền điện thoại, Quét QR, Tiết kiệm trực tuyến. Icon thiết kế dạng 2D trực quan, không dùng đổ bóng 3D phức tạp.
- **Khu vực Tiện ích đời sống:** Thanh toán hóa đơn (Điện, Nước, Internet), Đặt vé (Tàu, Xe, Máy bay). Gom cụm vào nhóm "Dịch vụ đời sống".

#### Thanh điều hướng dưới cùng (Bottom Navigation Bar)

Cố định 4 - 5 tab chính để người dùng chuyển đổi nhanh ở bất kỳ màn hình nào:

1. **Trang chủ** (Home)
2. **Quét mã QR** (QR Payment - Nằm chính giữa, có thể làm nổi bật hơn)
3. **Lịch sử** (Lịch sử giao dịch)
4. **Cài đặt** (Cài đặt & Bảo mật)

---

## 5. Thiết kế Trải nghiệm cho các Tính năng Đặc thù (UX UI Design Specs)

### 5.1. Tính năng Voice OTT (Thông báo số dư bằng giọng nói)

- **UI:** Trong phần cài đặt, thiết kế một nút chuyển (Toggle Switch) trực quan cho tính năng "Thông báo bằng giọng nói".
- **UX:** Khi có biến động số dư, app tự động kích hoạt âm thanh đọc rõ số tiền (Ví dụ: *"Tài khoản của bạn vừa nhận được năm mươi nghìn đồng"*). Giao diện lúc này cần hiển thị một Pop-up thông báo tối giản, chữ to, tự động tắt sau 3 giây.

### 5.2. Chia sẻ Thông báo Số dư (Dành cho chủ cửa hàng/tiểu thương)

- **UI:** Giao diện quản lý tài khoản có thêm mục "Chia sẻ biến động số dư". Thiết kế luồng thêm thành viên bằng số điện thoại hoặc mã QR của nhân viên.
- **UX:** Tạo trạng thái phân biệt rõ ràng giữa "Tài khoản chủ" và "Tài khoản nhân viên được chia sẻ" (Nhân viên chỉ thấy thông báo tiền vào, không thấy số dư tổng và không có quyền chuyển tiền).

### 5.3. Trình Tra soát Trực tuyến (Online Dispute Management)

- **UI:** Khi người dùng bấm vào một giao dịch bị lỗi trong phần Lịch sử, thiết kế nút **"Gửi yêu cầu tra soát"** màu đỏ hoặc xanh nổi bật ngay dưới biên lai.
- **UX:** Thiết kế một thanh tiến trình (Progress Bar) dạng bước (Step 1: Đã tiếp nhận -&gt; Step 2: Đang xử lý -&gt; Step 3: Hoàn thành) để người dùng theo dõi trực quan tiến độ xử lý của ngân hàng, tránh tâm lý hoang mang.

### 5.4. Hệ thống Cảnh báo Bảo mật Chủ động (Security Guard UI)

- **UX/UI Cảnh báo:** Nếu hệ thống phát hiện thiết bị nhiễm mã độc hoặc có app lạ đang theo dõi màn hình, ứng dụng sẽ lập tức che mờ màn hình (Overlay một lớp màu xám đen 80% opacity) và hiển thị một Hộp thoại (Dialog) cảnh báo lớn màu đỏ ở chính giữa, khóa mọi thao tác bấm cho đến khi người dùng xử lý theo hướng dẫn.

---

## 6. KNIGHT Presentation Design Extension

Phần này áp dụng riêng cho artifact trình chiếu **Đề 02: Co-opBank "Hiệp sĩ số" toàn năng** trong `knight_ai_agent_animated.html`. Đây là lớp sân khấu hóa để thuyết phục ban giám khảo về năng lực AI Agent ReAct, không thay thế quy chuẩn UI banking thật ở các phần trên.

### 6.1. Vai trò của Presentation Mode

- **Mục tiêu:** kể câu chuyện 02:00 khi giao dịch lạ xuất hiện, KNIGHT quan sát - suy luận - hành động - theo dõi kết quả, rồi cá nhân hóa phục hồi niềm tin sau sự cố.
- **Tone:** cyber-night, điện ảnh, tương phản sáng/tối cao, có cảm giác "hộ vệ tài chính" đang canh gác trong đêm.
- **Nhân hóa AI Agent:** KNIGHT được phép xuất hiện như nhân vật trung tâm trong deck, có độc thoại nội tâm Reasoning và trạng thái hành động rõ.
- **Ranh giới:** các cảnh dramatic chỉ dùng cho thuyết trình/demo. Khi product hóa vào mobile app thật, KNIGHT phải trở lại dạng shield mark, audit trail, short reasoning và CTA banking rõ ràng.

### 6.2. Visual Rules Cho Deck

- **Màu:** giữ nền xanh đêm và xanh trust của Co-opBank, cho phép cyan/neon/amber để thể hiện risk scoring, ReAct phase và trạng thái cảnh báo.
- **Typography:** tiêu đề có thể dùng phong cách futuristic/display; phần thân phải đủ lớn, tương phản cao, không để tràn chữ ở màn hình 1366x768.
- **Motion:** animation phục vụ mạch kể chuyện: KNIGHT thức dậy, risk score tăng, thẻ tạm khóa, Face ID xác thực, thẻ mới sẵn sàng, ưu đãi cá nhân hóa xuất hiện.
- **Âm thanh/cảnh báo:** không bật âm thanh mặc định. Nếu có còi cảnh báo, phải do người trình bày chủ động bật.

### 6.3. Copy Và Guardrail Bắt Buộc

- Không nói "AI tự quyết định khóa vĩnh viễn thẻ" hoặc "hoàn tiền chắc chắn".
- Được nói: "KNIGHT tạm khóa thẻ để bảo vệ vì đây là hành động có thể đảo ngược".
- Khóa vĩnh viễn thẻ, phát hành thẻ số mới và case fraud chỉ xuất hiện sau khi khách xác nhận giao dịch lạ và hoàn tất Face ID.
- Thông điệp kết luận: AI Agent không chỉ là chatbot, mà là **hộ vệ tài chính** và **chuyên viên tư vấn 1-1** hoạt động trong guardrail ngân hàng.

---

## 7. Lưu ý Kiểm thử Giao diện — Banking App Chung

| # | Tiêu chí | Cách kiểm tra | Pass khi |
|---|---|---|---|
| G-01 | Tap target | DevTools ruler | Mọi nút ≥ 44px |
| G-02 | Contrast ratio | [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) | ≥ 4.5:1 cho text chính |
| G-03 | Logo QTDND động | Thay logo runtime, kiểm tra layout | Không vỡ nét, không đè UI |
| G-04 | Loading state | Giả lập mạng 3G chậm | Skeleton hoặc spinner hiện trong ≤ 300ms |
| G-05 | Text overflow | Resize viewport nhỏ nhất 360×780 | 0 dòng bị cắt/tràn |

---

## 8. Visual Spec: 6 Màn hình KNIGHT

Phần này chỉ định **visual rule** cho các màn hình trong prototype KNIGHT. Nội dung (copy, mock data) đã được định nghĩa tại [`03-user-journeys-and-screens.md`](docs/knight-mobile/03-user-journeys-and-screens.md). Business rules ràng buộc tại [`02-business-rules-and-guardrails.md`](docs/knight-mobile/02-business-rules-and-guardrails.md).

---

### 8.0. Design Tokens cho KNIGHT Prototype

```css
/* === Colors === */
--color-ink:        #101828;            /* Text chính */
--color-muted:      #667085;            /* Metadata, timestamp */
--color-surface:    #F8FAFC;            /* App background */
--color-card:       #FFFFFF;            /* Card surface */
--color-trust:      #175CD3;            /* Primary action, KNIGHT brand */
--color-success:    #079455;            /* Completed state */
--color-amber:      #DC6803;            /* Warning, risk signal */
--color-fraud:      #D92D20;            /* High-risk only, fraud confirmed */
--color-line:       #E4E7EC;            /* Dividers */
--color-overlay:    rgba(16,24,40,0.72);/* Scrim / dark backdrop */

/* === Typography === */
--text-xs:  11px;   /* Metadata, timestamp */
--text-sm:  13px;   /* Secondary copy */
--text-md:  15px;   /* Body */
--text-lg:  18px;   /* Section title */
--text-xl:  24px;   /* Screen title */

/* === Spacing === */
--spacing-xs:   4px;
--spacing-sm:   8px;
--spacing-md:  16px;
--spacing-lg:  24px;
--spacing-xl:  32px;

/* === Border Radius === */
--radius-sm:    8px;
--radius-md:   12px;
--radius-lg:   16px;
--radius-full: 9999px;

/* === Interaction === */
--tap-min:     44px;   /* Tap target tối thiểu — KHÔNG giảm */
--transition:  200ms ease;
```

---

### Screen 1 — Critical Alert

**Mục tiêu:** Tạo hook, chứng minh KNIGHT bảo vệ chủ động khi khách đang ngủ.

| Thành phần | Spec |
|---|---|
| Background | `#0A0F1E` — mô phỏng lock screen ban đêm |
| Notification card | `border-radius: --radius-lg`, nền `rgba(255,255,255,0.08)`, `backdrop-filter: blur(12px)` |
| App icon + tên | Logo Co-opBank + "Co-opBank" trắng, `--text-sm` |
| Timestamp badge | "Vừa xong" — `--text-xs`, `--color-muted`, căn phải |
| Merchant + amount | "ShopMall Global · 4,800,000 ₫" — `--text-lg` bold, trắng |
| Status line | "Thẻ số đã được tạm khóa" — `--color-amber`, `--text-sm` |
| CTA | "Mở Co-opBank" — pill shape, nền `--color-trust`, trắng, `--text-md` bold, min-height `--tap-min` |
| Padding trong card | `--spacing-md` ngang · `--spacing-sm` dọc |

**Không được:** Flashing đỏ liên tục · Âm thanh tự động · Hiện số thẻ đầy đủ.

---

### Screen 2 — Fraud Review

**Mục tiêu:** Khách hiểu tình huống trong 5 giây, thấy 2 lựa chọn rõ ràng.

#### Hierarchy bố cục (trên → dưới)

```
[App bar: shield mark + "Bảo vệ tài khoản"]
[Headline: "KNIGHT đã tạm khóa thẻ số của bạn"]
[Risk Score: 847/1000 + progress bar]
[Risk Signal List: 3 items]
[Card Status Badge: SUSPENDED]
[Divider]
[Primary CTA: "Không phải tôi"]
[Secondary CTA: "Đây là giao dịch của tôi"]
```

#### Spec từng thành phần

| Thành phần | Spec |
|---|---|
| App bar | Nền `--color-surface`, cao 48px, shield mark 20px trái, tên "Bảo vệ tài khoản" `--text-md` căn giữa |
| Headline | `--text-xl` bold, `--color-ink`, padding-top `--spacing-lg` |
| Risk score number | "847 / 1000" — `--text-xl` bold, `--color-fraud`; label "Điểm rủi ro" `--text-xs` `--color-muted` |
| Risk score bar | `height: 4px`, `border-radius: --radius-full`, fill `--color-fraud`, track `--color-line` |
| Risk signal item | Icon tròn 20px `--color-amber` + label `--text-md` + mô tả `--text-sm` `--color-muted` |
| Risk signals | 3 items cố định: "Thiết bị mới" · "IP VPN Singapore" · "4 giao dịch trong 3 phút" |
| Card badge | "SUSPENDED" — pill, nền `rgba(217,45,32,0.1)`, viền `--color-fraud` 1px, `--text-sm` bold |
| Primary CTA | "Không phải tôi" — nền `--color-fraud`, trắng, `--text-md` bold, min-height `--tap-min`, full-width |
| Secondary CTA | "Đây là giao dịch của tôi" — nền transparent, viền `--color-line` 1px, `--color-ink`, min-height `--tap-min`, full-width |
| Gap giữa 2 CTA | `--spacing-sm` |
| Bottom safe area | `padding-bottom: calc(env(safe-area-inset-bottom) + var(--spacing-md))` |

**Không được:** Nói "giao dịch này là gian lận" trước khi khách xác nhận · Ẩn secondary CTA · Hiển thị model internals thô.

---

### Screen 3 — Face ID Step-up

**Mục tiêu:** Unlock L3 action — giải thích vì sao cần xác thực, không tạo friction vô nghĩa.

#### Hierarchy bố cục

```
[Top 40%: Title + Subtitle]
[Center 30%: Face ID ring animation]
[Bottom 30%: Status label + CTA phụ]
```

#### Spec từng thành phần

| Thành phần | Spec |
|---|---|
| Background | `--color-surface` |
| Title | "Xác thực để bảo vệ thẻ" — `--text-xl` bold, `--color-ink`, căn giữa |
| Subtitle | "Face ID xác nhận chính bạn đang yêu cầu. Thao tác này không thể đảo ngược." — `--text-sm`, `--color-muted`, căn giữa, padding ngang `--spacing-xl` |
| Face ID ring | SVG/CSS circle 96×96px, stroke `--color-trust` 3px; animation: `pulse-glow 1.5s ease-in-out` khi đang scan |
| Success state | Stroke đổi sang `--color-success`, check icon fade-in; tự chuyển màn hình sau 800ms |
| Status label | 3 trạng thái: "Đang nhận diện…" (`--color-muted`) → "Đã xác thực ✓" (`--color-success`) → _(chuyển màn hình)_ |
| CTA Thử lại | Chỉ hiện khi thất bại; text button `--color-trust`, min-height `--tap-min` |
| Retry limit | Tối đa 3 lần; lần 3 thất bại → hiện "Liên hệ tổng đài 1800 xxxx", không cho thử tiếp |

**Không được:** Tự động terminate card khi Face ID thất bại · Có nút bypass Face ID đến L3 action.

---

### Screen 4 — New Virtual Card

**Mục tiêu:** Chứng minh giá trị tức thời — thẻ mới active ngay, case đã được tạo.

#### Hierarchy bố cục

```
[Card visual: gradient Co-opBank]
[Status badge: ACTIVE]
[Action chips: 3 items]
[Case ID + note Fraud Ops]
[CTA: "Xem lịch sử hành động"]
```

#### Spec từng thành phần

| Thành phần | Spec |
|---|---|
| Card visual | Gradient `#175CD3 → #003B73`, `border-radius: --radius-lg`, `width: 100%`, `aspect-ratio: 1.586` (chuẩn ISO/IEC 7810), `box-shadow: 0 8px 24px rgba(23,92,211,0.25)` |
| Demo label | Tag "DEMO CARD" góc trên phải — `--text-xs`, nền `rgba(255,255,255,0.2)`, `border-radius: --radius-sm`, đảm bảo không bị nhầm thẻ thật |
| Masked PAN | "4532 •••• •••• 7291" — `--text-lg` bold, trắng, `letter-spacing: 2px` |
| Cardholder | "NGUYEN MINH AN" — `--text-sm`, `rgba(255,255,255,0.8)` |
| Status badge | "● ACTIVE" — `--color-success`, `--text-sm` bold, ngay dưới card |
| Action chips | Row 3 chips: "Thẻ cũ đã khóa" · "Thẻ mới đã cấp" · "Case đã tạo" — pill, nền `rgba(7,148,85,0.1)`, viền `--color-success` 1px, `--text-xs`, icon ✓ |
| Case ID | "Mã case: FR-20250601-001" — `--text-sm`, `--color-muted` |
| Fraud Ops note | "Đội Fraud Ops sẽ xem xét trong 3–5 ngày làm việc." — `--text-sm`, `--color-muted` |
| CTA | "Xem lịch sử hành động" — outlined, viền `--color-trust`, `--color-trust` text, min-height `--tap-min` |

**Không được:** Hiện CVV · Hiện full expiry nếu không cần · Cam kết "hoàn tiền ngay".

---

### Screen 5 — Recovery Offer

**Mục tiêu:** Phục hồi niềm tin sau sự cố — không bán hàng thô, không cảm giác lợi dụng.

#### Hierarchy bố cục

```
[Icon nhẹ nhàng: shield + gift]
[Title: ưu đãi]
[Body: mô tả cashback]
[Consent note]
[Primary CTA: "Kích hoạt"]
[Secondary CTA: "Để sau"]
```

#### Spec từng thành phần

| Thành phần | Spec |
|---|---|
| Background | `--color-surface` |
| Icon | Shield + gift kết hợp hoặc star mark, `--color-trust`, size 48×48px, căn giữa, margin-bottom `--spacing-md` |
| Title | "Một ưu đãi an tâm dành riêng cho bạn" — `--text-xl` bold, `--color-ink`, căn giữa |
| Body | "5% cashback cho điện, nước, internet và nhu yếu phẩm trong 90 ngày." — `--text-md`, `--color-ink`, padding ngang `--spacing-md` |
| Consent note | "Dựa trên danh mục chi tiêu bạn đã cho phép cá nhân hóa." — `--text-sm`, `--color-muted`, icon ⓘ nhỏ kèm theo |
| Primary CTA | "Kích hoạt ưu đãi" — nền `--color-trust`, trắng, `--text-md` bold, min-height `--tap-min`, full-width |
| Secondary CTA | "Để sau" — text button, `--color-muted`, `--text-md`, min-height `--tap-min`, full-width |
| Gap CTA | `--spacing-sm` |

**Không được:** Auto-activate offer mà không có tap xác nhận · Làm "Để sau" nhỏ hơn `--tap-min` · Nói "dựa trên toàn bộ dữ liệu của bạn".

---

### Screen 6 — Audit Timeline

**Mục tiêu:** Tạo trust và explainability — khách thấy từng bước KNIGHT làm theo policy nào.

#### Hierarchy bố cục

```
[Title: "Lịch sử hành động KNIGHT"]
[Case ID subtitle]
[Vertical timeline: 8 entries tối thiểu]
[Fraud Ops boundary note]
```

#### Spec từng thành phần

| Thành phần | Spec |
|---|---|
| Background | `--color-surface` |
| Title | "Lịch sử hành động" — `--text-xl` bold, `--color-ink` |
| Case ID | "Case FR-20250601-001" — `--text-sm`, `--color-muted` |
| Timeline connector | Đường dọc `2px solid --color-line`, nối các dot |
| Timeline dot | Circle 10×10px; màu theo phase: OBSERVE=`--color-muted` · REASON=`--color-amber` · ACT L1-L2=`--color-trust` · ACT L3=`--color-fraud` |
| Timestamp | `--text-xs`, `--color-muted`, bên trái dot |
| Phase badge | Pill xs: "OBSERVE" / "REASON" / "ACT" — màu tương ứng dot, `--text-xs` |
| Action text | `--text-md`, `--color-ink` |
| Policy level badge | "L0" / "L1" / "L2" / "L3" — `--text-xs`, `--color-muted`, badge nhỏ bên cạnh phase badge |
| Reason text | `--text-sm`, `--color-muted`; nếu dài > 80 ký tự thì mặc định collapse, tap để expand |
| Fraud Ops note | Box dưới cùng: "Các bước L4 (hoàn tiền, khóa tài khoản) do Fraud Ops xử lý theo quy định." — nền `rgba(220,104,3,0.08)`, border-left `3px solid --color-amber`, `--text-sm`, `--color-muted` |

#### Entries tối thiểu bắt buộc (Happy Path)

| Thời gian | Phase | Action | Policy |
|---|---|---|---|
| 02:00:00 | OBSERVE | 4 giao dịch bất thường phát hiện | L0 |
| 02:00:01 | REASON | Risk score tính: 847/1000 | L1 |
| 02:00:02 | ACT | Thẻ số tạm khóa | L2 |
| 02:03:17 | OBSERVE | Khách xác nhận "Không phải tôi" | L3 unlock |
| 02:03:18 | ACT | Face ID xác thực thành công | L3 unlock |
| 02:03:19 | ACT | Thẻ cũ khóa vĩnh viễn · Thẻ mới cấp phát | L3 |
| 02:03:20 | ACT | Case fraud tạo: FR-20250601-001 | L3 |
| 02:05:02 | ACT | Recovery offer tạo (dựa trên consent) | Consent required |

**Không được:** Hiện raw model internals · Để timeline rỗng bất kỳ bước nào · Bỏ field `policy` khỏi entry nào.

---

## 9. Checklist Kiểm thử KNIGHT (Có Tiêu chí Pass/Fail)

| # | Tiêu chí | Cách kiểm tra | Pass khi |
|---|---|---|---|
| V-01 | Tap target ≥ 44px | DevTools ruler trên mọi CTA | Mọi nút: measured height ≥ 44px |
| V-02 | Contrast ≥ 4.5:1 | WebAIM Contrast Checker | Tất cả text chính đạt WCAG AA |
| V-03 | Text không tràn | Resize 360×780, kiểm tra 6 màn hình | 0 dòng bị clip hoặc overflow |
| V-04 | Masked PAN | Inspect DOM · không có regex `\d{5,}` | Không có chuỗi liên tục > 4 chữ số |
| V-05 | Không CVV / secret | Grep source code | 0 kết quả cho `cvv`, `secret`, `apiKey` |
| V-06 | Audit completeness | Chạy happy path, đếm entries | Đủ 8 entries, mỗi entry có `phase` + `policy` |
| V-07 | Reduced motion | DevTools → Emulate `prefers-reduced-motion: reduce` | Không có animation chạy |
| V-08 | Face ID không bypass | Thử bấm mọi nút trên Screen 3 | Không có đường đến L3 action mà không qua biometric success |
| V-09 | Recovery offer consent | Đọc Screen 5 | Câu giải thích consent hiện rõ, không ẩn |
| V-10 | Fraud Ops boundary | Đọc Screen 4 + Screen 6 | Có note rõ L4 = Fraud Ops, không phải KNIGHT tự xử lý |
| V-11 | Demo controls ẩn | Mở URL mặc định (không có query param) | Panel demo không visible với khách |
| V-12 | Timeout không terminate | Chạy branch timeout trong demo | Thẻ giữ trạng thái SUSPENDED, không TERMINATED |