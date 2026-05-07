import type { Request, Response } from "express";
import { z } from "zod";
import { getSql, requireDatabaseUrl } from "@db/postgres";
import { requireAdminExpress } from "../express-helpers.js";

/**
 * GET /api/admin/check-in/lookup?ref=REFERENCE
 * Look up a registration by reference for the check-in verification modal.
 */
export async function getCheckInLookup(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const ref = typeof req.query.ref === "string" ? req.query.ref.trim() : "";
  if (!ref) {
    res.status(400).json({ error: "Missing ref parameter" });
    return;
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT
        reference,
        email,
        payload,
        fee_hkd,
        payment_method,
        payment_status,
        created_at,
        audience_type
      FROM registrations
      WHERE reference = ${ref}
      LIMIT 1
    `;

    if (rows.length === 0) {
      res.status(404).json({ error: "Registration not found" });
      return;
    }

    const flags = await sql`
      SELECT
        EXISTS (
          SELECT 1 FROM check_in_logs
          WHERE registration_reference = ${ref} AND type = 'check_in'
        ) AS chk_in,
        EXISTS (
          SELECT 1 FROM check_in_logs
          WHERE registration_reference = ${ref} AND type = 'check_out'
        ) AS chk_out
    `;
    const f = flags[0] as { chk_in: boolean; chk_out: boolean };

    const row = rows[0] as {
      reference: string;
      email: string;
      payload: unknown;
      payment_status: string;
      audience_type: string | null;
    };
    const p =
      typeof row.payload === "object" && row.payload !== null
        ? (row.payload as Record<string, unknown>)
        : {};

    const audienceFromDb =
      row.audience_type != null && String(row.audience_type).trim()
        ? String(row.audience_type).trim()
        : null;
    const audienceFromPayload =
      typeof p.audienceType === "string" && p.audienceType.trim()
        ? String(p.audienceType).trim()
        : null;
    const audienceTypeResolved = audienceFromDb ?? audienceFromPayload ?? "";

    res.json({
      reference: row.reference,
      email: row.email,
      title: p.title ?? p.salutation ?? "",
      firstName: p.firstName ?? p.first_name ?? "",
      lastName: p.lastName ?? p.last_name ?? "",
      company: p.company ?? "",
      jobTitle: p.jobTitle ?? p.job_title ?? "",
      phone: p.phone
        ? String(p.phone)
        : [p.phoneCountry ?? p.phone_country, p.phoneNumber ?? p.phone_number]
            .filter(Boolean)
            .join(" "),
      country: p.country ?? "",
      attendance: p.attendance ?? "",
      audienceType: audienceTypeResolved,
      paymentStatus: row.payment_status ?? "",
      alreadyCheckedIn: Boolean(f?.chk_in),
      alreadyCheckedOut: Boolean(f?.chk_out),
    });
  } catch (e) {
    console.error("check-in lookup error", e);
    res.status(500).json({ error: "Lookup failed" });
  }
}

const recordBodySchema = z.object({
  reference: z.string().min(1),
  type: z.enum(["check_in", "check_out"]),
});

/**
 * POST /api/admin/check-in/record
 * Record a check-in or check-out event.
 */
export async function postCheckInRecord(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const parsed = recordBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid body", detail: parsed.error.flatten() });
    return;
  }

  const { reference, type } = parsed.data;

  try {
    const sql = getSql();

    const reg = await sql`
      SELECT reference FROM registrations WHERE reference = ${reference} LIMIT 1
    `;
    if (reg.length === 0) {
      res.status(404).json({ error: "Registration not found" });
      return;
    }

    const dup = await sql`
      SELECT 1 FROM check_in_logs
      WHERE registration_reference = ${reference} AND type = ${type}
      LIMIT 1
    `;
    if (dup.length > 0) {
      res.status(409).json({
        error:
          type === "check_in" ? "Already checked in" : "Already checked out",
      });
      return;
    }

    await sql`
      INSERT INTO check_in_logs (registration_reference, type, checked_by)
      VALUES (${reference}, ${type}, ${auth.email})
    `;

    res.json({ ok: true, type, reference });
  } catch (e) {
    console.error("check-in record error", e);
    res.status(500).json({ error: "Failed to record check-in" });
  }
}
