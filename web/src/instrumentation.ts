import { logContainer } from "./lib/container-logger";

export async function register() {
  logContainer("info", "instrumentation_register", {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
