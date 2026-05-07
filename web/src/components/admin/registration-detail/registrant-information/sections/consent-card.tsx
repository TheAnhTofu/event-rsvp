"use client";

import type { Dispatch, SetStateAction } from "react";
import type { RegistrationDetailResponse } from "@/types/crm";
import type { RegistrantInfoFormState } from "../form-state";
import {
  FieldLabel,
  InfoBlock,
  INPUT_CLASS,
  ReadOnlyConsentRow,
  ReadOnlyRadioNoSelected,
  ReadOnlyRadioYesSelected,
} from "../primitives";
import { bool, dietaryPreferenceDisplay, str } from "../utils";

type Props = {
  row: RegistrationDetailResponse;
  isEditing: boolean;
  draft: RegistrantInfoFormState;
  setDraft: Dispatch<SetStateAction<RegistrantInfoFormState>>;
};

export function ConsentCard({ row, isEditing, draft, setDraft }: Props) {
  const p = row.payload;

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-admin-border bg-white p-6">
      <h2 className="text-[18px] font-semibold leading-[22px] text-admin-navy">
        Other Information
      </h2>

      {isEditing ? (
        <>
          <div className="flex min-w-0 flex-col gap-1">
            <FieldLabel>Dietary — any requirements?</FieldLabel>
            <select
              className={INPUT_CLASS}
              value={draft.dietaryYesNo}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  dietaryYesNo: e.target.value as "yes" | "no",
                }))
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          {draft.dietaryYesNo === "yes" ? (
            <>
              <div className="flex min-w-0 flex-col gap-1">
                <FieldLabel>Preference</FieldLabel>
                <select
                  className={INPUT_CLASS}
                  value={draft.dietary}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, dietary: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  <option value="vegan">Vegan</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="halal">Halal</option>
                  <option value="gluten_free">Gluten free</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {draft.dietary === "other" ? (
                <div className="flex min-w-0 flex-col gap-1">
                  <FieldLabel>Other details</FieldLabel>
                  <input
                    className={INPUT_CLASS}
                    value={draft.dietaryOtherDetails}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        dietaryOtherDetails: e.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}
            </>
          ) : null}
          <div className="flex min-w-0 flex-col gap-1">
            <FieldLabel>I would like to apply for the CPD hours</FieldLabel>
            <select
              className={INPUT_CLASS}
              value={draft.cpdApply}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  cpdApply: e.target.value as "yes" | "no",
                }))
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-[13px] font-medium text-black">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-admin-border"
              checked={draft.consent}
              onChange={(e) =>
                setDraft((d) => ({ ...d, consent: e.target.checked }))
              }
            />
            I acknowledge that I have read and agree with the above statements.
          </label>
        </>
      ) : (
        <>
          <InfoBlock
            label="Dietary Preference"
            value={dietaryPreferenceDisplay(p)}
          />

          <div className="flex flex-col gap-1">
            <p className="text-[14px] font-medium leading-[30px] text-[#001742]">
              I would like to apply for the CPD hours
            </p>
            {str(p, "cpdApply") === "yes" ? (
              <ReadOnlyRadioYesSelected />
            ) : (
              <ReadOnlyRadioNoSelected />
            )}
          </div>

          <ReadOnlyConsentRow checked={bool(p, "consent")}>
            I acknowledge that I have read and agree with the above statements.
          </ReadOnlyConsentRow>
        </>
      )}
    </section>
  );
}
