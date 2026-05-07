"use client";

import { useTranslations } from "next-intl";
import { FigmaIcon } from "@/components/icons/figma-icon";
import {
  ImportantInfoItem,
  ImportantInfoSection,
  ReturnToHomepageButton,
  SummaryWhiteCard,
} from "@/components/registration/summary-primitives";
import type { RegistrationFormValues } from "@/lib/registration-schema";
import {
  PaymentPersonalDetailsCard,
  PaymentSummaryBullet,
  PaymentSummaryCard,
} from "@/components/registration/step-pay/payment-summary";

export type PayPendingSocialLine = {
  text: string;
  tagTone: "subtle" | "blue";
};

export type PayPendingFigmaSummaryProps = {
  audienceType: RegistrationFormValues["audienceType"];
  role: string;
  jurisdiction: string;
  fullName: string;
  email: string;
  countryFormatted: string;
  organization: string;
  organizationLabel: string;
  attendance: string;
  registrationDateFormatted: string | null;
  conferenceDays: string[];
  mealLines: string[];
  socialLines: PayPendingSocialLine[];
  dietaryLabel: string;
  confirmationEmail: string;
  supportEmail: string;
};

/**
 * Figma `1499:24594` — compact summary below Payment Required banner (no full Review).
 */
export function PayPendingFigmaSummary({
  audienceType,
  role,
  jurisdiction,
  fullName,
  email,
  countryFormatted,
  organization,
  organizationLabel,
  attendance,
  registrationDateFormatted,
  conferenceDays,
  mealLines,
  socialLines,
  dietaryLabel,
  confirmationEmail,
  supportEmail,
}: PayPendingFigmaSummaryProps) {
  const tThank = useTranslations("ThankYou");

  return (
    <SummaryWhiteCard attached="top">
      {/* Figma 1499:24618 — white card: gap 32px between section stack and Return CTA; gap 28px between gray panels */}
      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-7">
        <PaymentPersonalDetailsCard
          audienceType={audienceType}
          title={tThank("registrationDetailsTitle")}
          role={role}
          jurisdiction={jurisdiction}
          fullName={fullName}
          email={email}
          countryFormatted={countryFormatted}
          organization={organization}
          organizationLabel={organizationLabel}
          attendance={attendance}
          registrationDateFormatted={registrationDateFormatted}
        />

        <PaymentSummaryCard
          title={tThank("annualConferenceTitle")}
          icon={<FigmaIcon name="note-text-bold-24" size={24} className="size-6" />}
        >
          {conferenceDays.length > 0 ? (
            conferenceDays.map((day) => (
              <PaymentSummaryBullet
                key={day}
                tag={tThank("registrationFeeAppliesTag")}
                tagTone="subtle"
              >
                {day}
              </PaymentSummaryBullet>
            ))
          ) : (
            <p className="text-[15px] leading-[30px] text-[#333]">
              {tThank("noSelectionPlaceholder")}
            </p>
          )}
        </PaymentSummaryCard>

        <PaymentSummaryCard
          title={tThank("lunchSelectionTitle")}
          icon={<FigmaIcon name="fork-spoon-rounded-24" size={24} className="size-6" />}
        >
          {mealLines.map((line) => (
            <PaymentSummaryBullet key={line}>{line}</PaymentSummaryBullet>
          ))}
        </PaymentSummaryCard>

        <PaymentSummaryCard
          title={tThank("socialEventsTitle")}
          icon={<FigmaIcon name="bookmark-2-bold-24" size={24} className="size-6" />}
        >
          {socialLines.length > 0 ? (
            socialLines.map((item) => (
              <PaymentSummaryBullet
                key={item.text}
                tag={
                  item.tagTone === "subtle"
                    ? tThank("socialTagMembersOnly")
                    : tThank("socialTagConferenceParticipants")
                }
                tagTone={item.tagTone}
              >
                {item.text}
              </PaymentSummaryBullet>
            ))
          ) : (
            <p className="text-[15px] leading-[30px] text-[#333]">
              {tThank("noSelectionPlaceholder")}
            </p>
          )}
        </PaymentSummaryCard>

        <PaymentSummaryCard
          title={tThank("dietaryRequirementsTitle")}
          icon={<FigmaIcon name="leaf-dietary-24" size={24} className="size-6" />}
        >
          <PaymentSummaryBullet>{dietaryLabel}</PaymentSummaryBullet>
        </PaymentSummaryCard>

        <ImportantInfoSection title={tThank("importantInformationTitle")}>
          <ImportantInfoItem>
            {tThank("importantInfoConfirmationLead")}
            <a
              href={`mailto:${confirmationEmail}`}
              className="text-[#3e65f5] underline decoration-solid [text-decoration-skip-ink:none]"
            >
              {confirmationEmail}
            </a>
          </ImportantInfoItem>
          <ImportantInfoItem>{tThank("importantInfoSaveEmail")}</ImportantInfoItem>
          <ImportantInfoItem>
            {tThank("importantInfoQuestionsLead")}
            <a
              href={`mailto:${supportEmail}`}
              className="text-[#3e65f5] underline decoration-solid [text-decoration-skip-ink:none]"
            >
              {supportEmail}
            </a>
          </ImportantInfoItem>
        </ImportantInfoSection>
        </div>

        <ReturnToHomepageButton label={tThank("returnToHomepage")} />
      </div>
    </SummaryWhiteCard>
  );
}
