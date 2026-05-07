# Design DNA – Admin CRM (IAIS)

Nguồn gốc: Figma *IAIS | AIF | Registration Form Web* — danh sách đăng ký ([90-6587](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/IAIS---AIF-%7C-Registration-Form-Web?node-id=90-6587)), khung CRM ([199-26013](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/IAIS---AIF-%7C-Registration-Form-Web?node-id=199-26013)), timeline status ([125-6758](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/IAIS---AIF-%7C-Registration-Form-Web?node-id=125-6758)), [125-7154](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/IAIS---AIF-%7C-Registration-Form-Web?node-id=125-7154). Bổ sung cho [DNA.md](./DNA.md) (public registration).

## Nguyên tắc

- Nền shell: `#F7F8FA` (trùng `--color-page-bg`); vùng nội dung và thẻ: trắng + viền `#CFD6DC` / `admin-border`.
- Tiêu đề trang CRM: **Source Sans 3** 700, màu `--color-heading` / `admin-navy` (`#001742`).
- Bảng: header nền `admin-table-header-bg`, chữ secondary `admin-col-muted`; hàng hover nhẹ `admin-sidebar-bg/50`.
- Filter “chip” pipeline: bo `rounded-xl`, border `2px`, active: `border-admin-navy` + `ring-admin-navy/30` (đã dùng trong `admin/emails`).

## Registration list (pipeline)

- Thanh tab: **Pipeline & send** / **Email log** — viền dưới tab active khớp Figma (border trên + nền trắng).
- Toolbar: search + sort + order — `rounded-lg`, focus ring xanh brand.
- Cột stage: pill `rounded-lg` / `rounded-xl`, font semibold, không dùng màu gắt ngoài token.

## Timeline trạng thái

- Khối timeline (chi tiết đăng ký): nền tối `#0a0a0a` (chữ trắng) để khớp frame trạng thái; đường dọc trắng mờ; node active xanh `#4E73F8` / `#6989FE`.
- Pill nhãn: nền trắng, chữ navy / muted tùy `done | current | pending`.

## Token Tailwind hiện có (admin)

Tham chiếu `globals.css` / `@theme`: `admin-navy`, `admin-border`, `admin-sidebar-bg`, `admin-col-muted`, `admin-table-header-bg`, `admin-table-border`.

Khi thêm token mới, đồng bộ vào `DNA.md` hoặc file này và tránh hardcode ngoài bảng màu.
