# Bài học vận hành: AWS (SES + EC2) + Cloudflare

Tài liệu học tập tổng hợp từ debug production (registration API, email, DNS). Dùng cùng `04-deployment-aws.md` cho thông số cụ thể repo.

## 1. Chuỗi nhân quả: từ trình duyệt đến email

1. **Người dùng** → HTTPS tới **Cloudflare** (proxy).
2. Cloudflare → **origin** theo chế độ SSL (ví dụ **Flexible**: HTTPS tới edge, HTTP tới origin).
3. Origin phải **lắng nghe đúng port** mà Cloudflare gọi (với Flexible thường là **80** trên IP public).
4. App (Next.js) gọi **SES** để gửi mail; SES cần **identity đã verify** + **IAM** cho phép `SendEmail`/`SendRawEmail` trên identity đó.
5. **Database:** cùng một `DATABASE_URL` với container — migration phải chạy trên DB đó, nếu không API sẽ lỗi (`42P01`, v.v.).

**Bài học:** Mỗi lớp (DNS → EC2 → app → SES → DB) có thể fail độc lập; log và kiểm tra theo thứ tự từ ngoài vào trong.

## 2. Cloudflare 521 và DNS

- **521** = “Web server is down” — edge Cloudflare **không kết nối được** origin (timeout/refused).
- Nguyên nhân thường gặp:
  - Record **A** trỏ sai IP (instance khác, không có dịch vụ trên port Cloudflare dùng).
  - Instance đúng nhưng **không mở port** (ví dụ chỉ bind `3000` nội bộ, không có `80:3000`).
  - **Sai zone** trong Cloudflare API (mỗi domain một zone ID).

**Bài học:** Xác nhận **đúng zone** (`newtofuevents.com`), **đúng Elastic IP** của EC2 đang chạy container `80→3000`, rồi mới sửa DNS.

## 3. SSL Flexible vs Full

- **Flexible:** Client ↔ Cloudflare = HTTPS; Cloudflare ↔ origin = **HTTP** (thường port **80**).
- Origin không bắt buộc có chứng chỉ TLS; phải có process lắng nghe **80** (hoặc cấu hình khác khớp rule).

**Bài học:** Nếu dùng Flexible, script deploy phải publish **`0.0.0.0:80→3000`**, không chỉ `:3000` nếu edge gọi port 80.

## 4. Amazon SES: không chỉ “gắn SDK”

### 4.1 Identity và FROM

- `AWS_SES_FROM_EMAIL` phải là địa chỉ/email thuộc **identity đã verify** trong SES (email hoặc cả domain).
- Gửi từ identity chưa verify hoặc sai account/region → lỗi hoặc deny.

**Bài học:** Verify **domain** (`newtofuevents.com`) rồi dùng `noreply@...` thay vì địa chỉ dev ở domain khác.

### 4.2 IAM

- Policy cần `ses:SendEmail` / `ses:SendRawEmail` trên **ARN identity** (hoặc `*` có kiểm soát).
- EC2 dùng **instance profile** — đảm bảo role đó có policy SES, không nhầm role/account.

**Bài học:** Khi đổi FROM domain, cập nhật **IAM resource** trong policy cho khớp identity mới.

### 4.3 DKIM, MAIL FROM, SPF, DMARC

- **DKIM:** SES cấp 3 CNAME `xxx._domainkey...` → thêm vào DNS (Cloudflare), proxy thường **tắt** cho record DKIM (gray cloud) nếu SES yêu cầu trỏ thẳng.
- **Custom MAIL FROM:** subdomain (ví dụ `bounce.domain.com`) — MX + SPF cho subdomain đó.
- **SPF** ở root: `v=spf1 include:amazonses.com ...`
- **DMARC:** `_dmarc` TXT — bắt đầu `p=none` để quan sát, sau siết dần.

**Bài học:** Gmail và nhiều provider lọc mạnh; thiếu DKIM/SPF alignment dễ vào spam hoặc không nhận.

### 4.4 Sandbox vs production

- Sandbox: chỉ gửi tới/from đã verify; volume giới hạn.
- **Production access** cần request trong SES; chờ AWS approve.

**Bài học:** Kiểm tra `aws sesv2 get-account` (hoặc console) về `ProductionAccessEnabled` trước khi kỳ vọng gửi hàng loạt.

## 5. Database và migration

- API `500` với Postgres `42P01` (undefined table) → migration chưa chạy trên **đúng** database.
- Nhiều môi trường / host: dễ nhầm connection string giữa dev và prod.

**Bài học:** Một nguồn sự thật: env trên server = nơi chạy `migrate`; sau khi đổi schema, redeploy không tự migrate trừ khi pipeline có bước đó.

## 6. Nhiều EC2 hoặc nhiều IP

- Hai instance khác nhau có thể cùng repo nhưng **env/path** khác — luôn xác định instance nào là **origin** của subdomain production.

**Bài học:** Ghi nhận instance ID + Elastic IP + port map trong tài liệu deploy; tránh chỉnh DNS trỏ nhầm máy.

## 7. Bảo mật vận hành

- **Không** dán Global API Key, `DATABASE_URL`, hoặc secret vào chat, ticket, hay skill có commit public.
- Nếu lỡ lộ: **rotate** API token Cloudflare, đổi password/keys liên quan, rà soát audit log.

**Bài học:** Skill và doc chỉ mô tả *tên* biến và *bước*, không copy giá trị bí mật.

## 8. Checklist nhanh khi “email không tới”

1. Cloudflare → origin có **200/health** không? (tránh 521 trước).
2. Log app / `email_logs`: lỗi SES? IAM? throttling?
3. SES: FROM thuộc identity đã verify? DKIM **Success**?
4. Sandbox: đích có phải email đã verify?
5. Hộp thư: spam, Promotions, delay vài phút.

## Liên quan trong repo

- Chi tiết triển khai: `agent/knowledge/04-deployment-aws.md`
- Code gửi mail: `web/src/lib/email/`
- Skill Cursor (quy trình): `.cursor/skills/aws-cloudflare-ses-setup/SKILL.md`

## Phiên bản đọc (HTML / DOCX / PDF)

- **HTML** (cùng style `PRD_IAIS_RSVP.html`): [`agent/knowledge/LESSON_AWS_Cloudflare_SES.html`](LESSON_AWS_Cloudflare_SES.html) — mở bằng trình duyệt.
- **PDF:** trong trình duyệt mở file HTML → In (`Cmd+P` / `Ctrl+P`) → **Save as PDF** (giữ được CSS in như PRD).
- **DOCX:** [`agent/knowledge/LESSON_AWS_Cloudflare_SES.docx`](LESSON_AWS_Cloudflare_SES.docx) — xuất từ HTML bằng `textutil` trên macOS; bố cục có thể lệch nhẹ so với HTML.
