import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxies Express `GET /api/stripe/fulfill-checkout-session` at runtime (same idea as
 * `publishable-config`). Ensures the App Router always serves this path so the thank-you
 * page never receives an HTML 404 when rewrites/order differ between dev and production.
 */
function backendBaseUrl(): string {
  return (
    process.env.EVENT_RSVP_DOCKER_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://127.0.0.1:4100"
  ).replace(/\/$/, "");
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionId = request.nextUrl.searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "Missing session_id" },
      { status: 400 },
    );
  }
  const backend = backendBaseUrl();
  const url = `${backend}/api/stripe/fulfill-checkout-session?session_id=${encodeURIComponent(sessionId)}`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const data = (await res.json().catch(() => ({
      ok: false,
      error: "invalid_json",
    }))) as Record<string, unknown>;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { ok: false, error: "fetch_failed" },
      { status: 502 },
    );
  }
}
