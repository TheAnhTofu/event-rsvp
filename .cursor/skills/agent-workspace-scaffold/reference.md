# Reference: file templates (placeholders)

Replace `{{PROJECT_NAME}}`, `{{PROJECT_PURPOSE}}`, `{{STACK}}`, `{{PROJECT_SLUG}}`.

---

## AGENTS.md (root)

```markdown
# {{PROJECT_NAME}} – Agent Instructions

AI agent làm việc trong repo này **đọc và tuân thủ** các file trong `agent/`.

## Đọc trước khi làm task

1. **Kiến thức dự án:** `agent/knowledge/` (`00`–`02`).
2. **Rule chính:** `agent/rules/AGENTS.md`.
3. **Rule domain:** `agent/rules/domain-rules.md`.
4. **Conventions:** `agent/rules/coding-conventions.md`.
5. **Git:** `agent/rules/git-branch-and-commit.md`.

## Memory

- **Quyết định:** `agent/memory/decisions.md`
- **Thuật ngữ:** `agent/memory/glossary.md`
- Cách cập nhật: `agent/memory/README.md`

## Khi xong task

Làm theo mục **Khi hoàn thành task** trong `agent/rules/AGENTS.md`.

## Tóm tắt

- **Stack:** {{STACK}}
- **Mục đích:** {{PROJECT_PURPOSE}}
```

---

## agent/README.md

```markdown
# {{PROJECT_NAME}} – Agent Knowledge & Memory

Thư mục chứa kiến thức dự án, memory và rules cho AI agent.

## Cấu trúc

- `knowledge/` – overview, modules, schema/domain data
- `memory/` – decisions (ADR), glossary
- `rules/` – AGENTS, domain, coding, git

## Khi nào cập nhật

- Spec đổi → `agent/knowledge/`
- Quyết định kỹ thuật → `agent/memory/decisions.md`
- Convention mới → `agent/rules/`
```

---

## agent/rules/AGENTS.md (skeleton)

```markdown
# Agent Rules – {{PROJECT_NAME}}

## 1. Nguồn kiến thức

- `agent/knowledge/*.md`
- `agent/memory/decisions.md`, `agent/memory/glossary.md`
- `agent/rules/domain-rules.md`, `coding-conventions.md`, `git-branch-and-commit.md`

## 2. Hành vi chung

- Tuân thủ stack: {{STACK}}
- Không commit secret; không log credentials

## 3. Khi viết code

- Tuân thủ `coding-conventions.md`

## 4. Khi đổi kiến thức

- Spec đổi → `agent/knowledge/`
- ADR → `decisions.md`
- Thuật ngữ → `glossary.md`

## 5. Khi hoàn thành task

1. Cập nhật memory nếu cần
2. Commit rõ ràng theo `git-branch-and-commit.md`
```

---

## agent/rules/coding-conventions.md (skeleton)

```markdown
# Coding Conventions – {{PROJECT_NAME}}

## Stack

- {{STACK}}

## Style

- Imports đầu file; TypeScript strict khi có
- Validate input (API/forms)
- Không attribution "Made with Cursor" trong code/meta

## Git

- Xem `git-branch-and-commit.md`
```

---

## agent/rules/git-branch-and-commit.md (single repo)

```markdown
# Git – {{PROJECT_NAME}}

## Branch

`type/short-description` hoặc `type/TICKET-123-short-description`

Types: feat, fix, hotfix, refactor, chore, test, docs, ci

## Commits

`type(scope): imperative description`

## PR

Ghi base branch; ghi Depends on / merge order nếu có chuỗi PR
```

---

## agent/rules/domain-rules.md (placeholder)

```markdown
# Domain Rules – {{PROJECT_NAME}}

{{PROJECT_PURPOSE}}

## Cập nhật khi có spec chi tiết

- Entity chính, luồng người dùng, rule validation
- Privacy / PII / retention nếu áp dụng

## Tạm thời (an toàn chung)

- Validate và sanitize input
- Không log secret
- Lỗi API: message rõ, status đúng
```

---

## agent/knowledge/00-project-overview.md

```markdown
# {{PROJECT_NAME}} – Overview

## Mục đích

{{PROJECT_PURPOSE}}

## Phạm vi

_(Bổ sung khi có PRD.)_

## Out of scope

_(Tùy chọn.)_
```

---

## agent/knowledge/01-modules.md

```markdown
# Modules – {{PROJECT_NAME}}

| Khu vực | Mô tả |
|--------|--------|
| _(cập nhật)_ | _(sau khi có cấu trúc repo)_ |
```

---

## agent/knowledge/02-schema-and-data.md

```markdown
# Schema & Data – {{PROJECT_NAME}}

Mô hình **gợi ý**; thay bằng schema thật khi implement.

## Entities (logical)

_(Liệt kê entity + field chính + unique constraints.)_

## Validation

_(Email, datetime, v.v.)_
```

---

## agent/memory/README.md

```markdown
# Memory – {{PROJECT_NAME}}

- **decisions.md** – ADR khi đổi kiến trúc / stack / schema
- **glossary.md** – Thuật ngữ domain

Format decisions: ngày, Context, Decision, Consequences.
```

---

## agent/memory/decisions.md (starter entry)

```markdown
# Decisions (ADR-style)

---

## YYYY-MM-DD – Agent workspace scaffold

- **Context:** Chuẩn hóa tài liệu cho AI agent.
- **Decision:** Thêm `AGENTS.md` và thư mục `agent/` (knowledge, rules, memory).
- **Consequences:** Cập nhật `agent/knowledge/` khi spec đổi; ghi ADR khi quyết định kỹ thuật.

---
```

---

## agent/memory/glossary.md

```markdown
# Glossary – {{PROJECT_NAME}}

| Term | Definition |
|------|------------|
| _(thêm)_ | _(thêm)_ |
```

---

## .cursor/rules/{{PROJECT_SLUG}}-agent.mdc

```yaml
---
description: {{PROJECT_NAME}} – read AGENTS.md and agent/ rules
globs: "**/*"
alwaysApply: true
---

# {{PROJECT_NAME}}

1. Read root `AGENTS.md`.
2. Follow `agent/rules/AGENTS.md` and `agent/rules/coding-conventions.md`.
3. Knowledge: `agent/knowledge/`. Decisions: `agent/memory/decisions.md`.

Stack: {{STACK}}
```
