---
name: agent-workspace-scaffold
description: Scaffolds AGENTS.md plus agent/knowledge, agent/rules, and agent/memory (EventConnect-style) for Cursor. Use when the user wants agent rules, conventions, and knowledge folders for a new repo, bootstrap agent documentation, replicate EventConnect-style agent setup, or standardize AI instructions across projects.
---

# Agent workspace scaffold (EventConnect-style)

## Purpose

Tạo bộ file chuẩn để agent Cursor có **một nguồn đọc cố định**: rule, convention, knowledge, memory (ADR + glossary). Mô hình tham chiếu: repo có `AGENTS.md` ở root và thư mục `agent/`.

## When to apply

- User yêu cầu "tạo agent folder", "rule cho agent", "convention + knowledge như EventConnect", "bootstrap agent cho project mới".
- Bắt đầu greenfield hoặc thêm tài liệu agent vào repo hiện có **chưa** có `agent/`.

## Before creating files

Thu thập (hỏi ngắn nếu thiếu):

1. **Tên dự án** (hiển thị trong doc).
2. **Một dòng mục đích** (product/domain).
3. **Stack** (ví dụ Next.js + Tailwind, FastAPI, v.v.) – mặc định nếu user rule là Next.js + Tailwind thì ghi đúng vậy.
4. **Ngôn ngữ doc:** tiếng Việt, tiếng Anh, hoặc song song – mặc định **tiếng Việt** nếu user nói tiếng Việt.
5. **Repo layout:** monorepo (nhiều package) hay single app – điều chỉnh `01-modules.md` và checklist git cho phù hợp.

**Không** ghi secret, token, hay nội dung nhạy cảm vào template.

## Directory structure to create

```
<repo-root>/
├── AGENTS.md
├── .cursor/
│   └── rules/
│       └── <project-slug>-agent.mdc    # optional, alwaysApply
└── agent/
    ├── README.md
    ├── knowledge/
    │   ├── 00-project-overview.md
    │   ├── 01-modules.md
    │   └── 02-schema-and-data.md       # or rename to domain-data.md if non-DB
    ├── memory/
    │   ├── README.md
    │   ├── decisions.md
    │   └── glossary.md
    └── rules/
        ├── AGENTS.md
        ├── domain-rules.md
        ├── coding-conventions.md
        └── git-branch-and-commit.md
```

Tùy chọn sau: `agent/reports/`, `knowledge/03-tech-stack.md`, `knowledge/06-workflow.md` (Jira, v.v.).

## Implementation steps

1. **Chọn slug** cho rule Cursor: ví dụ `acme-portal` → file `acme-portal-agent.mdc`.
2. **Tạo file theo thứ tự:** `AGENTS.md` → `agent/README.md` → `agent/rules/*` → `agent/knowledge/*` → `agent/memory/*` → `.cursor/rules/*.mdc`.
3. **Thay placeholder** trong mọi file:
   - `{{PROJECT_NAME}}`
   - `{{PROJECT_PURPOSE}}`
   - `{{STACK}}`
4. **Không** xóa file code hiện có; chỉ thêm doc. Nếu `AGENTS.md` hoặc `agent/` đã tồn tại, **merge** hoặc hỏi user trước khi ghi đè.
5. **Ghi một ADR đầu tiên** trong `agent/memory/decisions.md`: ngày hôm nay, Context = user muốn chuẩn hóa agent workspace, Decision = tạo cấu trúc `agent/`, Consequences = cập nhật knowledge khi spec đổi.

## Content guidelines

- **Root `AGENTS.md`:** Danh sách "đọc trước khi làm task", pointer tới `agent/rules/AGENTS.md`, memory, checklist khi xong task (ngắn gọn).
- **`agent/rules/AGENTS.md`:** Nguồn kiến thức, hành vi chung, khi nào cập nhật knowledge/memory, checklist hoàn thành task.
- **`coding-conventions.md`:** Stack, imports, TS, validation, branding (không "Made with Cursor"), cấu trúc thư mục.
- **`git-branch-and-commit.md`:** Branch `type/desc` hoặc `type/TICKET-desc`; Conventional Commits; ghi chú monorepo nếu có nhiều `.git`.
- **`domain-rules.md`:** Chỉ rule nghiệp vụ **cụ thể** cho product; nếu chưa rõ, để mục "Cập nhật khi có spec" + 3–5 bullet an toàn chung (validation, privacy, không log secret).
- **`02-schema-and-data.md`:** Entity logical + validation; ghi rõ "gợi ý" nếu chưa có migration thật.
- **`.mdc` rule:** `alwaysApply: true`, `globs: "**/*"`, 4–6 dòng trỏ về `AGENTS.md` và `agent/rules/`.

## Minimal `.mdc` frontmatter pattern

```yaml
---
description: <PROJECT_NAME> – read AGENTS.md and agent/ rules
globs: "**/*"
alwaysApply: true
---
```

Body: bullet trỏ `AGENTS.md`, `agent/rules/AGENTS.md`, `agent/knowledge/`, `agent/memory/decisions.md`.

## Copy skill to other projects

- **Toàn máy:** copy cả thư mục `.cursor/skills/agent-workspace-scaffold/` vào `~/.cursor/skills/agent-workspace-scaffold/`.
- **Theo repo:** giữ trong `<repo>/.cursor/skills/agent-workspace-scaffold/` và commit để team dùng chung.

Sau đó user (hoặc agent) gõ: *"dùng skill agent-workspace-scaffold cho repo này"* hoặc *"bootstrap agent folder"*.

## Verification

- Mọi path trong `AGENTS.md` trỏ đúng file đã tạo.
- Không có mâu thuẫn (ví dụ checklist nói Jira nhưng project không dùng Jira – bỏ mục đó).

## Full copy-paste templates

Trong cùng package skill, xem **`reference.md`** – chứa toàn bộ khung markdown cho từng file (placeholders `{{PROJECT_NAME}}`, v.v.).
