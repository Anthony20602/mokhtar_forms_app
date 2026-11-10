// Creates the database if it is missing, then applies pending SQL migrations.
//   npm run db:setup
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { connect, databaseName, databaseUrl, explain, maintenanceUrl } from "./_db.mjs";

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "db",
  "migrations",
);

async function ensureDatabase() {
  const name = databaseName();
  const probe = new pg.Client({ connectionString: databaseUrl() });
  try {
    await probe.connect();
    await probe.end();
    return;
  } catch (err) {
    if (err?.code !== "3D000") {
      console.error(explain(err));
      process.exit(1);
    }
  }
  const admin = await connect(maintenanceUrl());
  await admin.query(`CREATE DATABASE "${name.replaceAll('"', '""')}" ENCODING 'UTF8'`);
  await admin.end();
  console.log(`Created database "${name}".`);
}

async function migrate() {
  const db = await connect();
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const done = new Set(
    (await db.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name),
  );
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    try {
      await db.query("BEGIN");
      await db.query(sql);
      await db.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await db.query("COMMIT");
    } catch (err) {
      await db.query("ROLLBACK");
      console.error(`Migration ${file} failed: ${err.message}`);
      await db.end();
      process.exit(1);
    }
    console.log(`Applied ${file}`);
    applied++;
  }
  const { rows } = await db.query("SELECT count(*)::int AS n FROM persons");
  await db.end();
  console.log(
    applied ? `Done: ${applied} migration(s) applied.` : "Database is already up to date.",
  );
  console.log(`persons table holds ${rows[0].n} record(s).`);
  if (rows[0].n === 0)
    console.log('Next step: npm run db:import -- "C:\\path\\to\\Saghbine.db"');
}

await ensureDatabase();
await migrate();
