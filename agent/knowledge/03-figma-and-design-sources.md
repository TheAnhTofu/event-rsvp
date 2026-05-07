# Figma & nguồn thiết kế – Event RSVP

Tài liệu này gom **định danh file Figma** và liên kết tới token/copy chi tiết. Khi Figma đổi tên frame hoặc branch, cập nhật bảng dưới đây và đồng bộ [`.design/DNA.md`](../../.design/DNA.md).

## Figma – form đăng ký Web (IAIS)

| Trường | Giá trị |
|--------|---------|
| **Tên file (Figma)** | *IAIS \| AIF \| Registration Form Web* |
| **File key** | `DHXxjezs7iMK1vq3IEQ18R` |
| **URL mẫu (mở frame chính)** | `https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/?node-id=2-824` |
| **Frame tham chiếu chính** | **1440p Physical Registration Form** |
| **Node id (API / MCP)** | `2:824` (trong URL Figma thường là `node-id=2-824`) |

- **Wizard / scope UI:** landing + form nhiều bước (Registration → Review → Pay) bám frame trên; responsive ưu tiên desktop ~1440px, xem [`docs/PRODUCT-SPEC.md`](../../docs/PRODUCT-SPEC.md).
- **Token màu, typography, parity copy:** [`.design/DNA.md`](../../.design/DNA.md) — bao gồm checklist **Figma parity — layout và nội dung**.

## FigJam – flow & demo

| Trường | Giá trị |
|--------|---------|
| **Tên (theo spec)** | *Registration / IAIS Demo* — flow IAIS & AIF |

- **Link:** do team quản lý; không commit file nhị phân Figma/FigJam vào git (xem [`docs/PRODUCT-SPEC.md`](../../docs/PRODUCT-SPEC.md) mục tài liệu liên quan).

## Trong repo

| Artifact | Vai trò |
|----------|---------|
| [`.design/DNA.md`](../../.design/DNA.md) | Token CSS, font thay thế, checklist QC vs Figma |
| [`docs/PRODUCT-SPEC.md`](../../docs/PRODUCT-SPEC.md) | Yêu cầu sản phẩm; tham chiếu thiết kế ở phần đầu |
| `web/src/app/globals.css`, Tailwind `@theme` | Implementation token — đồng bộ khi Figma variables đổi |

## Ghi chú cho agent (MCP / implement)

- Lấy ngữ cảnh thiết kế: `get_design_context` với **fileKey** + **nodeId** (đổi `2-824` → `2:824` trong API).
- Đồng bộ biến: `get_variable_defs` trên node frame chính khi design đổi variables.
- Code sinh từ MCP là **tham chiếu** — chỉnh theo convention repo (`agent/rules/coding-conventions.md`) và component có sẵn.

## Phiên bản tài liệu

- Đồng bộ khi đổi file key Figma, đổi frame chuẩn, hoặc khi cập nhật lớn [`.design/DNA.md`](../../.design/DNA.md).
