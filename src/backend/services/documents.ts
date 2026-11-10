import "server-only";
import { normalizeAr } from "@/shared/arabic";
import { isoTs, query, queryOne, transaction } from "@/backend/database/db";
import type { DocData, DocumentRow, DocumentSummary } from "@/shared/types";

const SUMMARY = `
  id,
  form_type AS "formType",
  person_id AS "personId",
  person_name AS "personName",
  serial_year AS "serialYear",
  serial_no AS "serialNo",
  print_count AS "printCount",
  ${isoTs("last_printed_at")} AS "lastPrintedAt",
  ${isoTs("created_at")} AS "createdAt",
  ${isoTs("updated_at")} AS "updatedAt"`;

const FULL = `${SUMMARY}, data`;

/** The name shown in document lists, taken from what was actually typed in the form. */
export function personNameFromValues(values: Record<string, string>): string {
  if (values.fullName) return values.fullName.trim();
  return [values.firstName, values.fatherName, values.lastName]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export async function listDocuments(opts: {
  personId?: number;
  formType?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: DocumentSummary[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.personId) {
    params.push(opts.personId);
    where.push(`person_id = $${params.length}`);
  }
  if (opts.formType) {
    params.push(opts.formType);
    where.push(`form_type = $${params.length}`);
  }
  for (const token of normalizeAr(opts.q ?? "").split(" ").filter(Boolean).slice(0, 6)) {
    params.push(`%${token.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    where.push(`(normalize_ar(person_name) LIKE $${params.length} OR serial_no::text = btrim($${params.length}, '%'))`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [items, count] = await Promise.all([
    query<DocumentSummary>(
      `SELECT ${SUMMARY} FROM documents ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, opts.limit ?? 30, opts.offset ?? 0],
    ),
    queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM documents ${whereSql}`, params),
  ]);
  return { items, total: count?.n ?? 0 };
}

export function getDocument(id: number): Promise<DocumentRow | null> {
  return queryOne<DocumentRow>(`SELECT ${FULL} FROM documents WHERE id = $1`, [id]);
}

/** The person's most recent document of this type, used to pre-fill a new one. */
export function latestDocumentFor(personId: number, formType: string): Promise<DocumentRow | null> {
  return queryOne<DocumentRow>(
    `SELECT ${FULL} FROM documents
     WHERE person_id = $1 AND form_type = $2
     ORDER BY created_at DESC, id DESC LIMIT 1`,
    [personId, formType],
  );
}

/**
 * Saves a new document and gives it the next serial number of the current year
 * (1, 2, 3 ... restarting every January).
 */
export function createDocument(input: {
  formType: string;
  personId: number | null;
  data: DocData;
}): Promise<DocumentRow> {
  return transaction(async (client) => {
    // Serialise numbering so two devices saving at once never get the same serial.
    await client.query("SELECT pg_advisory_xact_lock(742001)");
    const year = new Date().getFullYear();
    const next = await client.query<{ n: number }>(
      `SELECT COALESCE(max(serial_no), 0)::int + 1 AS n FROM documents WHERE serial_year = $1`,
      [year],
    );
    const serialNo = next.rows[0].n;
    const data: DocData = {
      ...input.data,
      values: { ...input.data.values },
    };
    if (!data.values.serial?.trim()) data.values.serial = String(serialNo);

    if (input.personId != null) {
      const exists = await client.query(`SELECT 1 FROM persons WHERE id = $1`, [input.personId]);
      if (exists.rowCount === 0) input.personId = null;
    }

    const res = await client.query<DocumentRow>(
      `INSERT INTO documents (form_type, person_id, person_name, serial_year, serial_no, data)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING ${FULL}`,
      [
        input.formType,
        input.personId,
        personNameFromValues(data.values),
        year,
        serialNo,
        JSON.stringify(data),
      ],
    );
    return res.rows[0];
  });
}

export function updateDocument(id: number, data: DocData): Promise<DocumentRow | null> {
  return queryOne<DocumentRow>(
    `UPDATE documents SET data = $1::jsonb, person_name = $2, updated_at = now()
     WHERE id = $3
     RETURNING ${FULL}`,
    [JSON.stringify(data), personNameFromValues(data.values), id],
  );
}

export async function deleteDocument(id: number): Promise<boolean> {
  const rows = await query(`DELETE FROM documents WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

export async function markPrinted(id: number, copies = 1): Promise<void> {
  await query(
    `UPDATE documents SET print_count = print_count + $2, last_printed_at = now() WHERE id = $1`,
    [id, copies],
  );
}
