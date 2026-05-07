"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import type { FieldErrors, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import {
  audienceTypeValues,
  createRegistrationSchema,
  defaultRegistrationValues,
  getFeesHkd,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { ackReferenceFromDraftId } from "@/lib/registration-reference";
import { ensureRegistrationEmail } from "@/lib/synthetic-registration-email";
import { RegistrationPageShell } from "@/components/layout/registration-page-shell";
import { FigmaIcon } from "@/components/icons/figma-icon";
import { RegistrationStep0Card } from "@/components/registration/registration-step0-card";
import { StepRegistration } from "@/components/registration/step-registration";
import { StepReview } from "@/components/registration/step-review";
import { StepPay } from "@/components/registration/step-pay";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";

/** Fields with a native focus target (RHF `setFocus` works reliably). */
const FOCUSABLE_FIELDS: (keyof RegistrationFormValues)[] = [
  "title",
  "firstName",
  "lastName",
  "company",
  "jobTitle",
  "phoneCountry",
  "phoneNumber",
  "country",
  "contactTitle",
  "contactFirstName",
  "contactLastName",
  "dietaryOtherDetails",
];

type AudienceType = (typeof audienceTypeValues)[number];

function parseAudienceType(value: string | null): AudienceType {
  return audienceTypeValues.includes(value as AudienceType)
    ? (value as AudienceType)
    : "members";
}

function defaultAttendanceForAudience(
  audienceType: AudienceType,
): RegistrationFormValues["attendance"] {
  return audienceType === "virtual" ? "online" : "in_person";
}

async function completeRegistrationWithoutPayment(options: {
  registration: RegistrationFormValues;
  locale: string;
  draftId: string;
}): Promise<{ reference: string; email: string }> {
  const registration = ensureRegistrationEmail(options.registration);
  const reference = ackReferenceFromDraftId(options.draftId.trim());
  const res = await fetch("/api/registrations/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registration,
      locale: options.locale,
      reference,
      paymentMethod: "no_payment",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Could not complete registration",
    );
  }
  return { reference, email: registration.email };
}

