import { NextResponse } from "next/server";

type BackendPublishable = {
  publishableKey?: string;
  live?: boolean;
};

/**
 * Delegates to Express so publishable key tracks DB runtime config (same as payment API).
 */
export async function GET(): Promise<NextResponse> {
  const backend = (
    process.env.BACKEND_URL ?? "http://127.0.0.1:4100"
  ).replace(/\/$/, "");

  try {
    const res = await fetch(`${backend}/api/stripe/publishable-config`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "backend_unavailable", publishableKeyPrefix: "unset" as const },
        { status: 502 },
      );
    }
    const data = (await res.json()) as BackendPublishable;
    const pk = data.publishableKey ?? "";
    let publishableKeyPrefix: "pk_test" | "pk_live" | "unset" | "other" =
      "unset";
    if (pk.startsWith("pk_live")) publishableKeyPrefix = "pk_live";
    else if (pk.startsWith("pk_test")) publishableKeyPrefix = "pk_test";
    else if (pk.length > 0) publishableKeyPrefix = "other";

    const publishableKeyLooksLikeSecretKey =
      pk.startsWith("sk_test_") || pk.startsWith("sk_live_");

    return NextResponse.json({
      publishableKeyPrefix,
      publishableKeyLooksLikeSecretKey,
      effectiveLiveMode: Boolean(data.live),
    });
  } catch {
    return NextResponse.json(
      { error: "fetch_failed", publishableKeyPrefix: "unset" as const },
      { status: 502 },
    );
  }
}
