import type { Request, Response } from "express";
import { z } from "zod";
import {
  applyRuntimeSettingsPatch,
  getRuntimeConfigSnapshot,
} from "../lib/app-runtime-settings-cache.js";
import { describeResolvedStripeSecretKey } from "../lib/stripe-secret.js";
import { requireDatabaseUrl } from "@db/postgres";
import { requireAdminExpress } from "../express-helpers.js";

function pgErrorHint(err: unknown): string | undefined {
  const e = err as { code?: string; message?: string };
  if (e?.code === "42P01") {
    return "Table app_runtime_settings is missing. Run migration web/db/migrations/010_app_runtime_settings.sql (e.g. npm run db:migrate from web).";
  }
  if (e?.code === "42501") {
    return "Database permission denied for app_runtime_settings. Check RDS user grants.";
  }
  if (typeof e?.message === "string" && e.message.includes("app_runtime_settings")) {
    return e.message;
  }
  return undefined;
}

function respondRuntimeConfigError(
  res: Response,
  err: unknown,
  fallback: string,
): void {
  console.error("[runtime-config]", err);
  const hint = pgErrorHint(err);
  const payload: { error: string; detail?: string } = {
    error: hint ?? fallback,
  };
  if (process.env.NODE_ENV === "development" && err instanceof Error) {
    payload.detail = err.message;
  }
  res.status(500).json(payload);
}

const patchBodySchema = z.object({
  stripeLiveMode: z.boolean().nullable().optional(),
  emailProvider: z.enum(["auto", "ses", "resend"]).nullable().optional(),
  emailPrimaryResend: z.boolean().nullable().optional(),
  paymentasiaUseSandbox: z.boolean().nullable().optional(),
});

export async function getAdminRuntimeConfig(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  try {
    const snapshot = await getRuntimeConfigSnapshot();
    res.json({
      ...snapshot,
      stripeResolvedSecretKey: describeResolvedStripeSecretKey(),
    });
  } catch (e) {
    respondRuntimeConfigError(res, e, "Failed to load runtime config");
  }
}

export async function patchAdminRuntimeConfig(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;
  if (auth.role === "viewer") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const parsed = patchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", detail: parsed.error.flatten() });
    return;
  }

  try {
    await applyRuntimeSettingsPatch(parsed.data);
    const snapshot = await getRuntimeConfigSnapshot();
    res.json({
      ok: true,
      ...snapshot,
      stripeResolvedSecretKey: describeResolvedStripeSecretKey(),
    });
  } catch (e) {
    respondRuntimeConfigError(res, e, "Failed to update runtime config");
  }
}
