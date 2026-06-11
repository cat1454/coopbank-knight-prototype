# 07 - Security And Compliance

## Security Position

Prototype phải thể hiện đúng ranh giới bảo mật của sản phẩm ngân hàng, kể cả khi chưa kết nối hệ thống thật. Nếu demo làm sai guardrail, người xem sẽ hiểu sai capability.

## Sensitive Data Rules

Do not include:

- Full PAN.
- CVV.
- Real customer account number.
- Real customer phone number.
- API key.
- Auth token.
- Real core banking endpoint.
- Secret in source code.

Allowed:

- Masked PAN.
- Demo customer ID.
- Demo case ID.
- Mock transaction ID.
- Mock merchant.

## Storage Rules

- Không lưu card data trong `localStorage`.
- Nếu cần lưu state demo, dùng in-memory state.
- Nếu cần share demo state qua URL, chỉ dùng scenario name, không dùng dữ liệu nhạy cảm.
- Không log full payload có thể chứa sensitive data.

## Agent Tool Guardrails

Every tool/action needs:

| Field | Required |
|---|---|
| `actionName` | Có |
| `policyLevel` | Có |
| `allowed` | Có |
| `reason` | Có |
| `requiresCustomerConfirmation` | Có |
| `requiresHumanApproval` | Có |
| `auditEventId` | Có sau khi chạy |

## Threat Model For Prototype

| Threat | Risk | Mitigation |
|---|---|---|
| Người xem hiểu agent có thể tự khóa vĩnh viễn thẻ | Sai nghiệp vụ, rủi ro compliance | UI luôn nói L3 cần Face ID/customer confirmation |
| Demo lộ số thẻ thật | Rủi ro dữ liệu | Chỉ masked PAN, label demo |
| Copy khẳng định fraud khi chưa xác nhận | Rủi ro pháp lý | Dùng "giao dịch bất thường", "nguy cơ cao" |
| Recovery offer bị xem là lợi dụng sự cố | Rủi ro thương hiệu | Tone trấn an, cho phép để sau, nói consent |
| Prompt injection vào agent | Rủi ro khi agent có tool | Prototype không nhận prompt tự do để gọi tool |
| Audit missing | Không thuyết phục được kiểm toán | 100% action nhạy cảm phải có audit event |

## Compliance Notes

Prototype phải nói rõ:

- Thẻ bị tạm khóa để bảo vệ.
- Khóa vĩnh viễn chỉ sau xác nhận.
- Hoàn tiền/chargeback là quy trình review, không hứa hoàn ngay.
- Dữ liệu chi tiêu dùng cho offer phải dựa trên consent.
- Nhân sự Fraud Ops vẫn phụ trách các action L4.

## Secure Copy Examples

Use:

- "Chúng tôi phát hiện dấu hiệu bất thường."
- "Thẻ số đã được tạm khóa. Bạn có thể xác nhận để xử lý tiếp."
- "Face ID giúp xác nhận chính bạn đang yêu cầu khóa thẻ cũ."
- "Đội Fraud Ops sẽ xem xét yêu cầu hoàn tiền trong 3-5 ngày làm việc."

Avoid:

- "AI đã quyết định giao dịch này là gian lận."
- "Chúng tôi hoàn tiền ngay."
- "Thẻ của bạn bị đánh cắp."
- "Chúng tôi đã dùng toàn bộ dữ liệu của bạn để tạo ưu đãi."

## Security Acceptance Checklist

- Không có secret trong source.
- Không có full card number.
- Không có CVV.
- Không có API endpoint thật.
- Không có localStorage cho sensitive data.
- Có audit event cho `card.suspend`.
- Có audit event cho `card.terminate`.
- Có audit event cho `card.issueNewVirtualCard`.
- Có audit event cho `case.create`.
- Có visible human approval boundary cho chargeback.
