import type { RequestHandler } from "express";
import { config } from "../config.js";

/**
 * Expects `X-API-Key: <USER_API_KEY>` or `Authorization: Bearer <USER_API_KEY>`.
 */
export const requireApiKey: RequestHandler = (req, res, next) => {
  if (!config.userApiKey) {
    res.status(503).json({ error: "USER_API_KEY is not configured" });
    return;
  }

  const headerKey = req.header("x-api-key")?.trim();
  const auth = req.header("authorization")?.trim();
  const bearer =
    auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : undefined;

  const provided = headerKey || bearer;
  if (!provided || provided !== config.userApiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};
