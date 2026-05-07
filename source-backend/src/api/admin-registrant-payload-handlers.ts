import type { Request, Response } from "express";
import { z } from "zod";
import { requireDatabaseUrl } from "@db/postgres";
import { adminUpdateRegistrantInfoFields } from "@db/registrations";
import { requireAdminExpress } from "../express-helpers.js";
import {
  attendanceValues,
  dietaryChoiceValues,
  dietaryYesNoValues,
  normalizeFormText,
} from "../lib/registration-schema.js";

const adminRegistrantInfoBodySchema = z.object({
  title: z.string().max(200),
  firstName: z.string().max(200),
  lastName: z.string().max(200),
  company: z.string().max(400),
  jobTitle: z.string().max(400),
  email: z.string().max(320),
  phoneCountry: z.string().max(24),
  phoneNumber: z.string().max(80),
  country: z.string().max(12),
  attendance: z.enum(attendanceValues),
  sameContact: z.boolean(),
  contactTitle: z.string().max(200),
  contactFirstName: z.string().max(200),
  contactLastName: z.string().max(200),
  contactCompany: z.string().max(400),
  contactJobTitle: z.string().max(400),
  contactEmail: z.string().max(320),
  contactPhoneCountry: z.string().max(24),
  contactPhoneNumber: z.string().max(80),
  dietaryYesNo: z.enum(dietaryYesNoValues),
  dietary: z.enum(dietaryChoiceValues).optional(),
  dietaryOtherDetails: z.string().max(500),
  cpdApply: z.enum(["yes", "no"]),
  consent: z.boolean(),
});

export async function patchAdminRegistrationRegistrantInfo(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  const referenceRaw = req.params.reference;
  if (!referenceRaw || typeof referenceRaw !== "string" || !referenceRaw.trim()) {
    res.status(400).json({ error: "Missing reference" });
    return;
  }
  const reference = decodeURIComponent(referenceRaw.trim());

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const parsed = adminRegistrantInfoBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid body",
      details: parsed.error.issues,
    });
    return;
  }

  const b = parsed.data;
  const result = await adminUpdateRegistrantInfoFields(reference, {
    title: normalizeFormText(b.title),
    firstName: normalizeFormText(b.firstName),
    lastName: normalizeFormText(b.lastName),
    company: normalizeFormText(b.company),
    jobTitle: normalizeFormText(b.jobTitle),
    email: normalizeFormText(b.email),
    phoneCountry: normalizeFormText(b.phoneCountry),
    phoneNumber: normalizeFormText(b.phoneNumber),
    country: normalizeFormText(b.country),
    attendance: b.attendance,
    sameContact: b.sameContact,
    contactTitle: normalizeFormText(b.contactTitle),
    contactFirstName: normalizeFormText(b.contactFirstName),
    contactLastName: normalizeFormText(b.contactLastName),
    contactCompany: normalizeFormText(b.contactCompany),
    contactJobTitle: normalizeFormText(b.contactJobTitle),
    contactEmail: normalizeFormText(b.contactEmail),
    contactPhoneCountry: normalizeFormText(b.contactPhoneCountry),
    contactPhoneNumber: normalizeFormText(b.contactPhoneNumber),
    dietaryYesNo: b.dietaryYesNo,
    dietary: b.dietaryYesNo === "yes" ? b.dietary : undefined,
    dietaryOtherDetails: normalizeFormText(b.dietaryOtherDetails),
    cpdApply: b.cpdApply,
    consent: b.consent,
  });

  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.json({ ok: true, reference });
}
