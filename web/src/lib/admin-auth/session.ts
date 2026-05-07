/**
 * Used by Next.js middleware (Edge) for admin pages and `/api/admin/*` pre-proxy.
 * Mirror: `source-backend/src/lib/admin-auth/session.ts` — keep cookie/JWT behavior in sync.
 */
import { SignJWT, jwtVerify } from "jose";

export type AdminRole = "admin" | "viewer";

const COOKIE_NAME = "admin_session";

/** JWT payload for HS256 cookie session (7d). */
export type AdminSessionPayload = {
  sub: string;
  email: string;
  role: AdminRole;
};

function getSecret(): Uint8Array | null {
  const raw = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!raw || raw.length < 32) return null;
  return new TextEncoder().encode(raw);
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(getSecret());
}

export async function signAdminToken(
  payload: AdminSessionPayload,
): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  return new SignJWT({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAdminToken(
  token: string | undefined,
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub;
    const email = payload.email;
    const role = payload.role;
    if (typeof sub !== "string" || !sub) return null;
    if (typeof email !== "string" || !email) return null;
    if (role !== "admin" && role !== "viewer") return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
