# Co-opBank KNIGHT - "Hiệp sĩ số" bảo vệ tài khoản

Dự án mẫu (Prototype) cho **Đề 02: Ngân hàng Co-opBank - "Hiệp sĩ số" toàn năng**. Trình diễn cơ chế AI Agent dựa trên kiến trúc ReAct (Reasoning & Acting) giám sát rủi ro thời gian thực, tạm khóa thẻ số bảo vệ tài sản, và phục hồi trải nghiệm của khách hàng thông qua Face ID.

---

## 🌟 Tính Năng Nổi Bật của Prototype

1. **Giao diện Ngân hàng Mobile & Hộ vệ AI**: Tích hợp trực tiếp màn hình bảo vệ an ninh của KNIGHT bên trong ứng dụng ngân hàng di động giả lập.
2. **AI Agent Sinh Động**: Khung quan sát trực quan tiến trình suy luận (Reasoning), chỉ số rủi ro (Risk Score), biến động trạng thái thẻ, và hộp thoại cảnh báo thoại của KNIGHT Agent.
3. **Luồng Chạy Tuần Tự (Sequential Demo Flow)**: Khi kích hoạt, kịch bản bảo vệ sẽ chạy từng bước một với độ trễ (1.5s) để người thuyết trình có thể giải thích chi tiết các pha **OBSERVE ➔ REASON ➔ ACT**.
4. **Mô phỏng 3 Kịch Bản Demo**:
   - **Fraud (Gian lận)**: Khách báo cáo thẻ bị lộ ➔ Face ID xác thực ➔ Hủy thẻ cũ vĩnh viễn ➔ Cấp thẻ mới ➔ Lập hồ sơ tra soát (Case L3).
   - **Legit (Giao dịch thật)**: Khách xác nhận là họ mua sắm ➔ Face ID xác thực ➔ Mở khóa thẻ ➔ Whitelist phiên thiết bị ➔ Giám sát tăng cường 30 phút.
   - **Timeout (Không phản hồi)**: Khách ngủ say ➔ Hết 5 phút chờ ➔ Gửi SMS fallback ➔ Chuyển tiếp khẩn cấp cho con người (Fraud Ops) ➔ Tiếp tục khóa bảo toàn thẻ.
5. **Đồng bộ thời gian thực với Backend**: Frontend gửi trạng thái sang máy chủ backend giả lập để ghi nhật ký giao diện dòng lệnh (Terminal console log) chi tiết.

---

## 🛠️ Yêu Cầu Hệ Thống

- **Node.js** (Phiên bản v18 trở lên khuyến nghị)
- **NPM** (Đi kèm Node.js)

---

## 🚀 Hướng Dẫn Cài Đặt và Khởi Chạy

Chạy các lệnh dưới đây từ thư mục gốc của dự án (`h:/Knight/coopbank-knight-prototype`):

### Bước 1: Cài đặt thư viện phụ thuộc
```bash
npm install
```

### Bước 2: Khởi động Máy chủ Cảnh báo Backend (Terminal 1)
Máy chủ giả lập này nhận dữ liệu nhật ký bảo mật và cho phép kích hoạt sự cố từ xa:
```bash
npm run server
```
* **Phím điều khiển tại Terminal**:
  - `[Space]` / `[Enter]` / `[S]`: Kích hoạt cảnh báo rủi ro đột xuất.
  - `[R]`: Reset trạng thái ứng dụng về ban đầu.
  - `[Q]`: Thoát máy chủ.

### Bước 3: Khởi động Giao diện Web App (Terminal 2)
```bash
npm run dev
```
Mở đường dẫn **http://localhost:5173/** trên trình duyệt của bạn (khuyến nghị chế độ Mobile View hoặc Responsive Mode có chiều rộng khoảng 400px - 500px).

---

## 📑 Kiến Trúc Các Tầng Bảo Mật (Policy Levels)

Mô hình bảo vệ của KNIGHT được xây dựng trên 5 tầng bảo mật từ L0 đến L4:

| Cấp độ | Tên gọi | Hành động thực thi chính |
| :---: | :---: | :--- |
| **L0** | **Observe** | Phân tích 3 tín hiệu rủi ro (Thiết bị mới, IP VPN lạ, tần suất giao dịch đột biến lúc 2AM). Risk Score vọt lên 847/1000. |
| **L1** | **Notify** | Gửi tin nhắn đẩy (Push Notification) và tin nhắn dự phòng (SMS fallback) đến thiết bị tin cậy của khách hàng. |
| **L2** | **Protect** | Tạm khóa thẻ số trên hệ thống Core Banking để bảo toàn số dư tạm thời (Hành động có thể hoàn trả). |
| **L3** | **Biometric Verify** | Yêu cầu Face ID để ký số không từ chối cho các hành động không thể hoàn trả (Hủy thẻ, cấp thẻ mới, whitelist thiết bị). |
| **L4** | **Escalate** | Chuyển tiếp hồ sơ sự kiện và bằng chứng số lên đội ngũ kiểm duyệt thủ công của ngân hàng (Human Fraud Ops). |

---

## 🧪 Kiểm Thử Tự Động (Automated Testing)

Chúng tôi cung cấp hệ thống kiểm thử toàn diện bằng **Vitest** để xác thực các kịch bản chuyển đổi trạng thái của State Machine và giao diện người dùng:

```bash
# Chạy tất cả các bài kiểm thử đơn vị
npm run test

# Chạy kiểm thử có tạo báo cáo độ bao phủ mã nguồn (Coverage)
npm run test:coverage
```
*Lưu ý: Trong môi trường chạy test tự động, các độ trễ chuyển cảnh được thiết lập bằng 0 để các bước kiểm tra (assertions) diễn ra tức thì.*

---

## 📁 Cấu Trúc Thư Mục Dự Án

```markdown
coopbank-knight-prototype/
├── docs/                      # Tài liệu thiết kế và đặc tả trải nghiệm
├── server/
│   └── index.js               # Động cơ backend nhận log và mô phỏng còi cảnh báo
├── src/
│   ├── app/
│   │   ├── App.tsx            # Thành phần container chính (sequential state machine)
│   │   └── App.test.tsx       # Bộ test tích hợp giao diện người dùng
│   ├── components/            # Các màn hình điện thoại và khung hiển thị AI Agent
│   │   ├── KnightAgentVisual.tsx # Giao diện hoạt họa của KNIGHT AI Agent
│   │   ├── BiometricStepUp.tsx   # Giao diện Face ID
│   │   └── ...
│   ├── domain/                # Bộ máy trạng thái, kiểm tra chính sách bảo mật
│   ├── styles/                # CSS styling hệ thống tokens và app
│   └── main.tsx
├── package.json
└── vite.config.ts
```
