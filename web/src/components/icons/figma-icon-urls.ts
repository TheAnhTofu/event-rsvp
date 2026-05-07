/**
 * Figma UI icons — served from `public/icons/*.svg` as stable paths.
 * Hashed `/_next/static/media/*` from `import …?url` can break after deploy when
 * cached JS still references old filenames; `/icons/*` stays valid across releases.
 */
export const FIGMA_ICON_SRC = {
  "calendar-24": "/icons/calendar-24.svg",
  "calendar-16": "/icons/calendar-16.svg",
  "location-24": "/icons/location-24.svg",
  "global-24": "/icons/global-24.svg",
  "ion-earth": "/icons/ion-earth.svg",
  "chevron-down": "/icons/chevron-down.svg",
  "card-pos": "/icons/card-pos.svg",
  bank: "/icons/bank.svg",
  "user-bold-24": "/icons/user-bold-24.svg",
  "note-text-bold-24": "/icons/note-text-bold-24.svg",
  "bookmark-2-bold-24": "/icons/bookmark-2-bold-24.svg",
  "airplane-bold-24": "/icons/airplane-bold-24.svg",
  "info-circle-bold-24": "/icons/info-circle-bold-24.svg",
  "document-copy-bold-24": "/icons/document-copy-bold-24.svg",
  "fork-spoon-rounded-24": "/icons/fork-spoon-rounded-24.svg",
  /** Dietary requirements section — `public/icons/dietary-requirements-24.svg` */
  "leaf-dietary-24": "/icons/dietary-requirements-24.svg",
  "radio-outline": "/icons/radio-outline.svg",
  "radio-on": "/icons/radio-on.svg",
  "radio-on-muted": "/icons/radio-on-muted.svg",
  "fill-checkmark-circle": "/icons/fill-checkmark-circle.svg",
  "shield-tick": "/icons/shield-tick.svg",
  "arrow-circle-left": "/icons/arrow-circle-left.svg",
  "card-large-60": "/icons/card-large-60.svg",
  "card-linear-40": "/icons/card-linear-40.svg",
  "stripe-s": "/icons/stripe-s.svg",
  "home-rounded": "/icons/home-rounded.svg",
} as const;

export type FigmaIconName = keyof typeof FIGMA_ICON_SRC;
