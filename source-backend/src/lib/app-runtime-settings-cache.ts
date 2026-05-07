import {
  deleteRuntimeSetting,
  listRuntimeSettings,
  RUNTIME_SETTING_KEYS,
  type RuntimeSettingKey,
  upsertRuntimeSetting,
} from "@db/app-runtime-settings";

/**
 * DB-backed overrides for Stripe mode, email provider, Resend-first.
 * When a key is absent in DB, env vars apply (STRIPE_USE_LIVE_MODE, EMAIL_PROVIDER, …).
 */

let mem: Map<string, string> | null = null;
let loadPromise: Promise<void> | null = null;

function truthyEnv(v: string | undefined): boolean {
  const s = v?.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

export function envStripeLiveMode(): boolean {
  return (
    truthyEnv(process.env.STRIPE_USE_LIVE_MODE) ||
    truthyEnv(process.env.APP_CONFIG_STRIPE_LIVE)
  );
}

export function envEmailProviderMode(): "auto" | "ses" | "resend" {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (raw === "ses") return "ses";
  if (raw === "resend") return "resend";
  return "auto";
}

export function envEmailPrimaryResend(): boolean {
  return (
    truthyEnv(process.env.EMAIL_PRIMARY_RESEND) ||
    truthyEnv(process.env.APP_CONFIG_EMAIL_PRIMARY_RESEND)
  );
}

export function envPaymentAsiaUseSandbox(): boolean {
  return truthyEnv(process.env.PAYMENTASIA_USE_SANDBOX);
}

export function getEffectiveStripeLiveMode(): boolean {
  if (mem !== null) {
    const v = mem.get("stripe_live_mode");
    if (v !== undefined) return v === "true" || v === "1";
  }
  void refreshRuntimeSettingsCacheFireAndForget();
  return envStripeLiveMode();
}

export function getEffectiveEmailProviderMode(): "auto" | "ses" | "resend" {
  if (mem !== null) {
    const v = mem.get("email_provider")?.trim().toLowerCase();
    if (v === "ses" || v === "resend" || v === "auto") return v;
  }
  void refreshRuntimeSettingsCacheFireAndForget();
  return envEmailProviderMode();
}

export function getEffectiveEmailPrimaryResend(): boolean {
  if (mem !== null) {
    const v = mem.get("email_primary_resend");
    if (v !== undefined) return v === "true" || v === "1";
  }
  void refreshRuntimeSettingsCacheFireAndForget();
  return envEmailPrimaryResend();
}

/** Sandbox PA-SYS URLs when true; production when false. DB override or PAYMENTASIA_USE_SANDBOX. */
export function getEffectivePaymentAsiaUseSandbox(): boolean {
  if (mem !== null) {
    const v = mem.get("paymentasia_use_sandbox");
    if (v !== undefined) return v === "true" || v === "1";
  }
  void refreshRuntimeSettingsCacheFireAndForget();
  return envPaymentAsiaUseSandbox();
}

function refreshRuntimeSettingsCacheFireAndForget(): void {
  if (loadPromise) return;
  loadPromise = refreshRuntimeSettingsCache().finally(() => {
    loadPromise = null;
  });
}

export async function refreshRuntimeSettingsCache(): Promise<void> {
  try {
    const rows = await listRuntimeSettings();
    const next = new Map<string, string>();
    for (const [k, v] of Object.entries(rows)) {
      next.set(k, v);
    }
    mem = next;
  } catch {
    if (mem === null) mem = new Map();
  }
}

export async function applyRuntimeSettingsPatch(input: {
  stripeLiveMode?: boolean | null;
  emailProvider?: "auto" | "ses" | "resend" | null;
  emailPrimaryResend?: boolean | null;
  paymentasiaUseSandbox?: boolean | null;
}): Promise<void> {
  const ops: Promise<unknown>[] = [];

  if (input.stripeLiveMode === null) {
    ops.push(deleteRuntimeSetting("stripe_live_mode"));
  } else if (typeof input.stripeLiveMode === "boolean") {
    ops.push(
      upsertRuntimeSetting(
        "stripe_live_mode",
        input.stripeLiveMode ? "true" : "false",
      ),
    );
  }

  if (input.emailProvider === null) {
    ops.push(deleteRuntimeSetting("email_provider"));
  } else if (
    input.emailProvider === "auto" ||
    input.emailProvider === "ses" ||
    input.emailProvider === "resend"
  ) {
    ops.push(upsertRuntimeSetting("email_provider", input.emailProvider));
  }

  if (input.emailPrimaryResend === null) {
    ops.push(deleteRuntimeSetting("email_primary_resend"));
  } else if (typeof input.emailPrimaryResend === "boolean") {
    ops.push(
      upsertRuntimeSetting(
        "email_primary_resend",
        input.emailPrimaryResend ? "true" : "false",
      ),
    );
  }

  if (input.paymentasiaUseSandbox === null) {
    ops.push(deleteRuntimeSetting("paymentasia_use_sandbox"));
  } else if (typeof input.paymentasiaUseSandbox === "boolean") {
    ops.push(
      upsertRuntimeSetting(
        "paymentasia_use_sandbox",
        input.paymentasiaUseSandbox ? "true" : "false",
      ),
    );
  }

  await Promise.all(ops);
  await refreshRuntimeSettingsCache();
}

export type RuntimeConfigSnapshot = {
  db: Partial<Record<RuntimeSettingKey, string>>;
  effective: {
    stripeLiveMode: boolean;
    emailProvider: "auto" | "ses" | "resend";
    emailPrimaryResend: boolean;
    paymentasiaUseSandbox: boolean;
  };
  env: {
    stripeLiveMode: boolean;
    emailProvider: "auto" | "ses" | "resend";
    emailPrimaryResend: boolean;
    paymentasiaUseSandbox: boolean;
  };
};

export async function getRuntimeConfigSnapshot(): Promise<RuntimeConfigSnapshot> {
  await refreshRuntimeSettingsCache();
  const db: Partial<Record<RuntimeSettingKey, string>> = {};
  for (const k of RUNTIME_SETTING_KEYS) {
    const v = mem?.get(k);
    if (v !== undefined) db[k] = v;
  }
  return {
    db,
    effective: {
      stripeLiveMode: getEffectiveStripeLiveMode(),
      emailProvider: getEffectiveEmailProviderMode(),
      emailPrimaryResend: getEffectiveEmailPrimaryResend(),
      paymentasiaUseSandbox: getEffectivePaymentAsiaUseSandbox(),
    },
    env: {
      stripeLiveMode: envStripeLiveMode(),
      emailProvider: envEmailProviderMode(),
      emailPrimaryResend: envEmailPrimaryResend(),
      paymentasiaUseSandbox: envPaymentAsiaUseSandbox(),
    },
  };
}
