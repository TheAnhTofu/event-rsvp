---
name: aws-cloudflare-ses-setup
description: Triển khai và vận hành Next.js trên EC2 với Cloudflare DNS (SSL Flexible), Amazon SES (domain identity, DKIM, MAIL FROM, IAM), và kiểm tra lỗi 521 / email không đến. Dùng khi user hỏi Cloudflare + AWS SES + EC2, DNS A record, DKIM SPF DMARC, hoặc debug production registration/email.
---

# AWS + Cloudflare + SES — thiết lập và xử lý sự cố

## Khi dùng skill này

- Cấu hình **Cloudflare** (DNS, proxy, SSL mode) trỏ tới **EC2** làm origin.
- Cấu hình **Amazon SES**: verify domain/email, DKIM, custom MAIL FROM, IAM cho EC2/instance profile.
- Debug **521**, **500** API, **email không gửi** hoặc vào spam.

## Nguyên tắc (không secret trong doc)

- **Không** ghi API key Cloudflare, `DATABASE_URL`, Stripe secret, hay bất kỳ credential nào vào skill, commit, hay paste cho user — chỉ tên biến môi trường và hướng dẫn lấy từ Secrets Manager / `.env` local.
- Nếu user dán secret: nhắc **rotate** ngay.

## Luồng kiểm tra từ ngoài vào trong

1. **DNS:** Đúng **zone** Cloudflare cho domain; record **A** trỏ **Elastic IP** của instance đang chạy app **public** (và đúng port mapping — xem bước 2).
2. **Origin port:** Với SSL **Flexible**, Cloudflare thường gọi origin qua **HTTP port 80**. Container Next.js phải map **`80:3000`** (hoặc tương đương), không chỉ expose 3000 nội bộ nếu edge kỳ vọng 80.
3. **App:** `DATABASE_URL` và migration khớp — thiếu bảng → Postgres `42P01` / 500.
4. **SES:** `AWS_REGION`, `AWS_SES_FROM_EMAIL` khớp identity đã verify; IAM `ses:SendEmail`/`ses:SendRawEmail` trên resource identity đúng.

## Cloudflare

- **521:** Edge không kết nối được origin — kiểm IP, security group, process listen, **sai instance** trong DNS.
- Lấy **Zone ID** từ dashboard/API cho **đúng domain** (dễ nhầm nhiều zone).
- DKIM CNAME từ SES: thường **DNS only** (gray cloud) nếu nhà cung cấp yêu cầu; làm theo hướng dẫn SES.

## Amazon SES

1. Verify **domain** (hoặc email) trong SES cùng **region** với app.
2. Bật **Easy DKIM**, thêm CNAME vào DNS.
3. Tùy chọn **custom MAIL FROM** (subdomain) + MX/SPF cho subdomain đó.
4. Root **SPF** (`include:amazonses.com`), **DMARC** (`_dmarc`) theo chính sách team.
5. **IAM:** policy gắn role/instance profile của EC2; resource ARN identity domain/email.
6. **Sandbox:** chỉ gửi tới địa chỉ đã verify — hoặc xin **production access** và chờ AWS duyệt.

## Repo event-rsvp (tham chiếu nội bộ)

- Kiến thức chi tiết: `agent/knowledge/04-deployment-aws.md`
- Bài học tổng hợp: `agent/knowledge/05-aws-cloudflare-ses-lesson.md`
- Quyết định ADR: `agent/memory/decisions.md`

## Checklist email không đến

- Log app / bảng `email_logs` (nếu có): mã lỗi SES hay IAM deny?
- FROM address = identity đã verify?
- DKIM **verified** trong console SES?
- Gmail: spam / Promotions; sandbox: đích đã verify?

## Sau khi chỉnh infrastructure

- Cập nhật `agent/memory/decisions.md` nếu đổi kiến trúc (origin IP, SSL mode, SES identity chính thức).
- Không thêm secret vào `decisions.md` hay knowledge.
