"use client";

import { Link } from "@/i18n/navigation";
import {
  IconProfileCircle,
  IconSmsEnvelope,
  IconUserEdit,
  IconUserSingle,
  IconCardPos,
} from "@/components/icons/admin";

export type RegistrationDetailTab = "info" | "payment" | "emails";

type Props = {
  reference: string;
  /** e.g. "Man Tan Lee #R-2026-00001" */
  breadcrumbTitle: string;
  active: RegistrationDetailTab;
};

function tabHref(reference: string, tab: RegistrationDetailTab): string {
  const base = `/admin/registrations/${encodeURIComponent(reference)}`;
  return `${base}?tab=${tab}`;
}

export function RegistrationDetailChrome({
  reference,
  breadcrumbTitle,
  active,
}: Props) {
  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-admin-border bg-white px-5 py-[15px] md:px-5">
        <div className="flex min-w-0 items-center gap-1.5 text-[15px] leading-[22px]">
          <IconUserEdit className="size-[18px] shrink-0 text-admin-navy" />
          <Link
            href="/admin/emails"
            className="shrink-0 font-medium text-[#828282] hover:text-admin-navy"
          >
            Registrant List
          </Link>
          <span className="shrink-0 font-semibold text-admin-navy">/</span>
          <span className="min-w-0 truncate font-semibold text-[16px] text-admin-navy">
            {breadcrumbTitle}
          </span>
        </div>
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-admin-navy"
          title="Admin"
        >
          <IconProfileCircle className="size-5 text-white" />
        </div>
      </div>

      <div className="flex h-[45px] shrink-0 items-center border-b border-[#f2f2f2] bg-white px-5">
        <nav className="flex h-full items-center gap-0" aria-label="Registration sections">
          <Link
            href={tabHref(reference, "info")}
            className={`flex h-full items-center gap-2.5 px-2.5 text-[14px] font-medium ${
              active === "info"
                ? "border-b-2 border-admin-navy text-admin-navy"
                : "text-[#828282] hover:text-admin-navy/80"
            }`}
          >
            <IconUserSingle className="size-5 shrink-0" />
            Registrant Information
          </Link>
          <Link
            href={tabHref(reference, "payment")}
            className={`flex h-full items-center gap-2.5 px-2.5 text-[14px] font-medium ${
              active === "payment"
                ? "border-b-2 border-admin-navy text-admin-navy"
                : "text-[#828282] hover:text-admin-navy/80"
            }`}
          >
            <IconCardPos className="size-5 shrink-0" />
            Payment Information
          </Link>
          <Link
            href={tabHref(reference, "emails")}
            className={`flex h-full items-center gap-2.5 px-2.5 text-[14px] font-medium ${
              active === "emails"
                ? "border-b-2 border-admin-navy text-admin-navy"
                : "text-[#828282] hover:text-admin-navy/80"
            }`}
          >
            <IconSmsEnvelope className="h-5 w-6 shrink-0" />
            Email Sent Record
          </Link>
        </nav>
      </div>
    </>
  );
}
