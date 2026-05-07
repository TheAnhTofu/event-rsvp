# Domain Rules – Event RSVP

Rules nghiệp vụ khi implement hoặc review (điều chỉnh theo product thực tế).

## Event (sự kiện)

- Mỗi event có thông tin tối thiểu: tiêu đề, thời gian (hoặc khoảng), timezone rõ ràng nếu public.
- Chủ event (host/organizer) có quyền chỉnh event và xem danh sách phản hồi theo policy privacy.

## RSVP / Guest

- **Response:** Chuẩn gợi ý: `yes` | `no` | `maybe` (hoặc tương đương); có thể thêm `pending` nếu mời trước khi khách mở link.
- **Một khách / một phản hồi chính:** Tránh duplicate; nếu cho phép đổi ý, lưu `updated_at` hoặc version.
- **Email / tên:** Validate format email khi thu thập; trim whitespace; không tin tưởng input chưa sanitize cho hiển thị (XSS).

## Capacity & waitlist (nếu có)

- Nếu giới hạn chỗ: khi `yes` đạt cap → từ chối hoặc chuyển waitlist theo spec sản phẩm.
- Race condition: xử lý ở DB transaction hoặc atomic update khi cần.

## Link mời & quyền

- Public RSVP link: dùng **token không đoán được** (UUID/random đủ entropy), không chỉ dựa vào sequential id.
- Không expose danh sách email khách cho người không có quyền.

## Thông báo (nếu có)

- Gửi email nhắc / xác nhận: idempotent khi có thể (tránh double-send cùng hành động).
- Nội dung không chứa secret trong URL log.

## Data integrity

- Soft delete hoặc hard delete theo yêu cầu compliance; ghi rõ trong `decisions.md` khi chọn.
- Export dữ liệu cá nhân: tuân GDPR/consent nếu áp dụng.
