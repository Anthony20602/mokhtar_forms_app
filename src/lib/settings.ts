import "server-only";
import { query, queryOne } from "./db";
import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  mukhtarName: "",
  town: "صغبين",
  qadaa: "البقاع الغربي",
  muhafaza: "البقاع",
  phone: "",
  defaultPrinter: "",
  printOffsetX: 0,
  printOffsetY: 0,
  valueFontSize: 11,
};

export async function getSettings(): Promise<Settings> {
  const row = await queryOne<{ value: Partial<Settings> }>(
    `SELECT value FROM settings WHERE key = 'app'`,
  );
  return { ...DEFAULT_SETTINGS, ...(row?.value ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  await query(
    `INSERT INTO settings (key, value) VALUES ('app', $1::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(settings)],
  );
  return settings;
}
