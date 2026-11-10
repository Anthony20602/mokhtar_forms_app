// Writes a full SQL backup of the database into ./backups using pg_dump.
//   npm run db:backup
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { databaseUrl } from "./_db.mjs";

function findPgDump() {
  if (process.env.PG_DUMP_PATH) return process.env.PG_DUMP_PATH;
  if (process.platform === "win32") {
    for (const root of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]]) {
      const base = root && path.join(root, "PostgreSQL");
      if (!base || !existsSync(base)) continue;
      const versions = readdirSync(base).sort((a, b) => Number(b) - Number(a));
      for (const v of versions) {
        const exe = path.join(base, v, "bin", "pg_dump.exe");
        if (existsSync(exe)) return exe;
      }
    }
  }
  return "pg_dump"; // rely on PATH
}

const url = new URL(databaseUrl());
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const dir = path.resolve("backups");
mkdirSync(dir, { recursive: true });
const out = path.join(dir, `mokhtar-${stamp}.sql`);

const res = spawnSync(
  findPgDump(),
  [
    "--host", url.hostname,
    "--port", url.port || "5432",
    "--username", decodeURIComponent(url.username),
    "--dbname", decodeURIComponent(url.pathname.slice(1)),
    "--no-owner",
    "--clean",
    "--if-exists",
    "--file", out,
  ],
  {
    stdio: "inherit",
    env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) },
  },
);

if (res.error || res.status !== 0) {
  console.error(
    res.error
      ? `Could not run pg_dump (${res.error.message}). Set PG_DUMP_PATH in .env.local.`
      : "pg_dump failed.",
  );
  process.exit(1);
}
console.log(`Backup written: ${out} (${Math.round(statSync(out).size / 1024)} KB)`);
console.log("Restore with:  psql -U postgres -d mokhtar -f <that file>");
