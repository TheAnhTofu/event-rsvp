/**
 * JSON lines to stdout/stderr so Docker / Dozzle can tail container logs.
 * Safe for Edge (middleware) and Node (instrumentation).
 */

const SERVICE = "event-rsvp-web" as const;

export function logContainer(
  level: "info" | "warn" | "error",
  msg: string,
  extra?: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    service: SERVICE,
    level,
    msg,
    ...extra,
  });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
