# Event RSVP – Backlog TODO

Checklist theo epic. Tick `- [x]` khi xong; cập nhật [`agent/memory/decisions.md`](../agent/memory/decisions.md) nếu đổi kiến trúc.

## Mục lục

1. [Bug & email assets](#1-bug--email-assets)
2. [Email providers (SES + Resend)](#2-email-providers-ses--resend)
3. [Admin UI & Design DNA](#3-admin-ui--design-dna)
4. [Pipeline status & timeline](#4-pipeline-status--timeline)
5. [Admin authentication & RBAC](#5-admin-authentication--rbac)
6. [GitHub CI/CD](#6-github-cicd)
7. [Architecture & infrastructure](#7-architecture--infrastructure)
8. [Tests & payment wallets](#8-tests--payment-wallets)
9. [Outbound payment webhooks](#9-outbound-payment-webhooks)

---

## 1. Bug & email assets

| Task | Status | Notes / DoD |
|------|--------|-------------|
| Export header banner từ Figma [node 321-24867](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/IAIS---AIF-%7C-Registration-Form-Web?node-id=321-24867) | [ ] | PNG đúng brand; không nhầm với `insurance-authority-logo.png` (receipt/PDF). |
| Upload lên S3 (prefix `email-assets/` hoặc bucket ops) | [ ] | Script: `web/scripts/upload-email-header-to-s3.mjs` |
| Set `EMAIL_HEADER_IMAGE_URL` trên production | [ ] | HTTPS public; CDN/CloudFront optional |
| Cập nhật [`web/src/lib/email/email-assets.ts`](../web/src/lib/email/email-assets.ts) + [`web/.env.example`](../web/.env.example) | [ ] | Override env document rõ |

**Dependencies:** AWS credentials có quyền `s3:PutObject`.

---

## 2. Email providers (SES + Resend)

| Task | Status | Notes / DoD |
|------|--------|-------------|
| Resend fallback khi SES lỗi hoặc `EMAIL_PROVIDER=resend` | [ ] | [`web/src/lib/email/send-transactional-email.ts`](../web/src/lib/email/send-transactional-email.ts) |
| Cột `provider` trên `email_logs` | [ ] | Migration `007_email_logs_provider.sql` |
| Ghi log `ses` / `resend` khi gửi | [ ] | [`web/src/db/email-logs.ts`](../web/src/db/email-logs.ts) |
| Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | [ ] | Domain verify trên Resend |

---

## 3. Admin UI & Design DNA

| Task | Status | Notes / DoD |
|------|--------|-------------|
| Registration list theo Figma [90-6587](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/IAIS---AIF-%7C-Registration-Form-Web?node-id=90-6587) | [ ] | [`web/src/app/[locale]/admin/emails/page.tsx`](../web/src/app/[locale]/admin/emails/page.tsx) |
| DNA admin: sidebar, table, pills | [ ] | [`.design/DNA-admin.md`](../.design/DNA-admin.md) + Figma [199-26013](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/IAIS---AIF-%7C-Registration-Form-Web?node-id=199-26013), [125-6758](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/IAIS---AIF-%7C-Registration-Form-Web?node-id=125-6758) |

---

## 4. Pipeline status & timeline

| Task | Status | Notes / DoD |
|------|--------|-------------|
| State machine + điều kiện từng bước | [ ] | [`web/src/lib/admin/registration-pipeline.ts`](../web/src/lib/admin/registration-pipeline.ts) |
| Timeline UI Figma [125-7154](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/IAIS---AIF-%7C-Registration-Form-Web?node-id=125-7154) | [ ] | [`web/src/components/admin/RegistrationStatusTimeline.tsx`](../web/src/components/admin/RegistrationStatusTimeline.tsx) |
| Gắn vào chi tiết đăng ký | [ ] | [`web/src/app/[locale]/admin/registrations/[reference]/page.tsx`](../web/src/app/[locale]/admin/registrations/[reference]/page.tsx) |
| ADR nếu thêm bảng events (tùy chọn) | [ ] | [`agent/memory/decisions.md`](../agent/memory/decisions.md) |

---

## 5. Admin authentication & RBAC

| Task | Status | Notes / DoD |
|------|--------|-------------|
| Session JWT + cookie `admin_session` | [ ] | [`web/src/lib/admin-auth/session.ts`](../web/src/lib/admin-auth/session.ts) |
| Trang `/admin/login` | [ ] | [`web/src/app/[locale]/admin/login/page.tsx`](../web/src/app/[locale]/admin/login/page.tsx) |
| Middleware bảo vệ `/admin` | [ ] | [`web/src/middleware.ts`](../web/src/middleware.ts) |
| API `requireAdmin` / role `viewer` read-only | [ ] | [`web/src/lib/admin-auth/require-admin-api.ts`](../web/src/lib/admin-auth/require-admin-api.ts) |
| Env: `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD`, optional `ADMIN_VIEWER_PASSWORD` | [ ] | [`web/.env.example`](../web/.env.example) |

---

## 6. GitHub CI/CD

| Task | Status | Notes / DoD |
|------|--------|-------------|
| Workflow lint + test (Vitest) trên PR | [ ] | [`.github/workflows/ci-web.yml`](../.github/workflows/ci-web.yml) |
| Giữ deploy EC2 hiện có | [ ] | [`.github/workflows/deploy-ec2.yml`](../.github/workflows/deploy-ec2.yml) |

---

## 7. Architecture & infrastructure

| Task | Status | Notes / DoD |
|------|--------|-------------|
| ADR: tách FE/BE, RDS thay Neon | [ ] | [`agent/memory/decisions.md`](../agent/memory/decisions.md) |
| Docker Compose + healthchecks | [ ] | [`docker-compose.yml`](../docker-compose.yml) |
| Logging: structured logs / note Promtail-Loki (optional) | [ ] | Trong compose hoặc ADR |

---

## 8. Tests & payment wallets

| Task | Status | Notes / DoD |
|------|--------|-------------|
| Unit: pipeline timeline / điều kiện status | [ ] | Vitest |
| Unit: transactional email provider order (mock) | [ ] | Vitest |
| QA matrix: Apple Pay (Safari), Google Pay (Chrome) | [ ] | Checklist thủ công hoặc ghi trong tài liệu |

---

## 9. Outbound payment webhooks

| Task | Status | Notes / DoD |
|------|--------|-------------|
| Gọi URL khi thanh toán thành công (Stripe fulfillment) | [ ] | [`web/src/lib/payment-notify-webhook.ts`](../web/src/lib/payment-notify-webhook.ts) + Stripe webhook |
| Env: `PAYMENT_NOTIFY_WEBHOOK_URL`, `PAYMENT_NOTIFY_WEBHOOK_SECRET` | [ ] | HMAC optional |

**Platform đích (Slack / Discord / custom):** chọn sau; payload JSON thống nhất.

---

## Thứ tự ưu tiên gợi ý

1. P0: §1 header S3, §2 Resend + migration provider  
2. P1: §3 UI + DNA, §4 timeline  
3. P2: §5 auth, §6 CI  
4. P3: §7 architecture, §8–9 tests & notify  

---

*Generated for incremental delivery; cập nhật checkbox khi từng mục hoàn thành.*
