import { useEffect, useState } from "react";
import type { PaymentRequest, Stripe } from "@stripe/stripe-js";
import { stripeSupportedPaymentRequestCountry } from "../stripe-country";

type Params = {
  stripe: Stripe | null;
  payableHkd: number;
  countryCode: string | undefined;
};

export function useStripePaymentRequestSetup({
  stripe,
  payableHkd,
  countryCode,
}: Params) {
  const [paymentRequest, setPaymentRequest] =
    useState<PaymentRequest | null>(null);
  const [walletSupport, setWalletSupport] = useState<{
    applePay: boolean;
    googlePay: boolean;
  }>({ applePay: false, googlePay: false });

  useEffect(() => {
    if (!stripe || payableHkd <= 0) {
      return;
    }
    let cancelled = false;
    const country = stripeSupportedPaymentRequestCountry(countryCode);
    const pr = stripe.paymentRequest({
      country,
      currency: "hkd",
      total: {
        label: "IAIS AIF Registration",
        amount: Math.round(payableHkd * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      disableWallets: ["link"],
    });
    void pr.canMakePayment().then((result) => {
      if (cancelled) return;
      const applePay = result?.applePay === true;
      const googlePay = result?.googlePay === true;
      setWalletSupport({ applePay, googlePay });
      if (applePay || googlePay) {
        setPaymentRequest(pr);
      } else {
        setPaymentRequest(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stripe, payableHkd, countryCode]);

  return { paymentRequest, walletSupport };
}
