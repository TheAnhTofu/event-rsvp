import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Load repo-root `.env.local` (then `.env`) so `source-backend` và Next dùng chung một file env.
 * Gọi trước mọi module đọc `process.env`.
 */
export function loadRootEnv(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "../..");
  const envLocal = resolve(repoRoot, ".env.local");
  const envFile = resolve(repoRoot, ".env");
  if (existsSync(envFile)) {
    config({ path: envFile });
  }
  if (existsSync(envLocal)) {
    config({ path: envLocal, override: true });
  }
}
