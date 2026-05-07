# Agent Rules – Event RSVP

Đọc trước khi thực hiện task trong repo này. Nguồn chân thật: `agent/knowledge/` và (khi có) spec/tài liệu product trong repo hoặc `docs/`.

## 1. Nguồn kiến thức

- **Spec sản phẩm:** `docs/PRODUCT-SPEC.md` (ưu tiên khi implement feature).
- **Domain & yêu cầu bổ sung:** `agent/knowledge/*.md`.
- **Quyết định & thuật ngữ:** `agent/memory/decisions.md`, `agent/memory/glossary.md`.
- **Rule chi tiết:** `agent/rules/domain-rules.md`, `agent/rules/coding-conventions.md`.
- **Git:** `agent/rules/git-branch-and-commit.md`.

## 2. Hành vi chung

- **Stack UI:** Next.js + Tailwind CSS trừ khi user chỉ định khác.
- **Dữ liệu:** Tuân thủ rule trong `domain-rules.md` và `02-schema-and-data.md` (cập nhật khi schema thực tế khác).
- **Bảo mật:** Không log secret; không commit `.env*` có giá trị thật; link mời RSVP nên không đoán được (token) nếu có public URL.
- **Chạy lệnh:** Khi cần dùng terminal (build, test, lint, migrate, deploy script, v.v.), agent **tự động chạy lệnh bằng công cụ Shell** và **chỉ báo cáo kết quả/ảnh hưởng** cho user, **không** đưa lệnh dưới dạng “hãy chạy lệnh sau trên máy bạn” trừ khi user yêu cầu rõ ràng.

## 3. Khi viết code

- Tuân thủ `agent/rules/coding-conventions.md`.
- Ưu tiên component tái sử dụng, Server/Client Components đúng chỗ (App Router).
- API/route handlers: validate body/query; trả lỗi rõ ràng (status + message).

## 4. Khi thay đổi kiến thức hoặc quyết định

- Spec/requirement đổi → cập nhật `agent/knowledge/` tương ứng.
- Quyết định kiến trúc/schema/stack → ghi `agent/memory/decisions.md` (ngày, Context, Decision, Consequences).
- Thuật ngữ mới → cập nhật `agent/memory/glossary.md`.

## 5. Cấu trúc repo (tham chiếu)

- `agent/` – knowledge, memory, rules.
- `app/` hoặc `src/app/` – Next.js App Router (tùy scaffold).
- Thư mục khác – cập nhật `01-modules.md` khi cấu trúc ổn định.

## 6. Khi hoàn thành task (checklist)

1. **Figma + nội dung (UI liên quan form/landing):** Không chỉ khớp layout — đối chiếu **toàn bộ copy** hiển thị với Figma text layers hoặc bản copy chốt. Định danh file/frame: `agent/knowledge/03-figma-and-design-sources.md`. Checklist đầy đủ: `.design/DNA.md` mục **“Figma parity — layout và nội dung”** (đặc biệt khối CPD, Ack, Future, footer).
2. **Memory (nếu có thay đổi đáng ghi):** `decisions.md` / `glossary.md`.
3. **Reports (tùy chọn):** Nếu task gắn ticket hoặc cần bàn giao, có thể thêm file trong `agent/reports/` (tạo folder khi cần).
4. **Git:** Commit có message rõ ràng theo `git-branch-and-commit.md`; không gộp thay đổi không liên quan.
