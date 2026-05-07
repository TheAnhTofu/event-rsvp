import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { httpLogger } from "./lib/http-logger.js";
import { logger } from "./lib/logger.js";
import { mountEventRoutes } from "./mount-event-routes.js";

export const app = express();

if (process.env.TRUST_PROXY === "1" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
  cors({
    origin:
      config.allowedOrigin === "*" ? true : config.allowedOrigin,
    credentials: true,
  }),
);

app.use(httpLogger);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "source-backend" });
});

mountEventRoutes(app);

app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const log = req.log ?? logger;
    log.error({ err }, "unhandled_error");
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  },
);
