import type { Request as ExpressRequest, Response } from "express";
import { checkAdminApi } from "./lib/admin-auth/require-admin-api-core.js";

/** Build a Fetch API Request for helpers that expect Web `Request` (e.g. `getRequestOrigin`). */
export function toWebRequest(req: ExpressRequest): Request {
  const host = req.get("host") || "";
  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  const url = `${proto}://${host}${req.originalUrl}`;
  return new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
  });
}

export async function requireAdminExpress(
  req: ExpressRequest,
  res: Response,
  options?: { allowMutationsForViewer?: boolean },
): Promise<
  | { ok: true; role: "admin" | "viewer"; userId: string; email: string }
  | { ok: false }
> {
  const r = await checkAdminApi(req.headers.cookie, req.method, options);
  if (!r.ok) {
    res.status(r.status).json(r.body);
    return { ok: false };
  }
  return {
    ok: true,
    role: r.role,
    userId: r.userId,
    email: r.email,
  };
}
