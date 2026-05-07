import type { Request, Response } from "express";
import { requireDatabaseUrl } from "@db/postgres";
import { buildRegistrationEmailTemplateHtml } from "../lib/admin/email-template-preview-build.js";
import { requireAdminExpress } from "../express-helpers.js";

/**
 * GET /api/admin/registrations/:reference/email-template-preview?templateKey=acknowledge
 * Returns `{ html: string }` for in-app email template preview (admin session required).
 */
export async function getAdminEmailTemplatePreview(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  const reference = req.params.reference;
  if (!reference || typeof reference !== "string" || !reference.trim()) {
    res.status(400).json({ error: "Missing reference" });
    return;
  }

  const templateKeyRaw = req.query.templateKey;
  const templateKey =
    typeof templateKeyRaw === "string" ? templateKeyRaw.trim() : "";
  if (!templateKey) {
    res.status(400).json({ error: "Missing templateKey query" });
    return;
  }

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const decoded = decodeURIComponent(reference);
  const rejectionNote =
    typeof req.query.rejectionNote === "string"
      ? req.query.rejectionNote
      : undefined;

  const result = await buildRegistrationEmailTemplateHtml(
    decoded,
    templateKey,
    { rejectionNote },
  );

  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ html: result.html });
}
