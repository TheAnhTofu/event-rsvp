import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { apiRegistrationSchema } from "../lib/api-registration-schema.ts";
import { resolveDiscountForPayment } from "../lib/resolve-discount.js";
import { resolveFeesHkdForApi } from "../lib/registration-schema.ts";
import { ensureRegistrationEmail } from "../lib/synthetic-registration-email.ts";
import { requireDatabaseUrl } from "@db/postgres";
import {
  getRegistrationDraftById,
  insertRegistrationDraft,
  updateRegistrationDraftCheckoutSession,
  markRegistrationWebhookVerifiedByCheckoutSession,
} from "@db/registrations";
import { notifyPaymentWebhook } from "../lib/payment-notify-webhook.js";
import { fulfillStripeCheckoutSession } from "../lib/stripe-fulfillment.js";
import { getRequestOrigin } from "../lib/request-origin.js";
import {
  resolveStripeSecretKey,
  resolveStripeWebhookSecret,
} from "../lib/stripe-secret.js";
import { toWebRequest } from "../express-helpers.js";

/** Mirrors `web/src/lib/locale-path` without pulling `next-intl` into the API bundle. */
function localizedHref(locale: string, pathname: string): string {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === "en") return p;
  return `/${locale}${p}`;
}

function getStripe(): Stripe {
  const key = resolveStripeSecretKey();
  if (!key) {
    throw new Error(
      "Stripe secret key is not set (STRIPE_PRODUCTION_SECRET_KEY when live, or STRIPE_SECRET_KEY_* / STRIPE_SECRET_KEY)",
    );
  }
  return new Stripe(key);
}

