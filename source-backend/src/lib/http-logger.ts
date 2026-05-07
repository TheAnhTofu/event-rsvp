import type { IncomingMessage, ServerResponse } from "node:http";
import pinoHttp from "pino-http";
import { logger } from "./logger.js";

function shouldIgnore(req: IncomingMessage): boolean {
  const url = req.url ?? "";
  if (url === "/health" || url.startsWith("/health?")) return true;
  if (url === "/api/health" || url.startsWith("/api/health?")) return true;
  return false;
}

/**
 * Access logs: method, URL, status, timing — not full headers.
 * Default pino-http logs every req/res header (Cookie, Authorization, CF tokens) → noisy + risky for compliance.
 * Set LOG_HTTP_FULL_URL=1 or true to include query string (still no headers).
 */
function accessReqSerializer(req: IncomingMessage) {
  const withId = req as IncomingMessage & { id?: string };
  const raw = req.url ?? "";
  const url =
    process.env.LOG_HTTP_FULL_URL === "1" || process.env.LOG_HTTP_FULL_URL === "true"
      ? raw
      : raw.split("?")[0] ?? raw;
  return {
    id: withId.id,
    method: req.method,
    url,
  };
}

function accessResSerializer(res: ServerResponse) {
  return { statusCode: res.statusCode };
}

/** HTTP access log (JSON lines) for Docker / Dozzle — minimal fields, no cookies/tokens in logs. */
export const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: accessReqSerializer,
    res: accessResSerializer,
  },
  autoLogging: { ignore: shouldIgnore },
  customLogLevel(_req: IncomingMessage, res: ServerResponse, err?: Error) {
    if (err) return "error";
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage(req: IncomingMessage, res: ServerResponse) {
    return `${req.method ?? "?"} ${req.url ?? ""} ${res.statusCode}`;
  },
  customErrorMessage(req: IncomingMessage, res: ServerResponse, err: Error) {
    return `${req.method ?? "?"} ${req.url ?? ""} ${res.statusCode} — ${err.message}`;
  },
});