/** Surface Zod `flatten()` from `/api/registrations/*` when client and server validation drift. */
function formatAckApiIssues(issues: unknown): string | null {
  if (!issues || typeof issues !== "object") return null;
  const f = issues as {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
  const parts: string[] = [];
  if (Array.isArray(f.formErrors)) {
    parts.push(...f.formErrors.filter(Boolean));
  }
  if (f.fieldErrors && typeof f.fieldErrors === "object") {
    for (const msgs of Object.values(f.fieldErrors)) {
      if (Array.isArray(msgs)) parts.push(...msgs.filter(Boolean));
    }
  }
  const s = parts.join(" ").trim();
  return s.length > 0 ? s : null;
}

function RegistrationWizardForm() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tShell = useTranslations("Shell");
  const tWizard = useTranslations("Wizard");
  const tVal = useTranslations("Validation");

  const refQ = searchParams?.get("ref") ?? null;
  const stepQ = searchParams?.get("step") ?? null;
  const audienceQ = parseAudienceType(searchParams?.get("audience") ?? null);
  const shouldResume = Boolean(refQ && (stepQ === "review" || stepQ === "pay"));
  const resumeCompleteOnly = Boolean(refQ && stepQ === "complete");

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [paymentDraftId, setPaymentDraftId] = useState<string | null>(null);
  const [draftCreatedAtIso, setDraftCreatedAtIso] = useState<string | null>(null);
  const [resumeStatus, setResumeStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >(shouldResume ? "loading" : resumeCompleteOnly ? "done" : "idle");

  /** Resolved via GET /api/stripe/publishable-config (tracks env + admin DB mode). */
  const [stripePromise, setStripePromise] = useState<Promise<
    Stripe | null
  > | null>(null);
  /** Forces Stripe Elements to remount when the publishable key changes (Stripe forbids swapping `stripe` after mount). */
  const [stripePublishableKey, setStripePublishableKey] = useState<
    string | null
  >(null);
  const [stripeConfigError, setStripeConfigError] = useState(false);
  /** Matches `resolveFeesHkdForApi` on the server (env + admin DB live toggle). */
  const [stripePricingLive, setStripePricingLive] = useState(false);
  const lastStripePkRef = useRef<string | null>(null);
  const [hidePayHeaderBlock, setHidePayHeaderBlock] = useState(false);

  const loadStripePublishableConfig = useMemo(() => {
    return async () => {
      try {
        const res = await fetch("/api/stripe/publishable-config", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("bad_response");
        const data = (await res.json()) as {
          publishableKey?: string;
          live?: boolean;
        };
        setStripePricingLive(Boolean(data.live));
        const pk = data.publishableKey?.trim() ?? "";
        if (!pk) {
          lastStripePkRef.current = null;
          setStripePublishableKey(null);
          setStripePromise(null);
          setStripeConfigError(true);
          return;
        }
        setStripeConfigError(false);
        if (lastStripePkRef.current === pk) return;
        lastStripePkRef.current = pk;
        setStripePublishableKey(pk);
        setStripePromise(loadStripe(pk));
      } catch {
        lastStripePkRef.current = null;
        setStripePublishableKey(null);
        setStripePromise(null);
        setStripeConfigError(true);
      }
    };
  }, []);

  useEffect(() => {
    void loadStripePublishableConfig();
  }, [loadStripePublishableConfig, step]);

  useEffect(() => {
    if (step !== 2) return;
    const id = window.setInterval(() => {
      void loadStripePublishableConfig();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [step, loadStripePublishableConfig]);

  useEffect(() => {
    if (step !== 2) return;
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void loadStripePublishableConfig();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [step, loadStripePublishableConfig]);

  const required = tVal("required");
  const invalidEmail = tVal("invalidEmail");
  const invalidContactEmail = tVal("invalidContactEmail");
  const selectLunch = tVal("selectLunch");
  const selectDietaryYesNo = tVal("selectDietaryYesNo");
  const selectDietaryPreference = tVal("selectDietaryPreference");
  const dietaryOtherRequired = tVal("dietaryOtherRequired");
  const alternateContactRequired = tVal("alternateContactRequired");
  const consentRequired = tVal("consentRequired");
  const refundPolicyAckRequired = tVal("refundPolicyAckRequired");

  const schema = useMemo(
    () =>
      createRegistrationSchema({
        required,
        invalidEmail,
        invalidContactEmail,
        selectLunch,
        selectDietaryYesNo,
        selectDietaryPreference,
        dietaryOtherRequired,
        alternateContactRequired,
        consentRequired,
        refundPolicyAckRequired,
      }),
    [
      required,
      invalidEmail,
      invalidContactEmail,
      selectLunch,
      selectDietaryYesNo,
      selectDietaryPreference,
      dietaryOtherRequired,
      alternateContactRequired,
      consentRequired,
      refundPolicyAckRequired,
    ],
  );

  /**
   * Dev autofill — gated by `NEXT_PUBLIC_AUTOFILL_REG=1` in `.env.local`.
   * Over-fills every audience-conditional required field so the form passes
   * Zod validation regardless of which audience card the user clicks
   * (`members` / `industry` / `fellow` / `virtual`). Mirrors the schema's
   * `superRefine` rules in `lib/registration-schema.ts`:
   *   - members → `memberDelegateRole`, `jurisdiction`, `refundPolicyAck`
   *   - industry / fellow → `annualConferenceDays` + `industryLunchDays`
   *     (subset constraint), plus `guestType` for fellow
   *   - in_person non-members → `lunchSession` ("none" skips dietary)
   *   - all → `email` (real-looking) and `consent` checked
   */
  const autofillDevDefaults: RegistrationFormValues = useMemo(
    () => ({
      ...defaultRegistrationValues,
      audienceType: audienceQ,
      attendance: defaultAttendanceForAudience(audienceQ),
      // Personal details (all audiences)
      title: "Mr",
      firstName: "Test",
      lastName: "User",
      company: "IAIS QA",
      jobTitle: "QA Engineer",
      email: "qa+autofill@example.com",
      phoneCountry: "HK",
      phoneNumber: "91234567",
      country: "HK",
      sameContact: true,
      cpdApply: "no",
      consent: true,
      // Members audience (Figma 2:824)
      memberDelegateRole: "iais_member",
      jurisdiction: "HK",
      committeeMeetings: ["nov9_arc", "nov10_mpc"],
      refundPolicyAck: true,
      invitationLetterRequested: false,
      // Industry / fellow conference + lunch (industryLunchDays ⊆ annualConferenceDays)
      annualConferenceDays: ["nov12", "nov13"],
      industryLunchDays: ["nov12"],
      socialEvents: [],
      ...(audienceQ === "fellow"
        ? { guestType: "distinguished_fellow" as const }
        : {}),
      // Lunch + dietary — "none" makes dietaryYesNo not required for in_person
      lunchSession: "none",
      dietaryYesNo: "no",
      dietary: undefined,
      dietaryOtherDetails: "",
      // Travel info (industry / fellow)
      cityOfDeparture: "Hong Kong",
      meansOfTransportation: "Self-arranged",
      carbonOffset: "not_available",
    }),
    [audienceQ],
  );

  const initialDefaults =
    process.env.NEXT_PUBLIC_AUTOFILL_REG === "1"
      ? autofillDevDefaults
      : {
          ...defaultRegistrationValues,
          audienceType: audienceQ,
          attendance: defaultAttendanceForAudience(audienceQ),
        };

  const methods = useForm<RegistrationFormValues>({
    resolver: zodResolver(schema as never) as Resolver<RegistrationFormValues>,
    defaultValues: initialDefaults,
    mode: "onBlur",
  });

  const {
    handleSubmit,
    setFocus,
    reset,
    watch,
    formState: { errors, submitCount },
  } = methods;

  const audienceTypeLive = watch("audienceType");

  useEffect(() => {
    if (!shouldResume || !refQ) return;
    setResumeStatus("loading");
    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch(`/api/registrations/draft/${refQ}`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("not_found");
        const data = (await res.json()) as {
          payload: RegistrationFormValues;
          draftCreatedAt?: string;
        };
        reset(data.payload);
        setDraftCreatedAtIso(
          typeof data.draftCreatedAt === "string" ? data.draftCreatedAt : null,
        );
        if (stepQ === "pay") {
          const commitRes = await fetch("/api/registrations/commit-for-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              registration: data.payload,
              locale,
              draftId: refQ,
            }),
          });
          if (!commitRes.ok) {
            throw new Error("commit_failed");
          }
        }
        const resumedPayload = ensureRegistrationEmail(data.payload);
        const resumedBaseFee = getFeesHkd(resumedPayload.attendance, {
          audienceType: resumedPayload.audienceType,
        });
        if (stepQ === "pay" && resumedBaseFee === 0) {
          const { reference, email } = await completeRegistrationWithoutPayment({
            registration: resumedPayload,
            locale,
            draftId: refQ,
          });
          const q = new URLSearchParams({ ref: reference, email });
          router.replace(`/register/thank-you?${q.toString()}`);
          setResumeStatus("done");
          return;
        }
        setPaymentDraftId(refQ);
        setStep(stepQ === "pay" ? 2 : 1);
        setResumeStatus("done");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setResumeStatus("error");
        setStep(0);
        reset(defaultRegistrationValues);
        setPaymentDraftId(null);
        setDraftCreatedAtIso(null);
        router.replace("/register");
      }
    })();

    return () => ac.abort();
  }, [shouldResume, refQ, stepQ, locale, reset, router]);

  useEffect(() => {
    if (!shouldResume) {
      setResumeStatus((s) => (s === "error" ? "idle" : s));
    }
  }, [shouldResume]);

  useEffect(() => {
    if (!resumeCompleteOnly || !refQ) return;
    const q = new URLSearchParams({ ref: refQ });
    router.replace(`/register/thank-you?${q.toString()}`);
  }, [resumeCompleteOnly, refQ, router]);

  const onInvalid = (fieldErrors: FieldErrors<RegistrationFormValues>) => {
    const firstKey = FOCUSABLE_FIELDS.find((k) => fieldErrors[k]);
    if (firstKey) {
      void setFocus(firstKey);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [ackBusy, setAckBusy] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);

  const goReview = handleSubmit(async () => {
    setAckError(null);
    const d = ensureRegistrationEmail(methods.getValues());
    methods.reset(d);
    setAckBusy(true);
    try {
      const res = await fetch("/api/registrations/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration: d,
          locale,
          ...(paymentDraftId ? { draftId: paymentDraftId } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        draftId?: string;
        reference?: string;
        error?: string;
        issues?: unknown;
      };
      if (!res.ok) {
        const fromIssues =
          data.error === "Invalid registration"
            ? formatAckApiIssues(data.issues)
            : null;
        setAckError(
          fromIssues ??
            (typeof data.error === "string"
              ? data.error
              : tWizard("acknowledgeFailed")),
        );
        return;
      }
      if (!data.draftId) {
        setAckError(tWizard("acknowledgeFailed"));
        return;
      }
      setPaymentDraftId(data.draftId);
      router.replace(
        `/register?step=review&ref=${encodeURIComponent(data.draftId)}`,
      );
      setStep(1);
    } catch {
      setAckError(tWizard("acknowledgeFailed"));
    } finally {
      setAckBusy(false);
    }
  }, onInvalid);

  const goPay = async () => {
    if (!paymentDraftId) return;
    setAckError(null);
    setAckBusy(true);
    try {
      const d = ensureRegistrationEmail(methods.getValues());
      const res = await fetch("/api/registrations/commit-for-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration: d,
          locale,
          draftId: paymentDraftId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        issues?: unknown;
      };
      if (!res.ok) {
        const draftMissing =
          res.status === 404 || data.error === "Draft not found";
        const fromIssues =
          !draftMissing && data.error === "Invalid registration"
            ? formatAckApiIssues(data.issues)
            : null;
        setAckError(
          draftMissing
            ? tWizard("sessionDraftMissing")
            : fromIssues ??
              (typeof data.error === "string"
                ? data.error
                : tWizard("acknowledgeFailed")),
        );
        return;
      }
      const baseFeeHkd = getFeesHkd(d.attendance, {
        audienceType: d.audienceType,
      });
      if (baseFeeHkd === 0) {
        try {
          const { reference, email } = await completeRegistrationWithoutPayment({
            registration: d,
            locale,
            draftId: paymentDraftId,
          });
          onPaid(reference, email);
        } catch (e) {
          setAckError(
            e instanceof Error ? e.message : tWizard("acknowledgeFailed"),
          );
        }
        return;
      }
      router.replace(
        `/register?step=pay&ref=${encodeURIComponent(paymentDraftId)}`,
      );
      setStep(2);
    } catch {
      setAckError(tWizard("acknowledgeFailed"));
    } finally {
      setAckBusy(false);
    }
  };

  const onPaid = (reference: string, email: string) => {
    const q = new URLSearchParams({
      ref: reference,
      email,
    });
    router.replace(`/register/thank-you?${q.toString()}`);
  };

  const subtitle =
    step === 0
      ? tShell("subtitleRegistration")
      : step === 1
        ? tShell("subtitleReview")
        : tShell("subtitlePay");

  const showValidationBanner =
    step === 0 && submitCount > 0 && Object.keys(errors).length > 0;

  if (resumeStatus === "loading") {
    return (
      <FormProvider {...methods}>
        <RegistrationPageShell
          step={stepQ === "pay" ? 2 : 1}
          subtitle={stepQ === "pay" ? tShell("subtitlePay") : tShell("subtitleReview")}
          contentMaxClassName="max-w-none"
          hideSiteHeader
          hideEventHeader={stepQ === "pay" ? false : true}
          payHeaderBelowStepper={stepQ === "pay"}
          hideLanguageSwitcher
        >
          <p className="py-16 text-center text-[15px] text-ink-soft md:text-base">
            {tWizard("resumingPayment")}
          </p>
        </RegistrationPageShell>
      </FormProvider>
    );
  }

  if (resumeCompleteOnly && refQ) {
    return (
      <FormProvider {...methods}>
        <RegistrationPageShell
          step={3}
          subtitle={tShell("subtitleThankYou")}
          contentMaxClassName="max-w-none"
          hideSiteHeader
          hideEventHeader
          hideLanguageSwitcher
        >
          <div className="flex w-full flex-col items-stretch gap-6 px-2 py-8 text-center text-sm text-ink-soft md:gap-6">
            {tWizard("pleaseWait")}
          </div>
        </RegistrationPageShell>
      </FormProvider>
    );
  }

  return (
    <FormProvider {...methods}>
      <RegistrationPageShell
        step={step}
        subtitle={subtitle}
        contentMaxClassName="max-w-none"
        hideSiteHeader
        hideEventHeader={step < 2}
        payHeaderBelowStepper={step === 2}
        hidePayHeaderBlock={step === 2 && hidePayHeaderBlock}
        hideLanguageSwitcher={step >= 1}
        showChangeAttendanceType={false}
        hideStepIndicator={step === 0}
      >
        {resumeStatus === "error" ? (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-error bg-[#fff5f5] px-4 py-3 text-[15px] leading-snug text-error"
          >
            {tWizard("resumeFailed")}
          </div>
        ) : null}
        {step === 0 ? (
          <form
            noValidate
            className="flex w-full flex-col"
            onSubmit={goReview}
          >
            {ackError ? (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-error bg-[#fff5f5] px-4 py-3 text-[15px] leading-snug text-error"
              >
                {ackError}
              </div>
            ) : null}
            {showValidationBanner ? (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-error bg-[#fff5f5] px-4 py-3 text-[15px] leading-snug text-error"
              >
                {tWizard("validationSummary")}
              </div>
            ) : null}
            <RegistrationStep0Card>
              <div className="flex flex-col gap-6 md:gap-8">
                <StepRegistration />
              </div>
              <div className="mt-8 flex flex-col-reverse gap-3 sm:mt-10">
                <button
                  type="submit"
                  disabled={ackBusy}
                  className="w-full rounded-xl bg-[#0057b8] px-[43px] py-3 text-[16px] leading-6 text-white transition hover:opacity-95 disabled:opacity-60"
                >
                  {ackBusy ? tWizard("pleaseWait") : tWizard("continueReview")}
                </button>
              </div>
            </RegistrationStep0Card>
          </form>
        ) : (
          <>
            <div className="flex flex-col gap-6 md:gap-8">
              {step === 1 && ackError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-error bg-[#fff5f5] px-4 py-3 text-[15px] leading-snug text-error"
                >
                  {ackError}
                </div>
              ) : null}
              {step === 1 ? (
                <RegistrationStep0Card>
                  <StepReview embedded />
                  <div className="mt-8 flex flex-col-reverse gap-3 sm:mt-10 sm:flex-row sm:items-stretch sm:gap-4">
                    <button
                      type="button"
                      disabled={ackBusy}
                      onClick={() => {
                        const next = new URLSearchParams();
                        next.set("audience", audienceTypeLive);
                        if (paymentDraftId) {
                          next.set("ref", paymentDraftId);
                        }
                        router.replace(`/register?${next.toString()}`);
                        setStep(0);
                        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                      }}
                      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#828282] bg-white px-6 py-3 text-[16px] leading-6 text-[#828282] transition hover:bg-[#f8f9fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
                    >
                      <FigmaIcon
                        name="arrow-circle-left"
                        size={24}
                        className="size-6 shrink-0"
                        aria-hidden
                      />
                      {tWizard("backReview")}
                    </button>
                    <button
                      type="button"
                      disabled={ackBusy}
                      onClick={() => void goPay()}
                      className="w-full flex-1 rounded-xl bg-[#0057b8] px-[43px] py-3 text-[16px] leading-6 font-normal text-white transition hover:opacity-95 disabled:opacity-60"
                    >
                      {ackBusy ? tWizard("pleaseWait") : tWizard("confirmAndPay")}
                    </button>
                  </div>
                </RegistrationStep0Card>
              ) : null}
              {step === 2 ? (
                stripeConfigError ? (
                  <p
                    role="alert"
                    className="rounded-lg border border-error bg-[#fff5f5] px-4 py-3 text-[15px] text-error"
                  >
                    {tWizard("stripeConfigError")}
                  </p>
                ) : !stripePromise ? (
                  <p className="py-12 text-center text-[15px] text-ink-soft">
                    {tWizard("stripeLoading")}
                  </p>
                ) : (
                  <Elements
                    key={stripePublishableKey}
                    stripe={stripePromise}
                  >
                    <StepPay
                      stripePricingLive={stripePricingLive}
                      onComplete={onPaid}
                      paymentDraftId={paymentDraftId}
                      onPaymentDraftId={setPaymentDraftId}
                      draftCreatedAtIso={draftCreatedAtIso}
                      onPayChromeChange={setHidePayHeaderBlock}
                    />
                  </Elements>
                )
              ) : null}
            </div>
          </>
        )}
      </RegistrationPageShell>
    </FormProvider>
  );
}

export function RegistrationWizard() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-24 text-center text-[15px] text-ink-soft">
          Loading
        </div>
      }
    >
      <RegistrationWizardForm />
    </Suspense>
  );
}
