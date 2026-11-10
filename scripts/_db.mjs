// Shared helpers for the database scripts (plain Node, no build step).
import pg from "pg";

export function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
    process.exit(1);
  }
  return url;
}

export function databaseName(url = databaseUrl()) {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
}

/** Same server and credentials, but the built-in "postgres" maintenance database. */
export function maintenanceUrl(url = databaseUrl()) {
  const u = new URL(url);
  u.pathname = "/postgres";
  return u.toString();
}

export async function connect(url = databaseUrl()) {
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
  } catch (err) {
    console.error(explain(err));
    process.exit(1);
  }
  return client;
}

export function explain(err) {
  const where = (() => {
    try {
      const u = new URL(databaseUrl());
      return `${u.hostname}:${u.port || 5432}`;
    } catch {
      return "the server";
    }
  })();
  if (err?.code === "ECONNREFUSED")
    return `Cannot reach PostgreSQL at ${where}. Is the PostgreSQL service running?`;
  if (err?.code === "28P01")
    return "PostgreSQL rejected the user name / password in DATABASE_URL.";
  if (err?.code === "3D000")
    return `Database "${databaseName()}" does not exist yet. Run: npm run db:setup`;
  return `Database error: ${err?.message ?? err}`;
}
