"use client";

import { useCallback, useState, type ReactNode } from "react";
import { FigmaIcon } from "@/components/icons/figma-icon";
import type { RegistrationFormValues } from "@/lib/registration-schema";

type PaymentSummaryCardProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PaymentSummaryCard({
  title,
  icon,
  children,
  className,
}: PaymentSummaryCardProps) {
  return (
    <section
      className={[
        "rounded-[20px] bg-[#f8f9fa] p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center text-[#333]">
          {icon}
        </span>
        <h3 className="text-[20px] font-bold leading-normal text-[#333] md:text-[22px]">
          {title}
        </h3>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

export function PaymentSummaryTag({
  children,
  tone = "subtle",
}: {
  children: ReactNode;
  tone?: "subtle" | "blue";
}) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-[4px] p-1.5 text-[16.57px] font-bold leading-none text-[#333]",
        tone === "blue" ? "bg-[#a4f1ff]" : "bg-[#febf05]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function PaymentSummaryBullet({
  children,
  tag,
  tagTone,
}: {
  children: ReactNode;
  tag?: ReactNode;
  tagTone?: "subtle" | "blue";
}) {
  return (
    <div className="flex flex-wrap items-start gap-x-2 gap-y-1 pl-4 text-[15px] leading-[30px] text-[#333]">
      <span className="relative inline-flex min-w-0 max-w-full flex-wrap items-center gap-2 before:absolute before:-left-4 before:top-[0.8em] before:size-1.5 before:-translate-y-1/2 before:rounded-full before:bg-[#333]">
        <span className="min-w-0">{children}</span>
        {tag ? <PaymentSummaryTag tone={tagTone}>{tag}</PaymentSummaryTag> : null}
      </span>
    </div>
  );
}

export function PaymentDetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[15px] text-[#333]">
      <dt className="font-bold leading-[30px]">{label}:</dt>
      <dd className="min-w-0 leading-6">{value}</dd>
    </div>
  );
}

export function PaymentPersonalDetailsCard({
  audienceType,
  role,
  jurisdiction,
  fullName,
  email,
  countryFormatted,
  organization,
  organizationLabel,
  attendance,
  title,
  registrationDateFormatted,
}: {
  audienceType: RegistrationFormValues["audienceType"];
  role: string;
  jurisdiction: string;
  fullName: string;
  email: string;
  countryFormatted: string;
  organization: string;
  organizationLabel: string;
  attendance: string;
  title: string;
  /** Figma Pay-pending summary — shown after Attendance when draft timestamp exists */
  registrationDateFormatted?: string | null;
}) {
  const dateRow =
    registrationDateFormatted != null && registrationDateFormatted !== "" ? (
      <PaymentDetailRow
        label="Registration Date"
        value={registrationDateFormatted}
      />
    ) : null;

  if (audienceType === "industry" || audienceType === "fellow") {
    return (
      <PaymentSummaryCard
        title={title}
        icon={<FigmaIcon name="user-bold-24" size={24} className="size-6" />}
      >
        <dl className="flex flex-col gap-1">
          <PaymentDetailRow label="Full Name" value={fullName} />
          <PaymentDetailRow label="Email Address" value={email} />
          <PaymentDetailRow label="Country" value={countryFormatted} />
          <PaymentDetailRow label={organizationLabel} value={organization} />
          <PaymentDetailRow label="Attendance" value={attendance} />
          {dateRow}
        </dl>
      </PaymentSummaryCard>
    );
  }

  if (audienceType === "virtual") {
    return (
      <PaymentSummaryCard
        title={title}
        icon={<FigmaIcon name="user-bold-24" size={24} className="size-6" />}
      >
        <dl className="flex flex-col gap-1">
          <PaymentDetailRow label="Full Name" value={fullName} />
          <PaymentDetailRow label="Email Address" value={email} />
          <PaymentDetailRow label="Jurisdiction" value={jurisdiction} />
          <PaymentDetailRow label="Attendance" value={attendance} />
          {dateRow}
        </dl>
      </PaymentSummaryCard>
    );
  }

  return (
    <PaymentSummaryCard
      title={title}
      icon={<FigmaIcon name="user-bold-24" size={24} className="size-6" />}
    >
      <dl className="flex flex-col gap-1">
        <PaymentDetailRow label="Specific Role" value={role} />
        <PaymentDetailRow label="Jurisdiction" value={jurisdiction} />
        <PaymentDetailRow label="Full Name" value={fullName} />
        <PaymentDetailRow label="Email Address" value={email} />
        {organization.trim() && organization !== "-" ? (
          <PaymentDetailRow label={organizationLabel} value={organization} />
        ) : null}
        <PaymentDetailRow label="Attendance" value={attendance} />
        {dateRow}
      </dl>
    </PaymentSummaryCard>
  );
}

export const guestTypeLabels = {
  distinguished_fellow: "IAIS Distinguished Fellow",
  press: "Press",
  consumer_group: "Consumer Group",
  external_speaker: "External Speaker",
} as const;

export function formatCarbonOffset(value: RegistrationFormValues["carbonOffset"]) {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value === "not_available") return "Not available";
  return "Yes";
}

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-[#e1e3e6] bg-white p-4 text-left transition hover:border-accent/40"
    >
      <div className="min-w-0 flex-1 space-y-0">
        <p className="text-[15px] leading-normal text-[#4d4d4d]">{label}</p>
        <p className="wrap-break-word text-base font-bold leading-6 text-black">{value}</p>
      </div>
      <span className="shrink-0" title="Copy">
        {copied ? (
          <svg className="size-5 text-accent" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 10.5l4 4 8-9" />
          </svg>
        ) : (
          <FigmaIcon
            name="document-copy-bold-24"
            size={20}
            className="size-5 shrink-0"
            aria-hidden
          />
        )}
      </span>
    </button>
  );
}
