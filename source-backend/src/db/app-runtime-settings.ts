import { getSql } from "@db/postgres";

export const RUNTIME_SETTING_KEYS = [
  "stripe_live_mode",
  "email_provider",
  "email_primary_resend",
  "paymentasia_use_sandbox",
] as const;

export type RuntimeSettingKey = (typeof RUNTIME_SETTING_KEYS)[number];

export async function listRuntimeSettings(): Promise<Record<string, string>> {
  const sql = getSql();
  const rows = await sql`
    SELECT key, value
    FROM app_runtime_settings
    WHERE key = ANY(${[...RUNTIME_SETTING_KEYS]})
  `;
  const out: Record<string, string> = {};
  for (const r of rows as unknown as { key: string; value: string }[]) {
    out[r.key] = r.value;
  }
  return out;
}

export async function upsertRuntimeSetting(
  key: RuntimeSettingKey,
  value: string,
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO app_runtime_settings (key, value, updated_at)
    VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = now()
  `;
}

export async function deleteRuntimeSetting(key: RuntimeSettingKey): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM app_runtime_settings WHERE key = ${key}`;
}
