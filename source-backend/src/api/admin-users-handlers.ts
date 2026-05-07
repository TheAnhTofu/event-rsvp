import type { Request, Response } from "express";
import { z } from "zod";
import {
  getAdminUserById,
  hashAdminPassword,
  insertAdminUser,
  listAdminUsers,
  normalizeAdminEmail,
  updateAdminUser,
} from "@db/admin-users";
import { requireDatabaseUrl } from "@db/postgres";
import { requireAdminExpress } from "../express-helpers.js";

const roleSchema = z.enum(["admin", "viewer"]);

const postBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
  role: roleSchema,
  displayName: z.string().max(200).optional().default(""),
  phoneCountry: z.string().max(16).optional().default("+852"),
  phoneNumber: z.string().max(40).optional().default(""),
});

const patchBodySchema = z.object({
  email: z.string().email().max(320).optional(),
  password: z.string().min(8).max(200).optional(),
  role: roleSchema.optional(),
  displayName: z.string().max(200).optional(),
  phoneCountry: z.string().max(16).optional(),
  phoneNumber: z.string().max(40).optional(),
});

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

/** Current session role for admin UI (list vs mutations). */
export async function getAdminMe(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;
  res.json({
    role: auth.role,
    email: auth.email,
    userId: auth.userId,
  });
}

export async function getAdminUsers(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const limitRaw = req.query.limit;
  const offsetRaw = req.query.offset;
  const qRaw = req.query.q;
  const limit =
    typeof limitRaw === "string" ? Number.parseInt(limitRaw, 10) : 50;
  const offset =
    typeof offsetRaw === "string" ? Number.parseInt(offsetRaw, 10) : 0;
  const q = typeof qRaw === "string" && qRaw.trim() ? qRaw.trim() : undefined;

  if (!Number.isFinite(limit) || !Number.isFinite(offset)) {
    res.status(400).json({ error: "Invalid pagination" });
    return;
  }

  try {
    const result = await listAdminUsers({
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
      q,
    });
    res.json({
      users: result.rows,
      total: result.total,
      limit: Math.min(Math.max(limit, 1), 200),
      offset: Math.max(offset, 0),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list users" });
  }
}

export async function getAdminUser(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const id = req.params.id;
  if (!id || !z.string().uuid().safeParse(id).success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const user = await getAdminUserById(id);
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load user" });
  }
}

export async function postAdminUsers(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;
  if (auth.role === "viewer") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const parsed = postBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", detail: parsed.error.flatten() });
    return;
  }

  const b = parsed.data;
  try {
    const passwordHash = await hashAdminPassword(b.password);
    const user = await insertAdminUser({
      email: b.email,
      passwordHash,
      role: b.role,
      displayName: b.displayName ?? "",
      phoneCountry: b.phoneCountry ?? "+852",
      phoneNumber: b.phoneNumber ?? "",
    });
    res.status(201).json({ user });
  } catch (e) {
    if (isUniqueViolation(e)) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Failed to create user" });
  }
}

export async function patchAdminUser(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;
  if (auth.role === "viewer") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const id = req.params.id;
  if (!id || !z.string().uuid().safeParse(id).success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = patchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", detail: parsed.error.flatten() });
    return;
  }

  const b = parsed.data;
  const hasField =
    b.email !== undefined ||
    b.password !== undefined ||
    b.role !== undefined ||
    b.displayName !== undefined ||
    b.phoneCountry !== undefined ||
    b.phoneNumber !== undefined;

  if (!hasField) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  try {
    let passwordHash: string | undefined;
    if (b.password !== undefined) {
      passwordHash = await hashAdminPassword(b.password);
    }

    const user = await updateAdminUser(id, {
      email: b.email !== undefined ? normalizeAdminEmail(b.email) : undefined,
      displayName: b.displayName,
      phoneCountry: b.phoneCountry,
      phoneNumber: b.phoneNumber,
      role: b.role,
      passwordHash,
    });

    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ user });
  } catch (e) {
    if (isUniqueViolation(e)) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Failed to update user" });
  }
}
