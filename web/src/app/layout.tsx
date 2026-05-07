import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  title: {
    default: "IAIS Annual Conference 2026",
    template: "%s | IAIS",
  },
  description: "IAIS Annual Conference 2026 — Hong Kong.",
};

type Props = {
  children: ReactNode;
};

/** Root layout must include <html> and <body> (Next.js App Router). Locale-specific markup lives in `[locale]/layout.tsx`. */
export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-page-bg">{children}</body>
    </html>
  );
}
