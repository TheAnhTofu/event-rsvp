# Design DNA – IAIS Registration (Figma)

Nguồn: Figma *IAIS | AIF | Registration Form Web* — file `DHXxjezs7iMK1vq3IEQ18R`, frame **1440p Physical Registration Form** (`2:824`). Biến Figma (`get_variable_defs` trên node này) + inspect mã export từ MCP.

## Nguyên tắc

- Nền sáng, **nhiều khoảng trắng**, typography rõ ràng; **màu brand xanh đậm + xanh nhấn** cho tiêu đề và step đang active.
- Form controls: **viền nhẹ**, bo góc **8px**, chiều cao touch-friendly (~48px).
- Stepper ngang: thanh tiến độ **8px**, track `#CFD6DC`, fill gradient/ảnh (trong code dùng gradient xanh).

## Màu (CSS variables)

| Token | Hex | Ghi chú Figma |
|-------|-----|----------------|
| `--color-surface` | `#FFFFFF` | White |
| `--color-border` | `#CFD6DC` | Border |
| `--color-border-subtle` | `#E1E3E6` | Grey/Grey 3 — input border |
| `--color-text` | `#404D61` | Dark — body, labels |
| `--color-text-muted` | `#757D8A` | Grey/Grey 5 — secondary |
| `--color-heading` | `#001742` | Navy — section titles, primary text trên form |
| `--color-brand-deep` | `#00318D` | Montserrat subtitle / brand line |
| `--color-accent` | `#6989FE` | Active step label, links, focus ring |
| `--color-step-inactive` | `#ABB7C2` | Step chưa tới |
| `--color-error` | `#C62828` | (chuẩn hoá; Figma dùng state Error trên Input) |

### Token mở rộng (1440p / implementation)

Dùng trong `globals.css` + Tailwind `@theme`; giữ đồng bộ với stepper & payment frame.

| Token | Hex | Ghi chú |
|-------|-----|---------|
| `--color-accent-mid` | `#4C71F8` | Step label giữa, gradient fill |
| `--color-accent-strong` | `#3C64F4` | Step label phải / nút Pay dọc |
| `--color-blue-solid` | `#4E73F8` | Viền selected radio/card, focus input |
| `--color-ink` | `#262626` | Chữ đậm gần đen (form / payment) |
| `--color-ink-muted` | `#686868` | Phụ đề payment |
| `--color-ink-soft` | `#737373` | Mô tả phụ |
| `--color-page-bg` | `#F7F8FA` | Nền trang (shell) |
| `--color-card-border` | `#E4E4E4` | Viền card lớn |
| `--color-hero-fallback` | `#0D4EA8` | Nền chờ khi ảnh hero load (gần gradient banner) |

Màu **chưa token hoá** (hardcode trong component, lấy từ Figma): nền chọn option `#F4F7FF`, vòng icon `#E8E8E8`, badge thanh toán `#BABABA`, ô info `#FAFAFA` — có thể đưa vào `:root` sau nếu cần.

## Typography

| Vai trò | Figma | Web (Google Fonts thay thế) |
|---------|--------|-----------------------------|
| Display / H1 | Acumin Pro Bold 40px | **Source Sans 3** 700, 2rem–2.5rem |
| H2 / section | Acumin Pro Bold 22px | Source Sans 3 700 1.375rem |
| Subtitle brand | Montserrat SemiBold + `#00318D` | **Montserrat** 600 |
| Body | Acumin Pro Regular 16–18px | Source Sans 3 400 1rem / 1.125rem |
| Caption | 14–16px muted | Source Sans 3 400 0.875rem |

*Acumin Pro là font Adobe; dùng **Source Sans 3** làm substitute miễn phí, gần về cảm giác corporate.*

## Spacing & radius

- Grid gutter form: **16px** gap giữa các block.
- Input padding: **12px 16px** (py-3 px-4).
- **Radius:** `8px` inputs & buttons; container card `6px`–`12px` tùy khối.

## Components

