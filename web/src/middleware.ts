import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { COOKIE_NAME } from "@/lib/admin-auth/session";
import { verifyAdminToken } from "@/lib/admin-auth/session";
import { logContainer } from "@/lib/container-logger";

const intlMiddleware = createMiddleware(routing);

/** Legacy localized URLs → English (no locale prefix). */
const LEGACY_LOCALE_PREFIX = /^\/(zh-Hant|zh-Hans)(?=\/|$)/;

function englishPathFromLegacyUrl(pathname: string): string | null {
  const match = pathname.match(LEGACY_LOCALE_PREFIX);
  if (!match) return null;
  const rest = pathname.slice(match[0].length);
  if (rest === "") return "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

function isAdminLoginPath(pathname: string): boolean {
  return pathname.includes("/admin/login");
}

function isProtectedAdminPage(pathname: string): boolean {
  if (!pathname.includes("/admin")) return false;
  if (isAdminLoginPath(pathname)) return false;
  return true;
}

function adminAuthEnabled(): boolean {
  if (process.env.ADMIN_AUTH_DISABLED === "true") return false;
  const s = process.env.ADMIN_SESSION_SECRET?.trim();
  return Boolean(s && s.length >= 32);
}

/** Login + logout stay public so users can obtain or clear the session cookie. */
function isPublicAdminApiPath(pathname: string): boolean {
  return (
    pathname === "/api/admin/auth/login" ||
    pathname === "/api/admin/auth/logout"
  );
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (process.env.LOG_WEB_REQUESTS !== "false") {
    logContainer("info", "request", {
      method: request.method,
      path: pathname,
    });
  }

  const legacyTarget = englishPathFromLegacyUrl(pathname);
  if (legacyTarget !== null) {
    const url = request.nextUrl.clone();
    url.pathname = legacyTarget;
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/api/admin")) {
    if (!adminAuthEnabled()) {
      return NextResponse.next();
    }
    if (!isPublicAdminApiPath(pathname)) {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      const session = await verifyAdminToken(token);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  if (!adminAuthEnabled()) {
    return intlMiddleware(request);
  }

  if (isProtectedAdminPage(pathname)) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = await verifyAdminToken(token);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isAdminLoginPath(pathname)) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = await verifyAdminToken(token);
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/api/admin/:path*",
  ],
};
