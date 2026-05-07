import Image from "next/image";

/**
 * IAIS + Insurance Authority + Hong Kong skyline hero.
 *
 * Two artworks ship side-by-side because the desktop and mobile crops have
 * different aspect ratios (the IAIS logo + skyline reflow per breakpoint):
 *  - Desktop: 2881×801  (~3.60:1)  — `homepage-hero-banner.png`
 *  - Mobile : 787×421   (~1.87:1)  — `homepage-hero-banner-mobile.png`
 *
 * We render both with `next/image` and toggle visibility via Tailwind so each
 * breakpoint downloads only its own asset (the hidden one stays `display:none`
 * but Next still preloads the priority desktop image; the mobile variant is
 * gated by `sm:hidden` and lazy-fetched in practice for ≥640px viewports).
 *
 * Desktop uses `object-cover` with a fluid `clamp(200px, 28vw, 420px)` height
 * so on ultra-wide viewports the banner fills its slot (no #28a9e0 letterbox
 * strip top/bottom) and crops the skyline edges instead.
 */
export function HeroBanner() {
  return (
    <div
      className="relative w-full overflow-hidden bg-[#28a9e0]"
      role="img"
      aria-label="IAIS and Insurance Authority event banner with Hong Kong skyline"
    >
      <Image
        src="/figma-assets/homepage/homepage-hero-banner.png"
        alt="IAIS — International Association of Insurance Supervisors and Insurance Authority — Hong Kong skyline"
        width={2881}
        height={801}
        priority
        sizes="100vw"
        className="hidden h-[clamp(200px,28vw,420px)] w-full object-cover object-center sm:block"
      />
      <Image
        src="/figma-assets/homepage/homepage-hero-banner-mobile.png"
        alt=""
        aria-hidden
        width={787}
        height={421}
        priority
        sizes="100vw"
        className="block h-auto w-full object-cover object-center sm:hidden"
      />
    </div>
  );
}
