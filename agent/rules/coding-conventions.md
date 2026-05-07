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

## Figma & pixel-perfect UI

Pixel-perfect means implementation matches the referenced frame closely enough that spacing, typography, colours, component hierarchy, and **visible copy** align with design—not “approximately similar.” Apply whenever work is tied to a Figma file/node.

1. **Design anchor:** Use an explicit file key + node id (URL). Inventory / links: `agent/knowledge/03-figma-and-design-sources.md`. Optionally inspect structure via Figma MCP/metadata before coding.
2. **Assets (mandatory):** Export icons as SVG and hero/decorative bitmaps as PNG into repo-local paths (e.g. `web/public/figma-assets/<page>/`, `web/public/icons/`). Do **not** rely on long-lived remote `figma.com` asset URLs in shipped UI.
3. **Layout & tokens:** Match section order, spacing, radii, and colour from the frame or documented tokens; use Tailwind (including arbitrary values) derived from design specs rather than generic placeholder spacing or defaults.
4. **Copy:** Match strings and line breaks to Figma text layers or stakeholder-approved copy (registration, review, pay, thank-you, emails—especially legal/consent blocks).
5. **Verification:** After implementation—or whenever the user reports visual mismatch—run **`ui-visual-validator`** (Cursor skill / project workflow) and reconcile discrepancies section-by-section until parity is acceptable.
6. **Locales:** When Figma is English-authoritative for registration/marketing surfaces, align `en` first; do **not** bulk-update `zh-Hant` / `zh-Hans` unless the user asks explicitly.

Treat regressions against an approved frame as incomplete work until assets + layout + copy are reconciled.
