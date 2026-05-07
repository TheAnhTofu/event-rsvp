"use client";

import type { Dispatch, SetStateAction } from "react";
import type { RegistrationDetailResponse } from "@/types/crm";
import type { RegistrantInfoFormState } from "../form-state";
import {
  FieldLabel,
  InfoBlock,
  InfoGridTwo,
  INPUT_CLASS,
} from "../primitives";
import { formatPhoneLine, str } from "../utils";

type Props = {
  row: RegistrationDetailResponse;
  sameContact: boolean;
  isEditing: boolean;
  draft: RegistrantInfoFormState;
  setDraft: Dispatch<SetStateAction<RegistrantInfoFormState>>;
};

export function ContactPersonCard({
  row,
  sameContact,
  isEditing,
  draft,
  setDraft,
}: Props) {
  const p = row.payload;

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-admin-border bg-white p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-[16px] font-semibold leading-[22px] text-admin-navy">
          Contact Person{" "}
          <span className="font-normal">
            (for registration matters, if different from the attendee)
          </span>
        </h2>
        <p className="text-[14px] font-medium text-[#566072]">
          (You will receive a copy of the confirmation email and a forum reminder.)
        </p>
      </div>

      {isEditing ? (
        <>
          <label className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-ink">
            <input
              type="checkbox"
              className="size-4 rounded border-admin-border"
              checked={draft.sameContact}
              onChange={(e) =>
                setDraft((d) => ({ ...d, sameContact: e.target.checked }))
              }
            />
            Same as attendee
          </label>
          {!draft.sameContact ? (
            <>
              <InfoGridTwo>
                <InfoBlock label="Registrant ID" value={row.reference} />
                <div className="flex min-w-0 flex-col gap-1">
                  <FieldLabel>Title</FieldLabel>
                  <input
                    className={INPUT_CLASS}
                    value={draft.contactTitle}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, contactTitle: e.target.value }))
                    }
                  />
                </div>
              </InfoGridTwo>
              <InfoGridTwo>
                <div className="flex min-w-0 flex-col gap-1">
                  <FieldLabel>First Name</FieldLabel>
                  <input
                    className={INPUT_CLASS}
                    value={draft.contactFirstName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, contactFirstName: e.target.value }))
                    }
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <FieldLabel>Last Name</FieldLabel>
                  <input
                    className={INPUT_CLASS}
                    value={draft.contactLastName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, contactLastName: e.target.value }))
                    }
                  />
                </div>
              </InfoGridTwo>
              <InfoGridTwo>
                <div className="flex min-w-0 flex-col gap-1">
                  <FieldLabel>Company / Organization</FieldLabel>
                  <input
                    className={INPUT_CLASS}
                    value={draft.contactCompany}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, contactCompany: e.target.value }))
                    }
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <FieldLabel>Job Title</FieldLabel>
                  <input
                    className={INPUT_CLASS}
                    value={draft.contactJobTitle}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, contactJobTitle: e.target.value }))
                    }
                  />
                </div>
              </InfoGridTwo>
              <div className="flex min-w-0 flex-col gap-1">
                <FieldLabel>Email (contact)</FieldLabel>
                <input
                  type="email"
                  className={INPUT_CLASS}
                  value={draft.contactEmail}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contactEmail: e.target.value }))
                  }
                />
              </div>
              <InfoGridTwo>
                <div className="flex min-w-0 flex-col gap-1">
                  <FieldLabel>Contact phone country (ISO2)</FieldLabel>
                  <input
                    className={INPUT_CLASS}
                    value={draft.contactPhoneCountry}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        contactPhoneCountry: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <FieldLabel>Contact phone number</FieldLabel>
                  <input
                    className={INPUT_CLASS}
                    value={draft.contactPhoneNumber}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        contactPhoneNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              </InfoGridTwo>
            </>
          ) : (
            <p className="text-[15px] leading-6 text-ink">Same as attendee.</p>
          )}
        </>
      ) : sameContact ? (
        <p className="text-[15px] leading-6 text-ink">
          Same as attendee.
        </p>
      ) : (
        <>
          <InfoGridTwo>
            <InfoBlock label="Registrant ID" value={row.reference} />
            <InfoBlock
              label="Title"
              value={str(p, "contactTitle") || "—"}
            />
          </InfoGridTwo>

          <InfoGridTwo>
            <InfoBlock
              label="First Name"
              value={str(p, "contactFirstName") || "—"}
            />
            <InfoBlock
              label="Last Name"
              value={str(p, "contactLastName") || "—"}
            />
          </InfoGridTwo>

          <InfoGridTwo>
            <InfoBlock
              label="Company / Organization"
              value={str(p, "contactCompany") || "—"}
            />
            <InfoBlock
              label="Job Title"
              value={str(p, "contactJobTitle") || "—"}
            />
          </InfoGridTwo>

          <InfoBlock
            label="Email Address* (You will receive a confirmation email and a forum reminder here.)"
            value={str(p, "contactEmail") || "—"}
          />

          <InfoBlock
            label="Telephone"
            value={formatPhoneLine(
              str(p, "contactPhoneCountry"),
              str(p, "contactPhoneNumber"),
            )}
          />
        </>
      )}
    </section>
  );
}
