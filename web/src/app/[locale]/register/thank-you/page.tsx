"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { RegistrationPageShell } from "@/components/layout/registration-page-shell";
import {
  ThankYouMessageCard,
  ThankYouSuccessBanner,
} from "@/components/registration/thank-you-message-card";
import { ThankYouSummaryCards } from "@/components/registration/thank-you-summary-cards";
import type { RegistrationFormValues } from "@/lib/registration-schema";

/**
 * /register/thank-you — Figma `1423:48828`
 * (834p Thank you for your registration + registration summary).
 *
 * Layout: HeroBanner → light-blue section with message card → footer from
 * `RegistrationPageShell`.
 *
 * With `?ref=…&email=…`, loads stored registration via
 * `GET /api/registrations/thank-you-summary` and shows the full summary
 * (registration details, committee days, meals, etc.). Otherwise shows the
 * compact Notes card.
 *
 * Stripe redirect: `session_id` → fulfill → replace URL with ref + email.
 */
function ThankYouInner() {
  const t = useTranslations("ThankYou");
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id")?.trim();
  const paymentIntent = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");

  const ref = searchParams.get("ref")?.trim();
  const email = searchParams.get("email")?.trim();

  const shouldFetchSummary = Boolean(ref && email);

  const redirectPaymentFailed =
    Boolean(paymentIntent) && redirectStatus === "failed";

  const [stripeSessionError, setStripeSessionError] = useState<string | null>(
    null,
  );
  const [fulfillDone, setFulfillDone] = useState(!sessionId);

  const [summaryData, setSummaryData] = useState<{
    payload: RegistrationFormValues;
    registeredAt: string | null;
  } | null>(null);
  const [summaryFetchStatus, setSummaryFetchStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >(() => (shouldFetchSummary ? "loading" : "idle"));

  useEffect(() => {
    if (!sessionId) return;
    const url = `/api/stripe/fulfill-checkout-session?session_id=${encodeURIComponent(sessionId)}`;
    void fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        const result = (await res.json()) as
          | { ok: true; reference: string; email: string }
          | { ok: false; error?: string };
        if (result.ok) {
          const q = new URLSearchParams({
            ref: result.reference,
            email: result.email,
          });
          router.replace(`/register/thank-you?${q.toString()}`);
          return;
        }
        setStripeSessionError(result.error ?? "Could not complete registration");
      })
      .catch(() => {
        setStripeSessionError("Could not reach the registration server");
      })
      .finally(() => {
        setFulfillDone(true);
      });
  }, [sessionId, router]);

  const displayStripeError =
    stripeSessionError ??
    (redirectPaymentFailed
      ? "Payment was not completed. Please try again."
      : null);

  useEffect(() => {
    if (!shouldFetchSummary || !ref || !email) {
      return;
    }

    const ac = new AbortController();
    queueMicrotask(() => {
      if (ac.signal.aborted) return;
      setSummaryFetchStatus("loading");
      const q = new URLSearchParams({ ref, email });
      void fetch(`/api/registrations/thank-you-summary?${q.toString()}`, {
        cache: "no-store",
        signal: ac.signal,
        headers: { Accept: "application/json" },
      })
        .then(async (res) => {
          if (!res.ok) {
            setSummaryData(null);
            setSummaryFetchStatus("error");
            return;
          }
          const body = (await res.json()) as {
            payload: RegistrationFormValues;
            registeredAt?: string;
          };
          setSummaryData({
            payload: body.payload,
            registeredAt: body.registeredAt ?? null,
          });
          setSummaryFetchStatus("success");
        })
        .catch(() => {
          if (ac.signal.aborted) return;
          setSummaryData(null);
          setSummaryFetchStatus("error");
        });
    });

    return () => ac.abort();
  }, [shouldFetchSummary, ref, email]);

  const summaryQueryActive = shouldFetchSummary && Boolean(ref && email);
  const visibleSummaryData = summaryQueryActive ? summaryData : null;

  const showSummaryLoading =
    summaryQueryActive && summaryFetchStatus === "loading";

  if (sessionId && !fulfillDone) {
    return (
      <RegistrationPageShell
        step={3}
        contentMaxClassName="max-w-none"
        hideSiteHeader
        hideLanguageSwitcher
      >
        <div className="flex w-full flex-col items-center px-2 py-8 text-center text-sm text-[#878b8e] md:gap-6">
          {t("summaryLoading")}
        </div>
      </RegistrationPageShell>
    );
  }

  if (showSummaryLoading) {
    return (
      <RegistrationPageShell
        step={3}
        contentMaxClassName="max-w-none"
        hideSiteHeader
        hideLanguageSwitcher
      >
        <div className="flex w-full flex-col items-center px-2 py-8 text-center text-sm text-[#878b8e] md:gap-6">
          {t("summaryLoading")}
        </div>
      </RegistrationPageShell>
    );
  }

  const summaryFailed =
    summaryQueryActive && summaryFetchStatus === "error" && !summaryData;

  return (
    <RegistrationPageShell
      step={3}
      contentMaxClassName="max-w-none"
      hideSiteHeader
      hideLanguageSwitcher
    >
      <div className="flex w-full flex-col items-stretch gap-4 md:gap-6">
        {displayStripeError ? (
          <p className="text-error m-0 w-full rounded-lg border border-error bg-[#fff5f5] px-4 py-3 text-left text-sm font-normal leading-6">
            {t("stripeSessionError", { message: displayStripeError })}
          </p>
        ) : null}

        {summaryFailed ? (
          <p className="m-0 w-full rounded-lg border border-[#cfe2ff] bg-[#ecf4ff] px-4 py-3 text-left text-sm font-normal leading-6 text-[#333]">
            {t("summaryLoadError")}
          </p>
        ) : null}

        {visibleSummaryData ? (
          <div
            className="flex w-full flex-col items-center gap-8 rounded-bl-[16px] rounded-br-[16px] rounded-tl-[6px] rounded-tr-[16px] bg-white p-5 shadow-[0_4px_2px_rgba(0,0,0,0.25)] md:gap-8 md:p-10"
            data-figma-node="1423:48832"
          >
            <ThankYouSuccessBanner />
            <ThankYouSummaryCards
              omitOuterShell
              payload={visibleSummaryData.payload}
              registrantReference={ref}
              registeredAt={visibleSummaryData.registeredAt}
            />
          </div>
        ) : (
          <ThankYouMessageCard />
        )}
      </div>
    </RegistrationPageShell>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-admin-col-muted">
          Loading…
        </div>
      }
    >
      <ThankYouInner />
    </Suspense>
  );
}
