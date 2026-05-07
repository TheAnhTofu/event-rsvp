"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { FigmaIcon, type FigmaIconName } from "@/components/icons/figma-icon";

/**
 * Shared building blocks for the registration summary surfaces — Pay, Review,
 * and Thank-you (pending payment) — so all three match the same Figma frame.
 *
 * Source of truth:
 *   Figma `1149:41673` (1440p Physical Registration Form / Payment Required)
 *   - White outer card with `drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]`
 *   - Inner gray sections `bg-[#f8f9fa] rounded-[20px] p-5`
 *   - Arial Bold 22 / 15px text on `#333` for headings & body
 *   - Bullet lists (`<ul><li class="list-disc">`) for day groupings
 *   - Tags: yellow `#febf05` (restricted/fee-required), cyan `#a4f1ff`
 *     (Annual Conference participants)
 *   - Important Information panel uses light cyan tint
 *     `bg-[rgba(223,249,255,0.7)]`
 *   - "Return to Homepage" CTA: outline blue button at the very bottom.
 */

// ---------------------------------------------------------------------------
// Outer white card

/**
 * White rounded shell that holds the summary sections (and an optional
 * top-attached banner like {@link PaymentRequiredBanner}). When `attached`
 * is `top`, only the bottom corners are rounded so a banner can sit flush
 * above this card. When omitted, all four corners are rounded.
 */
