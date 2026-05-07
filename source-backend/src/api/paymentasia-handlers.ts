import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { apiRegistrationSchema } from "../lib/api-registration-schema.ts";
import { resolveDiscountForPayment } from "../lib/resolve-discount.js";
import { resolveFeesHkdForApi } from "../lib/registration-schema.ts";
import { ensureRegistrationEmail } from "../lib/synthetic-registration-email.ts";
import { requireDatabaseUrl } from "@db/postgres";
import {
  getRegistrationDraftById,
  insertPaymentAsiaMerchantRef,
} from "@db/registrations";
import { getEffectivePaymentAsiaUseSandbox } from "../lib/app-runtime-settings-cache.js";
import {
  resolvePaymentAsiaActionUrl,
  resolvePaymentAsiaConfig,
} from "../lib/paymentasia-config.js";
import { paymentAsiaSign, paymentAsiaVerifySign } from "../lib/paymentasia-sign.js";
import { fulfillPaymentAsiaNotification } from "../lib/paymentasia-fulfillment.js";

function localizedHref(locale: string, pathname: string): string {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === "en") return p;
  return `/${locale}${p}`;
}

function getExpressOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req.get("x-forwarded-host") ?? req.get("host") ?? "";
  const proto = req.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

function mapLocaleToPaLang(locale: string): string {
  const l = locale.toLowerCase();
  if (l.startsWith("zh-hans")) return "zh-cn";
  if (l.startsWith("zh-hant")) return "zh-tw";
  return "zh-en";
}

function clientIp(req: Request): string {
  const xf = req.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xf && /^[\d.:a-fA-F]+$/.test(xf)) return xf;
  return req.socket.remoteAddress?.replace(/^::ffff:/, "") || "127.0.0.1";
}

const createBodySchema = z.object({
  draftId: z.string().uuid(),
  locale: z.string().max(32).optional(),
  wallet: z.enum(["alipay", "wechat", "card"]),
  discountCode: z.string().max(512).optional(),
  skipAutomaticDiscount: z.boolean().optional(),
});

export async function getPaymentAsiaConfig(
  _req: Request,
  res: Response,
): Promise<void> {
  const cfg = resolvePaymentAsiaConfig();
  res.json({
    enabled: Boolean(cfg),
    sandbox: getEffectivePaymentAsiaUseSandbox(),
  });
}

export async function postCreatePaymentAsiaPayment(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const cfg = resolvePaymentAsiaConfig();
  if (!cfg) {
    res.status(503).json({
      error:
        "PaymentAsia is not configured (set PAYMENTASIA_MERCHANT_TOKEN and PAYMENTASIA_SECRET_CODE)",
    });
    return;
  }

  const parsed = createBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

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
  const resolved = await resolveDiscountForPayment(
    baseFee,
    parsed.data.discountCode,
    {
      allowAutomaticDiscount: !parsed.data.skipAutomaticDiscount,
    },
  );
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
  const origin = getExpressOrigin(req);
  const notifyUrl =
    process.env.PAYMENTASIA_NOTIFY_URL?.trim() ||
    `${origin}/api/paymentasia/notify`;
  const thankYouPath = localizedHref(locale, "/register/thank-you");
  const returnUrl = `${origin}${thankYouPath}?ref=${encodeURIComponent(parsed.data.draftId)}`;

  const amountStr = finalFeeHkd.toFixed(2);
  /** Must match PA-SYS exactly: `Alipay` | `Wechat` | `CreditCard` (from wallet button on client). */
  const network: "Alipay" | "Wechat" | "CreditCard" =
    parsed.data.wallet === "alipay"
      ? "Alipay"
      : parsed.data.wallet === "wechat"
        ? "Wechat"
        : "CreditCard";
  const subject =
    process.env.PAYMENTASIA_SUBJECT?.trim() || "IAIS Conference registration";

  const merchantReference = randomUUID();
  try {
    await insertPaymentAsiaMerchantRef({
      merchantReference,
      draftId: parsed.data.draftId,
    });
  } catch (e) {
    console.error("[paymentasia create-payment] merchant ref insert", e);
    res.status(500).json({ error: "Could not start payment session" });
    return;
  }

  const p = regWithEmail;
  const phone = `${p.phoneCountry?.trim() ?? ""}${p.phoneNumber?.trim() ?? ""}`.slice(
    0,
    64,
  );

  const fields: Record<string, string> = {
    merchant_reference: merchantReference,
    currency: "HKD",
    amount: amountStr,
    return_url: returnUrl,
    customer_ip: clientIp(req),
    customer_first_name: p.firstName.trim().slice(0, 255),
    customer_last_name: p.lastName.trim().slice(0, 255),
    customer_phone: phone || "00000000",
    customer_email: p.email.trim().slice(0, 255),
    network,
    subject: subject.slice(0, 255),
    notify_url: notifyUrl.slice(0, 255),
    lang: mapLocaleToPaLang(locale),
  };

  const addr = [p.company?.trim(), p.jobTitle?.trim()]
    .filter(Boolean)
    .join(", ")
    .slice(0, 255);
  if (addr.length > 0) {
    fields.customer_address = addr;
  }
  const cc = p.country?.trim().slice(0, 2).toUpperCase();
  if (cc) {
    fields.customer_country = cc;
    fields.customer_state = cc === "HK" ? "HK" : cc;
  }

  /**
   * PA-SYS Credit Card requires `customer_address`, `customer_state`,
   * `customer_country`, `customer_postal_code`. Provide safe fallbacks so the
   * checkout never fails validation when the registration omits address fields.
   */
  if (network === "CreditCard") {
    if (!fields.customer_address) {
      fields.customer_address = "N/A";
    }
    if (!fields.customer_country) {
      fields.customer_country = "HK";
    }
    if (!fields.customer_state) {
      fields.customer_state = fields.customer_country;
    }
    fields.customer_postal_code = "000000";
  }

  fields.sign = paymentAsiaSign(fields, cfg.secretCode);

  const actionUrl = resolvePaymentAsiaActionUrl(parsed.data.wallet, cfg);

  res.json({
    actionUrl,
    method: "POST" as const,
    fields,
  });
}

export async function postPaymentAsiaNotify(
  req: Request,
  res: Response,
): Promise<void> {
  const cfg = resolvePaymentAsiaConfig();
  if (!cfg) {
    res.status(503).send("FAIL");
    return;
  }

  const body = req.body as Record<string, string | string[] | undefined>;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue;
    flat[k] = Array.isArray(v) ? String(v[0]) : String(v);
  }

  const sign = flat.sign?.trim();
  if (!sign) {
    res.status(400).send("FAIL");
    return;
  }

  const { sign: _drop, ...rest } = flat;
  const verifyFields = { ...rest };
  if (!paymentAsiaVerifySign(verifyFields, cfg.secretCode, sign)) {
    console.warn("[paymentasia notify] signature mismatch");
    res.status(401).send("FAIL");
    return;
  }

  const st = flat.status?.trim();
  if (st !== "1") {
    console.info("[paymentasia notify] ignored status", st, flat.merchant_reference);
    res.status(200).send("OK");
    return;
  }

  const result = await fulfillPaymentAsiaNotification(flat);
  if (!result.ok) {
    console.warn("[paymentasia notify]", result.error, flat);
    res.status(400).send("FAIL");
    return;
  }

  res.status(200).send("OK");
}
