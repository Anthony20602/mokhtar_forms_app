// Copies the villagers from the old Flutter app's SQLite file into PostgreSQL.
//   npm run db:import -- "C:\path\to\Saghbine.db"            (skips ids already imported)
//   npm run db:import -- "C:\path\to\Saghbine.db" --replace  (overwrites existing ids)
import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { connect } from "./_db.mjs";

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const file = args.find((a) => !a.startsWith("--"));

if (!file || !existsSync(file)) {
  console.error(
    file
      ? `SQLite file not found: ${file}`
      : 'Usage: npm run db:import -- "C:\\path\\to\\Saghbine.db" [--replace]',
  );
  process.exit(1);
}

const clean = (v) => (v == null ? "" : String(v).trim());
const GENDER = { الذكور: "ذكر", الإناث: "أنثى", ذكور: "ذكر", إناث: "أنثى" };
const gender = (v) => GENDER[clean(v)] ?? clean(v);
// The registry uses "--" for "not recorded".
const religion = (v) => (/^-+$/.test(clean(v)) ? "" : clean(v));

const sqlite = new DatabaseSync(file, { readOnly: true });
const rows = sqlite.prepare("SELECT * FROM persons ORDER BY id").all();
sqlite.close();
console.log(`Read ${rows.length} person(s) from ${file}`);

const db = await connect();
const COLS = 10;
const onConflict = replace
  ? `DO UPDATE SET record_no = EXCLUDED.record_no, family_name = EXCLUDED.family_name,
       first_name = EXCLUDED.first_name, father_name = EXCLUDED.father_name,
       mother_name = EXCLUDED.mother_name, birth_date = EXCLUDED.birth_date,
       gender = EXCLUDED.gender, personal_religion = EXCLUDED.personal_religion,
       record_religion = EXCLUDED.record_religion, updated_at = now()`
  : "DO NOTHING";

let written = 0;
try {
  await db.query("BEGIN");
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const params = [];
    const tuples = chunk.map((r, n) => {
      params.push(
        r.id,
        clean(r.record_id),
        clean(r.family_name),
        clean(r.first_name),
        clean(r.father_name),
        clean(r.mother_name),
        clean(r.birth_date),
        gender(r.gender),
        religion(r.personal_religion),
        religion(r.record_religion),
      );
      const base = n * COLS;
      return `(${Array.from({ length: COLS }, (_, k) => `$${base + k + 1}`).join(",")})`;
    });
    const res = await db.query(
      `INSERT INTO persons (id, record_no, family_name, first_name, father_name, mother_name,
         birth_date, gender, personal_religion, record_religion)
       VALUES ${tuples.join(",")}
       ON CONFLICT (id) ${onConflict}`,
      params,
    );
    written += res.rowCount ?? 0;
  }
  // New people added from the web app must get ids above the imported ones.
  await db.query(
    `SELECT setval(pg_get_serial_sequence('persons', 'id'),
            GREATEST((SELECT COALESCE(max(id), 0) FROM persons), 1))`,
  );
  await db.query("COMMIT");
} catch (err) {
  await db.query("ROLLBACK");
  console.error(`Import failed, nothing was changed: ${err.message}`);
  await db.end();
  process.exit(1);
}

const { rows: total } = await db.query("SELECT count(*)::int AS n FROM persons");
await db.end();
console.log(
  `${replace ? "Inserted/updated" : "Inserted"} ${written} person(s); ` +
    `${rows.length - written} skipped. persons now holds ${total[0].n} record(s).`,
);
