import type { ReactNode } from "react";

import "./globals.css";

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
