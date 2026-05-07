import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Thank you | IAIS Annual Conference 2026",
  description:
    "Your registration for the IAIS Annual Conference 2026 has been received.",
  robots: { index: false, follow: false },
};

export default function ThankYouLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
