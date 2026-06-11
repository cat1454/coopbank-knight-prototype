# 04 - Mobile UX Spec

## Design Direction

Purpose: giao diện app ngân hàng để khách xử lý rủi ro thẻ trong đêm.

Audience: khách hàng phổ thông, đang dùng iPhone, có thể đang hoảng và chưa tỉnh ngủ.

Tone: calm, secure, premium, concise.

Memorable detail: KNIGHT không phải nhân vật đứng giữa sân khấu trong app chính. KNIGHT xuất hiện như một lớp bảo vệ tinh tế: shield mark, short reasoning, audit trail, và trạng thái hành động rõ.

## Device Targets

| Viewport | Mục tiêu |
|---|---|
| 390x844 | Baseline iPhone |
| 393x852 | iPhone modern compact |
| 430x932 | iPhone large |
| 360x780 | Stress test text fit |

Use:

- `min-height: 100svh`
- `padding-top: env(safe-area-inset-top)`
- `padding-bottom: env(safe-area-inset-bottom)`
- fixed bottom action area only if it does not hide content

## Layout Rules

- Portrait-first.
- One primary task per screen.
- CTA chính ở lower half, dễ chạm bằng ngón cái.
- Primary and secondary CTA phải khác weight rõ ràng.
- Không dùng card lồng card.
- Không dùng hero landing page.
- Không dùng decorative blob/orb.
- Không để text che card number, CTA hoặc timeline.
- Mọi fixed-format surface như card, notification, bottom action phải có stable height/min-height.

## Typography

Recommended stack:

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
```

Scale:

| Token | Size | Use |
|---|---:|---|
| `--text-xs` | 11px | Metadata, timestamp |
| `--text-sm` | 13px | Secondary copy |
| `--text-md` | 15px | Body |
| `--text-lg` | 18px | Section title |
| `--text-xl` | 24px | Screen title |

Không scale font bằng viewport width.

## Color Direction

Palette nên đa chiều nhưng tiết chế:

| Role | Color suggestion | Use |
|---|---|---|
| Ink | `#101828` | Text chính |
| Muted | `#667085` | Metadata |
| Surface | `#F8FAFC` | App background |
| Card | `#FFFFFF` | Screen surface |
| Trust blue | `#175CD3` | Primary action |
| Success green | `#079455` | Completed state |
| Risk amber | `#DC6803` | Warning |
| Fraud red | `#D92D20` | High risk only |
| Line | `#E4E7EC` | Dividers |

Dark mode optional. Prototype đầu có thể dùng light banking UI để giống app thật hơn.

## Components

### App Shell

- iPhone frame optional for presentation.
- In-app status bar optional.
- Top area: bank name, time/status, compact KNIGHT shield.
- Main area: current screen.
- Bottom area: CTA only when action is needed.

### Risk Signal List

Each item:

- Icon or small status marker.
- Signal label.
- One-line explanation.

Do not show raw model internals to customer. Keep details in audit timeline.

### Virtual Card

Rules:

- Mask PAN.
- No CVV.
- No full expiry if not needed.
- Use "Demo card" label if presenting outside controlled context.

### Audit Timeline

Rules:

- Compact vertical timeline.
- Each item includes time, phase, action, policy.
- Reason text is expandable if long.

## Motion

Allowed:

- Notification slide in.
- Risk score count up.
- Face ID scan -> check.
- Card replace transition.
- Timeline items reveal.

Avoid:

- Constant background animation.
- Flashing red for long periods.
- Alarm audio by default.
- Motion that prevents reading.

Must support:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

## Copy Rules

Good:

- "KNIGHT đã tạm khóa thẻ số để bảo vệ bạn."
- "Chúng tôi cần Face ID trước khi khóa thẻ cũ vĩnh viễn."
- "Thẻ số mới đã sẵn sàng."
- "Case fraud đã được tạo để đội Fraud Ops xem xét hoàn tiền."

Avoid:

- "Bạn đã bị hack."
- "AI quyết định khóa thẻ của bạn."
- "Hoàn tiền chắc chắn."
- "Mua ngay ưu đãi này."
