import "server-only";
import { normalizeAr, toLatinDigits } from "@/shared/arabic";
import { isoTs, query, queryOne } from "@/backend/database/db";
import type { Person, PersonInput, Stats } from "@/shared/types";

const COLUMNS = `
  id,
  record_no AS "recordNo",
  family_name AS "familyName",
  first_name AS "firstName",
  father_name AS "fatherName",
  mother_name AS "motherName",
  birth_date AS "birthDate",
  gender,
  personal_religion AS "personalReligion",
  record_religion AS "recordReligion",
  notes,
  ${isoTs("created_at")} AS "createdAt",
  ${isoTs("updated_at")} AS "updatedAt"`;

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Every word must match. A number matches the person id or the registry number;
 * anything else matches any of the four names, ignoring Arabic spelling variants.
 * An empty query lists everyone.
 */
export async function searchPersons(opts: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Person[]; total: number }> {
  const limit = opts.limit ?? 30;
  const offset = opts.offset ?? 0;
  const tokens = normalizeAr(toLatinDigits(opts.q ?? ""))
    .split(" ")
    .filter(Boolean)
    .slice(0, 8);

  const where: string[] = [];
  const rank: string[] = [];
  const params: unknown[] = [];
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      params.push(token);
      const p = `$${params.length}`;
      where.push(`(id::text = ${p} OR record_no = ${p} OR record_no LIKE ${p} || ' %')`);
    } else {
      params.push(`%${escapeLike(token)}%`);
      const p = `$${params.length}`;
      where.push(`search_text LIKE ${p}`);
      // A hit on the person's own name outranks a hit on a parent's name.
      rank.push(`CASE WHEN normalize_ar(first_name) LIKE ${p} THEN 4
                     WHEN normalize_ar(family_name) LIKE ${p} THEN 3
                     WHEN normalize_ar(father_name) LIKE ${p} THEN 2 ELSE 1 END`);
    }
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [items, count] = await Promise.all([
    query<Person>(
      `SELECT ${COLUMNS} FROM persons ${whereSql}
       ORDER BY ${rank.length ? `(${rank.join(" + ")}) DESC,` : ""} family_name, first_name, father_name, id
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM persons ${whereSql}`, params),
  ]);
  return { items, total: count?.n ?? 0 };
}

export function getPerson(id: number): Promise<Person | null> {
  return queryOne<Person>(`SELECT ${COLUMNS} FROM persons WHERE id = $1`, [id]);
}

/** Everyone else on the same registry (سجل) number, i.e. the same family record. */
export function getFamily(recordNo: string, excludeId: number): Promise<Person[]> {
  if (!recordNo) return Promise.resolve([]);
  return query<Person>(
    `SELECT ${COLUMNS} FROM persons
     WHERE record_no = $1 AND id <> $2
     ORDER BY substring(birth_date from '\\d{4}') NULLS LAST, id
     LIMIT 200`,
    [recordNo, excludeId],
  );
}

const values = (p: PersonInput) => [
  p.recordNo,
  p.familyName,
  p.firstName,
  p.fatherName,
  p.motherName,
  p.birthDate,
  p.gender,
  p.personalReligion,
  p.recordReligion,
  p.notes,
];

export async function createPerson(input: PersonInput): Promise<Person> {
  const row = await queryOne<Person>(
    `INSERT INTO persons (record_no, family_name, first_name, father_name, mother_name,
       birth_date, gender, personal_religion, record_religion, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING ${COLUMNS}`,
    values(input),
  );
  return row!;
}

export function updatePerson(id: number, input: PersonInput): Promise<Person | null> {
  return queryOne<Person>(
    `UPDATE persons SET record_no=$1, family_name=$2, first_name=$3, father_name=$4,
       mother_name=$5, birth_date=$6, gender=$7, personal_religion=$8, record_religion=$9,
       notes=$10, updated_at=now()
     WHERE id=$11
     RETURNING ${COLUMNS}`,
    [...values(input), id],
  );
}

export async function deletePerson(id: number): Promise<boolean> {
  const rows = await query(`DELETE FROM persons WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/** Distinct values already in use, offered as suggestions in the person form. */
export async function getReligionOptions(): Promise<string[]> {
  const rows = await query<{ v: string }>(
    `SELECT v FROM (
       SELECT personal_religion AS v FROM persons
       UNION ALL SELECT record_religion FROM persons
     ) t WHERE v <> '' GROUP BY v ORDER BY count(*) DESC LIMIT 40`,
  );
  return rows.map((r) => r.v);
}

export async function getStats(): Promise<Stats> {
  type Bucket = { label: string; count: number };
  const [totals, docs, byReligion, byDecade, topFamilies] = await Promise.all([
    queryOne<{ total: number; males: number; females: number; families: number }>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE gender = 'ذكر')::int AS males,
              count(*) FILTER (WHERE gender = 'أنثى')::int AS females,
              count(DISTINCT record_no) FILTER (WHERE record_no <> '')::int AS families
       FROM persons`,
    ),
    queryOne<{ documents: number; thisYear: number }>(
      `SELECT count(*)::int AS documents,
              count(*) FILTER (WHERE serial_year = extract(year FROM now()))::int AS "thisYear"
       FROM documents`,
    ),
    query<Bucket>(
      `SELECT CASE WHEN personal_religion = '' THEN 'غير محدد' ELSE personal_religion END AS label,
              count(*)::int AS count
       FROM persons GROUP BY 1 ORDER BY count DESC, label LIMIT 12`,
    ),
    query<Bucket>(
      `SELECT (floor(y / 10) * 10)::int::text AS label, count(*)::int AS count
       FROM (SELECT substring(birth_date from '\\d{4}')::int AS y FROM persons) t
       WHERE y BETWEEN 1850 AND 2100
       GROUP BY 1 ORDER BY 1`,
    ),
    query<Bucket>(
      `SELECT family_name AS label, count(*)::int AS count
       FROM persons WHERE family_name <> ''
       GROUP BY 1 ORDER BY count DESC, label LIMIT 12`,
    ),
  ]);
  return {
    total: totals?.total ?? 0,
    males: totals?.males ?? 0,
    females: totals?.females ?? 0,
    families: totals?.families ?? 0,
    documents: docs?.documents ?? 0,
    documentsThisYear: docs?.thisYear ?? 0,
    byReligion,
    byDecade,
    topFamilies,
  };
}
