import { NextResponse } from "next/server";
import { describeDbError, queryOne } from "@/lib/db";

// Liveness + database check, used by the Settings page and by start-up scripts.
export async function GET() {
  try {
    const row = await queryOne<{ persons: number; version: string }>(
      `SELECT (SELECT count(*)::int FROM persons) AS persons, current_setting('server_version') AS version`,
    );
    return NextResponse.json({ ok: true, database: "up", ...row });
  } catch (err) {
    return NextResponse.json(
      { ok: false, database: "down", error: describeDbError(err) ?? "خطأ في قاعدة البيانات." },
      { status: 503 },
    );
  }
}
