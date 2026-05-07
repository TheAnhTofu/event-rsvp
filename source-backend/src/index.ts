import { refreshRuntimeSettingsCache } from "./lib/app-runtime-settings-cache.js";
import { app } from "./app.js";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";

void refreshRuntimeSettingsCache().catch(() => {});
setInterval(() => {
  void refreshRuntimeSettingsCache().catch(() => {});
}, 60_000);

app.listen(config.port, () => {
  logger.info(
    { port: config.port },
    `source-backend listening on http://127.0.0.1:${config.port}`,
  );
});
