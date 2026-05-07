import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import createNextIntlPlugin from "next-intl/plugin";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(repoRoot);

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  /** Tunnel HTTPS: browser gửi Origin domain thật trong khi dev server nhận Host localhost → Next chặn `/_next/*` (403) nếu không khai báo. */
  allowedDevOrigins: ["local.newtofuevents.com", "*.newtofuevents.com"],
  /**
   * API được triển khai trong `source-backend` (Express). Chạy song song:
   * `cd source-backend && npm run dev` (mặc định :4100) và `cd web && npm run dev`.
   */
  async rewrites() {
    /**
     * Repo-root `.env.local` often sets `BACKEND_URL=http://127.0.0.1:4100` for local dev.
     * That value must NOT be baked into production images (Docker build loads parent env via
     * `loadEnvConfig(repoRoot)`), or `/api/*` rewrites point at localhost inside the web container.
     * Prefer `EVENT_RSVP_DOCKER_BACKEND_URL` (set in web/Dockerfile) for packaged deploys.
     */
    const backend = (
      process.env.EVENT_RSVP_DOCKER_BACKEND_URL ||
      process.env.BACKEND_URL ||
      "http://127.0.0.1:4100"
    ).replace(/\/$/, "");
    return {
      /**
       * afterFiles lets Next.js app/api route handlers win over the proxy so we can
       * expose web-only env (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY prefix) from the
       * Next server while other /api/* still forwards to Express (source-backend).
       */
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${backend}/api/:path*`,
        },
      ],
    };
  },
};

export default withNextIntl(nextConfig);
