"use client";

import { useLocale } from "next-intl";
import { RegistrationStatusTimeline } from "@/components/admin/RegistrationStatusTimeline";
import { CheckInInformationTimeline } from "@/components/admin/registration-detail/check-in-information-timeline";
import { buildCountryOptions } from "@/lib/countries-data";
import type { AppLocale } from "@/i18n/routing";
import type {
  CheckInLogEntry,
  RegistrationPipelineSnapshot,
} from "@/types/admin-registration-detail";
import type { EmailLogRow } from "@/types/email-log";
import type { PipelineStepView } from "@/types/admin-pipeline";
import type { RegistrationDetailResponse } from "@/types/crm";
import { ConsentCard } from "./registrant-information/sections/consent-card";
import { ContactPersonCard } from "./registrant-information/sections/contact-person-card";
import { RegistrantInformationHeaderBar } from "./registrant-information/sections/header-bar";
import { PersonalInformationCard } from "./registrant-information/sections/personal-information-card";
import { QrCodeCard } from "./registrant-information/sections/qr-code-card";
import { useRegistrantInfoEdit } from "./registrant-information/use-edit-mode";
import { bool } from "./registrant-information/utils";

type Props = {
  reference: string;
  row: RegistrationDetailResponse;
  pipelineTimeline: PipelineStepView[];
  displayTitle: string;
  paymentTabHref: string;
  pipelineSnapshot: RegistrationPipelineSnapshot | null;
  emailLogs: EmailLogRow[];
  checkInLogs: CheckInLogEntry[];
  onReloadRegistration: () => void | Promise<void>;
};

/**
 * Registrant Information — Figma node 796:8932: timeline (left) + read-only form cards (right).
 */
export function RegistrantInformationTab({
  reference,
  row,
  pipelineTimeline,
  displayTitle,
  paymentTabHref,
  pipelineSnapshot,
  emailLogs,
  checkInLogs,
  onReloadRegistration,
}: Props) {
  const locale = useLocale() as AppLocale;
  const p = row.payload;
  const sameContact = bool(p, "sameContact");

  const countryOptions = buildCountryOptions(locale);

  const {
    isEditing,
    draft,
    setDraft,
    saving,
    beginEdit,
    cancelEdit,
    saveEdit,
  } = useRegistrantInfoEdit(reference, row, onReloadRegistration);

  return (
    <div className="flex flex-col gap-4">
      <RegistrantInformationHeaderBar
        displayTitle={displayTitle}
        paymentTabHref={paymentTabHref}
        reference={reference}
        isEditing={isEditing}
        saving={saving}
        beginEdit={beginEdit}
        cancelEdit={cancelEdit}
        saveEdit={saveEdit}
        pipelineSnapshot={pipelineSnapshot}
        row={row}
        emailLogs={emailLogs}
        onReloadRegistration={onReloadRegistration}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:min-w-[400px] lg:max-w-[440px] lg:w-[min(100%,440px)]">
          <RegistrationStatusTimeline steps={pipelineTimeline} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <PersonalInformationCard
            row={row}
            locale={locale}
            isEditing={isEditing}
            draft={draft}
            setDraft={setDraft}
            countryOptions={countryOptions}
          />

          <ContactPersonCard
            row={row}
            sameContact={sameContact}
            isEditing={isEditing}
            draft={draft}
            setDraft={setDraft}
          />

          <ConsentCard
            row={row}
            isEditing={isEditing}
            draft={draft}
            setDraft={setDraft}
          />

          <CheckInInformationTimeline entries={checkInLogs} />

          <QrCodeCard row={row} locale={locale} />
        </div>
      </div>
    </div>
  );
}
