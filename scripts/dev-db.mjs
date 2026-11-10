// Development helper: a private PostgreSQL (no installer, no Windows service) on
// port 5433 with its data in ./.pgdata. Handy for trying the app without touching a
// real PostgreSQL install. The binaries come from the "embedded-postgres" dev package.
//   npm run db:dev            start (keeps running in the background)
//   npm run db:dev -- stop    stop
//   npm run db:dev -- status
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const port = String(process.env.DEV_PGPORT ?? 5433);
const password = process.env.DEV_PGPASSWORD ?? "mokhtar_dev";
// Relative on purpose: PostgreSQL's Windows tools mis-handle absolute paths with spaces.
const dataDir = ".pgdata";
const action = process.argv[2] ?? "start";

const platformPkg = `@embedded-postgres/${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`;
const binDir = path.join("node_modules", ...platformPkg.split("/"), "native", "bin");
if (!existsSync(binDir)) {
  console.error(`PostgreSQL binaries not found (${platformPkg}). Run: npm install`);
  process.exit(1);
}
const exe = (name) => path.join(binDir, process.platform === "win32" ? `${name}.exe` : name);
// pg_ctl (unlike running "postgres" directly) drops administrator rights on Windows,
// which PostgreSQL insists on.
const run = (name, args, quiet = false) =>
  spawnSync(exe(name), args, { stdio: quiet ? "ignore" : "inherit" });

const isRunning = () => run("pg_ctl", ["-D", dataDir, "status"], true).status === 0;

if (action === "status") {
  console.log(isRunning() ? `Running on port ${port}.` : "Not running.");
} else if (action === "stop") {
  if (!isRunning()) console.log("Development PostgreSQL is not running.");
  else {
    run("pg_ctl", ["-D", dataDir, "-m", "fast", "-w", "stop"]);
  }
} else {
  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log(`Creating a new development database cluster in ./${dataDir} ...`);
    const tmp = mkdtempSync(path.join(os.tmpdir(), "mokhtar-pg-"));
    const pwFile = path.join(tmp, "pw");
    writeFileSync(pwFile, password);
    const init = run(
      "initdb",
      ["-D", dataDir, "-U", "postgres", `--pwfile=${pwFile}`, "--auth=scram-sha-256", "--encoding=UTF8", "--locale=C"],
      true,
    );
    rmSync(tmp, { recursive: true, force: true });
    if (init.status !== 0) {
      console.error("initdb failed.");
      process.exit(1);
    }
  }
  if (isRunning()) {
    console.log(`Development PostgreSQL is already running on port ${port}.`);
  } else {
    // Output is discarded on purpose: the server outlives this script, and letting it
    // inherit our console would keep the calling terminal from returning.
    const start = run(
      "pg_ctl",
      [
        "-D", dataDir,
        "-o", `-p ${port} -c listen_addresses=127.0.0.1`,
        "-l", path.join(dataDir, "server.log"),
        "-w", "start",
      ],
      true,
    );
    if (start.status !== 0) {
      console.error(`Could not start PostgreSQL. See ${path.join(dataDir, "server.log")}`);
      process.exit(1);
    }
  }
  console.log(`\nDATABASE_URL=postgres://postgres:${password}@127.0.0.1:${port}/mokhtar`);
  console.log("Stop it with: npm run db:dev -- stop");
}
