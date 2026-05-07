"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { Link } from "@/i18n/navigation";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { PaymentRequestPaymentMethodEvent } from "@stripe/stripe-js";
import { FigmaIcon } from "@/components/icons/figma-icon";
import {
  PaymentAsiaMethodLogos,
  StripePaymentMethodLogos,
} from "@/components/registration/payment-method-logos";
import type { AppLocale } from "@/i18n/routing";
import { DEFAULT_TIME_ZONE } from "@/i18n/routing";
import { getEventScheduleLines, getLunchOrderLines } from "@/lib/pay-order-detail";
import { formatStoredCountry, getCountryLabelByIso } from "@/lib/countries-data";
import {
  normalizeDiscountCode,
  parseDiscountCodesFromRaw,
} from "@/lib/discount-code";
import {
  getFeesHkd,
  inferDietaryYesNo,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { ackReferenceFromDraftId } from "@/lib/registration-reference";
import { ensureRegistrationEmail } from "@/lib/synthetic-registration-email";
import { COMMITTEE_MEETING_DAY_GROUPS } from "@/lib/committee-meetings";
import {
  industryConferenceDayLabels,
  refundPolicyContent,
} from "@/lib/registration-event-content";
import {
  CardBrandLogosCompact,
  CvcHintIcon,
  PaymentMethodCardGlyph,
  PaymentMethodListIconBox,
} from "./step-pay/ui-figma";
import {
  CopyField,
  formatCarbonOffset,
  guestTypeLabels,
  PaymentDetailRow,
  PaymentPersonalDetailsCard,
  PaymentSummaryBullet,
  PaymentSummaryCard,
  PaymentSummaryTag,
} from "./step-pay/payment-summary";
import { BankSlipUploadArea } from "./step-pay/bank-slip-upload";
import { NoPaymentScreen } from "./step-pay/screens/no-payment-screen";
import { PaymentRequiredPhase } from "./step-pay/screens/payment-required-phase";
import { useDiscountPreview } from "./step-pay/hooks/use-discount-preview";
import { usePaymentAsiaEnabled } from "./step-pay/hooks/use-paymentasia-config";
import { useStripePaymentRequestSetup } from "./step-pay/hooks/use-payment-request";
import { useStripeRedirectPaymentIntentResult } from "./step-pay/hooks/use-stripe-redirect-result";

type StepPayProps = {
  onComplete: (reference: string, email: string) => void;
  /** Server draft UUID: resume Stripe or show reference after checkout started. */
  paymentDraftId: string | null;
  onPaymentDraftId: (id: string) => void;
  /** When true, fee matches server live mode (~HK$4 for paid tiers). */
  stripePricingLive?: boolean;
  /** Bank transfer details/upload: hide pay page title + intro in shell. */
  onPayChromeChange?: (compact: boolean) => void;
  /** Draft `created_at` ISO from resume API — shows Registration Date on Pay summary */
  draftCreatedAtIso?: string | null;
};

export function StepPay({
  onComplete,
  paymentDraftId,
  onPaymentDraftId,
  stripePricingLive = false,
  onPayChromeChange,
  draftCreatedAtIso = null,
}: StepPayProps) {
  const t = useTranslations("Pay");
  const tReg = useTranslations("Registration");
  const tThank = useTranslations("ThankYou");
  const locale = useLocale() as AppLocale;
  const searchParams = useSearchParams();
  const stripe = useStripe();
  const elements = useElements();
  const { watch, getValues } = useFormContext<RegistrationFormValues>();
  const d = watch();
  const baseFeeHkd = getFeesHkd(d.attendance, {
    liveMode: stripePricingLive,
    audienceType: d.audienceType,
  });
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<
    string | undefined
  >(undefined);
  /** After remove (X), skip DB auto discount (EARLYBIRD) until user clicks Apply again (empty restores auto). */
  const [suppressAutoDiscount, setSuppressAutoDiscount] = useState(false);
  const {
    discountPreviewLoading,
    discountPreviewError,
    setDiscountPreviewError,
    discountBreakdown,
    discountApiPayload,
  } = useDiscountPreview({
    baseFeeHkd,
    appliedDiscountCode,
    suppressAutoDiscount,
  });

  const showRemoveDiscount =
    discountBreakdown.discountAmountHkd > 0 &&
    !discountPreviewLoading &&
    !discountPreviewError;

  const discountBadgeLabel =
    discountBreakdown.stackSteps && discountBreakdown.stackSteps.length > 1
      ? discountBreakdown.stackSteps.map((s) => s.codeLabel).join(" + ")
      : appliedDiscountCode?.trim() ||
        discountBreakdown.appliedLabel.split(" (")[0]?.trim() ||
        "";

  const payableHkd = discountBreakdown.finalFeeHkd;

  const { paymentRequest, walletSupport } = useStripePaymentRequestSetup({
    stripe,
    payableHkd,
    countryCode: d.country,
  });

  const eventDateLines = useMemo(
    () => getEventScheduleLines(d, t, tReg),
    [d, t, tReg],
  );
  const lunchOrder = useMemo(
    () => getLunchOrderLines(d, t, tReg),
    [d, t, tReg],
  );
  const [method, setMethod] = useState<"online" | "wallet" | "bank" | null>(
    "online",
  );
  const [onlinePhase, setOnlinePhase] = useState<"select" | "methods" | "card">(
    "select",
  );
  const [walletPhase, setWalletPhase] = useState<"select" | "methods">("select");
  const [bankPhase, setBankPhase] = useState<"select" | "details" | "upload">(
    "select",
  );
  /**
   * Figma pay flow: (1) orange **Payment Required** + full summary +
   * discount + **Complete Payment** → (2) blue **Complete your payment** +
   * method picker + Pay Now → (3) checkout (Stripe / PaymentAsia / bank).
   */
  const [payViewPhase, setPayViewPhase] = useState<
    "payment_required" | "method_select" | "checkout"
  >("payment_required");

  useEffect(() => {
    const compact =
      method === "bank" &&
      (bankPhase === "details" || bankPhase === "upload");
    onPayChromeChange?.(compact);
  }, [method, bankPhase, onPayChromeChange]);

  /** Fallback nếu chưa có draft (edge); production dùng ACK-* khớp email acknowledge. */
  const bankRefFallback = useRef(`RG-${Date.now().toString(36).toUpperCase()}`);
  const payRef = useMemo(() => {
    const id = paymentDraftId?.trim();
    if (id && /^[0-9a-f-]{36}$/i.test(id)) {
      return ackReferenceFromDraftId(id);
    }
    return bankRefFallback.current;
  }, [paymentDraftId]);

  /** Remove one stacked discount: typed codes from input, or automatic discount when not in the input. */
  const removeDiscountStep = useCallback(
    (codeLabel: string) => {
      const label = normalizeDiscountCode(codeLabel);
      const manualParsed = parseDiscountCodesFromRaw(appliedDiscountCode);
      const manualHas = manualParsed.some(
        (c) => normalizeDiscountCode(c) === label,
      );

      if (manualHas) {
        const next = manualParsed.filter(
          (c) => normalizeDiscountCode(c) !== label,
        );
        setAppliedDiscountCode(next.length > 0 ? next.join(",") : undefined);
        setDiscountCodeInput(next.length > 0 ? next.join(", ") : "");
        setDiscountPreviewError(null);
        setClientSecret(null);
        return;
      }

      setSuppressAutoDiscount(true);
      setDiscountPreviewError(null);
      setClientSecret(null);
    },
    [appliedDiscountCode, setDiscountPreviewError],
  );

  const applyDiscountFromInput = useCallback(() => {
    const next = discountCodeInput.trim();
    setAppliedDiscountCode(next === "" ? undefined : next);
    setSuppressAutoDiscount(false);
    setClientSecret(null);
  }, [discountCodeInput]);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadRemarks, setUploadRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  /** Resume URL has `?ref=<draftId>` — keep parent state in sync if hydration missed it. */
  const refFromUrl = searchParams?.get("ref")?.trim() ?? "";
  useEffect(() => {
    if (paymentDraftId) return;
    if (!refFromUrl || !/^[0-9a-f-]{36}$/i.test(refFromUrl)) return;
    onPaymentDraftId(refFromUrl);
  }, [paymentDraftId, refFromUrl, onPaymentDraftId]);

  const paymentAsiaEnabled = usePaymentAsiaEnabled();

  useEffect(() => {
    if (method === "wallet" && walletPhase === "methods") {
      setBusy(false);
    }
  }, [method, walletPhase]);
  const [walletClientSecret, setWalletClientSecret] = useState<string | null>(null);
  useEffect(() => {
    setClientSecret(null);
    setWalletClientSecret(null);
  }, [appliedDiscountCode, suppressAutoDiscount]);

  const [cardholderName, setCardholderName] = useState(() =>
    `${d.firstName} ${d.lastName}`.trim(),
  );
  const [cardZip, setCardZip] = useState("");

  useEffect(() => {
    setCardholderName(`${d.firstName} ${d.lastName}`.trim());
  }, [d.firstName, d.lastName]);

  const stripeCardStyles = useMemo(
    () => ({
      base: {
        fontSize: "15px",
        lineHeight: "24px",
        color: "#292d32",
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        "::placeholder": {
          color: "#c7c7cc",
        },
      },
      invalid: {
        color: "#dc2626",
      },
    }),
    [],
  );

  const cardNumberOptions = useMemo(
    () => ({
      style: stripeCardStyles,
      showIcon: false,
    }),
    [stripeCardStyles],
  );

  const cardExpiryCvcOptions = useMemo(
    () => ({
      style: stripeCardStyles,
    }),
    [stripeCardStyles],
  );

  const finishSuccess = useCallback(
    (ref: string) => {
      const reg = ensureRegistrationEmail(getValues());
      onComplete(ref, reg.email);
    },
    [getValues, onComplete],
  );

  const persistThenFinish = useCallback(
    async (
      ref: string,
      paymentMethod: "bank_transfer" | "no_payment" | "demo",
    ) => {
      setBusy(true);
      setCheckoutError(null);
      setPersistError(null);
      try {
        const res = await fetch("/api/registrations/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration: ensureRegistrationEmail(getValues()),
            locale,
            reference: ref,
            paymentMethod,
            ...discountApiPayload,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? t("saveFailed"));
        }
        finishSuccess(ref);
      } catch (e) {
        setPersistError(e instanceof Error ? e.message : t("saveFailed"));
      } finally {
        setBusy(false);
      }
    },
    [discountApiPayload, finishSuccess, getValues, locale, t],
  );

  const ensureClientSecret = useCallback(async () => {
    if (clientSecret) return clientSecret;
    const res = await fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration: ensureRegistrationEmail(getValues()),
        locale,
        paymentMethodType: "card" as const,
        ...discountApiPayload,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      clientSecret?: string;
      error?: string;
    };
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error ?? t("stripeCheckoutFailed"));
    }
    setClientSecret(data.clientSecret);
    return data.clientSecret;
  }, [clientSecret, discountApiPayload, getValues, locale, t]);

  const ensureWalletClientSecret = useCallback(async () => {
    if (walletClientSecret) return walletClientSecret;
    const res = await fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration: ensureRegistrationEmail(getValues()),
        locale,
        paymentMethodType: "card" as const,
        walletCurrency: "cny",
        ...discountApiPayload,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      clientSecret?: string;
      error?: string;
    };
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error ?? t("stripeCheckoutFailed"));
    }
    setWalletClientSecret(data.clientSecret);
    return data.clientSecret;
  }, [walletClientSecret, discountApiPayload, getValues, locale, t]);

  const buildStripeWalletReturnUrl = useCallback(() => {
    if (!paymentDraftId?.trim()) {
      throw new Error(t("stripeOnlineNeedDraft"));
    }
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("step", "pay");
    url.searchParams.set("ref", paymentDraftId.trim());
    return url.toString();
  }, [paymentDraftId, t]);

  const handleStripeAlipay = useCallback(async () => {
    if (!stripe) return;
    if (!paymentDraftId?.trim()) {
      setCheckoutError(t("stripeOnlineNeedDraft"));
      return;
    }
    setBusy(true);
    setCheckoutError(null);
    setPersistError(null);
    try {
      const cs = await ensureWalletClientSecret();
      const { error } = await stripe.confirmAlipayPayment(cs, {
        return_url: buildStripeWalletReturnUrl(),
      });
      if (error) {
        setCheckoutError(error.message ?? t("stripeCheckoutFailed"));
        setBusy(false);
        return;
      }
    } catch (e) {
      setCheckoutError(
        e instanceof Error ? e.message : t("stripeCheckoutFailed"),
      );
      setBusy(false);
    }
  }, [
    stripe,
    paymentDraftId,
    ensureWalletClientSecret,
    buildStripeWalletReturnUrl,
    t,
  ]);

  const handleStripeWechatPay = useCallback(async () => {
    if (!stripe) return;
    if (!paymentDraftId?.trim()) {
      setCheckoutError(t("stripeOnlineNeedDraft"));
      return;
    }
    setBusy(true);
    setCheckoutError(null);
    setPersistError(null);
    try {
      const cs = await ensureWalletClientSecret();
      const r1 = await stripe.confirmWechatPayPayment(
        cs,
        {
          payment_method_options: {
            wechat_pay: {
              client: "web",
            },
          },
        },
        { handleActions: false },
      );
      if (r1.error) {
        setCheckoutError(r1.error.message ?? t("stripeCheckoutFailed"));
        return;
      }
      const pi = r1.paymentIntent;
      if (pi?.status === "succeeded") {
        await persistThenFinish(payRef, "demo");
        return;
      }
      if (pi?.status === "requires_action") {
        const r2 = await stripe.handleNextAction({ clientSecret: cs });
        if (r2.error) {
          setCheckoutError(r2.error.message ?? t("stripeCheckoutFailed"));
          return;
        }
        const intent =
          "paymentIntent" in r2 && r2.paymentIntent
            ? r2.paymentIntent
            : null;
        if (intent?.status === "succeeded") {
          await persistThenFinish(payRef, "demo");
          return;
        }
      }
      setCheckoutError(t("stripeCheckoutFailed"));
    } catch (e) {
      setCheckoutError(
        e instanceof Error ? e.message : t("stripeCheckoutFailed"),
      );
    } finally {
      setBusy(false);
    }
  }, [stripe, paymentDraftId, ensureWalletClientSecret, persistThenFinish, payRef, t]);

  useStripeRedirectPaymentIntentResult({
    stripe,
    paymentDraftId,
    payRef,
    persistThenFinish,
    setBusy,
    setCheckoutError,
    setPersistError,
    t,
  });

  const handleConfirmCardPayment = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setCheckoutError(null);
    setPersistError(null);
    try {
      const cs = await ensureClientSecret();
      const card = elements.getElement(CardNumberElement);
      if (!card) throw new Error("Card element not found");

      const zip = cardZip.trim();
      const result = await stripe.confirmCardPayment(cs, {
        payment_method: {
          card,
          billing_details: {
            name: cardholderName.trim() || undefined,
            email: ensureRegistrationEmail(d).email || undefined,
            address: {
              country: d.country || "HK",
              postal_code: zip || undefined,
            },
          },
        },
      });

      if (result.error) {
        setCheckoutError(result.error.message ?? t("stripeCheckoutFailed"));
        return;
      }
      if (result.paymentIntent?.status === "succeeded") {
        await persistThenFinish(payRef, "demo");
      } else {
        setCheckoutError(t("stripeCheckoutFailed"));
      }
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : t("stripeCheckoutFailed"));
    } finally {
      setBusy(false);
    }
  };

  /** Alipay / WeChat / Credit Card via PaymentAsia hosted page (POST redirect). */
  const handleWalletPayment = async (wallet: "alipay" | "wechat" | "card") => {
    const draftId =
      paymentDraftId?.trim() ||
      refFromUrl ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("ref")?.trim() ??
          ""
        : "");
    if (!draftId || !/^[0-9a-f-]{36}$/i.test(draftId)) {
      setCheckoutError(t("walletNeedDraft"));
      return;
    }
    if (!paymentDraftId?.trim()) {
      onPaymentDraftId(draftId);
    }
    setBusy(true);
    setCheckoutError(null);
    setPersistError(null);
    try {
      if (!paymentAsiaEnabled) {
        throw new Error(t("walletNoProvider"));
      }
      const res = await fetch("/api/paymentasia/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          locale,
          wallet,
          ...discountApiPayload,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        actionUrl?: string;
        fields?: Record<string, string>;
        error?: string;
      };
      if (!res.ok || !data.actionUrl || !data.fields) {
        throw new Error(
          typeof data.error === "string" ? data.error : t("walletStartFailed"),
        );
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.actionUrl;
      form.acceptCharset = "utf-8";
      for (const [name, value] of Object.entries(data.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setCheckoutError(
        e instanceof Error ? e.message : t("walletStartFailed"),
      );
      setBusy(false);
    }
  };

  /** Open Apple/Google Pay sheet from list click (no intermediate screen). show() must follow user gesture. */
  const handleWalletPaymentRequest = () => {
    if (!stripe || !paymentRequest) return;
    setCheckoutError(null);
    setPersistError(null);

    const pr = paymentRequest;
    const onPaymentMethod = async (ev: PaymentRequestPaymentMethodEvent) => {
      pr.off("paymentmethod", onPaymentMethod);
      pr.off("cancel", onCancel);
      setBusy(true);
      try {
        const cs = await ensureClientSecret();
        const result = await stripe.confirmCardPayment(cs, {
          payment_method: ev.paymentMethod.id,
        });
        if (result.error) {
          ev.complete("fail");
          setCheckoutError(result.error.message ?? t("stripeCheckoutFailed"));
          return;
        }
        if (result.paymentIntent?.status === "succeeded") {
          ev.complete("success");
          await persistThenFinish(payRef, "demo");
        } else {
          ev.complete("fail");
          setCheckoutError(t("stripeCheckoutFailed"));
        }
      } catch (e) {
        ev.complete("fail");
        setCheckoutError(
          e instanceof Error ? e.message : t("stripeCheckoutFailed"),
        );
      } finally {
        setBusy(false);
      }
    };

    const onCancel = () => {
      pr.off("paymentmethod", onPaymentMethod);
      setBusy(false);
    };

    pr.on("paymentmethod", onPaymentMethod);
    pr.once("cancel", onCancel);
    pr.show();
  };

  const ticketHeadline = (() => {
    switch (d.attendance) {
      case "in_person":
        return {
          title: t("ticketTitleInPerson"),
          subtitle: t("ticketSubtitleInPerson"),
        };
      case "online":
        return {
          title: t("ticketTitleOnline"),
          subtitle: t("ticketSubtitleOnline"),
        };
      case "not_attending":
        return {
          title: t("ticketTitleNotAttending"),
          subtitle: t("ticketSubtitleNotAttending"),
        };
      default: {
        const _e: never = d.attendance;
        return _e;
      }
    }
  })();

  const total = t("hkdAmount", { amount: payableHkd.toFixed(2) });
  const showHowPay =
    (method === "online" && onlinePhase === "select") ||
    (method === "wallet" && walletPhase === "select") ||
    (method === "bank" && bankPhase === "select");
  const hideOrderSummary =
    (method === "online" && onlinePhase !== "select") ||
    (method === "wallet" && walletPhase !== "select") ||
    (method === "bank" && bankPhase !== "select");

  const subTotalLabel = t("hkdAmount", {
    amount: discountBreakdown.baseFeeHkd.toFixed(2),
  });

  const bankTransferNarrowLayout =
    method === "bank" &&
    (bankPhase === "details" || bankPhase === "upload");
  const memberDelegateRoleLabelsPay = {
    iais_member: "IAIS Member",
    iais_secretariat: "IAIS Secretariat",
    amf: "Hong Kong Insurance Authority",
  } as const;
  const paymentParticipantRole = (() => {
    switch (d.audienceType) {
      case "members": {
        const r = d.memberDelegateRole;
        if (r && r in memberDelegateRoleLabelsPay) {
          return memberDelegateRoleLabelsPay[
            r as keyof typeof memberDelegateRoleLabelsPay
          ];
        }
        return "IAIS Member";
      }
      case "industry":
        return "Industry Representative";
      case "fellow":
        return d.guestType ? guestTypeLabels[d.guestType] : "Distinguished Fellow / Press / External Speaker";
      case "virtual":
        return "Virtual Participation";
      default: {
        const _e: never = d.audienceType;
        return _e;
      }
    }
  })();
  const isPackAudience =
    d.audienceType === "industry" ||
    d.audienceType === "fellow" ||
    d.audienceType === "members";
  const paymentFullName =
    (isPackAudience
      ? [d.firstName, d.lastName].filter(Boolean).join(" ").trim() || d.firstName
      : [d.title, d.firstName, d.lastName].filter(Boolean).join(" ")) || "-";
  const paymentJurisdiction =
    formatStoredCountry(
      (d.jurisdiction?.trim() || d.country || "").trim(),
      locale,
    ) || "-";
  const paymentCountryOnly =
    formatStoredCountry((d.country ?? "").trim(), locale) || "-";
  const paymentOrganization = (d.company ?? "").trim() || "-";
  const paymentOrganizationLabel =
    d.audienceType === "fellow"
      ? "Organization"
      : "Organisation";
  const paymentAttendanceLabel = (() => {
    if (d.attendance === "in_person") return tReg("attendInPerson");
    if (d.attendance === "online") return tReg("attendOnline");
    return tReg("notAttendingFull");
  })();
  const annualConferenceSelections = isPackAudience
    ? (d.annualConferenceDays ?? []).map((day) => industryConferenceDayLabels[day])
    : [
        "11 November, Wednesday",
        "12 November, Thursday",
        "13 November, Friday",
      ];
  const lunchSelections = isPackAudience
    ? (d.industryLunchDays ?? []).map((day) => industryConferenceDayLabels[day])
    : d.lunchSession === "both"
      ? ["11 November, Wednesday", "12 November, Thursday", "13 November, Friday"]
      : d.lunchSession === "nov12"
        ? ["12 November, Thursday"]
        : d.lunchSession === "nov13"
          ? ["13 November, Friday"]
          : ["No lunch"];
  const committeeMeetingSummaryGroups = COMMITTEE_MEETING_DAY_GROUPS.map(
    (group) => ({
      day: group.day,
      meetings: group.meetings.filter((m) =>
        (d.committeeMeetings ?? []).includes(m.id),
      ),
    }),
  ).filter((g) => g.meetings.length > 0);
  const socialEventSelections = isPackAudience
    ? [
        (d.socialEvents ?? []).includes("members_dinner")
          ? "12 November: Dinner for IAIS Members only"
          : null,
        (d.socialEvents ?? []).includes("conference_reception")
          ? "13 November: Reception for Annual Conference participants"
          : null,
      ].filter((event): event is string => Boolean(event))
    : [
        "12 November: Dinner for IAIS Members only",
        "13 November: Reception for Annual Conference participants",
      ];
  const dietaryChoice = (() => {
    if (d.dietary === "vegan") {
      return { label: tReg("dietaryVegan"), icon: null };
    }
    if (d.dietary === "vegetarian") {
      return { label: tReg("dietaryVegetarian"), icon: null };
    }
    if (d.dietary === "halal") {
      return { label: tReg("dietaryHalal"), icon: null };
    }
    if (d.dietary === "gluten_free") {
      return { label: tReg("dietaryGlutenFree"), icon: null };
    }
    if (d.dietary === "other") {
      const detail = d.dietaryOtherDetails?.trim();
      return {
        label: detail ? `${tReg("dietaryOther")}: ${detail}` : tReg("dietaryOther"),
        icon: null,
      };
    }
    return { label: tReg("dietaryNone"), icon: null };
  })();
  const dietaryLabel =
    inferDietaryYesNo(d) === "yes"
      ? dietaryChoice.label
      : tReg("dietaryNone");
  const dietaryOtherDetail =
    d.dietary === "other" && d.dietaryOtherDetails.trim()
      ? d.dietaryOtherDetails.trim()
      : "-";
  const cityOfDeparture = d.cityOfDeparture?.trim() || "Hong Kong";
  const meansOfTransportation = d.meansOfTransportation?.trim() || "Flight";
  const supportOrganiserEmail = refundPolicyContent.cancellationEmail;
  const confirmationEmail =
    d.email?.trim() || supportOrganiserEmail;

  const registrationDateDisplay = useMemo(() => {
    if (!draftCreatedAtIso?.trim()) return null;
    const dt = new Date(draftCreatedAtIso);
    if (Number.isNaN(dt.getTime())) return null;
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: DEFAULT_TIME_ZONE,
    }).format(dt);
  }, [draftCreatedAtIso]);

  const payPendingMealLines = useMemo(
    () =>
      lunchSelections.map((s) =>
        s === "No lunch" || s.startsWith("Lunch")
          ? s
          : `${tThank("lunchPrefix")}${s}`,
      ),
    [lunchSelections, tThank],
  );

  const payPendingSocialLines = useMemo(() => {
    type Tone = "subtle" | "blue";
    type Line = { text: string; tagTone: Tone };
    if (isPackAudience) {
      const lines: Line[] = [];
      if ((d.socialEvents ?? []).includes("members_dinner")) {
        lines.push({
          text: tThank("payPendingSocialLineDinner"),
          tagTone: "subtle",
        });
      }
      if ((d.socialEvents ?? []).includes("conference_reception")) {
        lines.push({
          text: tThank("payPendingSocialLineReception"),
          tagTone: "blue",
        });
      }
      return lines;
    }
    return [
      { text: tThank("payPendingSocialLineDinner"), tagTone: "subtle" as Tone },
      { text: tThank("payPendingSocialLineReception"), tagTone: "blue" as Tone },
    ];
  }, [d.socialEvents, isPackAudience, tThank]);

  if (baseFeeHkd === 0) {
    return (
      <NoPaymentScreen
        title={t("noPaymentTitle")}
        body={t("noPaymentBody")}
        persistError={persistError}
        busy={busy}
        pleaseWaitLabel={t("pleaseWait")}
        completeLabel={t("completeRegistration")}
        onComplete={() => void persistThenFinish(payRef, "no_payment")}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Figma `1312:58610` method-select Pay view: blue gradient header + compact
  // Registration Summary + inline payment-method picker + Secure Payment
  // notice + Back/Return CTAs. Clicking Pay Now jumps straight into the
  // active sub-phase (Stripe card, wallet sheet, bank details upload) to
  // skip the redundant second picker in the checkout view.
  const attendanceSummaryLabel =
    d.attendance === "in_person"
      ? "In Person"
      : d.attendance === "online"
        ? "Online"
        : "Will not Attend";

  const headerCardIconBoxClass =
    "flex size-[60px] shrink-0 items-center justify-center rounded-full bg-white/15";
  const summaryRowLabelClass = "shrink-0 font-bold leading-[30px]";
  const summaryRowValueClass = "min-w-0 leading-[24px]";

  const advancePaySelectionToCheckout = () => {
    if (!method) return;
    if (method === "online") {
      setOnlinePhase("methods");
    } else if (method === "wallet") {
      setWalletPhase("methods");
    } else if (method === "bank") {
      setBankPhase("details");
    }
    setPayViewPhase("checkout");
  };

  const renderPayMethodOption = (params: {
    selected: boolean;
    onClick: () => void;
    iconNode: ReactNode;
    title: string;
    description: string;
    logos?: ReactNode;
  }) => (
    <button
      type="button"
      onClick={params.onClick}
      aria-pressed={params.selected}
      className={[
        "flex w-full flex-col gap-3 rounded-[8px] border bg-white p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6efd] sm:flex-row sm:items-center sm:gap-3",
        params.selected
          ? "border border-[#e1e3e6] bg-white"
          : "border border-[#e1e3e6] hover:border-[#0d6efd]/60",
      ].join(" ")}
    >
      <span
        className={[
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 self-start sm:self-center",
          params.selected
            ? "border-[#0d6efd] bg-[#0d6efd]"
            : "border-[#e1e3e6] bg-white",
        ].join(" ")}
        aria-hidden
      >
        {params.selected ? (
          <span className="size-2 rounded-full bg-white" />
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        {params.iconNode}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[18px] font-bold leading-6 text-[#333]">
            {params.title}
          </span>
          <span className="text-[14px] leading-snug text-[#878b8e]">
            {params.description}
          </span>
        </span>
      </span>
      {params.logos ? (
        <span className="flex shrink-0 items-center sm:ml-auto">
          {params.logos}
        </span>
      ) : null}
    </button>
  );

  if (payViewPhase === "payment_required") {
    return (
      <PaymentRequiredPhase
        summary={{
          audienceType: d.audienceType,
          role: paymentParticipantRole,
          jurisdiction: paymentJurisdiction,
          fullName: paymentFullName,
          email: d.email || "-",
          countryFormatted: paymentCountryOnly,
          organization: paymentOrganization,
          organizationLabel: paymentOrganizationLabel,
          attendance: paymentAttendanceLabel,
          registrationDateFormatted: registrationDateDisplay,
          conferenceDays: annualConferenceSelections,
          mealLines: payPendingMealLines,
          socialLines: payPendingSocialLines,
          dietaryLabel,
          confirmationEmail,
          supportEmail: supportOrganiserEmail,
        }}
        discountCodeInput={discountCodeInput}
        onDiscountCodeInputChange={setDiscountCodeInput}
        onApplyDiscount={applyDiscountFromInput}
        onDiscountInputKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            applyDiscountFromInput();
          }
        }}
        discountPreviewLoading={discountPreviewLoading}
        discountPreviewError={discountPreviewError}
        totalAmountLabel={total}
        onContinueToMethodSelect={() => setPayViewPhase("method_select")}
      />
    );
  }

  if (payViewPhase === "method_select") {
    return (
      <div className="mx-auto flex w-full max-w-[1024px] flex-col items-stretch">
        {/* Blue gradient header card */}
        <div className="flex flex-col items-center gap-2.5 rounded-tl-[16px] rounded-tr-[16px] bg-[linear-gradient(90deg,#0d33c2_0%,#3ac8f6_100%)] px-5 py-8 text-white shadow-[0_4px_2px_rgba(0,0,0,0.25)] md:py-10">
          <div className={headerCardIconBoxClass}>
            <FigmaIcon
              name="card-large-60"
              size={40}
              className="size-10 filter-[brightness(0)_invert(1)]"
            />
          </div>
          <h2 className="text-[24px] font-bold leading-[32px] text-center text-white md:text-[28px] md:leading-[40px]">
            {t("completeYourPayment")}
          </h2>
          <p className="text-[28px] font-bold leading-[36px] text-center text-white md:text-[32px] md:leading-[40px]">
            {total}
          </p>
        </div>

        {/* White card */}
        <div className="flex w-full flex-col gap-6 rounded-bl-[16px] rounded-br-[16px] bg-white p-5 shadow-[0_4px_2px_rgba(0,0,0,0.25)] md:gap-8 md:p-10">
          {/* Registration Summary card */}
          <div className="flex w-full flex-col items-stretch">
            <div className="flex items-center gap-2.5 rounded-tl-[20px] rounded-tr-[20px] border border-b-0 border-[#c3c3c3] bg-[#f8f9fa] p-5">
              <FigmaIcon
                name="user-bold-24"
                size={24}
                className="size-6 shrink-0 text-[#333]"
              />
              <h3 className="text-[17px] font-bold leading-normal text-[#333]">
                {t("registrationSummaryTitle")}
              </h3>
            </div>
            <div className="flex flex-col gap-2 rounded-bl-[20px] rounded-br-[20px] border border-[#c3c3c3] p-5">
              <p className="text-[18px] font-bold leading-6 text-black">
                {t("orderNumber", { ref: payRef })}
              </p>
              <div className="flex w-full flex-col">
                <div className="flex flex-wrap items-baseline gap-2 text-[14px] text-[#333]">
                  <span className={summaryRowLabelClass}>
                    {tThank("fullNameLabel")}
                  </span>
                  <span className={summaryRowValueClass}>
                    {paymentFullName}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2 text-[14px] text-[#333]">
                  <span className={summaryRowLabelClass}>
                    {tThank("specificRoleLabel")}
                  </span>
                  <span className={summaryRowValueClass}>
                    {paymentParticipantRole}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2 text-[14px] text-[#333]">
                  <span className={summaryRowLabelClass}>
                    {tThank("attendanceLabel")}
                  </span>
                  <span className={summaryRowValueClass}>
                    {attendanceSummaryLabel}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[#bdbdbd] pt-5 text-[15px] font-bold text-[#333]">
                <span>{t("registrationFeeLabel")}</span>
                <span>{total}</span>
              </div>
            </div>
          </div>

          {/* Select payment method */}
          <div className="flex w-full flex-col gap-2 rounded-[20px] bg-[#f8f9fa] p-5">
            <div className="flex items-center gap-2.5">
              <FigmaIcon
                name="card-pos"
                size={24}
                className="size-6 shrink-0 text-[#333]"
              />
              <h3 className="text-[17px] font-bold leading-normal text-[#333]">
                {t("selectPaymentMethodTitle")}
              </h3>
            </div>
            <div className="flex w-full flex-col gap-3">
              {renderPayMethodOption({
                selected: method === "wallet",
                onClick: () => {
                  setMethod("wallet");
                  setWalletPhase("select");
                  setOnlinePhase("select");
                  setBankPhase("select");
                },
                iconNode: (
                  <FigmaIcon
                    name="card-linear-40"
                    size={40}
                    className="size-10 shrink-0"
                  />
                ),
                title: t("payOnlineNowTitle"),
                description: t("payOnlineNowBody"),
                logos: <PaymentAsiaMethodLogos />,
              })}
              {renderPayMethodOption({
                selected: method === "online",
                onClick: () => {
                  setMethod("online");
                  setOnlinePhase("select");
                  setWalletPhase("select");
                  setBankPhase("select");
                },
                iconNode: (
                  <FigmaIcon
                    name="stripe-s"
                    size={40}
                    className="size-10 shrink-0"
                  />
                ),
                title: t("payByStripeTitle"),
                description: t("payByStripeBody"),
                logos: <StripePaymentMethodLogos />,
              })}
              {renderPayMethodOption({
                selected: method === "bank",
                onClick: () => {
                  setMethod("bank");
                  setBankPhase("select");
                  setWalletPhase("select");
                  setOnlinePhase("select");
                },
                iconNode: (
                  <FigmaIcon
                    name="bank"
                    size={40}
                    className="size-10 shrink-0"
                  />
                ),
                title: t("payByBankTransferTitle"),
                description: t("payByBankTransferBody"),
              })}
            </div>

            {checkoutError || persistError ? (
              <p className="mt-2 rounded-lg border border-error bg-[#fff5f5] px-3 py-2 text-sm text-error">
                {checkoutError ?? persistError}
              </p>
            ) : null}

            <button
              type="button"
              disabled={
                busy ||
                !method ||
                (method === "online" && (!stripe || !elements)) ||
                (method === "wallet" && !paymentAsiaEnabled)
              }
              onClick={advancePaySelectionToCheckout}
              className="mt-3 flex w-full items-center justify-center rounded-[8px] bg-[#0057b8] px-[43px] py-3 text-[15px] leading-6 text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("payNow")}
            </button>
          </div>

          {/* Secure Payment notice */}
          <section className="flex w-full flex-col gap-2 rounded-[20px] border border-[#0d6efd] bg-[#e7f3ff] p-5">
            <div className="flex items-center gap-2.5">
              <FigmaIcon
                name="shield-tick"
                size={24}
                className="size-6 shrink-0 text-[#333]"
              />
              <h3 className="text-[17px] font-bold leading-normal text-[#333]">
                {t("securePaymentTitle")}
              </h3>
            </div>
            <ul className="m-0 flex w-full flex-col gap-1 p-0 text-[13px] leading-normal text-[#333]">
              <li className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-[7px] inline-block size-[6px] shrink-0 rounded-full bg-[#333]"
                />
                <span className="min-w-0 flex-1">{t("secureBulletSsl")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-[7px] inline-block size-[6px] shrink-0 rounded-full bg-[#333]"
                />
                <span className="min-w-0 flex-1">
                  {t("secureBulletNoStorage")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-[7px] inline-block size-[6px] shrink-0 rounded-full bg-[#333]"
                />
                <span className="min-w-0 flex-1">
                  {t("secureBulletExpiry")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-[7px] inline-block size-[6px] shrink-0 rounded-full bg-[#333]"
                />
                <span className="min-w-0 flex-1">
                  {t("secureBulletContactLead")}
                  <a
                    className="font-medium text-[#3e65f5] underline decoration-solid"
                    href={`mailto:${supportOrganiserEmail}`}
                  >
                    {supportOrganiserEmail}
                  </a>
                </span>
              </li>
            </ul>
          </section>

          {/* Bottom CTAs */}
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-stretch">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.history.back();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#828282] bg-white px-4 py-3 text-[16px] leading-6 text-[#828282] transition hover:bg-[#f8f9fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6efd] md:px-[43px]"
            >
              <FigmaIcon
                name="arrow-circle-left"
                size={24}
                className="size-6 shrink-0"
              />
              <span>{t("backToRegistration")}</span>
            </button>
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#0d6efd] bg-white px-4 py-3 text-[16px] leading-6 text-[#0d6efd] transition hover:bg-[#0d6efd]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6efd] md:px-[43px]"
            >
              <FigmaIcon
                name="home-rounded"
                size={24}
                className="size-6 shrink-0"
              />
              <span>{t("returnToHomepage")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className={bankTransferNarrowLayout ? "contents" : "flex flex-col gap-6"}>
    <div
      className={
        bankTransferNarrowLayout
          ? "mx-auto flex w-full max-w-none flex-col gap-6 bg-transparent p-0 shadow-none"
          : "flex flex-col gap-6 rounded-3xl border border-card-border bg-white p-4 shadow-[0_4px_2px_-2px_rgba(27,46,94,0.02)] md:p-8 xl:flex-row xl:items-stretch xl:gap-0"
      }
    >
      {!hideOrderSummary ? (
        <div className="order-1 w-full min-w-0 flex-1 xl:border-r xl:border-border-subtle xl:pr-8">
          <h3 className="font-display text-[22px] font-bold leading-tight text-heading md:text-[24px]">
            {t("orderNumber", { ref: payRef })}
          </h3>
          <div className="mt-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-lg font-semibold text-ink md:text-xl">
                  {ticketHeadline.title}
                </p>
                <p className="text-sm font-normal text-ink-muted">
                  {ticketHeadline.subtitle}
                </p>
                <div className="flex gap-1 text-[13px] text-ink-muted">
                  <FigmaIcon
                    name="calendar-16"
                    size={16}
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span>
                    {eventDateLines.map((line, i) => (
                      <span key={`${line}-${i}`}>
                        {i > 0 ? <br /> : null}
                        {line}
                      </span>
                    ))}
                  </span>
                </div>
                {lunchOrder ? (
                  <div className="space-y-2">
                    <p className="text-sm font-normal text-ink-muted">
                      {lunchOrder.label}
                    </p>
                    <div className="flex gap-1 text-[13px] text-ink-muted">
                      <FigmaIcon
                        name="calendar-16"
                        size={16}
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span>
                        {lunchOrder.whenLines.map((line, i) => (
                          <span key={`${line}-${i}`}>
                            {i > 0 ? <br /> : null}
                            {line}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
              <p className="text-[18px] text-heading">{subTotalLabel}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <p className="text-[15px] font-normal text-heading">
              {t("addDiscountCode")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
              <label htmlFor="discount-code" className="sr-only">
                {t("discountCode")}
              </label>
              <input
                id="discount-code"
                type="text"
                value={discountCodeInput}
                onChange={(e) => setDiscountCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyDiscountFromInput();
                  }
                }}
                autoComplete="off"
                placeholder={t("discountPlaceholder")}
                className="h-12 min-w-0 flex-1 rounded-lg border border-[#e1e3e6] bg-white px-3 text-[16px] leading-6 text-heading outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={applyDiscountFromInput}
                className="h-12 shrink-0 rounded-lg bg-linear-to-b from-[#6989fe] to-[#3c64f4] px-10 text-[15px] font-bold leading-6 text-white shadow-sm transition hover:opacity-95 sm:min-w-[120px] sm:px-[43px]"
              >
                {t("applyDiscount")}
              </button>
            </div>
            {discountPreviewLoading ? (
              <p className="text-sm text-ink-soft">{t("pleaseWait")}</p>
            ) : null}
            {discountPreviewError ? (
              <p className="text-sm text-red-600">{discountPreviewError}</p>
            ) : null}
          </div>

          <div className="mt-5 space-y-3 border-t border-heading pt-5 text-base">
            {discountBreakdown.discountAmountHkd > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {(discountBreakdown.stackSteps?.length
                    ? discountBreakdown.stackSteps
                    : [
                        {
                          codeLabel: discountBadgeLabel,
                          discountAmountHkd: discountBreakdown.discountAmountHkd,
                        },
                      ]
                  ).map((s, idx) => (
                    <div
                      key={`${s.codeLabel}-${idx}`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-[#e1e3e6] bg-white px-3.5 py-2 text-[13px] text-[#292d32]"
                    >
                      <span
                        className="min-w-0 truncate font-medium uppercase tracking-wide"
                        title={s.codeLabel}
                      >
                        {s.codeLabel}
                      </span>
                      {showRemoveDiscount ? (
                        <button
                          type="button"
                          onClick={() => removeDiscountStep(s.codeLabel)}
                          className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-[#292d32] transition hover:bg-black/5"
                          aria-label={`${t("removeDiscountCode")} (${s.codeLabel})`}
                        >
                          <svg
                            viewBox="0 0 16 16"
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            aria-hidden
                          >
                            <path d="M4 4l8 8M12 4l-8 8" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <span className="shrink-0 text-[16px] text-heading">
                  −
                  {t("hkdAmount", {
                    amount: discountBreakdown.discountAmountHkd.toFixed(2),
                  })}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between font-normal text-heading">
              <span>{t("subTotal")}</span>
              <span>{subTotalLabel}</span>
            </div>
            <div className="flex justify-between font-normal text-heading">
              <span>{t("tax")}</span>
              <span>{t("taxZero")}</span>
            </div>
          </div>
          <div className="mt-5 flex justify-between border-t border-heading pt-5 text-[16px] font-bold text-heading md:text-[16px]">
            <span>{t("totalToPay")}</span>
            <span>{total}</span>
          </div>
        </div>
      ) : null}

      <div
        className={`order-2 flex min-w-0 flex-1 flex-col gap-3 md:gap-4 ${!hideOrderSummary ? "xl:pl-8" : ""}`}
      >
        {showHowPay && (
          <>
            <h2 className="text-[20px] font-bold leading-normal text-ink md:text-[24px]">
              {t("howPay")}
            </h2>
            <div className="border-t border-border-subtle pt-5">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("online");
                    setOnlinePhase("select");
                    setWalletPhase("select");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-6 text-left transition"
                >
                  <div className="flex flex-1 gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8e8e8] p-2.5">
                      <FigmaIcon name="card-pos" size={24} className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-ink">
                        {t("payOnline")}
                      </p>
                      <p className="mt-2 text-sm leading-5 text-ink-soft">
                        {t("payOnlineBody")}
                      </p>
                      <div className="mt-3 flex justify-end sm:justify-start">
                        <StripePaymentMethodLogos />
                      </div>
                    </div>
                  </div>
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      method === "online"
                        ? "border-blue-solid bg-blue-solid"
                        : "border-border-subtle"
                    }`}
                  >
                    {method === "online" ? (
                      <span className="size-2 rounded-full bg-white" />
                    ) : null}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethod("wallet");
                    setWalletPhase("select");
                    setOnlinePhase("select");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-6 text-left transition"
                >
                  <div className="flex flex-1 gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8e8e8] p-2.5">
                      <FigmaIcon name="card-pos" size={24} className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-ink">{t("payWallet")}</p>
                      <p className="mt-2 text-sm leading-5 text-ink-soft">
                        {t("payWalletBody")}
                      </p>
                      <div className="mt-3 flex justify-end sm:justify-start">
                        <PaymentAsiaMethodLogos />
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-[#737373]">
                        {t("payWalletHint")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      method === "wallet"
                        ? "border-blue-solid bg-blue-solid"
                        : "border-border-subtle"
                    }`}
                  >
                    {method === "wallet" ? (
                      <span className="size-2 rounded-full bg-white" />
                    ) : null}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethod("bank");
                    setBankPhase("select");
                    setWalletPhase("select");
                    setOnlinePhase("select");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-6 text-left transition"
                >
                  <div className="flex flex-1 gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8e8e8] p-2.5">
                      <FigmaIcon name="bank" size={24} className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-ink">{t("payBank")}</p>
                      <p className="mt-2 text-sm leading-5 text-ink-soft">
                        {t("payBankBody")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      method === "bank"
                        ? "border-blue-solid bg-blue-solid"
                        : "border-border-subtle"
                    }`}
                  >
                    {method === "bank" ? (
                      <span className="size-2 rounded-full bg-white" />
                    ) : null}
                  </span>
                </button>

                {checkoutError || persistError ? (
                  <p className="mt-2 rounded-lg border border-error bg-[#fff5f5] px-3 py-2 text-sm text-error">
                    {checkoutError ?? persistError}
                  </p>
                ) : null}

                {method === "online" && onlinePhase === "select" ? (
                  <div className="mt-3 space-y-3">
                    <button
                      type="button"
                      disabled={busy || !stripe || !elements}
                      onClick={() => setOnlinePhase("methods")}
                      className="w-full rounded-lg bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-accent-strong)_100%)] px-11 py-3 text-center text-[15px] font-bold leading-6 text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                    >
                      {t("payNow")}
                    </button>
                    <p className="text-center text-[13px] leading-relaxed text-[#737373]">
                      {t("payNotConfirmedUntilPaid")}
                    </p>
                  </div>
                ) : null}

                {method === "wallet" && walletPhase === "select" ? (
                  <div className="mt-3 space-y-3">
                    <button
                      type="button"
                      disabled={busy || !paymentAsiaEnabled}
                      onClick={() => setWalletPhase("methods")}
                      className="w-full rounded-lg bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-accent-strong)_100%)] px-11 py-3 text-center text-[15px] font-bold leading-6 text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                    >
                      {t("payNow")}
                    </button>
                    <p className="text-center text-[13px] leading-relaxed text-[#737373]">
                      {t("payNotConfirmedUntilPaid")}
                    </p>
                  </div>
                ) : null}

                {method === "bank" && bankPhase === "select" ? (
                  <div className="mt-3 space-y-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setBankPhase("details")}
                      className="w-full rounded-lg bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-accent-strong)_100%)] px-11 py-3 text-center text-[15px] font-bold leading-6 text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                    >
                      {t("payNow")}
                    </button>
                    <p className="text-center text-[13px] leading-relaxed text-[#737373]">
                      {t("payNotConfirmedUntilPaid")}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}

        {method === "online" && onlinePhase === "methods" && (
          <div className="mt-5 space-y-5">
            <button
              type="button"
              onClick={() => setOnlinePhase("select")}
              className="inline-flex items-center gap-1 rounded-lg border border-black px-3 py-2.5 text-base font-bold text-black transition hover:bg-surface"
            >
              <svg className="size-5 rotate-180" viewBox="0 0 20 20" fill="none">
                <path
                  d="M7.5 4.167 13.333 10 7.5 15.833"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>

            <h3 className="text-[24px] font-bold leading-normal text-black">
              Payment Method
            </h3>

            {checkoutError || persistError ? (
              <p className="rounded-lg border border-error bg-[#fff5f5] px-3 py-2 text-sm text-error">
                {checkoutError ?? persistError}
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setOnlinePhase("card");
                }}
                className="flex w-full items-center gap-4 rounded-lg border border-[#e1e3e6] bg-white p-3 text-left transition hover:border-accent/40"
              >
                <PaymentMethodCardGlyph />
                <p className="flex-1 text-base font-bold text-[#292d32]">Card</p>
                <CardBrandLogosCompact variant="paymentMethodList" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!walletSupport.applePay || busy) return;
                  handleWalletPaymentRequest();
                }}
                disabled={!walletSupport.applePay || busy}
                className={`flex w-full items-center gap-4 rounded-lg border p-3 text-left transition ${
                  walletSupport.applePay && !busy
                    ? "border-[#e1e3e6] bg-white hover:border-accent/40"
                    : "cursor-not-allowed border-border-subtle bg-surface opacity-60"
                }`}
              >
                <PaymentMethodListIconBox>
                  <img
                    src="/payment/apple-pay.svg"
                    alt=""
                    className="max-h-[14px] max-w-[90%] object-contain"
                  />
                </PaymentMethodListIconBox>
                <p className="flex-1 text-base font-bold text-[#292d32]">
                  Apple Pay
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!walletSupport.googlePay || busy) return;
                  handleWalletPaymentRequest();
                }}
                disabled={!walletSupport.googlePay || busy}
                className={`flex w-full items-center gap-4 rounded-lg border p-3 text-left transition ${
                  walletSupport.googlePay && !busy
                    ? "border-[#e1e3e6] bg-white hover:border-accent/40"
                    : "cursor-not-allowed border-border-subtle bg-surface opacity-60"
                }`}
              >
                <PaymentMethodListIconBox>
                  <span className="flex items-center justify-center gap-px px-0.5">
                    <img
                      src="/payment/google-pay-g.svg"
                      alt=""
                      width={12}
                      height={12}
                      className="h-2.5 w-auto object-contain"
                    />
                    <img
                      src="/payment/google-pay-pay.svg"
                      alt=""
                      width={14}
                      height={8}
                      className="h-2 w-auto object-contain"
                    />
                  </span>
                </PaymentMethodListIconBox>
                <p className="flex-1 text-base font-bold text-[#292d32]">
                  Google Pay
                </p>
              </button>

              <button
                type="button"
                disabled={busy || !stripe || !paymentDraftId}
                onClick={() => void handleStripeAlipay()}
                className="flex w-full items-center gap-4 rounded-lg border border-[#e1e3e6] bg-white p-3 text-left transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PaymentMethodListIconBox>
                  <img
                    src="/payment/alipay.svg"
                    alt=""
                    className="max-h-[18px] w-[85%] object-contain"
                  />
                </PaymentMethodListIconBox>
                <p className="flex-1 text-base font-bold text-[#292d32]">Alipay</p>
              </button>

              <button
                type="button"
                disabled={busy || !stripe || !paymentDraftId}
                onClick={() => void handleStripeWechatPay()}
                className="flex w-full items-center gap-4 rounded-lg border border-[#e1e3e6] bg-white p-3 text-left transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PaymentMethodListIconBox>
                  <img
                    src="/payment/wechat-pay.svg"
                    alt=""
                    className="max-h-[18px] w-[70%] object-contain"
                  />
                </PaymentMethodListIconBox>
                <p className="flex-1 text-base font-bold text-[#292d32]">
                  WeChat Pay
                </p>
              </button>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                {t("stripeAlipayWechatHint")}
              </p>
              {stripe &&
              !walletSupport.applePay &&
              !walletSupport.googlePay ? (
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  {t("walletUnavailableHint")}
                </p>
              ) : null}
              {stripe &&
              walletSupport.googlePay &&
              !walletSupport.applePay ? (
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  {t("applePaySafariHint")}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {method === "wallet" && walletPhase === "methods" && (
          <div className="relative z-10 mt-5 space-y-5">
            <button
              type="button"
              onClick={() => {
                setBusy(false);
                setWalletPhase("select");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-black px-3 py-2.5 text-base font-bold text-black transition hover:bg-surface"
            >
              <svg className="size-5 rotate-180" viewBox="0 0 20 20" fill="none">
                <path
                  d="M7.5 4.167 13.333 10 7.5 15.833"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>

            <h3 className="text-[24px] font-bold leading-normal text-black">
              {t("payChooseWallet")}
            </h3>

            {checkoutError || persistError ? (
              <p className="rounded-lg border border-error bg-[#fff5f5] px-3 py-2 text-sm text-error">
                {checkoutError ?? persistError}
              </p>
            ) : null}

            <p className="text-[13px] leading-relaxed text-ink-soft">
              {t("payWalletHint")}
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                data-wallet="card"
                onClick={() => void handleWalletPayment("card")}
                className="flex w-full items-center gap-4 rounded-lg border border-[#e1e3e6] bg-white p-3 text-left transition hover:border-accent/40 disabled:opacity-50"
              >
                <PaymentMethodCardGlyph />
                <p className="flex-1 text-base font-bold text-[#292d32]">
                  {t("payWalletCard")}
                </p>
                <CardBrandLogosCompact variant="paymentMethodList" />
              </button>

              <button
                type="button"
                disabled={busy}
                data-wallet="alipay"
                onClick={() => void handleWalletPayment("alipay")}
                className="flex w-full items-center gap-4 rounded-lg border border-[#e1e3e6] bg-white p-3 text-left transition hover:border-accent/40 disabled:opacity-50"
              >
                <PaymentMethodListIconBox>
                  <img
                    src="/payment/alipay.svg"
                    alt=""
                    className="max-h-[18px] w-[85%] object-contain"
                  />
                </PaymentMethodListIconBox>
                <p className="flex-1 text-base font-bold text-[#292d32]">Alipay</p>
              </button>

              <button
                type="button"
                disabled={busy}
                data-wallet="wechat"
                onClick={() => void handleWalletPayment("wechat")}
                className="flex w-full items-center gap-4 rounded-lg border border-[#e1e3e6] bg-white p-3 text-left transition hover:border-accent/40 disabled:opacity-50"
              >
                <PaymentMethodListIconBox>
                  <img
                    src="/payment/wechat-pay.svg"
                    alt=""
                    className="max-h-[18px] w-[70%] object-contain"
                  />
                </PaymentMethodListIconBox>
                <p className="flex-1 text-base font-bold text-[#292d32]">
                  WeChat Pay
                </p>
              </button>
            </div>
          </div>
        )}

        {method === "online" && onlinePhase === "card" ? (
          <div className="mt-5 space-y-5">
                <button
                  type="button"
                  onClick={() => setOnlinePhase("methods")}
                  className="inline-flex items-center gap-1 rounded-lg border border-black px-3 py-2.5 text-base font-bold text-black transition hover:bg-surface"
                >
                  <svg className="size-5 rotate-180" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 4.167 13.333 10 7.5 15.833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back
                </button>

                <h3 className="text-[24px] font-bold leading-normal text-black">
                  Pay with Card
                </h3>

                <>
                    <div className="flex flex-col gap-4 rounded-lg border border-[#e1e3e6] bg-white px-5 pb-5 pt-4 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-4">
                        <div className="flex size-[42px] shrink-0 items-center justify-center">
                          <svg
                            className="size-6 text-[#292d32]"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden
                          >
                            <rect
                              x="2.5"
                              y="5"
                              width="19"
                              height="14"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M2.5 9.5h19"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <rect
                              x="5"
                              y="13"
                              width="5"
                              height="2.5"
                              rx="0.5"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <p className="text-base font-bold leading-6 text-[#292d32]">
                          {t("cardSectionTitle")}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-normal text-[#292d32]">
                          {t("cardInformation")}
                          <span className="text-error">*</span>
                        </label>
                        <div className="overflow-hidden rounded-lg border border-[#e1e3e6]">
                          <div className="flex items-center gap-2 border-b border-[#e1e3e6] bg-white px-3 py-2">
                            <div className="min-h-[40px] min-w-0 flex-1 py-1">
                              <CardNumberElement options={cardNumberOptions} />
                            </div>
                            <CardBrandLogosCompact />
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-[#e1e3e6]">
                            <div className="min-h-[40px] bg-white px-3 py-4">
                              <CardExpiryElement
                                options={cardExpiryCvcOptions}
                              />
                            </div>
                            <div className="relative min-h-[40px] bg-white py-2 pl-3 pr-10">
                              <div className="min-h-[40px] pr-1 py-2">
                                <CardCvcElement options={cardExpiryCvcOptions} />
                              </div>
                              <CvcHintIcon className="pointer-events-none absolute right-2 top-1/2 size-5 -translate-y-1/2 text-[#757d8a]" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-normal text-[#292d32]">
                          {t("cardholderName")}
                          <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          autoComplete="cc-name"
                          placeholder={t("fullNameOnCardPlaceholder")}
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          className="w-full rounded-lg border border-[#e1e3e6] bg-white px-3 py-2 text-[15px] leading-6 text-[#292d32] outline-none placeholder:text-[#c7c7cc] focus:border-accent"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-normal text-[#292d32]">
                          {t("countryOrRegion")}
                          <span className="text-error">*</span>
                        </label>
                        <div className="overflow-hidden rounded-lg border border-[#e1e3e6]">
                          <div className="flex items-center justify-between border-b border-[#e1e3e6] bg-white px-3 py-2">
                            <span className="text-[15px] leading-6 text-[#292d32]">
                              {getCountryLabelByIso(d.country, locale)}
                            </span>
                            <svg
                              className="size-5 shrink-0 text-[#292d32]"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden
                            >
                              <path
                                d="m6 9 6 6 6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="bg-white px-3 py-2">
                            <input
                              type="text"
                              autoComplete="postal-code"
                              inputMode="text"
                              placeholder={t("zip")}
                              value={cardZip}
                              onChange={(e) => setCardZip(e.target.value)}
                              className="w-full border-0 bg-transparent p-0 text-[15px] leading-6 text-[#292d32] outline-none placeholder:text-[#c7c7cc]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={busy || !stripe || !elements}
                      onClick={() => void handleConfirmCardPayment()}
                      className="w-full rounded-lg bg-linear-to-b from-[#6989fe] to-[#3c64f4] px-11 py-3 text-center text-[15px] font-bold leading-6 text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                    >
                      {busy
                        ? t("pleaseWait")
                        : t("payCardAmount", { amount: total })}
                    </button>
                </>
              </div>
        ) : null}

        {method === "bank" && bankPhase === "details" ? (
          <div className="mt-3 w-full space-y-6">
            <div className="space-y-5 text-left md:text-center">
              <h3 className="font-display text-[22px] font-bold leading-tight text-[#00318d] md:text-[28px] md:leading-[50px] lg:text-[30px]">
                {t("payByBankTransferHeading")}
              </h3>
              <div className="space-y-0 text-[15px] leading-normal text-[#878b8e] md:text-[18px]">
                <p>{t("bankIntroLine1")}</p>
                <p>{t("bankIntroLine2")}</p>
              </div>
            </div>
            <div className="rounded-xl border border-[#e1e3e6] bg-white p-6 text-left shadow-sm">
              <h4 className="text-[20px] font-bold leading-7 text-[#0a2540]">
                {t("bankDetailsCardTitle")}
              </h4>
              <div className="my-6 h-px w-full bg-[#e1e3e6]" />
              <p className="text-[15px] text-[#878b8e]">
                {t("orderNumber", { ref: payRef })}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <CopyField label={t("bankLabelBankName")} value={t("bankName")} />
                <CopyField label={t("bankLabelPayeeName")} value={t("bankAccountName")} />
                <CopyField
                  label={t("bankLabelAccountNumber")}
                  value={t("bankAccountNumber")}
                />
                <CopyField label={t("bankLabelSwift")} value={t("bankSwiftCode")} />
              </div>
              <div className="mt-4 flex flex-col gap-4">
                <CopyField label={t("bankLabelOurAddress")} value={t("bankAddress")} />
                <CopyField label={t("bankLabelAmount")} value={total} />
                <CopyField
                  label={t("bankLabelPaymentReference")}
                  value={payRef}
                />
              </div>
              <div className="mt-6 flex w-full items-center gap-3 rounded-xl bg-[#f4f4f4] px-3.5 py-3">
                <FigmaIcon
                  name="info-circle-bold-24"
                  size={20}
                  className="size-5 shrink-0"
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-0">
                  <p className="text-[15px] font-bold leading-snug text-black">
                    {t("bankReferenceCalloutTitle")}
                  </p>
                  <p className="whitespace-pre-line text-[13px] leading-snug text-[#737373]">
                    {t("bankReferenceCalloutBody")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <button
                type="button"
                disabled={busy}
                onClick={() => setBankPhase("upload")}
                className="min-h-[48px] flex-1 rounded-lg bg-[linear-gradient(180deg,#6989fe_0%,#3c64f4_100%)] px-6 py-3 text-center text-[15px] font-bold leading-6 text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 sm:px-11"
              >
                {t("continueBank")}
              </button>
              <button
                type="button"
                onClick={() => setBankPhase("select")}
                className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-lg border border-[#4e73f8] bg-white px-6 text-[16px] font-normal text-[#4e73f8] transition hover:bg-[#f4f7ff] sm:min-w-[120px]"
              >
                {t("paymentBack")}
              </button>
            </div>
            <p className="text-center text-[13px] leading-relaxed text-[#737373]">
              {t("bankPendingNote")}
            </p>
          </div>
        ) : null}

        {method === "bank" && bankPhase === "upload" ? (
          <div className="mt-3 w-full space-y-7">
            <div className="space-y-5 text-center">
              <h3 className="font-display text-[22px] font-bold leading-tight text-[#00318d] md:text-[28px] md:leading-[50px] lg:text-[30px]">
                {t("payByBankTransferHeading")}
              </h3>
              <div className="space-y-0 text-[15px] leading-normal text-[#878b8e] md:text-[18px]">
                <p>{t("bankIntroLine1")}</p>
                <p>{t("bankIntroLine2")}</p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[700px] space-y-6">
              {checkoutError || persistError ? (
                <p className="rounded-lg border border-error bg-[#fff5f5] px-3 py-2 text-sm text-error">
                  {checkoutError ?? persistError}
                </p>
              ) : null}
              <div className="flex flex-col gap-6 rounded-xl border border-[#e1e3e6] p-6">
                <h4 className="text-[20px] font-bold leading-7 text-[#0a2540]">
                  {t("bankUploadCardTitle")}
                </h4>
                <div className="h-px w-full bg-[#e1e3e6]" />
                <p className="text-[15px] text-[#878b8e]">
                  {t("orderNumber", { ref: payRef })}
                </p>

                <BankSlipUploadArea file={uploadFile} onFile={setUploadFile} />

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[15px] text-[#292d32]">
                      {t("bankSlipPayerNameLabel")}
                      <span className="text-red-600">*</span>
                    </label>
                    <div className="mt-1 w-full rounded-lg border border-[#e1e3e6] bg-white px-3 py-2 text-[16px] leading-6 text-black">
                      {paymentFullName}
                    </div>
                  </div>
                  <div>
                    <label className="text-[15px] text-[#292d32]">
                      {t("remarksLabel")}
                    </label>
                    <textarea
                      value={uploadRemarks}
                      onChange={(e) => setUploadRemarks(e.target.value)}
                      placeholder={t("remarksPlaceholder")}
                      rows={3}
                      className="mt-1 min-h-[70px] w-full resize-y rounded-lg border border-[#e1e3e6] bg-white px-3 py-2 text-[15px] leading-6 text-black placeholder:text-[#bfbfbf] outline-none focus:border-[#4e73f8]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-row flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (!uploadFile) {
                      setCheckoutError(t("slipErrorNoFile"));
                      return;
                    }
                    setBusy(true);
                    setCheckoutError(null);
                    try {
                      const postSlip = async (file: File) => {
                        const formData = new FormData();
                        formData.set("reference", payRef);
                        formData.set("file", file);
                        const res = await fetch("/api/registrations/bank-slip", {
                          method: "POST",
                          body: formData,
                        });
                        const data = (await res.json().catch(() => ({}))) as {
                          error?: string;
                        };
                        if (!res.ok) {
                          throw new Error(data.error ?? t("slipErrorUploadFailed"));
                        }
                      };
                      await postSlip(uploadFile);
                      await persistThenFinish(
                        payRef,
                        "bank_transfer",
                      );
                    } catch (e) {
                      setCheckoutError(
                        e instanceof Error ? e.message : t("slipErrorUploadFailed"),
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="min-h-[48px] min-w-0 flex-1 rounded-lg bg-[linear-gradient(180deg,#6989fe_0%,#3c64f4_100%)] px-11 py-3 text-center text-[16px] font-bold leading-6 text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                >
                  {busy ? t("pleaseWait") : t("uploadSubmit")}
                </button>
                <button
                  type="button"
                  onClick={() => setBankPhase("details")}
                  className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-lg border border-[#4e73f8] bg-white px-11 py-3 text-[16px] font-normal leading-6 text-[#4e73f8] transition hover:bg-[#f4f7ff]"
                >
                  {t("paymentBack")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
      {!bankTransferNarrowLayout ? (
        <>
          <PaymentPersonalDetailsCard
            audienceType={d.audienceType}
            title={tThank("registrationDetailsTitle")}
            role={paymentParticipantRole}
            jurisdiction={paymentJurisdiction}
            fullName={paymentFullName}
            email={d.email || "-"}
            countryFormatted={paymentCountryOnly}
            organization={paymentOrganization}
            organizationLabel={paymentOrganizationLabel}
            attendance={paymentAttendanceLabel}
            registrationDateFormatted={registrationDateDisplay}
          />

          <PaymentSummaryCard
            title={tThank("committeeMeetingsTitle")}
            icon={<FigmaIcon name="note-text-bold-24" size={24} className="size-6" />}
            className="gap-7"
          >
            {committeeMeetingSummaryGroups.length > 0 ? (
              committeeMeetingSummaryGroups.map((group) => (
                <div key={group.day} className="flex flex-col gap-1">
                  <p className="text-[16px] font-semibold leading-[30px] text-[#333333]">
                    {group.day}
                  </p>
                  {group.meetings.map((m) => (
                    <PaymentSummaryBullet key={m.id} tag={m.tag}>
                      {m.label}
                    </PaymentSummaryBullet>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-[16px] leading-[30px] text-[#333333]">-</p>
            )}
          </PaymentSummaryCard>

          <PaymentSummaryCard
            title={tThank("annualConferenceTitle")}
            icon={<FigmaIcon name="note-text-bold-24" size={24} className="size-6" />}
          >
            {annualConferenceSelections.length > 0 ? (
              annualConferenceSelections.map((day) => (
                <PaymentSummaryBullet
                  key={day}
                  tag={tThank("registrationFeeAppliesTag")}
                  tagTone="subtle"
                >
                  {day}
                </PaymentSummaryBullet>
              ))
            ) : (
              <p className="text-[16px] leading-[30px] text-[#333333]">-</p>
            )}
          </PaymentSummaryCard>

          <PaymentSummaryCard
            title={tThank("socialEventsTitle")}
            icon={<FigmaIcon name="bookmark-2-bold-24" size={24} className="size-6" />}
          >
            {socialEventSelections.length > 0 ? (
              socialEventSelections.map((event) => (
                <div
                  key={event}
                  className="inline-flex max-w-full flex-wrap items-center gap-2"
                >
                  <p className="m-0 min-w-0 text-[16px] font-semibold leading-[30px] text-[#333333]">
                    {event}
                  </p>
                  <PaymentSummaryTag
                    tone={event.includes("Dinner") ? "subtle" : "blue"}
                  >
                    {event.includes("Dinner")
                      ? tThank("socialTagMembersOnly")
                      : tThank("socialTagConferenceParticipants")}
                  </PaymentSummaryTag>
                </div>
              ))
            ) : (
              <p className="text-[16px] leading-[30px] text-[#333333]">-</p>
            )}
          </PaymentSummaryCard>

          <PaymentSummaryCard
            title={tThank("lunchSelectionTitle")}
            icon={<FigmaIcon name="fork-spoon-rounded-24" size={24} className="size-6" />}
          >
            {lunchSelections.map((selection) => (
              <PaymentSummaryBullet key={selection}>
                {selection}
              </PaymentSummaryBullet>
            ))}
          </PaymentSummaryCard>

          <PaymentSummaryCard
            title={tThank("dietaryRequirementsTitle")}
            icon={<FigmaIcon name="leaf-dietary-24" size={24} className="size-6" />}
          >
            <div className="flex flex-wrap items-center gap-2 text-[16px] font-semibold leading-6 text-[#333333]">
              {dietaryChoice.icon ? (
                <span className="flex shrink-0 items-center">
                  {dietaryChoice.icon}
                </span>
              ) : null}
              <span>{dietaryLabel}</span>
            </div>
            <dl className="mt-1 flex flex-col gap-1">
              <PaymentDetailRow
                label="Please specify your dietary preference"
                value={dietaryOtherDetail}
              />
            </dl>
          </PaymentSummaryCard>

          <PaymentSummaryCard
            title={tThank("travelInformationTitle")}
            icon={<FigmaIcon name="airplane-bold-24" size={24} className="size-6" />}
          >
            <dl className="flex flex-col gap-1">
              <PaymentDetailRow label="City of departure" value={cityOfDeparture} />
              <PaymentDetailRow
                label="Means of transportation"
                value={meansOfTransportation}
              />
              <PaymentDetailRow
                label="Did you or your organisation participate in a carbon offsetting programme for your travel to the event?"
                value={formatCarbonOffset(d.carbonOffset)}
              />
            </dl>
          </PaymentSummaryCard>

          <PaymentSummaryCard
            title={tThank("importantInformationTitle")}
            icon={<FigmaIcon name="info-circle-bold-24" size={24} className="size-6" />}
          >
            <ul className="list-disc space-y-1 pl-5 text-[16px] font-medium leading-[30px] text-[#333333]">
              <li>
                A confirmation email has been sent to{" "}
                <a
                  className="font-medium text-[#3e65f5] underline decoration-solid [text-decoration-skip-ink:none]"
                  href={`mailto:${confirmationEmail}`}
                >
                  {confirmationEmail}
                </a>
              </li>
              <li>Please save your email for future correspondence</li>
              <li>
                For any questions, contact us at{" "}
                <a
                  className="font-medium text-[#3e65f5] underline decoration-solid [text-decoration-skip-ink:none]"
                  href={`mailto:${supportOrganiserEmail}`}
                >
                  {supportOrganiserEmail}
                </a>
              </li>
            </ul>
          </PaymentSummaryCard>
        </>
      ) : null}
    </div>
  );
}