- **Primary button:** nền gradient/xanh đậm (trong implementation: solid `#00318D` hoặc gradient `#00318D` → `#6989FE`), chữ trắng, full width max ~400px centered hoặc block.
- **Secondary / outline:** nền trắng, border `#E1E3E6`.
- **Radio / checkbox cards:** giống Figma — cụm nút có border, selected state có thể border `--color-accent` hoặc nền nhạt.
- **Language dropdown:** top-right, border subtle, icon globe (optional).

## Mapping Tailwind (tham chiếu)

Extend trong `tailwind.config` hoặc `@theme` v4 — giữ đồng bộ với `globals.css` `:root`.

## Implementation trong repo

- Token CSS: `web/src/app/globals.css` (`:root` + `@theme inline` cho Tailwind v4).
- Font: `web/src/app/layout.tsx` — **Source Sans 3** (`--font-source-sans`), **Montserrat** (`--font-montserrat`).

## Figma parity — đổi chiều: layout **và** nội dung

Trước đây hay chỉ đối chiếu **khung UI** (spacing, component, màu). Để implement không thiếu copy, QC phải **luôn** gồm cả **nội dung** lấy từ Figma (text layers) hoặc bản copy đã chốt — không coi placeholder trong code là đủ.

### Nguồn chân thật

| Loại | Nguồn |
|------|--------|
| Visual | Frame Figma (file `DHXxjezs7iMK1vq3IEQ18R`, node chính `2:824` và các frame con: Pay, Thank you nếu có) |
| Copy ngắn (label, nút) | Text trong Figma hoặc export `get_design_context` |
| Copy dài (CPD, legal, privacy) | **Bắt buộc** đối layer/section tương ứng trong Figma **hoặc** tài liệu copy chính thức (Word/PDF/email stakeholder). Không dùng `(example copy)` làm chuẩn QC. |
| Đa ngôn ngữ | `web/src/messages/*.json` — mỗi locale cùng **cấu trúc ý**; nếu thiếu bản dịch, ghi rõ trong ticket |

### Checklist QC / trước khi merge (bắt buộc)

**A. Shell & stepper**

- [ ] Tiêu đề, subtitle từng bước khớp Figma (EN trước, rồi sync `zh-Hant` / `zh-Hans`).
- [ ] Stepper: % fill, màu label — đã có trong DNA; đối screenshot frame.

**B. Form — từng section (lặp cho mỗi khối)**

- [ ] **Cấu trúc:** thứ tự section, heading cấp 2, divider/border như design.
- [ ] **Icon:** asset từ Figma (`public/icons/`), không méo (`preserveAspectRatio` ≠ `none`).
- [ ] **Nội dung — từng chuỗi hiển thị:** đối chiếu text layer hoặc bản copy chốt (kể cả dấu câu, casing, “HK Time”).
- [ ] **Rich text:** chỗ Figma có **in đậm / link / ghi chú** → implement bằng `t.rich` hoặc tách key, không gom một đoạn placeholder.

**C. Khối dễ bị sót (phải tick riêng)**

- [ ] **CPD:** đoạn mở đầu đầy đủ; số giờ (vd. 5.5); **Note 1** (đoạn nhỏ dưới Yes/No nếu có trên design).
- [ ] **Acknowledgement:** từng đoạn (1)(2); label consent; asterisk.
- [ ] **Future / marketing:** toàn bộ câu + link email / opt-out nếu design có.
- [ ] **Footer form:** Mandatory; Privacy Policy + email — đúng domain/email theo bản chốt (không tự đổi `enquiries@…` nếu design ghi khác).

**D. Pay / Thank you (khi trong scope)**

- [ ] Order detail, line items, badge thanh toán (nếu design có logo thẻ).
- [ ] Mọi string trong `messages` đối frame Pay tương ứng.

**E. Kỹ thuật**

- [ ] `npm run build` pass; không để key i18n orphan sau khi đổi copy.

### Khi Figma cập nhật

1. Variables / màu → như mục “Cập nhật” bên dưới.
2. **Text:** chạy lại đối chiếu checklist **B + C**; cập nhật `en.json` trước, rồi `zh-Hant` / `zh-Hans`.

## Cập nhật

Khi Figma đổi variables: chạy lại `get_variable_defs` trên frame chính và sửa bảng màu + `web/src/app/globals.css`.
