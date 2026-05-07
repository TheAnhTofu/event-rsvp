import { NextResponse } from "next/server";

type BackendPublishableConfig = {
  publishableKey?: string;
  live?: boolean;
  envStripeLiveMode?: boolean;
  dbStripeLiveMode?: boolean | null;
  error?: string;
};

/**
 * Same effective URL chain as `next.config` rewrites — runtime + Docker-safe.
 */
function backendBaseUrl(): string {
  return (
    process.env.EVENT_RSVP_DOCKER_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://127.0.0.1:4100"
  ).replace(/\/$/, "");
}

/**
 * Mirrors `source-backend/src/lib/stripe-secret.ts` `resolveStripePublishableKey` using
 * `live` from the API response (DB + env effective mode).
 */
function resolvePublishableKeyFromEnv(live: boolean): string {
  if (live) {
    return (
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE?.trim() ||
      process.env.STRIPE_PUBLISHABLE_KEY_LIVE?.trim() ||
      ""
    );
  }
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY_TEST?.trim() ||
    ""
  );
}

/** Matches `source-backend` `envStripeLiveMode` when DB runtime config is unavailable. */
function envStripeLiveMode(): boolean {
  const truthy = (v: string | undefined): boolean => {
    const s = v?.trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes";
  };
  return (
    truthy(process.env.STRIPE_USE_LIVE_MODE) ||
    truthy(process.env.APP_CONFIG_STRIPE_LIVE)
  );
}

/** Dev / degraded: same shape as Express success when backend is down but web env has a key. */
function tryEnvOnlyPublishableResponse(): NextResponse | null {
  const live = envStripeLiveMode();
  const publishableKey = resolvePublishableKeyFromEnv(live);
  if (!publishableKey) return null;
  return NextResponse.json(
    {
      publishableKey,
      live,
      envStripeLiveMode: live,
      dbStripeLiveMode: null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Proxies Express `GET /api/stripe/publishable-config` using **runtime** backend URL (avoids
 * broken rewrites when build-time `BACKEND_URL` pointed at 127.0.0.1). Fills an empty
 * `publishableKey` from container env when the API process lacks the matching var.
 */
export async function GET(): Promise<NextResponse> {
  const backend = backendBaseUrl();

  try {
    const res = await fetch(`${backend}/api/stripe/publishable-config`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const raw = (await res.json().catch(() => ({}))) as BackendPublishableConfig;

    if (!res.ok) {
      const envOnly = tryEnvOnlyPublishableResponse();
      if (envOnly) return envOnly;
      return NextResponse.json(
        {
          error: raw.error ?? "upstream_error",
          publishableKey: "",
          live: Boolean(raw.live),
        },
        { status: res.status },
      );
    }

    let publishableKey = raw.publishableKey?.trim() ?? "";
    if (!publishableKey) {
      publishableKey = resolvePublishableKeyFromEnv(Boolean(raw.live));
    }

    return NextResponse.json(
      {
        ...raw,
        publishableKey,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    const envOnly = tryEnvOnlyPublishableResponse();
    if (envOnly) return envOnly;
    return NextResponse.json(
      { error: "fetch_failed", publishableKey: "", live: false },
      { status: 502 },
    );
  }
}
