# Modules – Event RSVP

Bản đồ module gợi ý; **cập nhật** khi repo đã có cấu trúc thật.

## Cấu trúc hiện tại

- **CRM API (Node.js, tách repo-app):** thư mục `crm-api/` — Express + TypeScript, đọc bảng `registrations` (và có thể mở rộng). Truy cập admin qua Next + `source-backend` proxy (`/api/crm/...`), không dùng `x-api-key` giữa proxy và crm-api. Chạy: `cd crm-api && npm run dev` (xem `.env.example`).
- **Next.js app:** thư mục `web/` — `src/app/page.tsx` (landing), `src/app/register/` (wizard Registration → Review → Pay), `src/app/register/thank-you/`.
- **Figma & file thiết kế:** `agent/knowledge/03-figma-and-design-sources.md` (file key, node frame chính, URL).
- **Design DNA (token + parity copy):** `.design/DNA.md` (chi tiết từ Figma IAIS Registration).
- **Deploy AWS:** `web/Dockerfile`, script `web/scripts/deploy-ecs.sh`, cấu hình mô tả trong `agent/knowledge/04-deployment-aws.md` (ECR `event-rsvp-web`, ECS cluster/service `ap-southeast-1`, profile `newtofu`).

## Gợi ý theo Next.js App Router

| Khu vực | Mô tả |
|--------|--------|
| **Marketing / landing** | `web/src/app/page.tsx` — CTA đăng ký. |
| **Public registration** | `web/src/app/register` — form đa bước theo `docs/PRODUCT-SPEC.md`. |
| **Auth / Admin** | CRM REST API trong `crm-api/` (API key); UI admin Figma/backlog có thể gọi API này. |
| **API / Email** | API routes (`/api/registrations/*`, Stripe, queue, SES); xem code trong `web/src/app/api/`. |

## Tích hợp

- **DB:** Postgres / SQLite / Turso / v.v. – ghi rõ trong `decisions.md` và `02-schema-and-data.md` khi đã chọn.
- **Email:** Resend, SendGrid, Postmark – không hardcode API key.
- **Thanh toán:** Stripe (luồng hiện tại trong `source-backend/` / web). **PaymentAsia / PA-SYS** (Alipay, WeChat Pay, CUP, CreditCard, FPS, Octopus, generic `UserDefine`): spec kỹ thuật — [`06-paymentasia-pa-sys-integration.md`](06-paymentasia-pa-sys-integration.md) (`payment.pa-sys.com`, `gateway.pa-sys.com`, chữ ký SHA-512, notify data-feed).

## Ghi chú cho agent

Khi thêm thư mục mới (`app/(marketing)`, `app/api/rsvp`, …), cập nhật bảng trên để agent và dev cùng một bản đồ.
