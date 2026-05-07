import type { SVGProps } from "react";

/**
 * Admin / CRM — inline SVG icons (single module).
 *
 * Naming: `Icon` + domain hint + role + optional variant (`Bold`, `Field`, `Sliders`, …).
 * Figma: *IAIS | AIF | Registration Form Web* (`DHXxjezs7iMK1vq3IEQ18R`) where `@figma` is noted.
 */
export type IconSvgProps = SVGProps<SVGSVGElement> & { className?: string };

type SortArrowProps = IconSvgProps & { emphasized?: boolean };

// --- Shell / sidebar (nav) -------------------------------------------------

/** Figma 20×20 — sidebar Dashboard (bento / split layout). */
export function IconDashboard({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M9.16667 16.5833V3.41666C9.16667 2.16666 8.63333 1.66666 7.30833 1.66666H3.94167C2.61667 1.66666 2.08333 2.16666 2.08333 3.41666V16.5833C2.08333 17.8333 2.61667 18.3333 3.94167 18.3333H7.30833C8.63333 18.3333 9.16667 17.8333 9.16667 16.5833Z"
        fill="currentColor"
      />
      <path
        d="M17.9167 16.3667V12.8C17.9167 11.7167 17.0833 10.8333 16.0583 10.8333H12.6917C11.6667 10.8333 10.8333 11.7167 10.8333 12.8V16.3667C10.8333 17.45 11.6667 18.3333 12.6917 18.3333H16.0583C17.0833 18.3333 17.9167 17.45 17.9167 16.3667Z"
        fill="currentColor"
      />
      <path
        d="M17.9167 7.19999V3.63332C17.9167 2.54999 17.0833 1.66666 16.0583 1.66666H12.6917C11.6667 1.66666 10.8333 2.54999 10.8333 3.63332V7.19999C10.8333 8.28332 11.6667 9.16666 12.6917 9.16666H16.0583C17.0833 9.16666 17.9167 8.28332 17.9167 7.19999Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Figma 20×20 — sidebar On-Site Check-In (clipboard + check). */
export function IconCheckin({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M11.9583 1.66669H8.04167C7.17501 1.66669 6.46667 2.36669 6.46667 3.23335V4.01669C6.46667 4.88335 7.16667 5.58335 8.03334 5.58335H11.9583C12.825 5.58335 13.525 4.88335 13.525 4.01669V3.23335C13.5333 2.36669 12.825 1.66669 11.9583 1.66669Z"
        fill="currentColor"
      />
      <path
        d="M14.3667 4.01665C14.3667 5.34165 13.2833 6.42498 11.9583 6.42498H8.04165C6.71665 6.42498 5.63332 5.34165 5.63332 4.01665C5.63332 3.54998 5.13332 3.25832 4.71665 3.47498C3.54165 4.09998 2.74165 5.34165 2.74165 6.76665V14.6083C2.74165 16.6583 4.41665 18.3333 6.46665 18.3333H13.5333C15.5833 18.3333 17.2583 16.6583 17.2583 14.6083V6.76665C17.2583 5.34165 16.4583 4.09998 15.2833 3.47498C14.8667 3.25832 14.3667 3.54998 14.3667 4.01665ZM12.7833 10.6083L9.44998 13.9416C9.32498 14.0666 9.16665 14.125 9.00832 14.125C8.84998 14.125 8.69165 14.0666 8.56665 13.9416L7.31665 12.6916C7.07498 12.45 7.07498 12.05 7.31665 11.8083C7.55832 11.5666 7.95832 11.5666 8.19998 11.8083L9.00832 12.6167L11.9 9.72498C12.1416 9.48332 12.5417 9.48332 12.7833 9.72498C13.025 9.96665 13.025 10.3666 12.7833 10.6083Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Figma 20×20 — Print Badge / sidebar “Print Badges” (printer). */
export function IconPrinter({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M5 7V5.5C5 4.12 6.12 3 7.5 3h5C13.88 3 15 4.12 15 5.5V7"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M5 7H3.25C2.56 7 2 7.56 2 8.25v2.5C2 11.44 2.56 12 3.25 12H5"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M15 7h1.75c.69 0 1.25.56 1.25 1.25v2.5c0 .69-.56 1.25-1.25 1.25H15"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <rect
        x="5"
        y="14"
        width="10"
        height="4"
        rx="1"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M7 14V11h6v3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Person + check — Registrant / registration (Figma 20×20, `currentColor`).
 * Dùng chung cho sidebar “Registrant List”, breadcrumb, và tab Registrant Information.
 */
export function IconUserSingle({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M9.9998 11.6665C5.8248 11.6665 2.4248 14.4665 2.4248 17.9165C2.4248 18.1498 2.60814 18.3332 2.84147 18.3332H17.1581C17.3915 18.3332 17.5748 18.1498 17.5748 17.9165C17.5748 14.4665 14.1748 11.6665 9.9998 11.6665Z"
        fill="currentColor"
      />
      <path
        d="M10.0002 1.6665C9.01683 1.6665 8.11683 2.00817 7.40016 2.58317C6.44183 3.3415 5.8335 4.5165 5.8335 5.83317C5.8335 6.6165 6.05016 7.34984 6.44183 7.97484C7.1585 9.18317 8.47516 9.99984 10.0002 9.99984C11.0502 9.99984 12.0085 9.6165 12.7418 8.95817C13.0668 8.68317 13.3502 8.34984 13.5668 7.97484C13.9502 7.34984 14.1668 6.6165 14.1668 5.83317C14.1668 3.53317 12.3002 1.6665 10.0002 1.6665ZM12.1585 5.38317L9.9335 7.43317C9.7835 7.57484 9.59183 7.6415 9.40016 7.6415C9.20016 7.6415 9.00016 7.5665 8.85016 7.4165L7.82516 6.38317C7.51683 6.07484 7.51683 5.58317 7.82516 5.27484C8.1335 4.9665 8.62516 4.9665 8.9335 5.27484L9.42516 5.7665L11.1002 4.22484C11.4168 3.93317 11.9085 3.94984 12.2002 4.2665C12.4918 4.5915 12.4752 5.0915 12.1585 5.38317Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Sidebar “Registrant List” + breadcrumb — cùng asset `IconUserSingle`. */
export function IconUserEdit(props: IconSvgProps) {
  return <IconUserSingle {...props} />;
}

export function IconClipboardTick({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M9 3h6l1 2h3a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h3l1-2z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M9 12.5l2 2 4-4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconProfileCircle({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <circle cx={12} cy={8} r={3.5} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M6 18c0-3.3 2.7-5 6-5s6 1.7 6 5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={12} cy={12} r={9.5} stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

/** Generic search (currentColor). */
export function IconSearch({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <circle cx={10.5} cy={10.5} r={6} stroke="currentColor" strokeWidth={1.5} />
      <path d="M15 15l5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/** Minimal filter (three horizontal rules). */
export function IconFilterLines({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Registrant list “Actions” column — tapered filter lines (14×14). */
export function IconRegistrantActionsFilter({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M1.75 4.08331H12.25"
        stroke="currentColor"
        strokeWidth={0.875}
        strokeLinecap="round"
      />
      <path
        d="M3.5 7H10.5"
        stroke="currentColor"
        strokeWidth={0.875}
        strokeLinecap="round"
      />
      <path
        d="M5.83331 9.91669H8.16665"
        stroke="currentColor"
        strokeWidth={0.875}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Same family as `IconRegistrantActionsFilter` — funnel + check when column filter is applied (14×14). */
export function IconRegistrantActionsFilterActive({
  className,
  ...props
}: IconSvgProps) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M10.4533 5.90398C10.2608 5.85732 10.0566 5.83398 9.84664 5.83398C8.31831 5.83398 7.07581 7.07648 7.07581 8.60482C7.07581 9.12398 7.22164 9.61398 7.47831 10.034C7.69414 10.3957 7.99164 10.7048 8.35331 10.9265C8.78497 11.2123 9.29831 11.3757 9.84664 11.3757C10.8616 11.3757 11.7425 10.8332 12.2208 10.034C12.4775 9.61398 12.6175 9.12398 12.6175 8.60482C12.6175 7.28648 11.6958 6.17815 10.4533 5.90398ZM11.2291 8.24315L9.74747 9.60815C9.6658 9.68398 9.55497 9.72482 9.44997 9.72482C9.33914 9.72482 9.22831 9.68398 9.14081 9.59648L8.45831 8.91398C8.28914 8.74482 8.28914 8.46482 8.45831 8.29565C8.62747 8.12648 8.90747 8.12648 9.07664 8.29565L9.46164 8.68065L10.6341 7.60148C10.815 7.43815 11.0891 7.44982 11.2525 7.62482C11.4158 7.80565 11.4041 8.07982 11.2291 8.24315Z"
        fill="currentColor"
      />
      <path
        d="M12.005 2.34435V3.63935C12.005 4.11185 11.7133 4.70102 11.4217 4.99852L11.3167 5.09185C11.235 5.16768 11.1125 5.18518 11.0075 5.15018C10.8908 5.10935 10.7742 5.08018 10.6575 5.05102C10.4008 4.98685 10.1267 4.95768 9.84666 4.95768C7.83416 4.95768 6.20083 6.59102 6.20083 8.60352C6.20083 9.26852 6.38166 9.92185 6.72583 10.4818C7.0175 10.9718 7.42583 11.3802 7.86916 11.6543C8.00333 11.7418 8.05583 11.9285 7.93916 12.0335C7.89833 12.0685 7.8575 12.0977 7.81666 12.1269L7 12.6577C6.24166 13.1302 5.1975 12.5993 5.1975 11.6543V8.53352C5.1975 8.11935 4.96416 7.58852 4.73083 7.29685L2.52 4.94018C2.22833 4.64268 1.995 4.11185 1.995 3.76185V2.40268C1.995 1.69685 2.51999 1.16602 3.15583 1.16602H10.8442C11.48 1.16602 12.005 1.69685 12.005 2.34435Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconDotsVertical({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <circle cx={12} cy={6} r={1.5} fill="currentColor" />
      <circle cx={12} cy={12} r={1.5} fill="currentColor" />
      <circle cx={12} cy={18} r={1.5} fill="currentColor" />
    </svg>
  );
}

/** Horizontal ellipsis (⋯) — row / overflow menus. */
export function IconDotsHorizontal({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <circle cx={6} cy={12} r={1.5} fill="currentColor" />
      <circle cx={12} cy={12} r={1.5} fill="currentColor" />
      <circle cx={18} cy={12} r={1.5} fill="currentColor" />
    </svg>
  );
}

/** Circular arrows — “update status” / refresh. */
export function IconArrowPath({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronLeft({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronRight({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M10 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Compact up/down chevrons (e.g. sidebar). */
export function IconSortChevronsCompact({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M8 6l4-3 4 3M8 18l4 3 4-3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconGlobe({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M3 12h18M12 3a16 16 0 0 0 0 18M12 3a16 16 0 0 1 0 18"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}

export function IconPlusCircle({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconChevronsUpDown({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M7 14l5 5 5-5M7 10l5-5 5 5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// --- Registrant list page (Figma 90:6587, 199:25624) ------------------------

/** Page title — cùng SVG Figma như `IconUserEdit` (giữ tên cho call sites cũ). */
export function IconUserEditBold(props: IconSvgProps) {
  return <IconUserEdit {...props} />;
}

/** Plus on white disc — primary navy CTA (Create New Registrant). */
export function IconPlusNavy({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <circle cx={12} cy={12} r={9} fill="white" />
      <path
        d="M12 9v6M9 12h6"
        stroke="#002353"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Toolbar search field — @figma Component 11, Gray 3 #828282. */
export function IconSearchField({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={21}
      height={21}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <circle cx={10.5} cy={10.5} r={6.25} stroke="#828282" strokeWidth={1.5} />
      <path
        d="M15.5 15.5L20 20"
        stroke="#828282"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Pagination control — previous. */
export function IconPaginationPrev({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Pagination control — next. */
export function IconPaginationNext({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Filter with sliders + knobs — toolbar quick filter (vuesax-style).
 * @figma Cell / Component 1 (113:4595) scale 16px
 */
export function IconFilterSliders({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M4 6h4M15 6h5M10 6h1"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={9} cy={6} r={2} fill="currentColor" />
      <path
        d="M4 12h7M16 12h4M13 12h1"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={11} cy={12} r={2} fill="currentColor" />
      <path
        d="M4 18h3M10 18h10M7 18h1"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={5} cy={18} r={2} fill="currentColor" />
    </svg>
  );
}

/** Dual vertical sort arrows — Actions panel “Sort”. @figma vuesax/linear/sort (199:25631). */
export function IconSortBidirectional({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M8 5v14M5 8l3-3 3 3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 19V5m3 3-3-3-3 3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Small chevron beside column title (column filter / menu affordance).
 * @figma vuesax/linear/arrow-3, 12px (199:25628).
 */
export function IconChevronDownMini({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M8 10l4 4 4-4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Table header sort — arrow up with vertical shaft (12×12). */
export function IconSortArrowUp({
  className,
  emphasized,
  ...props
}: SortArrowProps) {
  const sw = emphasized ? 1 : 0.75;
  return (
    <svg
      className={className}
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M9.03497 4.785L5.99997 1.75L2.96497 4.785"
        stroke="currentColor"
        strokeWidth={sw}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10.25V1.83496"
        stroke="currentColor"
        strokeWidth={sw}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Table header sort — arrow down with vertical shaft (12×12). */
export function IconSortArrowDown({
  className,
  emphasized,
  ...props
}: SortArrowProps) {
  const sw = emphasized ? 1 : 0.75;
  return (
    <svg
      className={className}
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M2.96497 7.215L5.99997 10.25L9.03497 7.215"
        stroke="currentColor"
        strokeWidth={sw}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 1.75V10.165"
        stroke="currentColor"
        strokeWidth={sw}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// --- Registration detail tabs (Figma 125:7261) --------------------------------
// IconUserSingle — tab “Registrant Information” (định nghĩa phía trên cùng `IconUserEdit`).

/** Card POS — tab “Payment Information”. */
export function IconCardPos({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <rect
        x={3}
        y={5}
        width={18}
        height={14}
        rx={2}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path d="M3 10h18" stroke="currentColor" strokeWidth={1.5} />
      <rect x={6} y={14} width={4} height={2} rx={0.5} fill="currentColor" />
    </svg>
  );
}

/** SMS / envelope — tab “Email Sent Record”. */
export function IconSmsEnvelope({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={24}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M4 6h16v12H4V6z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M4 7l8 5 8-5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Pencil on line — Edit CTA (Figma 20×20, `currentColor`). */
export function IconPencilEdit({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M17.5 18.3335H2.5C2.15833 18.3335 1.875 18.0502 1.875 17.7085C1.875 17.3668 2.15833 17.0835 2.5 17.0835H17.5C17.8417 17.0835 18.125 17.3668 18.125 17.7085C18.125 18.0502 17.8417 18.3335 17.5 18.3335Z"
        fill="currentColor"
      />
      <path
        d="M15.85 2.90005C14.2333 1.28338 12.65 1.24172 10.9916 2.90005L9.98331 3.90838C9.89998 3.99172 9.86665 4.12505 9.89998 4.24172C10.5333 6.45005 12.3 8.21672 14.5083 8.85005C14.5416 8.85838 14.575 8.86672 14.6083 8.86672C14.7 8.86672 14.7833 8.83338 14.85 8.76672L15.85 7.75838C16.675 6.94172 17.075 6.15005 17.075 5.35005C17.0833 4.52505 16.6833 3.72505 15.85 2.90005Z"
        fill="currentColor"
      />
      <path
        d="M13.0084 9.60817C12.7668 9.4915 12.5334 9.37484 12.3084 9.2415C12.1251 9.13317 11.9501 9.0165 11.7751 8.8915C11.6334 8.79984 11.4668 8.6665 11.3084 8.53317C11.2918 8.52484 11.2334 8.47484 11.1668 8.40817C10.8918 8.17484 10.5834 7.87484 10.3084 7.5415C10.2834 7.52484 10.2418 7.4665 10.1834 7.3915C10.1001 7.2915 9.95844 7.12484 9.83344 6.93317C9.73344 6.80817 9.61677 6.62484 9.50844 6.4415C9.3751 6.2165 9.25844 5.9915 9.14177 5.75817C8.9888 5.43039 8.55859 5.33301 8.30282 5.58879L3.61677 10.2748C3.50844 10.3832 3.40844 10.5915 3.38344 10.7332L2.93344 13.9248C2.8501 14.4915 3.00844 15.0248 3.35844 15.3832C3.65844 15.6748 4.0751 15.8332 4.5251 15.8332C4.6251 15.8332 4.7251 15.8248 4.8251 15.8082L8.0251 15.3582C8.1751 15.3332 8.38344 15.2332 8.48344 15.1248L13.1772 10.4311C13.4279 10.1804 13.3337 9.74912 13.0084 9.60817Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Calendar outline — column date-range filter (Figma 16×16). */
export function IconCalendarOutline({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M5 1.75V2.75M11 1.75V2.75M2.75 5.75H13.25M3.75 2.75H12.25C13.2165 2.75 14 3.5335 14 4.5V12.25C14 13.2165 13.2165 14 12.25 14H3.75C2.7835 14 2 13.2165 2 12.25V4.5C2 3.5335 2.7835 2.75 3.75 2.75Z"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Card with check — Payment Received CTA (Figma 125:7928). */
export function IconCardTick({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <rect
        x={2}
        y={4}
        width={20}
        height={16}
        rx={2}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Arrow down to tray — export / download CSV (20×20). */
export function IconArrowDownTray({ className, ...props }: IconSvgProps) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M10 3.33334V11.6667M10 11.6667L6.66667 8.33334M10 11.6667L13.3333 8.33334"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.16667 14.1667V15.8333C4.16667 16.7538 4.91286 17.5 5.83333 17.5H14.1667C15.0871 17.5 15.8333 16.7538 15.8333 15.8333V14.1667"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
