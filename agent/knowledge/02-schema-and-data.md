# Schema & Data – Event RSVP

Mô hình **gợi ý** cho MVP RSVP. Thay thế bằng schema thực (Prisma/Drizzle/SQL) khi đã implement.

## Entities (logical)

### Event

- `id` (UUID)
- `title` (text)
- `description` (text, optional)
- `starts_at`, `ends_at` (timestamptz, optional theo product)
- `location` hoặc `meeting_url` (text, optional)
- `host_id` (FK user, nếu có auth)
- `capacity` (int, nullable – null = không giới hạn)
- `invite_token` (unique, secret – dùng trong public URL)
- `created_at`, `updated_at`

### RSVP / GuestResponse

- `id` (UUID)
- `event_id` (FK)
- `guest_name` (text)
- `guest_email` (citext hoặc text, validated)
- `status` – `yes` | `no` | `maybe`
- `message` (text, optional)
- `created_at`, `updated_at`
- Unique gợi ý: `(event_id, guest_email)` nếu một email chỉ một phản hồi per event

### User (host) – nếu có auth

- `id`, `email`, `password_hash` hoặc OAuth ids – theo stack auth

## Rules tóm tắt

- `invite_token` không sequential; rotate khi có yêu cầu bảo mật (ghi `decisions.md`).
- Mọi thay đổi schema ảnh hưởng API → cập nhật file này và migration.

## Validation

- Email: RFC-style validation ở tầng app.
- Datetime: lưu UTC; hiển thị theo timezone event hoặc browser.

## Bổ sung – app `web/` (Postgres)

- **`email_logs`** (`web/db/migrations/003_email_logs.sql`): audit gửi email (Amazon SES) — `registration_reference`, `template_key`, `to_email`, `status` (`sent` | `failed`), `provider_message_id`, `error_message`.

## Hướng tối ưu truy vấn (2026-04 — đề xuất)

Hiện tại admin list (`admin-emails-list`) join `bank_transfer_slips`, `email_logs` và nhiều điều kiện pipeline — chậm khi bảng lớn.

1. **Materialized pipeline (tuỳ chọn):** cột `pipeline_stage` (text) + trigger hoặc job cập nhật khi đổi `payment_status`, `approval_status`, `thank_you` (từ log). Index `(pipeline_stage, created_at DESC)` cho filter tab.
2. **Tách denormalize cho sort:** đã có `payment_reference_sort` trong query — giữ một cột generated/stored trên `registrations` nếu sort theo reference Stripe dùng nhiều.
3. **Email log tra cứu:** index `(registration_reference, template_key, created_at DESC)` trên `email_logs` (nếu chưa có).
4. **CRM read model:** nếu vẫn cần `crm-api` riêng, đồng bộ bằng CDC hoặc view DB thay vì service thứ hai — hoặc bỏ CRM API nếu mọi admin đọc qua Next + Postgres (như detail page).

Migration cụ thể: chờ khối lượng dữ liệu và SLO query; không bắt buộc cho MVP nhỏ.
