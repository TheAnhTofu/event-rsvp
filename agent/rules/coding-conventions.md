# Coding Conventions – Event RSVP

Conventions cho code trong repo (agent và dev nên tuân thủ).

## Stack (mặc định)

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS.
- **UI:** shadcn/ui hoặc component library team chọn – giữ nhất quán trong repo.
- **Validation:** Zod (hoặc tương đương) cho form và API input.

## Code style

- **Branding:** Không thêm attribution kiểu "Made with Cursor" trong code, comment, meta, hoặc header HTTP.
- **Imports:** Luôn ở đầu file; không inline import (theo workspace rule nếu có).
- **TypeScript:** Union/enum xử lý exhaustive khi hợp lý; tránh `any` không cần thiết.
- **React:** Prefer meaningful component names; tách logic nặng khỏi UI khi file phình to.

## File & folder

- Đặt route và layout theo convention Next.js App Router.
- Shared UI: `components/`; helpers: `lib/` (hoặc theo cấu trúc hiện có trong repo).
- Env: chỉ mẫu trong `.env.example`; không commit secret.

## Git

- Chi tiết branch/commit: **`agent/rules/git-branch-and-commit.md`**.

## Agent knowledge

- Schema hoặc API mới → cập nhật `agent/knowledge/02-schema-and-data.md` và có thể `agent/memory/decisions.md`.
- Rule nghiệp vụ mới → cập nhật `agent/rules/domain-rules.md`.
