"use client";

import type { Dispatch, SetStateAction } from "react";
import { RegistrationTypeBadge } from "@/components/admin/registrant-list/registration-type-badge";
import { formatStoredCountry } from "@/lib/countries-data";
import type { AppLocale } from "@/i18n/routing";
import { registrationTypeLabel } from "@/lib/admin/registrant-list/utils";
import type { RegistrationDetailResponse } from "@/types/crm";
import type { RegistrantInfoFormState } from "../form-state";
import {
  FieldLabel,
  InfoBlock,
  InfoGridTwo,
  INPUT_CLASS,
} from "../primitives";
import { formatPhoneLine, str } from "../utils";

type CountryOption = { value: string; label: string };

type Props = {
  row: RegistrationDetailResponse;
  locale: AppLocale;
  isEditing: boolean;
  draft: RegistrantInfoFormState;
  setDraft: Dispatch<SetStateAction<RegistrantInfoFormState>>;
  countryOptions: CountryOption[];
};

export function PersonalInformationCard({
  row,
  locale,
  isEditing,
  draft,
  setDraft,
  countryOptions,
}: Props) {
  const p = row.payload;
  const emailMain = row.email || str(p, "email");
  const countryMain = formatStoredCountry(str(p, "country"), locale) || "—";

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-admin-border bg-white p-6">
      <h2 className="text-[16px] font-semibold leading-[22px] text-admin-navy">
        Personal Information
      </h2>

      {isEditing ? (
        <>
          <InfoGridTwo>
            <InfoBlock label="Registrant ID" value={row.reference} />
            <div className="flex min-w-0 flex-col gap-1">
              <FieldLabel>Participant category</FieldLabel>
              <RegistrationTypeBadge audienceType={str(p, "audienceType")} />
            </div>
          </InfoGridTwo>
          <div className="flex min-w-0 flex-col gap-1">
            <FieldLabel>Participation</FieldLabel>
            <select
              className={INPUT_CLASS}
              value={draft.attendance}
              onChange={(e) =>
                setDraft((d) => ({ ...d, attendance: e.target.value }))
              }
            >
              <option value="in_person">Physical Participation</option>
              <option value="online">Online Participation</option>
              <option value="not_attending">Not attending</option>
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <FieldLabel>Title</FieldLabel>
            <input
              className={INPUT_CLASS}
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </div>
          <InfoGridTwo>
            <div className="flex min-w-0 flex-col gap-1">
              <FieldLabel>First Name</FieldLabel>
              <input
                className={INPUT_CLASS}
                value={draft.firstName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, firstName: e.target.value }))
                }
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <FieldLabel>Last Name</FieldLabel>
              <input
                className={INPUT_CLASS}
                value={draft.lastName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, lastName: e.target.value }))
                }
              />
            </div>
          </InfoGridTwo>
          <InfoGridTwo>
            <div className="flex min-w-0 flex-col gap-1">
              <FieldLabel>Company / Organization</FieldLabel>
              <input
                className={INPUT_CLASS}
                value={draft.company}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, company: e.target.value }))
                }
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <FieldLabel>Job Title</FieldLabel>
              <input
                className={INPUT_CLASS}
                value={draft.jobTitle}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, jobTitle: e.target.value }))
                }
              />
            </div>
          </InfoGridTwo>
          <div className="flex min-w-0 flex-col gap-1">
            <FieldLabel>
              Email Address* (You will receive a confirmation email and a forum reminder here.)
            </FieldLabel>
            <input
              type="email"
              autoComplete="email"
              className={INPUT_CLASS}
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            />
          </div>
          <InfoGridTwo>
            <div className="flex min-w-0 flex-col gap-1">
              <FieldLabel>Phone country (ISO2, e.g. HK)</FieldLabel>
              <input
                className={INPUT_CLASS}
                value={draft.phoneCountry}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, phoneCountry: e.target.value }))
                }
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <FieldLabel>Phone number</FieldLabel>
              <input
                className={INPUT_CLASS}
                value={draft.phoneNumber}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, phoneNumber: e.target.value }))
                }
              />
            </div>
          </InfoGridTwo>
          <div className="flex min-w-0 flex-col gap-1">
            <FieldLabel>Country/Region</FieldLabel>
            <select
              className={INPUT_CLASS}
              value={draft.country || ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, country: e.target.value }))
              }
            >
              <option value="">—</option>
              {countryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
          <InfoGridTwo>
            <InfoBlock label="Registrant ID" value={row.reference} />
            <div className="flex min-w-0 flex-col gap-1">
              <FieldLabel>Registration Type</FieldLabel>
              <RegistrationTypeBadge audienceType={str(p, "audienceType")} />
            </div>
          </InfoGridTwo>
          <InfoBlock
            label="Participation"
            value={registrationTypeLabel(str(p, "attendance"))}
          />

          <InfoBlock label="Title" value={str(p, "title") || "—"} />

          <InfoGridTwo>
            <InfoBlock label="First Name" value={str(p, "firstName") || "—"} />
            <InfoBlock label="Last Name" value={str(p, "lastName") || "—"} />
          </InfoGridTwo>

          <InfoGridTwo>
            <InfoBlock label="Company / Organization" value={str(p, "company") || "—"} />
            <InfoBlock label="Job Title" value={str(p, "jobTitle") || "—"} />
          </InfoGridTwo>

          <InfoBlock
            label="Email Address* (You will receive a confirmation email and a forum reminder here.)"
            value={emailMain || "—"}
          />

          <InfoGridTwo>
            <InfoBlock
              label="Telephone"
              value={formatPhoneLine(str(p, "phoneCountry"), str(p, "phoneNumber"))}
            />
            <InfoBlock label="Country/Region" value={countryMain} />
          </InfoGridTwo>
        </>
      )}
    </section>
  );
}
