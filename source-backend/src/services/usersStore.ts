import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import type { UserRecord } from "../types/user.js";
import {
  getUserByIdFromRegistrations,
  listUsersFromRegistrations,
  updateUserStatusRegistrations,
} from "./usersStoreRegistrations.js";

type PersistedUsers = {
  users: UserRecord[];
};

const DEFAULT_PERMISSION = "admin";

function getFilePath(): string {
  return path.resolve(process.cwd(), config.dataFile);
}

async function ensureStorage(): Promise<string> {
  const filePath = getFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await readFile(filePath, "utf8");
  } catch {
    const initial: PersistedUsers = { users: [] };
    await writeFile(filePath, JSON.stringify(initial, null, 2), "utf8");
  }
  return filePath;
}

async function readUsers(): Promise<UserRecord[]> {
  const filePath = await ensureStorage();
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<PersistedUsers>;
  return Array.isArray(parsed.users) ? parsed.users : [];
}

async function writeUsers(users: UserRecord[]): Promise<void> {
  const filePath = await ensureStorage();
  await writeFile(filePath, JSON.stringify({ users }, null, 2), "utf8");
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function generateUserId(currentCount: number): string {
  const year = new Date().getFullYear();
  const sequence = String(currentCount + 1).padStart(5, "0");
  return `U-${year}-${sequence}`;
}

export async function listUsers(params: {
  limit: number;
  offset: number;
  email?: string;
  q?: string;
  status?: "active" | "archived";
}): Promise<{ total: number; limit: number; offset: number; items: UserRecord[] }> {
  if (config.databaseUrl) {
    return listUsersFromRegistrations(params);
  }

  const users = await readUsers();
  const q = params.q ? normalizeText(params.q) : undefined;
  const email = params.email ? normalizeText(params.email) : undefined;

  const filtered = users.filter((user) => {
    if (params.status && user.status !== params.status) return false;
    if (email && !normalizeText(user.email).includes(email)) return false;
    if (!q) return true;
    return (
      normalizeText(user.userId).includes(q) ||
      normalizeText(user.name).includes(q) ||
      normalizeText(user.email).includes(q)
    );
  });

  const total = filtered.length;
  const items = filtered.slice(params.offset, params.offset + params.limit);
  return { total, limit: params.limit, offset: params.offset, items };
}

export async function createUser(input: {
  email: string;
  name: string;
  permission?: string;
}): Promise<{ id: string }> {
  if (config.databaseUrl) {
    const err = new Error(
      "Creating users is disabled when DATABASE_URL is set (list is backed by event registrations).",
    );
    err.name = "CreateNotSupportedError";
    throw err;
  }

  const users = await readUsers();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const permission = input.permission?.trim() || DEFAULT_PERMISSION;

  const duplicate = users.some((user) => normalizeText(user.email) === email);
  if (duplicate) {
    const err = new Error("Email already exists");
    err.name = "DuplicateEmailError";
    throw err;
  }

  const record: UserRecord = {
    id: randomUUID(),
    userId: generateUserId(users.length),
    status: "active",
    permission,
    name,
    email,
    createdAt: new Date().toISOString(),
  };

  users.unshift(record);
  await writeUsers(users);
  return { id: record.id };
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (config.databaseUrl) {
    return getUserByIdFromRegistrations(id);
  }

  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function updateUserStatus(id: string, status: "active" | "archived"): Promise<boolean> {
  if (config.databaseUrl) {
    return updateUserStatusRegistrations(id, status);
  }

  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users[idx] = { ...users[idx], status };
  await writeUsers(users);
  return true;
}
