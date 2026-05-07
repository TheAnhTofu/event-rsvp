# Product backlog – stakeholder tickets

Nguồn: feedback Cher Chiu (Slack), ngày ghi nhận **2026-04-06**. Dùng cho dev/agent ưu tiên và traceability. Cập nhật trạng thái khi xong (Done / Wontfix / Deferred).

---

## Thứ tự ưu tiên (tổng quan)

| Tier | Nội dung |
|------|----------|
| **P0** | Bug Review + TC; Admin thiếu action “confirm registration” — xử lý trước để giảm nợ |
| **P1** | Copy/layout Registration·Review & Payment; pricing in-person vs online; EARLYBIRD; Stripe Back; ẩn language bar |
| **P2** | Pay by Bank: bỏ dòng copy dư |
| **P3** | Research / vendor: Alipay & WeChat (Stripe hạn chế; có thể QFPay); review nội dung email (follow-up) |

---

## P0 – Must fix first

**Trạng thái (2026-04-07):** Đang **Reviewing** — đã implement; chờ QA/test trên môi trường thật.

### TICKET-2026-04-06-01 — Review step fails when form filled in Traditional Chinese

- **Mô tả:** Trang Review không hoạt động khi điền đủ field bằng **chữ Hồng Kông / Traditional Chinese**; dữ liệu vẫn lưu được ở admin.
- **Loại:** Bug (validation, encoding, locale, hoặc font/script).
- **Acceptance:** Luồng Registration → Review → Pay hoàn tất với payload toàn ký tự CJK truyền thống; không lỗi client/server không rõ ràng.
- **Ghi chú:** Ưu tiên theo yêu cầu handoff (“solve the above issue first”).

### TICKET-2026-04-06-02 — Admin: thiếu row action “Confirm registration”

- **Mô tả:** Approve payment đã chạy; còn thiếu **hành động xác nhận đăng ký** (confirm registration) ở cấp row/table.
- **Loại:** Feature gap / admin UX.
- **Acceptance:** Có action rõ ràng (và quyền nếu có RBAC) để “confirm registration” khớp nghiệp vụ; nhất quán với trạng thái thanh toán / pipeline.

---

## P1 — Registration & Review

**Trạng thái:** Đã implement trong code (2026-04-07); chờ QA.

### TICKET-2026-04-06-03 — Bỏ top bar trên Registration & Review

- **Acceptance:** Không còn thanh trên cùng theo phạm vi đã thống nhất (layout khớp design).

### TICKET-2026-04-06-04 — Đổi nhãn “Event overview” → “IAIS ANNUAL GENERAL MEETING 2026”

- **Acceptance:** Copy hiển thị đúng chuỗi trên; đồng bộ i18n nếu có key riêng.

### TICKET-2026-04-06-05 — Bỏ title phía trên progress bar

- **Mô tả:** Không hiển thị khối title kiểu “IAIS ANNUAL GENERAL MEETING 2026 / Registration For Participation” **trên** progress bar.
- **Acceptance:** Progress bar và heading theo layout mới (title đã gỡ khỏi vị trí đó).

### TICKET-2026-04-06-06 — Giá khác nhau: Attend in Person vs Attend Online

- **Mô tả:** Hai lựa chọn phải có **giá khác** để thấy rõ chênh lệch ở bước Pay.
- **Acceptance:** Config hoặc mock pricing phản ánh hai mức; trang Pay hiển thị đúng theo lựa chọn.

---

## P1 — Payment page & Stripe flow

**Trạng thái:** Cùng đợt implement code với mục Registration & Review (2026-04-07); chờ QA.

### TICKET-2026-04-06-07 — EARLYBIRD áp dụng tự động, không cần nhập code

- **Mô tả:** User được giảm EARLYBIRD **không cần gõ mã**; **mã giảm giá** chỉ cho promotion cụ thể.
- **Acceptance:** Logic giá/checkout phản ánh điều kiện EARLYBIRD (theo thời gian/rule đã chốt); ô mã chỉ cho promo đặc biệt.

### TICKET-2026-04-06-08 — Ẩn language bar nếu không cho user đổi ngôn ngữ

- **Acceptance:** Không hiển thị UI đổi ngôn ngữ khi tính năng bị khóa / không hỗ trợ.

### TICKET-2026-04-06-09 — Progress bar nằm **trên** title (Payment)

- **Acceptance:** Thứ tự vertical: progress bar → title (không đảo ngược so với hiện tại nếu đang sai).

### TICKET-2026-04-06-10 — Nút Back từ trang chọn phương thức Stripe → quay về **Payment**, không về home/Registration

- **Acceptance:** Điều hướng `cancel`/`return` URL hoặc history phù hợp; smoke test luồng Stripe test mode.

---

## P2 — Pay by Bank

**Trạng thái:** Done (2026-04-07) — đã gỡ hint ở bước chọn Bank; giữ nút Pay now + dòng “not confirmed until paid”.

### TICKET-2026-04-06-11 — Gỡ copy “When you're ready, we'll show the account details for your transfer.”

- **Acceptance:** Không còn dòng đó (hoặc thay bằng copy đã chốt nếu có).

---

## P3 — Research / follow-up (không chặn release UI)

### TICKET-2026-04-06-12 — Alipay (Stripe): QR/link có nhưng thanh toán fail

- **Trạng thái:** Investigation; có thể cần gateway khác.
- **Ghi chú:** Cher xem lại tài liệu; Stripe Alipay/WeChat **hạn chế** — có thể tích hợp **QFPay** (hoặc provider địa phương) riêng cho Alipay & WeChat.

### TICKET-2026-04-06-13 — WeChat Pay (Stripe): chỉ ví Trung Quốc — không test đầy đủ

- **Trạng thái:** Deferred / vendor evaluation cùng TICKET-12.

### TICKET-2026-04-06-14 — Review nội dung email (copy, biến, branding)

- **Trạng thái:** Scheduled (“tmw” trong feedback).
- **Ghi chú:** Email đã gửi được; cần rà soát nội dung.

### TICKET-2026-04-06-15 — Đã verify: Apple Pay, thẻ MasterCard, email delivery

- **Trạng thái:** Positive QA — không cần ticket fix trừ khi có regression.

---

## Trace

| Field | Value |
|-------|--------|
| Nguồn | Cher Chiu feedback (Registration, Review, Payment, Pay by Bank, Admin, QA Alipay/WeChat/Apple Pay/Card/Email) |
| Ngày nhập backlog | 2026-04-06 |
