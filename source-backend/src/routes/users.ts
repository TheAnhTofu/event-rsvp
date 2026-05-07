import { Router } from "express";
import { z } from "zod";
import {
  createUser,
  getUserById,
  listUsers,
  updateUserStatus,
} from "../services/usersStore.js";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  email: z.string().trim().optional(),
  q: z.string().trim().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

const createSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120),
  permission: z.string().trim().min(1).max(80).optional(),
});

const statusBodySchema = z.object({
  status: z.enum(["active", "archived"]),
});

export const usersRouter = Router();

usersRouter.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", detail: parsed.error.flatten() });
    return;
  }

  const data = await listUsers(parsed.data);
  res.json(data);
});

usersRouter.get("/:id", async (req, res) => {
  const user = await getUserById(String(req.params.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

usersRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", detail: parsed.error.flatten() });
    return;
  }

  try {
    const created = await createUser(parsed.data);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof Error && error.name === "CreateNotSupportedError") {
      res.status(501).json({ error: error.message });
      return;
    }
    if (error instanceof Error && error.name === "DuplicateEmailError") {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

usersRouter.patch("/:id/status", async (req, res) => {
  const id = String(req.params.id);
  const parsed = statusBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", detail: parsed.error.flatten() });
    return;
  }

  const ok = await updateUserStatus(id, parsed.data.status);
  if (!ok) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(204).end();
});
