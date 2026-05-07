import { loadRootEnv } from "./load-root-env.js";

loadRootEnv();

function optional(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

/** Dev-only default; production should set USER_API_KEY explicitly. */
const devDefaultKey = "dev-user-api-key";

export const config = {
  /** Process listen port (local dev, Docker, EC2 — container often 4100 for API). */
  port: Number(process.env.PORT) || 4100,
  userApiKey: optional("USER_API_KEY") ?? devDefaultKey,
  /**
   * CORS allowed origin for browser calls to this API.
   * Set `*` to allow any origin (`cors` uses reflect / `origin: true`).
   */
  allowedOrigin: optional("USER_API_ALLOWED_ORIGIN") ?? "http://localhost:3000",
  dataFile: optional("USER_API_DATA_FILE") ?? "./data/users.json",
  /** Postgres (RDS, …) — `registrations`, admin, v.v. */
  databaseUrl: optional("DATABASE_URL"),
};
