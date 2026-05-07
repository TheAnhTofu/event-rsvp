# Glossary – Event RSVP

Thuật ngữ domain (bổ sung khi product cố định hơn).

| Term | Definition |
|------|------------|
| **Host** | Người tạo/quản lý sự kiện và xem phản hồi (có thể cần đăng nhập). |
| **Guest** | Người được mời; gửi RSVP qua link hoặc form. |
| **RSVP** | Phản hồi tham dự: thường Yes / No / Maybe. |
| **Invite token** | Chuỗi bí mật trong URL công khai để map tới một event cụ thể. |
| **Capacity** | Giới hạn số chỗ; có thể null nếu không giới hạn. |
| **Waitlist** | Hàng chờ khi số Yes đạt capacity (nếu product hỗ trợ). |
| **user-admin** | Repo backend (ngoài `event-rsvp`): admin / quản trị user — xem `agent/memory/decisions.md` (2026-04-01). |
| **source-backend** | Express API trong monorepo (`source-backend/`): đăng ký, admin, Stripe, queue — xem `agent/memory/decisions.md` (2026-04-02). |
| **event-rsvp-pg** | **Amazon RDS** PostgreSQL 16 (production, account Newtofu `ap-southeast-1`): instance identifier; endpoint và SG trong `agent/knowledge/04-deployment-aws.md`. |
| **.env.rds.generated** | File cục bộ dưới `web/` (pattern `.env*`, không commit) — chứa `DATABASE_URL` / biến RDS sau khi provision; không dán giá trị vào chat hay ticket. |
| **postgres.js** | Package npm `postgres` — client SQL (tagged template) cho mọi Postgres qua TCP/TLS; code dùng trong `web/src/db/postgres.ts` thay cho `@neondatabase/serverless`. |
| **PA-SYS / PaymentAsia** | Cổng thanh toán hosted (`payment.pa-sys.com`, sandbox `payment-sandbox.pa-sys.com`) và API gateway (`gateway.pa-sys.com`) — Alipay, WeChat, CUP, thẻ, FPS, Octopus; chữ ký SHA-512. Chi tiết: `agent/knowledge/06-paymentasia-pa-sys-integration.md`. |
| **merchant_reference** | Mã đơn duy nhất phía merchant gửi lên PA-SYS (hosted POST / query / refund). |
| **request_reference** | Mã giao dịch do cổng PA-SYS cấp; có trong redirect/data-feed và query API. |

---

_(Thêm hàng vào bảng khi có thuật ngữ mới.)_
