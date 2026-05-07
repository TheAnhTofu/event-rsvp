"use client";

import {
  registrationFormCategoryBadgeClass,
  registrationFormCategoryLabel,
} from "@/lib/admin/registrant-list/registration-form-category";

/** Figma « Registration Type » badges — participant category (four homepage forms). */
const BADGE_BASE =
  "inline-flex max-w-full items-center rounded-lg px-3 py-1 text-[10px] font-normal leading-[18px] tracking-[0.16px] text-white";

type Props = {
  audienceType: string | null | undefined;
  className?: string;
};

export function RegistrationTypeBadge({ audienceType, className = "" }: Props) {
  const label = registrationFormCategoryLabel(audienceType);
  const bg = registrationFormCategoryBadgeClass(audienceType);
  return (
    <span className={`${BADGE_BASE} ${bg} ${className}`.trim()} title={label}>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
