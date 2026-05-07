import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error("DATABASE_URL is not configured");
  }
  return url.trim();
}

function resolveSsl(url: string): boolean | "require" | undefined {
  if (process.env.DATABASE_SSL === "false") return false;
  if (process.env.DATABASE_SSL === "require") return "require";
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "db")
      return false;
    if (host.endsWith(".rds.amazonaws.com")) return "require";
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * SQL client (postgres.js) — dùng với mọi Postgres tương thích giao thức
 * (Docker local, **Amazon RDS**, v.v.).
 */
export function getSql() {
  if (!client) {
    const url = requireDatabaseUrl();
    client = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 30,
      ssl: resolveSsl(url),
    });
  }
  return client;
}
