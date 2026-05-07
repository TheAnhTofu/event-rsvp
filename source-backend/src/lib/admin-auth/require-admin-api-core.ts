import {
  COOKIE_NAME,
  isAdminAuthConfigured,
  verifyAdminToken,
  type AdminRole,
} from "./session.js";

function getCookieValue(
  cookieHeader: string | null,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const prefix = `${name}=`;
  for (const p of parts) {
    if (p.startsWith(prefix))
      return decodeURIComponent(p.slice(prefix.length));
  }
  return undefined;
}

export type AdminApiCheckResult =
  | { ok: true; role: AdminRole; userId: string; email: string }
  | { ok: false; status: number; body: Record<string, unknown> };

/**
 * Framework-agnostic admin guard (Express). Next.js middleware uses
 * `web/src/lib/admin-auth/session.ts` for Edge — keep JWT/session behavior aligned.
 */
export async function checkAdminApi(
  cookieHeader: string | null | undefined,
  method: string,
  options?: { allowMutationsForViewer?: boolean },
): Promise<AdminApiCheckResult> {
  if (process.env.ADMIN_AUTH_DISABLED === "true") {
    return { ok: true, role: "admin", userId: "", email: "" };
  }
  if (!isAdminAuthConfigured()) {
    return { ok: true, role: "admin", userId: "", email: "" };
  }

  const token = getCookieValue(cookieHeader ?? null, COOKIE_NAME);
  const session = await verifyAdminToken(token);

  if (!session) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }

  const readOnly = method === "GET" || method === "HEAD";
  if (
    session.role === "viewer" &&
    !readOnly &&
    !options?.allowMutationsForViewer
  ) {
    return { ok: false, status: 403, body: { error: "Forbidden" } };
  }

  return {
    ok: true,
    role: session.role,
    userId: session.sub,
    email: session.email,
  };
}