export async function postStripeWebhook(req: Request, res: Response): Promise<void> {
  const secret = resolveStripeWebhookSecret();
  if (!secret) {
    res.status(503).json({ error: "Webhook not configured" });
    return;
  }

  const raw = req.body as Buffer;
  const sig = req.get("stripe-signature");
  if (!sig) {
    res.status(400).json({ error: "Missing signature" });
    return;
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  let hasDb = true;
  try {
    requireDatabaseUrl();
  } catch {
    hasDb = false;
  }

  if (event.type === "checkout.session.completed" && hasDb) {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    if (sessionId && session.payment_status === "paid") {
      const result = await fulfillStripeCheckoutSession(sessionId);
      if (result.ok) {
        await markRegistrationWebhookVerifiedByCheckoutSession(sessionId);
        const amountTotal =
          session.amount_total != null ? session.amount_total / 100 : null;
        void notifyPaymentWebhook({
          event: "payment.completed",
          reference: result.reference,
          stripeCheckoutSessionId: sessionId,
          amountTotal,
          currency: session.currency ?? null,
          at: new Date().toISOString(),
        });
      }
    }
  }

  res.json({ received: true });
}

/**
 * Approximate HKD→CNY rate for wallet payments charged in CNY.
 * Stripe settles in HKD regardless; a 2 % FX fee applies on CNY charges.
 * Update periodically or replace with a live FX lookup.
 */
const HKD_TO_CNY_RATE = 0.92;

const piBodySchema = z.object({
  registration: z.unknown(),
  locale: z.string().max(32).optional(),
  /** Legacy field; PaymentIntent always allows card, Link, Alipay, WeChat Pay (Dashboard + currency). */
  paymentMethodType: z.enum(["card"]).optional().default("card"),
  discountCode: z.string().max(512).optional(),
  /** When true with empty discountCode, do not apply DB auto (`apply_without_code`). */
  skipAutomaticDiscount: z.boolean().optional(),
  /** Set to "cny" to create a wallet-only PaymentIntent in CNY (Alipay / WeChat Pay). */
  walletCurrency: z.enum(["cny"]).optional(),
});

export async function postCreatePaymentIntent(
  req: Request,
  res: Response,
): Promise<void> {
  let json: unknown;
  try {
    json = req.body;
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const parsed = piBodySchema.safeParse(json);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const reg = apiRegistrationSchema.safeParse(parsed.data.registration);
  if (!reg.success) {
    res.status(400).json({
      error: "Invalid registration",
      issues: reg.error.flatten(),
    });
    return;
  }

  const regWithEmail = ensureRegistrationEmail(reg.data);
  const baseFee = await resolveFeesHkdForApi(
    regWithEmail.attendance,
    regWithEmail.audienceType,
  );
  const resolved = await resolveDiscountForPayment(baseFee, parsed.data.discountCode, {
    allowAutomaticDiscount: !parsed.data.skipAutomaticDiscount,
  });
  if (!resolved.ok) {
    res.status(400).json({ error: "Invalid or expired discount code" });
    return;
  }
  const { finalFeeHkd } = resolved.breakdown;
  if (finalFeeHkd <= 0) {
    res.status(400).json({ error: "No payment required for this registration" });
    return;
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  const dcMeta = resolved.normalized ?? "";
  const useCny = parsed.data.walletCurrency === "cny";
  const currency = useCny ? "cny" : "hkd";
  const amount = useCny
    ? Math.round(finalFeeHkd * HKD_TO_CNY_RATE * 100)
    : Math.round(finalFeeHkd * 100);
  const methods: string[] = useCny
    ? ["alipay", "wechat_pay"]
    : ["card", "link", "alipay", "wechat_pay"];

  const intentParams: Stripe.PaymentIntentCreateParams = {
    amount,
    currency,
    receipt_email: regWithEmail.email,
    metadata: {
      email: regWithEmail.email,
      attendance: regWithEmail.attendance,
      ...(dcMeta ? { discount_code: dcMeta } : {}),
      ...(useCny ? { original_currency: "hkd", original_amount_hkd: String(finalFeeHkd) } : {}),
    },
    payment_method_types: methods,
  };

  const intent = await stripe.paymentIntents.create(intentParams);
  res.json({ clientSecret: intent.client_secret });
}

/**
 * Stripe Checkout: card, Link, plus Alipay / WeChat for sandbox testing.
 * Alipay / WeChat via PaymentAsia use `/api/paymentasia/create-payment` (separate flow).
 */
const checkoutPaymentMethodTypeSchema = z.enum([
  "card",
  "link",
  "alipay",
  "wechat_pay",
]);

const DEFAULT_STRIPE_CHECKOUT_PAYMENT_METHODS: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
  ["card", "link", "alipay", "wechat_pay"];

const checkoutBodySchema = z
  .object({
    registration: z.unknown().optional(),
    locale: z.string().max(32).optional(),
    draftId: z.string().uuid().optional(),
    /** When set (e.g. `["alipay"]`), Checkout shows only those methods — better for mobile Alipay/WeChat than PaymentIntent + confirm*. */
    paymentMethodTypes: z.array(checkoutPaymentMethodTypeSchema).min(1).optional(),
    discountCode: z.string().max(512).optional(),
    skipAutomaticDiscount: z.boolean().optional(),
  })
  .refine((b) => b.draftId != null || b.registration != null, {
    message: "registration or draftId required",
  });

function checkoutUrls(origin: string, locale: string, draftId: string) {
  const thankYouPath = localizedHref(locale, "/register/thank-you");
  const registerPath = localizedHref(locale, "/register");
  return {
    successUrl: `${origin}${thankYouPath}?session_id={CHECKOUT_SESSION_ID}`,
    /** Must match wizard query `ref` (not `draft`) so cancel returns to Payment step. */
    cancelUrl: `${origin}${registerPath}?step=pay&ref=${encodeURIComponent(draftId)}`,
  };
}

const WALLET_ONLY_METHODS = new Set<string>(["alipay", "wechat_pay"]);

function isWalletOnlyMethods(
  types: Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
): boolean {
  return types.length > 0 && types.every((t) => WALLET_ONLY_METHODS.has(t));
}

async function createStripeCheckoutSession(
  stripe: Stripe,
  input: {
    draftId: string;
    email: string;
    unitAmount: number;
    successUrl: string;
    cancelUrl: string;
    paymentMethodTypes?: Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
    /** Normalized discount code for Stripe metadata (audit) */
    discountCodeNormalized?: string | null;
    /** Force CNY for wallet-only checkout sessions. */
    walletCurrency?: "cny";
  },
): Promise<Stripe.Checkout.Session> {
  const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
    input.paymentMethodTypes ?? DEFAULT_STRIPE_CHECKOUT_PAYMENT_METHODS;

  const useCny =
    input.walletCurrency === "cny" || isWalletOnlyMethods(paymentMethodTypes);
  const currency = useCny ? "cny" : "hkd";
  const unitAmount = useCny
    ? Math.round(input.unitAmount * HKD_TO_CNY_RATE)
    : input.unitAmount;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    currency,
    customer_email: input.email,
    payment_method_types: useCny
      ? paymentMethodTypes.filter((t) => WALLET_ONLY_METHODS.has(t))
      : paymentMethodTypes,
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: "IAIS Annual Conference 2026",
            description: "Conference registration",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      draft_id: input.draftId,
      ...(input.discountCodeNormalized
        ? { discount_code: input.discountCodeNormalized }
        : {}),
      ...(useCny ? { original_currency: "hkd", original_amount_hkd: String(input.unitAmount / 100) } : {}),
    },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  };
  return stripe.checkout.sessions.create(params);
}

export async function postCreateCheckoutSession(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    res.status(503).json({ error: "Stripe is not configured" });
    return;
  }

  const parsed = checkoutBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const origin = getRequestOrigin(toWebRequest(req));

  if (parsed.data.draftId) {
    const draft = await getRegistrationDraftById(parsed.data.draftId);
    if (!draft) {
      res.status(404).json({ error: "Draft not found" });
      return;
    }

    const reg = apiRegistrationSchema.safeParse(draft.payload);
    if (!reg.success) {
      res.status(400).json({
        error: "Invalid registration",
        issues: reg.error.flatten(),
      });
      return;
    }

    const regWithEmail = ensureRegistrationEmail(reg.data);
    const baseFee = await resolveFeesHkdForApi(
      regWithEmail.attendance,
      regWithEmail.audienceType,
    );
    const resolved = await resolveDiscountForPayment(baseFee, parsed.data.discountCode, {
      allowAutomaticDiscount: !parsed.data.skipAutomaticDiscount,
    });
    if (!resolved.ok) {
      res.status(400).json({ error: "Invalid or expired discount code" });
      return;
    }
    const { finalFeeHkd } = resolved.breakdown;
    if (finalFeeHkd <= 0) {
      res.status(400).json({ error: "No payment required for this registration" });
      return;
    }

    const locale = parsed.data.locale ?? draft.locale ?? "en";
    const { successUrl, cancelUrl } = checkoutUrls(origin, locale, draft.id);
    const unitAmount = Math.round(finalFeeHkd * 100);
    const discountNorm = resolved.normalized;

    let existing: Stripe.Checkout.Session | null = null;
    try {
      existing = await stripe.checkout.sessions.retrieve(
        draft.stripe_checkout_session_id,
      );
    } catch {
      existing = null;
    }

    const restrictPaymentMethods = parsed.data.paymentMethodTypes != null;
    if (
      !restrictPaymentMethods &&
      existing?.status === "open" &&
      typeof existing.url === "string" &&
      existing.url.length > 0
    ) {
      res.json({ url: existing.url, draftId: draft.id });
      return;
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await createStripeCheckoutSession(stripe, {
        draftId: draft.id,
        email: regWithEmail.email,
        unitAmount,
        successUrl,
        cancelUrl,
        paymentMethodTypes: parsed.data.paymentMethodTypes,
        discountCodeNormalized: discountNorm,
      });
    } catch (e) {
      console.error(e);
      res.status(502).json({ error: "Could not start checkout" });
      return;
    }

    if (!session.id || !session.url) {
      res.status(502).json({ error: "Checkout session incomplete" });
      return;
    }

    try {
      await updateRegistrationDraftCheckoutSession(
        draft.id,
        session.id,
        discountNorm,
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Could not update registration draft" });
      return;
    }

    res.json({ url: session.url, draftId: draft.id });
    return;
  }

  const reg = apiRegistrationSchema.safeParse(parsed.data.registration);
  if (!reg.success) {
    res.status(400).json({
      error: "Invalid registration",
      issues: reg.error.flatten(),
    });
    return;
  }

  const regWithEmail = ensureRegistrationEmail(reg.data);
  const baseFee = await resolveFeesHkdForApi(
    regWithEmail.attendance,
    regWithEmail.audienceType,
  );
  const resolved = await resolveDiscountForPayment(baseFee, parsed.data.discountCode, {
    allowAutomaticDiscount: !parsed.data.skipAutomaticDiscount,
  });
  if (!resolved.ok) {
    res.status(400).json({ error: "Invalid or expired discount code" });
    return;
  }
  const { finalFeeHkd } = resolved.breakdown;
  if (finalFeeHkd <= 0) {
    res.status(400).json({ error: "No payment required for this registration" });
    return;
  }

  const locale = parsed.data.locale ?? "en";
  const draftId = randomUUID();
  const { successUrl, cancelUrl } = checkoutUrls(origin, locale, draftId);
  const unitAmount = Math.round(finalFeeHkd * 100);
  const discountNorm = resolved.normalized;

  let session: Stripe.Checkout.Session;
  try {
    session = await createStripeCheckoutSession(stripe, {
      draftId,
      email: regWithEmail.email,
      unitAmount,
      successUrl,
      cancelUrl,
      paymentMethodTypes: parsed.data.paymentMethodTypes,
      discountCodeNormalized: discountNorm,
    });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "Could not start checkout" });
    return;
  }

  if (!session.id || !session.url) {
    res.status(502).json({ error: "Checkout session incomplete" });
    return;
  }

  try {
    await insertRegistrationDraft({
      id: draftId,
      stripeCheckoutSessionId: session.id,
      feeHkd: finalFeeHkd,
      locale,
      payload: regWithEmail,
      discountCode: discountNorm,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not save registration draft" });
    return;
  }

  res.json({ url: session.url, draftId });
}

/**
 * Called from the Next.js thank-you page after Stripe redirects with ?session_id=...
 * (browser must not run fulfillment on the Next server — only this API).
 */
export async function getFulfillCheckoutSession(
  req: Request,
  res: Response,
): Promise<void> {
  const raw = req.query.session_id;
  const sessionId = typeof raw === "string" ? raw.trim() : "";
  if (!sessionId) {
    res.status(400).json({ ok: false, error: "Missing session_id" });
    return;
  }
  const result = await fulfillStripeCheckoutSession(sessionId);
  if (result.ok) {
    res.json({ ok: true, reference: result.reference, email: result.email });
    return;
  }
  res.json({ ok: false, error: result.error });
}
