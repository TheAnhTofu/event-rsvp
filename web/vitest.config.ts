import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.tsx"],
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.integration.test.{ts,tsx}"],
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
    css: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.ts", "src/components/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.*",
        "**/*.integration.test.*",
        "**/test-utils/**",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      /** Vitest resolves extensionless `next/navigation` incorrectly without explicit `.js`. */
      "next/navigation": path.resolve(
        __dirname,
        "node_modules/next/navigation.js",
      ),
    },
  },
});
