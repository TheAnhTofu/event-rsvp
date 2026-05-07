# Event RSVP – Agent Instructions

AI agent làm việc trong repo này **đọc và tuân thủ** các file trong `agent/`.

## Đọc trước khi làm task

1. **Spec sản phẩm:** `docs/PRODUCT-SPEC.md` – luồng, form, email, data model, acceptance MVP.
2. **Kiến thức dự án:** `agent/knowledge/` (`00`–`06`) – overview, modules, schema gợi ý, Figma & nguồn thiết kế, **deploy AWS (EC2/ECR/Cloudflare)**, bài học vận hành SES/DNS (`05`), **PaymentAsia / PA-SYS** (Alipay, WeChat, CUP, thẻ, FPS, Octopus, `06`).
3. **Rule chính:** `agent/rules/AGENTS.md` – nguồn kiến thức, hành vi, khi nào cập nhật.
4. **Rule domain:** `agent/rules/domain-rules.md` – sự kiện, khách, RSVP, quyền riêng tư, dữ liệu.
5. **Conventions:** `agent/rules/coding-conventions.md` – Next.js, Tailwind CSS, TypeScript, cấu trúc repo.
6. **Git:** `agent/rules/git-branch-and-commit.md` – tên branch, commit message (Conventional Commits).

## Memory (cập nhật khi cần)

- **Quyết định:** `agent/memory/decisions.md` – ADR-style khi đổi kiến trúc / schema / stack.
- **Thuật ngữ:** `agent/memory/glossary.md` – RSVP, guest, capacity, v.v.
- Cách cập nhật: `agent/memory/README.md`.

## Khi xong task

Làm theo **mục "Khi hoàn thành task"** trong `agent/rules/AGENTS.md` (memory, báo cáo tùy ticket, git).

## Tóm tắt bắt buộc

- **Stack:** Next.js, Tailwind CSS (theo preference dự án).
- **Scope:** Đăng ký sự kiện (wizard Registration → Review → Pay), email transactional, thanh toán (xem `docs/PRODUCT-SPEC.md`).
- **Code:** Imports đầu file; TypeScript strict; validate input (ví dụ Zod) cho API/forms.

Cập nhật `agent/knowledge/` khi product spec thay đổi.

## Learned User Preferences

- Khi user đưa Figma node, triển khai UI bám sát frame đó và dùng asset/icon thực từ Figma hoặc S3 thay vì placeholder generic; khi user đưa copy chính xác cho thank-you hoặc trạng thái thanh toán, giữ đúng ngắt dòng và bỏ các khối họ yêu cầu gỡ (ví dụ phí tham dự).
- Khi chỉnh copy/layout đăng ký bám Figma với tiếng Anh là mục tiêu, không cập nhật `zh-Hant` / `zh-Hans` trừ khi user yêu cầu rõ ràng.
- Triển khai UI từ Figma phải pixel-perfect (luôn luôn): tải icon Figma về repo dưới dạng SVG và hero/background bitmap dưới dạng PNG thay vì giữ URL Figma, rồi chạy `ui-visual-validator` để đối chiếu khi user phản hồi UI chưa khớp.
- Khi user yêu cầu deploy lên EC2/prod trong repo này, agent chạy `bash scripts/deploy-ec2.sh` hoặc `yarn deploy:ec2` từ `web/` (Docker build, ECR, SSM Run Command), không chỉ dừng ở hướng dẫn push GitHub Actions — trừ khi họ chỉ định chỉ dùng CI.
- Hiển thị jurisdiction Hong Kong nhất quán là **Hong Kong only** trên toàn app; không dùng “Hong Kong, China” hay “China, Hong Kong”.

## Learned Workspace Facts

- Public web is English-only: routing uses `en` only; legacy `zh-Hant` / `zh-Hans` path prefixes redirect to the same unprefixed path; the public language switcher was removed.
- Homepage audience selection drives registration pricing; Registration, Review, and Pay should carry forward the selected audience instead of deriving price from attendance alone.
- Registration forms use progressive disclosure: lunch follow-up fields appear only for options that require details, dietary details appear only after "Yes", and "Other" selections show free-text input; Industry and Fellow paths use `IndustryPanel` with gap-only spacing between sections (no horizontal dividers), matching the IAIS Members layout rhythm.
- Members registration extends the flow with Figma-aligned fields (e.g. delegate role, jurisdiction, committee meetings, annual conference and lunch/social/dietary/travel, acknowledgements) kept in sync across schema, UI, review, and pay.
- Registrant data stores first name and last name separately, but the registrant list table renders them combined into a single sortable `Name` column (sorted by `last_name`); admin forms and profile views still expose them as separate fields.
- `registration_confirmed` can be a transient status because approve/email/payment steps may advance records immediately to later statuses.
- User-uploaded receipts and generated user-facing PDF documents are stored in S3 and loaded by registration/reference identity.
- Legal pages that use `LegalPageShell` (e.g. `/privacy`) omit the white top `SiteHeader` bar so content starts with the policy hero/banner; transactional email previews using admin `iframe` + `srcDoc` must use `sandbox="allow-same-origin"`, and S3 objects used in email must match bytes with correct `Content-Type` (e.g. do not serve SVG as `image/png`).
- When a registration path has no payment due (e.g. user will not attend), the flow should land on thank-you without a separate pay step; wallet/checkout uses PaymentAsia PA-SYS only (QFPay removed from code; legacy `qfpay` may remain in old DB rows).
- Event schedule and editable registration copy (committee day labels, industry conference day labels, refund deadline, cancellation contact email) live in `web/src/content/registration-event-content.json` and supporting TS helpers; avoid hardcoding those strings in components. Base HKD amounts for the simple in-person and online tiers (`REGISTRATION_FEE_IN_PERSON_HKD` / `REGISTRATION_FEE_ONLINE_HKD`) are fixed in `web/src/lib/registration-schema.ts` and `source-backend/src/lib/registration-schema.ts`, not via `NEXT_PUBLIC_*` env vars.
- Local Figma assets live under `web/public/figma-assets/<page>/` (e.g. `homepage/`, `thank-you/`, `admin-login/`): icons as SVG and hero/footer/background bitmaps as PNG; reference local paths instead of remote Figma URLs. next-intl: `getRequestConfig` (`web/src/i18n/request.ts`), `NextIntlClientProvider` in `web/src/app/[locale]/layout.tsx`, and `render-with-intl` must all pass the same `timeZone` (`DEFAULT_TIME_ZONE` / `Asia/Hong_Kong` from `@/i18n/routing`); omitting `timeZone` on the client triggers `ENVIRONMENT_FALLBACK` and can mismatch SSR vs client date rendering.
- Admin views should be driven by actual history rather than expected pipeline state: `RegistrationStatusTimeline` only renders steps with real timestamps from `status_audit`/`email_logs` (pending phases are filtered out), and `iaais-a6-badge-print.tsx` (Figma "Badge without background" 861:4107 — white card, black names/company, day-marker circle, QR, green dot, orange bar at the bottom of the content block; no background image or green-marker asset) only fires `window.print` after the QR data URL is decoded plus two `requestAnimationFrame`s.
