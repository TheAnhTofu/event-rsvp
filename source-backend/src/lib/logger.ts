import pino from "pino";

const level =
  process.env.LOG_LEVEL?.trim().toLowerCase() ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

/** JSON logs to stdout — visible in `docker logs` and Dozzle. */
export const logger = pino({
  level,
  base: { service: "source-backend" },
  timestamp: pino.stdTimeFunctions.isoTime,
  /** Defense in depth if code logs full `req` / credential objects. */
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "headers.authorization",
      "headers.cookie",
      "password",
      "secret",
      "client_secret",
    ],
    censor: "[Redacted]",
  },
});
