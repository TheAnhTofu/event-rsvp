import { useEffect } from "react";
import type { Stripe } from "@stripe/stripe-js";

type Params = {
  stripe: Stripe | null;
  paymentDraftId: string | null;
  payRef: string;
  persistThenFinish: (
    ref: string,
    paymentMethod: "bank_transfer" | "no_payment" | "demo",
  ) => Promise<void>;
  setBusy: (v: boolean) => void;
  setCheckoutError: (v: string | null) => void;
  setPersistError: (v: string | null) => void;
  t: (key: string) => string;
};

/** After Alipay (or similar redirect), Stripe sends the customer back with `payment_intent` query params. */
export function useStripeRedirectPaymentIntentResult({
  stripe,
  paymentDraftId,
  payRef,
  persistThenFinish,
  setBusy,
  setCheckoutError,
  setPersistError,
  t,
}: Params) {
  useEffect(() => {
    if (!stripe || !paymentDraftId?.trim()) return;

    const params = new URLSearchParams(window.location.search);
    const pi = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");
    const csParam = params.get("payment_intent_client_secret");
    if (!pi || !redirectStatus || !csParam) return;

    const doneKey = `stripe_return_done_${pi}`;
    const processingKey = `stripe_return_processing_${pi}`;
    if (sessionStorage.getItem(doneKey)) {
      const clean = new URL(window.location.href);
      for (const k of [
        "payment_intent",
        "payment_intent_client_secret",
        "redirect_status",
      ]) {
        clean.searchParams.delete(k);
      }
      window.history.replaceState({}, "", clean.toString());
      return;
    }
    if (sessionStorage.getItem(processingKey)) return;
    if (redirectStatus !== "succeeded") {
      if (redirectStatus === "failed") {
        setCheckoutError(t("stripeCheckoutFailed"));
      }
      return;
    }

    sessionStorage.setItem(processingKey, "1");
    setBusy(true);
    setCheckoutError(null);
    setPersistError(null);

    let cancelled = false;
    void (async () => {
      try {
        const { error, paymentIntent } =
          await stripe.retrievePaymentIntent(csParam);
        if (cancelled) return;
        if (error || paymentIntent?.status !== "succeeded") {
          sessionStorage.removeItem(processingKey);
          setCheckoutError(t("stripeCheckoutFailed"));
          setBusy(false);
          return;
        }
        sessionStorage.setItem(doneKey, "1");
        sessionStorage.removeItem(processingKey);
        const clean = new URL(window.location.href);
        for (const k of [
          "payment_intent",
          "payment_intent_client_secret",
          "redirect_status",
        ]) {
          clean.searchParams.delete(k);
        }
        window.history.replaceState({}, "", clean.toString());
        await persistThenFinish(payRef, "demo");
      } catch (e) {
        sessionStorage.removeItem(processingKey);
        if (!cancelled) {
          setCheckoutError(
            e instanceof Error ? e.message : t("stripeCheckoutFailed"),
          );
          setBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    stripe,
    paymentDraftId,
    payRef,
    persistThenFinish,
    setBusy,
    setCheckoutError,
    setPersistError,
    t,
  ]);
}