export function SummaryWhiteCard({
  children,
  attached,
}: {
  children: ReactNode;
  attached?: "top";
}) {
  const rounded =
    attached === "top"
      ? "rounded-bl-[16px] rounded-br-[16px]"
      : "rounded-[16px]";
  return (
    <div
      className={[
        "flex w-full flex-col items-stretch gap-8 bg-white p-5 shadow-[0_4px_2px_rgba(0,0,0,0.25)] md:p-10",
        rounded,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gray inner section

type SectionTone = "gray" | "info";

/**
 * One of the inner sections — by default a soft gray panel; pass
 * `tone="info"` for the light-cyan "Important Information" variant.
 */
export function SummarySection({
  icon,
  title,
  children,
  tone = "gray",
}: {
  icon?: FigmaIconName;
  title: string;
  children: ReactNode;
  tone?: SectionTone;
}) {
  const bg =
    tone === "info"
      ? "bg-[rgba(223,249,255,0.7)]"
      : "bg-[#f8f9fa]";
  return (
    <section className={`flex w-full flex-col gap-2 rounded-[20px] p-5 ${bg}`}>
      <div className="flex w-full items-center gap-2.5">
        {icon ? (
          <FigmaIcon
            name={icon}
            size={24}
            className="size-6 shrink-0 text-[#333]"
          />
        ) : null}
        <h2 className="text-[20px] font-bold leading-normal text-[#333] md:text-[22px]">
          {title}
        </h2>
      </div>
      <div className="flex w-full flex-col items-stretch">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// "Label: value" rows used for Registration Details, dietary specifics, etc.

/**
 * Single row inside a section: bold label + regular value, both at 15px.
 * `value` can be a string or arbitrary node (links, tags, etc.).
 */
export function SummaryDetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  /** Figma `1499:24041` — label Bold `leading-[30px]`, value Regular `leading-[24px]`. */
  return (
    <div className="flex flex-wrap items-baseline gap-2 text-[15px] text-[#333]">
      <span className="shrink-0 font-bold leading-[30px]">{label}</span>
      <span className="min-w-0 font-normal leading-6">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bullet list rows (Conference days, Meal selection, Social events, etc.)

/**
 * Render a `disc` bullet that visually matches Figma's
 * `<ul><li class="list-disc ms-[22.5px]">` markup.
 */
function Bullet() {
  return (
    <span
      aria-hidden
      className="mt-[3px] inline-block size-[6px] shrink-0 rounded-full bg-[#333]"
    />
  );
}

/**
 * Single bullet row: "• <text>" with optional trailing tag(s).
 * Wraps cleanly when a tag pushes content past the available width.
 */
export function SummaryBulletItem({
  children,
  tags,
  bold,
}: {
  children: ReactNode;
  /** Tags appear inline to the right of the bullet text, may wrap. */
  tags?: ReactNode;
  /** Bold-weight bullet text — used for day headers. */
  bold?: boolean;
}) {
  return (
    <div className="flex w-full flex-wrap items-start gap-x-2 gap-y-1 text-[15px] text-[#333]">
      <span className="ml-[10px] inline-flex min-w-0 max-w-full flex-wrap items-center gap-2">
        <Bullet />
        <span
          className={[
            "leading-[30px]",
            bold ? "font-bold" : "font-normal",
          ].join(" ")}
        >
          {children}
        </span>
        {tags ? (
          <span className="inline-flex flex-wrap items-center gap-2">{tags}</span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * A "day" grouping for committee meetings: a bold bullet header
 * (e.g. "Monday, 9 November") followed by indented entries underneath.
 */
export function SummaryDayBlock({
  day,
  children,
}: {
  day: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col">
      <SummaryBulletItem bold>{day}</SummaryBulletItem>
      <div className="ml-[34px] flex flex-col">{children}</div>
    </div>
  );
}

/**
 * Plain row inside a {@link SummaryDayBlock} — no bullet, just indented
 * text optionally followed by a tag.
 */
export function SummaryEntryRow({
  children,
  tags,
}: {
  children: ReactNode;
  tags?: ReactNode;
}) {
  return (
    <div className="flex w-full flex-wrap items-start gap-x-2 gap-y-1 text-[15px] text-[#333]">
      <span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-2">
        <span className="leading-[30px]">{children}</span>
        {tags ? (
          <span className="inline-flex flex-wrap items-center gap-2">{tags}</span>
        ) : null}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tags

export type SummaryTagTone = "yellow" | "cyan";

/**
 * Pill-shaped tag rendered next to a bullet item or detail row. Yellow is
 * the default warning-style tone (e.g. "Restricted to ARC members",
 * "Registration Fee Applies", "IAIS Members only"); cyan is informative
 * (e.g. "Annual Conference participants").
 */
export function SummaryTag({
  tone = "yellow",
  children,
}: {
  tone?: SummaryTagTone;
  children: ReactNode;
}) {
  const bg = tone === "cyan" ? "bg-[#a4f1ff]" : "bg-[#febf05]";
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-[4px] p-1.5 text-[16.57px] font-bold leading-none text-[#333]",
        bg,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Important Information convenience wrapper

/**
 * Light-cyan "Important Information" section: a {@link SummarySection} with
 * `tone="info"` and the Figma-flipped info-circle icon.
 */
export function ImportantInfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex w-full flex-col gap-2 rounded-[20px] bg-[rgba(223,249,255,0.7)] p-5">
      <div className="flex w-full items-center gap-2.5">
        {/* Figma flips the info-circle vertically to mimic an exclamation badge. */}
        <span className="-scale-y-100 inline-flex size-6 shrink-0 items-center justify-center">
          <FigmaIcon name="info-circle-bold-24" size={24} className="size-6" />
        </span>
        <h2 className="text-[20px] font-bold leading-normal text-[#333] md:text-[22px]">
          {title}
        </h2>
      </div>
      <ul className="m-0 flex w-full flex-col gap-0 p-0">{children}</ul>
    </section>
  );
}

/**
 * One bullet inside {@link ImportantInfoSection}. `children` may include
 * inline anchors (e.g. mailto links) — keep them styled per Figma's blue
 * underline (#3e65f5 on the original, but we use the brand link colour).
 */
export function ImportantInfoItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 text-[15px] text-[#333]">
      {/* Dot aligns with first-line cap height: 15px / 30px lh → ~9px nudge below flex start */}
      <span
        aria-hidden
        className="mt-[9px] inline-block size-[6px] shrink-0 rounded-full bg-[#333]"
      />
      <span className="min-w-0 flex-1 leading-[30px]">{children}</span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// "Return to Homepage" button

/**
 * Outline-blue CTA at the bottom of the summary card, anchored to `/`.
 */
export function ReturnToHomepageButton({ label }: { label: string }) {
  return (
    <Link
      href="/"
      className="flex h-auto min-h-[48px] w-full items-center justify-center gap-2 rounded-[12px] border border-solid border-[#0d6efd] bg-white px-[43px] py-3 text-[16px] font-normal leading-6 text-[#0d6efd] transition hover:bg-[#0d6efd]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6efd]"
    >
      {/* Figma 1499:24760 — material-symbols:home-rounded 24 */}
      <FigmaIcon name="home-rounded" size={24} className="size-6 shrink-0 text-[#0d6efd]" />
      <span>{label}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Payment Required banner (orange)

/**
 * Orange gradient banner that sits above the white card when payment is
 * still pending. Hosts a discount-code field (slot), a "Complete Payment"
 * action (slot), and an expiry note. The discount + complete-payment
 * controls are slotted so we can wire real Stripe / discount logic in.
 */
export function PaymentRequiredBanner({
  title,
  description,
  expiryLabel,
  discountSlot,
  completeSlot,
}: {
  title: string;
  description: string;
  expiryLabel: string;
  discountSlot: ReactNode;
  completeSlot: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-tl-[16px] rounded-tr-[16px] bg-linear-to-r from-[#ffbb06] to-[#ff9702] p-5 text-white shadow-[0_4px_2px_rgba(0,0,0,0.25)]">
      <div className="flex w-full items-center gap-2.5">
        <svg
          aria-hidden
          viewBox="0 0 28 28"
          className="size-7 shrink-0 fill-current"
        >
          {/* vuesax bold "card" silhouette — minimal inline copy */}
          <path d="M3 7a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v3H3V7zm0 5h22v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-9zm4 5a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H7z" />
        </svg>
        <h2 className="text-[20px] font-bold leading-tight">{title}</h2>
      </div>
      <p className="m-0 text-[14px] leading-snug">{description}</p>
      <div className="w-full rounded-[12px] bg-[#f8f9fa] p-3">{discountSlot}</div>
      {completeSlot}
      <div className="flex w-full items-center gap-2.5 text-[14px] leading-snug">
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-4 shrink-0 fill-current"
        >
          {/* vuesax bold "clock" — minimal inline copy */}
          <path d="M8 1.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13zm.75 6.69 2.5 1.5a.75.75 0 1 1-.77 1.29l-2.86-1.71A.75.75 0 0 1 7.25 8.5V4.75a.75.75 0 0 1 1.5 0v3.44z" />
        </svg>
        <span>{expiryLabel}</span>
      </div>
    </div>
  );
}
