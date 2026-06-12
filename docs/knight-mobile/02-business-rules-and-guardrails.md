# 02 - Business Rules And Guardrails

## Business Goal

KNIGHT phải giảm thiệt hại gian lận thẻ số trong lúc khách hàng không chủ động theo dõi app, đồng thời biến sự cố bảo mật thành trải nghiệm phục hồi niềm tin.

## Core Business Rules

| ID | Rule | Bắt buộc |
|---|---|---|
| BR-001 | Risk score từ 800 trở lên được coi là high risk trong prototype | Có |
| BR-002 | Khi high risk, KNIGHT được tạm khóa thẻ vì đây là hành động reversible | Có |
| BR-003 | KNIGHT phải gửi cảnh báo cho khách ngay sau khi tạm khóa | Có |
| BR-004 | Khách phải xác thực Face ID trước khi khóa vĩnh viễn thẻ | Có |
| BR-005 | Khách phải xác nhận "tôi không thực hiện giao dịch" trước khi phát hành thẻ mới | Có |
| BR-006 | Nếu khách xác nhận giao dịch hợp lệ, thẻ được mở lại và session được giám sát tăng cường 30 phút | Có |
| BR-007 | Nếu khách không phản hồi Web Push sau 3-5 giây, gọi điện tự động; nếu không bắt máy mới gửi SMS, giữ thẻ tạm khóa và escalate Fraud Ops | Có |
| BR-008 | Chargeback hoặc hoàn tiền chỉ được Fraud Ops/Compliance xử lý | Có |
| BR-009 | Recovery offer chỉ hiển thị nếu có consent dùng dữ liệu chi tiêu cho personalization | Có |
| BR-010 | Mỗi action nhạy cảm phải ghi audit event | Có |

## Action Permission Matrix

| Level | Action | Agent tự làm | Điều kiện | Ai duyệt |
|---|---|---:|---|---|
| L0 | Monitor, ghi log, tăng sampling | Có | Luôn bật | Không cần |
| L1 | Gửi warning/push | Có | Risk score vượt ngưỡng | Không cần |
| L1 | Gọi điện tự động | Có | Web Push khẩn cấp chưa được phản hồi sau 3-5 giây | Không cần |
| L1 | Gửi SMS fallback | Có | Cuộc gọi tự động không bắt máy/bận/thất bại/hủy | Không cần |
| L1 | Yêu cầu xác minh | Có | Risk score > 700 | Không cần |
| L2 | Tạm khóa thẻ | Có | Risk score > 800, action reversible | Không cần |
| L2 | Chặn merchant/session tạm thời | Có | Theo policy | Không cần |
| L3 | Khóa vĩnh viễn thẻ | Không tự ý | Customer confirms fraud + Face ID | Customer |
| L3 | Phát hành thẻ số mới | Không tự ý | Customer confirms fraud + Face ID | Customer |
| L3 | Tạo case fraud | Có sau xác nhận | Sau customer confirms fraud | Không cần thêm |
| L4 | Hoàn tiền/chargeback | Không | Case đã đủ bằng chứng | Fraud Ops/Compliance |
| L4 | Khóa toàn bộ tài khoản | Không | Rủi ro cực cao | Manager |
| L4 | Báo cáo cơ quan chức năng | Không | Theo quy định | Compliance |

## Invariants

- Không có Face ID thì không được terminate card.
- Không có customer confirmation thì không được issue new card.
- Không được hiển thị full PAN hoặc CVV.
- Không được nói chắc chắn "đây là gian lận" trước khi khách xác nhận. Copy nên dùng "giao dịch bất thường" hoặc "nguy cơ cao".
- Tạm khóa thẻ phải có cách mở lại nếu khách xác nhận hợp lệ.
- Audit log phải được ghi cả khi action thất bại.
- Timeout không được tự động terminate card.

## Customer Communication Rules

| Tình huống | Copy tone | Không được nói |
|---|---|---|
| Phát hiện high risk | Rõ ràng, bình tĩnh, bảo vệ | "Tài khoản của bạn bị hack chắc chắn" |
| Tạm khóa thẻ | Trấn an, nhấn mạnh tạm thời | "Bạn không thể dùng thẻ nữa" |
| Yêu cầu Face ID | Giải thích vì sao cần xác thực | "Chúng tôi cần xác thực cho vui" |
| Fraud confirmed | Nhanh, chắc, có bước tiếp theo | "Hoàn tiền ngay lập tức" |
| Giao dịch hợp lệ | Xin lỗi nhẹ, khôi phục nhanh | "Bạn đã làm hệ thống nhầm" |
| Timeout | Bảo vệ tài sản, hướng dẫn liên hệ | "Chúng tôi tự quyết định khóa vĩnh viễn" |

## KPI

| KPI | Target prototype | Ghi chú |
|---|---:|---|
| Time to suspend | < 3 giây trong demo | Từ risk detected đến card suspended |
| Time to new virtual card | < 30 giây sau Face ID | Mock được phép nhanh hơn |
| Audit completeness | 100% action có audit event | Bắt buộc |
| Flow completion | < 90 giây cho happy path demo | Bắt buộc |
| Text overflow | 0 lỗi trên 390x844 | Bắt buộc |
| Branch coverage | 3/3 branch có thể demo | Fraud, legit, timeout |

## Business Acceptance Checklist

- Khách hiểu vì sao thẻ bị tạm khóa.
- Khách có lựa chọn rõ: "Không phải tôi" và "Đây là giao dịch của tôi".
- Khách thấy Face ID là điều kiện bảo vệ, không phải friction vô nghĩa.
- Khách thấy thẻ số mới active sau khi xác nhận fraud.
- Khách thấy case fraud có mã và trạng thái.
- Khách thấy action nào do KNIGHT làm, action nào chờ Fraud Ops.
- Recovery offer không làm cảm giác bị bán hàng ngay sau sự cố.
