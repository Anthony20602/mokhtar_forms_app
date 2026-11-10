import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

// One pool per server process. Stored on globalThis so dev hot-reloads reuse it
// instead of leaking connections.
const globalForDb = globalThis as unknown as { __mokhtarPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.__mokhtarPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw Object.assign(new Error("DATABASE_URL is not set"), { code: "NO_DATABASE_URL" });
    }
    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    // Idle clients can error when the database restarts; don't crash the server.
    pool.on("error", (err) => console.error("[db] idle client error:", err.message));
    globalForDb.__mokhtarPool = pool;
  }
  return globalForDb.__mokhtarPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** ISO-8601 UTC text for a timestamptz column, so rows are plain JSON. */
export const isoTs = (col: string) =>
  `to_char(${col} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

/** Turns a low-level database failure into a message the office can act on. */
export function describeDbError(err: unknown): string | null {
  const e = err as { code?: string; errors?: { code?: string }[] };
  const code = e?.code ?? e?.errors?.[0]?.code;
  switch (code) {
    case "NO_DATABASE_URL":
      return "لم يتم ضبط الاتصال بقاعدة البيانات (DATABASE_URL في الملف .env.local).";
    case "ECONNREFUSED":
    case "ETIMEDOUT":
    case "ENOTFOUND":
      return "تعذّر الاتصال بقاعدة البيانات PostgreSQL. تأكّد أن الخدمة تعمل.";
    case "28P01":
    case "28000":
      return "اسم المستخدم أو كلمة مرور PostgreSQL غير صحيحة (DATABASE_URL).";
    case "3D000":
      return "قاعدة البيانات غير موجودة بعد. شغّل الأمر: npm run db:setup";
    case "42P01":
      return "جداول قاعدة البيانات غير موجودة. شغّل الأمر: npm run db:setup";
    default:
      return null;
  }
}
