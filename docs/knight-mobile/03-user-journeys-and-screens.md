# 03 - User Journeys And Screens

## Primary Journey

Tên journey: **2AM Fraud Rescue**

Người dùng: Nguyễn Minh An, khách hàng đang ngủ, chỉ có điện thoại bên cạnh.

Mục tiêu: xử lý cảnh báo bất thường trong app trong thời gian ngắn, không cần gọi tổng đài, vẫn có quyền kiểm soát các hành động irreversible.

## Happy Path - Customer Confirms Fraud

```text
1. Customer receives critical alert.
2. Customer opens app.
3. App shows fraud review and card already suspended.
4. Customer taps "Không phải tôi".
5. App asks Face ID.
6. Face ID succeeds.
7. KNIGHT terminates old virtual card.
8. KNIGHT issues new virtual card.
9. KNIGHT creates fraud case.
10. App shows recovery offer.
11. App shows audit timeline.
```

## Branch - Customer Confirms Legitimate

```text
1. Customer opens fraud review.
2. Customer taps "Đây là giao dịch của tôi".
3. App asks Face ID.
4. Face ID succeeds.
5. KNIGHT unsuspends card.
6. KNIGHT whitelists device/session temporarily.
7. App shows enhanced monitoring for 30 minutes.
8. Audit timeline records false positive resolution.
```

## Branch - Customer Timeout

```text
1. High risk is detected.
2. Card is suspended.
3. Customer does not respond for 5 minutes.
4. KNIGHT sends SMS fallback.
5. KNIGHT escalates case to Fraud Ops.
6. Card remains suspended.
7. UI can show timeout branch in demo controls.
```

## Required Screens

### Screen 1 - Critical Alert

Purpose: tạo hook, chứng minh app chủ động bảo vệ.

Content:

- Time: 02:00
- Merchant: ShopMall Global
- Amount: 4,800,000 VND total
- Status: thẻ đã được tạm khóa
- CTA: "Mở Co-opBank"

Implementation note:

- Trong web prototype, mô phỏng lock screen bằng một iPhone frame hoặc top notification sheet.
- Không cần push thật.

### Screen 2 - Fraud Review

Purpose: khách hiểu trong 5 giây.

Content hierarchy:

1. "KNIGHT đã tạm khóa thẻ số của bạn"
2. Risk score: 847/1000
3. Three signals:
   - Thiết bị mới
   - IP VPN Singapore
   - 4 giao dịch trong 3 phút lúc 02:00
4. Card status: Suspended
5. Primary CTA: "Không phải tôi"
6. Secondary CTA: "Đây là giao dịch của tôi"

### Screen 3 - Face ID Step-up

Purpose: unlock L3 action.

Content:

- Title: "Xác thực để khóa thẻ cũ"
- Body: "Face ID giúp đảm bảo chính bạn đang yêu cầu khóa vĩnh viễn và phát hành thẻ mới."
- Animation: Face ID ring/check.
- State: scanning -> success -> continue.

### Screen 4 - New Virtual Card

Purpose: chứng minh giá trị tức thời.

Content:

- New card visual.
- Masked PAN: `4532 **** **** 7291`
- Status: Active
- Case ID: `FR-20250601-001`
- Action chips:
  - Old card terminated
  - New card issued
  - Fraud case created
- CTA optional: "Xem timeline"

### Screen 5 - Recovery Offer

Purpose: phục hồi niềm tin, không bán hàng thô.

Content:

- Title: "Một ưu đãi an tâm dành riêng cho bạn"
- Body: "Nhận 5% cashback cho điện, nước, internet và nhu yếu phẩm trong 90 ngày."
- Explanation: "Dựa trên danh mục chi tiêu đã được bạn cho phép cá nhân hóa."
- CTA: "Kích hoạt"
- Secondary: "Để sau"

### Screen 6 - Audit Timeline

Purpose: tạo trust và explainability.

Required entries:

| Time | Phase | Action | Policy |
|---|---|---|---|
| 02:00:00 | Observe | 4 giao dịch bất thường | L0 |
| 02:00:01 | Reason | Risk score 847/1000 | L1 |
| 02:00:02 | Act | Tạm khóa thẻ | L2 |
| 02:03:17 | Observe | Customer confirms fraud | L3 unlock |
| 02:03:18 | Act | Face ID verified | L3 unlock |
| 02:03:19 | Act | Terminate + issue new card | L3 |
| 02:03:20 | Act | Fraud case created | L3 |
| 02:05:02 | Act | Recovery offer generated | Consent required |

## Demo Controls

Prototype nên có controls ẩn hoặc panel nhỏ cho người demo:

- Start scenario.
- Jump to fraud confirmed.
- Jump to legitimate.
- Jump to timeout.
- Reset.
- Toggle reduced motion preview.

Panel này không phải UI khách hàng, nên có thể ẩn sau query param hoặc nút nhỏ.
