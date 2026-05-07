"use client";

import { useCallback, useEffect, useState } from "react";

type Snapshot = {
  db: Record<string, string>;
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
  /** Backend-only: prefix of resolved secret (sk_test / sk_live), never the full key. */
  stripeResolvedSecretKey?: "unset" | "test" | "live" | "other";
};

type PublishableHint = {
  publishableKeyPrefix: "pk_test" | "pk_live" | "unset" | "other";
  /** True if NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY was set to sk_test/sk_live by mistake. */
  publishableKeyLooksLikeSecretKey?: boolean;
  /** Same source as payment: /api/stripe/publishable-config (DB + env). */
  effectiveLiveMode?: boolean;
};

export function AdminRuntimeConfigContent() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [publishableHint, setPublishableHint] =
    useState<PublishableHint | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [res, hintRes] = await Promise.all([
        fetch("/api/admin/runtime-config", { credentials: "include" }),
        fetch("/api/admin/stripe-publishable-hint", { credentials: "include" }),
      ]);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        throw new Error(
          [j.error, j.detail].filter(Boolean).join(" — ") || `HTTP ${res.status}`,
        );
      }
      const data = (await res.json()) as Snapshot;
      setSnap(data);
      if (hintRes.ok) {
        const hint = (await hintRes.json()) as PublishableHint;
        setPublishableHint(hint);
      } else {
        setPublishableHint(null);
      }
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Could not load runtime config.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (body: {
    stripeLiveMode?: boolean | null;
    emailProvider?: "auto" | "ses" | "resend" | null;
    emailPrimaryResend?: boolean | null;
    paymentasiaUseSandbox?: boolean | null;
  }) => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/runtime-config", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        throw new Error(
          [j.error, j.detail].filter(Boolean).join(" — ") ||
            `HTTP ${res.status}`,
        );
      }
      const data = (await res.json()) as Snapshot & { ok?: boolean };
      setSnap({
        db: data.db,
        effective: data.effective,
        env: data.env,
        stripeResolvedSecretKey: data.stripeResolvedSecretKey,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!snap) {
    return (
      <p className="px-5 py-8 text-sm text-admin-col-muted">
        {err ?? "Loading…"}
      </p>
    );
  }

  const rowClass =
    "flex flex-col gap-3 rounded-lg border border-admin-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between";

  return (
    <div className="space-y-4">
      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      {publishableHint?.publishableKeyLooksLikeSecretKey ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-950">
          <p className="font-semibold">
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY looks like a secret key (sk_test_… / sk_live_…).
          </p>
          <p className="mt-2 text-[13px] leading-relaxed">
            Use the <strong>publishable</strong> key only (
            <code className="rounded bg-red-100/90 px-1">pk_test_…</code> or{" "}
            <code className="rounded bg-red-100/90 px-1">pk_live_…</code>) from Stripe Dashboard →
            Developers → API keys. Never put <code className="rounded bg-red-100/90 px-1">sk_…</code> in a{" "}
            <code className="rounded bg-red-100/90 px-1">NEXT_PUBLIC_*</code> variable.
          </p>
        </div>
      ) : null}

      {(publishableHint?.effectiveLiveMode ?? snap.effective.stripeLiveMode) &&
      (publishableHint?.publishableKeyPrefix === "pk_test" ||
        publishableHint?.publishableKeyPrefix === "unset") ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">
            Live mode is on, but the live publishable key is missing or still test (
            <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE</code>{" "}
            should be <code className="rounded bg-amber-100/80 px-1">pk_live_…</code>).
          </p>
          <p className="mt-2 text-[13px] leading-relaxed">
            Set it in the server env (same process as <code className="rounded bg-amber-100/80 px-1">source-backend</code>
            ). Registration uses <code className="rounded bg-amber-100/80 px-1">/api/stripe/publishable-config</code>{" "}
            so it follows this toggle; restart the API after changing env.
          </p>
        </div>
      ) : null}

      {snap.effective.stripeLiveMode &&
      (snap.stripeResolvedSecretKey === "test" ||
        snap.stripeResolvedSecretKey === "unset") ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Live mode is on, but the server is not using a live secret key.</p>
          <p className="mt-2 text-[13px] leading-relaxed">
            The admin toggle only selects which env vars the API reads. Set{" "}
            <code className="rounded bg-amber-100/80 px-1">STRIPE_PRODUCTION_SECRET_KEY</code> or{" "}
            <code className="rounded bg-amber-100/80 px-1">STRIPE_SECRET_KEY_LIVE</code> to your{" "}
            <code className="rounded bg-amber-100/80 px-1">sk_live_…</code> value (and the matching live
            webhook secret). If only <code className="rounded bg-amber-100/80 px-1">STRIPE_SECRET_KEY</code>{" "}
            is set, it is used as a fallback and is often still a test key. For the browser, set{" "}
            <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to{" "}
            <code className="rounded bg-amber-100/80 px-1">pk_live_…</code> and rebuild the web app.
          </p>
        </div>
      ) : null}

      <p className="text-sm text-admin-col-muted">
        Overrides are stored in Postgres. Clearing an override restores the value from
        environment variables on the server (and from AWS Secrets Manager when used on
        EC2). Stripe secret keys are never shown here — only mode selection. PaymentAsia
        merchant credentials stay in env (<code className="rounded bg-admin-table-header-bg px-1">PAYMENTASIA_MERCHANT_TOKEN</code>,{" "}
        <code className="rounded bg-admin-table-header-bg px-1">PAYMENTASIA_SECRET_CODE</code>); sandbox vs production hosted URLs can be toggled below or via{" "}
        <code className="rounded bg-admin-table-header-bg px-1">PAYMENTASIA_USE_SANDBOX</code>.
      </p>

      <div className={rowClass}>
        <div>
          <p className="text-[14px] font-semibold text-admin-navy">Stripe live mode</p>
          <p className="mt-1 text-[12px] text-admin-col-muted">
            When on, the app uses{" "}
            <code className="rounded bg-admin-table-header-bg px-1">STRIPE_PRODUCTION_SECRET_KEY</code>{" "}
            (then <code className="rounded bg-admin-table-header-bg px-1">STRIPE_SECRET_KEY_LIVE</code>)
            and matching webhook secrets. Env default:{" "}
            <strong>{snap.env.stripeLiveMode ? "live" : "test"}</strong>
            {snap.db.stripe_live_mode !== undefined ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-900">
                overridden
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-admin-navy">
            <input
              type="checkbox"
              className="size-4 rounded border-admin-border"
              checked={snap.effective.stripeLiveMode}
              disabled={saving}
              onChange={(e) => {
                void patch({ stripeLiveMode: e.target.checked });
              }}
            />
            Use live Stripe keys
          </label>
          {snap.db.stripe_live_mode !== undefined ? (
            <button
              type="button"
              disabled={saving}
              className="rounded-lg border border-admin-border px-3 py-1.5 text-[12px] font-medium text-admin-navy hover:bg-admin-table-header-bg"
              onClick={() => void patch({ stripeLiveMode: null })}
            >
              Use env only
            </button>
          ) : null}
        </div>
      </div>

      <div className={rowClass}>
        <div>
          <p className="text-[14px] font-semibold text-admin-navy">PaymentAsia sandbox</p>
          <p className="mt-1 text-[12px] text-admin-col-muted">
            When on, hosted checkout uses PaymentAsia sandbox (
            <code className="rounded bg-admin-table-header-bg px-1">payment-sandbox.pa-sys.com</code>
            ). When off, production PA-SYS. Env default:{" "}
            <strong>{snap.env.paymentasiaUseSandbox ? "sandbox" : "production"}</strong>
            {snap.db.paymentasia_use_sandbox !== undefined ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-900">
                overridden
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-admin-navy">
            <input
              type="checkbox"
              className="size-4 rounded border-admin-border"
              checked={snap.effective.paymentasiaUseSandbox}
              disabled={saving}
              onChange={(e) => {
                void patch({ paymentasiaUseSandbox: e.target.checked });
              }}
            />
            Use sandbox (test) URLs
          </label>
          {snap.db.paymentasia_use_sandbox !== undefined ? (
            <button
              type="button"
              disabled={saving}
              className="rounded-lg border border-admin-border px-3 py-1.5 text-[12px] font-medium text-admin-navy hover:bg-admin-table-header-bg"
              onClick={() => void patch({ paymentasiaUseSandbox: null })}
            >
              Use env only
            </button>
          ) : null}
        </div>
      </div>

      <div className={rowClass}>
        <div>
          <p className="text-[14px] font-semibold text-admin-navy">Email provider</p>
          <p className="mt-1 text-[12px] text-admin-col-muted">
            Env default: <strong>{snap.env.emailProvider}</strong>
            {snap.db.email_provider !== undefined ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-900">
                overridden
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-admin-border bg-white px-3 py-2 text-[13px] text-admin-navy outline-none focus:border-admin-navy focus:ring-2 focus:ring-admin-navy/20"
            value={snap.effective.emailProvider}
            disabled={saving}
            onChange={(e) => {
              const v = e.target.value as "auto" | "ses" | "resend";
              void patch({ emailProvider: v });
            }}
          >
            <option value="auto">auto (SES then Resend on failure)</option>
            <option value="ses">SES only</option>
            <option value="resend">Resend only</option>
          </select>
          {snap.db.email_provider !== undefined ? (
            <button
              type="button"
              disabled={saving}
              className="rounded-lg border border-admin-border px-3 py-1.5 text-[12px] font-medium text-admin-navy hover:bg-admin-table-header-bg"
              onClick={() => void patch({ emailProvider: null })}
            >
              Use env only
            </button>
          ) : null}
        </div>
      </div>

      <div className={rowClass}>
        <div>
          <p className="text-[14px] font-semibold text-admin-navy">Resend first (auto mode)</p>
          <p className="mt-1 text-[12px] text-admin-col-muted">
            When email provider is <strong>auto</strong>, try Resend before SES. Env default:{" "}
            <strong>{snap.env.emailPrimaryResend ? "on" : "off"}</strong>
            {snap.db.email_primary_resend !== undefined ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-900">
                overridden
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-admin-navy">
            <input
              type="checkbox"
              className="size-4 rounded border-admin-border"
              checked={snap.effective.emailPrimaryResend}
              disabled={saving}
              onChange={(e) => {
                void patch({ emailPrimaryResend: e.target.checked });
              }}
            />
            Prefer Resend first
          </label>
          {snap.db.email_primary_resend !== undefined ? (
            <button
              type="button"
              disabled={saving}
              className="rounded-lg border border-admin-border px-3 py-1.5 text-[12px] font-medium text-admin-navy hover:bg-admin-table-header-bg"
              onClick={() => void patch({ emailPrimaryResend: null })}
            >
              Use env only
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-[12px] text-admin-col-muted">
        <button
          type="button"
          className="text-admin-navy underline"
          onClick={() => void load()}
        >
          Refresh
        </button>
      </p>
    </div>
  );
}
