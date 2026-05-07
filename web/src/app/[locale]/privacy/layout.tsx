import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Policies & Consents | IAIS",
  description:
    "Privacy policy, refund policy, cookies consent, and FAQs for IAIS event registration.",
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
