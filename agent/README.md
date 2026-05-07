# Event RSVP – Agent Knowledge & Memory

Thư mục chứa kiến thức dự án, memory và rules để AI agent hoạt động nhất quán (mô hình tham chiếu từ EventConnect).

## Spec sản phẩm (root repo)

- `docs/PRODUCT-SPEC.md` — PRD/FR/NFR, luồng, form, data model, acceptance MVP.

## Cấu trúc

```
agent/
├── README.md                 # File này
├── knowledge/                # Kiến thức dự án (cập nhật khi spec đổi)
│   ├── 00-project-overview.md
│   ├── 01-modules.md
│   ├── 02-schema-and-data.md
│   └── 03-figma-and-design-sources.md
├── memory/                   # Quyết định & thuật ngữ
│   ├── README.md
│   ├── decisions.md
│   └── glossary.md
└── rules/                    # Rules cho agent
    ├── AGENTS.md
    ├── domain-rules.md
    ├── coding-conventions.md
    └── git-branch-and-commit.md
```

## Khi nào cập nhật

- **knowledge/** – Khi thay đổi scope, luồng RSVP, mô hình dữ liệu, hoặc **đổi file/frame Figma** (cập nhật `03-figma-and-design-sources.md` và `.design/DNA.md` khi cần).
- **memory/** – Khi có quyết định kiến trúc, đổi DB/API, hoặc thuật ngữ mới.
- **rules/** – Khi thêm convention hoặc rule hành vi cho agent.

## Bổ sung sau

Có thể thêm `agent/reports/` cho ticket hoặc bản ghi implementation; các file `knowledge/04-*.md` trở đi cho chủ đề bổ sung (ví dụ tech stack chi tiết) khi cần.
