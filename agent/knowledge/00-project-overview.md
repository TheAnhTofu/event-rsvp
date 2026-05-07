# Event RSVP – Project Overview

## Spec chính

**Nguồn yêu cầu sản phẩm:** [`docs/PRODUCT-SPEC.md`](../../docs/PRODUCT-SPEC.md) — luồng đăng ký nhiều bước (Registration → Review → Pay), email, thanh toán, backlog IAIS/AIF; ưu tiên **Web & Email** cho MVP demo.

## Tên & mục đích

- **Tên làm việc:** Event RSVP / IAIS-style event registration (workspace `event-rsvp`).
- **Mục đích:** Web thu đăng ký sự kiện có cấu trúc, gửi email transactional, hỗ trợ thanh toán (Stripe / bank transfer trong backlog đầy đủ).

## Phạm vi tóm tắt

1. Landing + wizard 3 bước theo Figma (*Physical Registration Form*).
2. Lưu bản ghi đăng ký + (MVP) gửi acknowledge/confirmation email.
3. Thank you page; admin/export tùy thời gian.
4. Onsite badge, đa ngôn ngữ AIF đầy đủ, health check — xem **ngoài MVP** trong spec.

## Phiên bản tài liệu overview

- Cập nhật khi `docs/PRODUCT-SPEC.md` đổi version; đồng bộ `01-modules.md` / `02-schema-and-data.md` khi kiến trúc ổn định.
- **Figma (file key, frame, link):** [`03-figma-and-design-sources.md`](03-figma-and-design-sources.md); token & checklist QC: [`.design/DNA.md`](../../.design/DNA.md).
- **Triển khai production (Docker, ECR, ECS, profile Newtofu):** [`04-deployment-aws.md`](04-deployment-aws.md).
- **Thanh toán khu vực (PaymentAsia / PA-SYS, hosted page + API):** [`06-paymentasia-pa-sys-integration.md`](06-paymentasia-pa-sys-integration.md) — tham chiếu khi mở rộng ngoài Stripe.
