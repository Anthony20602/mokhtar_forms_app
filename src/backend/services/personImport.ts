import "server-only";
import ExcelJS from "exceljs";
import type { PoolClient } from "pg";
import { AppError } from "@/backend/api/http";
import { query, transaction } from "@/backend/database/db";
import type {
  ImportField,
  ImportIssue,
  ImportPreview,
  ImportRowResult,
  ImportSummary,
  ImportValues,
} from "@/shared/types";
import {
  IMPORT_FIELDS,
  MAX_IMPORT_ROWS,
  displayName,
  fieldForHeader,
  fieldLabel,
  personKey,
  validateRow,
  type RawValues,
} from "./personImportRules";

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
const HEADER_SCAN_ROWS = 10;
const MAX_SHEET_ROWS = 100_000;

type Run = (sql: string, params: unknown[]) => Promise<Record<string, unknown>[]>;

interface SourceRow {
  rowNumber: number;
  raw: RawValues;
}

// ── Reading the Excel file ────────────────────────────────────────────────────

function pad(n: number) {
  return String(n);
}

/** Text of an Excel cell as the user sees it (numbers without ".0", dates as d/m/yyyy). */
function cellText(value: ExcelJS.CellValue | undefined): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) {
    return `${pad(value.getUTCDate())}/${pad(value.getUTCMonth() + 1)}/${value.getUTCFullYear()}`;
  }
  const v = value as unknown as Record<string, unknown>;
  if (Array.isArray(v.richText)) return (v.richText as { text: string }[]).map((t) => t.text).join("");
  if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
  if (typeof v.text === "string") return v.text;
  if (typeof v.error === "string") return "";
  return "";
}

interface ParsedSheet {
  sheetName: string;
  ignoredColumns: string[];
  rows: SourceRow[];
}

async function readWorkbook(buffer: Buffer): Promise<ParsedSheet> {
  // .xlsx files are zip archives; this also rejects renamed .xls/.csv/.pdf files early.
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new AppError(400, "الملف ليس بصيغة Excel الحديثة (.xlsx). افتحه في Excel ثم احفظه باسم «Excel Workbook (.xlsx)».");
  }
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    throw new AppError(400, "تعذّر قراءة الملف. قد يكون تالفاً أو محمياً بكلمة مرور.");
  }

  const sheet = workbook.worksheets.find((s) => s.state === "visible" && s.actualRowCount > 0);
  if (!sheet) throw new AppError(400, "الملف لا يحتوي على أي بيانات.");
  if (sheet.rowCount > MAX_SHEET_ROWS) throw new AppError(400, "الملف كبير جداً. قسّمه إلى ملفات أصغر.");

  // The header row is the first of the top rows that names at least two known columns.
  const columns = new Map<number, ImportField>();
  const ignored: string[] = [];
  let headerRow = 0;
  const found: string[] = [];
  for (let r = 1; r <= Math.min(HEADER_SCAN_ROWS, sheet.rowCount); r++) {
    const row = sheet.getRow(r);
    const mapped = new Map<number, ImportField>();
    const unknown: string[] = [];
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const text = cellText(cell.value).trim();
      if (!text) return;
      if (found.length < 12) found.push(text);
      const field = fieldForHeader(text);
      if (field) mapped.set(col, field);
      else unknown.push(text);
    });
    if (mapped.size >= 2) {
      mapped.forEach((f, c) => columns.set(c, f));
      ignored.push(...unknown);
      headerRow = r;
      break;
    }
  }
  if (!headerRow) {
    throw new AppError(
      400,
      `لم يتم العثور على صف العناوين. يجب أن يحتوي الصف الأول على عناوين مثل: ${IMPORT_FIELDS.slice(0, 5).map((f) => f.label).join("، ")}. حمّل القالب الجاهز لتجنب الخطأ.`,
    );
  }

  const seen = new Map<ImportField, number>();
  for (const [col, field] of columns) {
    if (seen.has(field)) throw new AppError(400, `العمود «${fieldLabel(field)}» مكرر في الملف. اترك عموداً واحداً فقط.`);
    seen.set(field, col);
  }
  const missing = IMPORT_FIELDS.filter((f) => f.required && !seen.has(f.key)).map((f) => f.label);
  if (missing.length) {
    throw new AppError(400, `الأعمدة المطلوبة غير موجودة في الملف: ${missing.join("، ")}. حمّل القالب الجاهز لتجنب الخطأ.`);
  }

  const rows: SourceRow[] = [];
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const raw: RawValues = {};
    let any = false;
    for (const [col, field] of columns) {
      const text = cellText(row.getCell(col).value);
      if (text.trim()) any = true;
      raw[field] = text;
    }
    if (!any) continue; // empty line
    if (rows.length >= MAX_IMPORT_ROWS) {
      throw new AppError(400, `الملف يحتوي على أكثر من ${MAX_IMPORT_ROWS} صف. قسّمه إلى ملفات أصغر.`);
    }
    rows.push({ rowNumber: r, raw });
  }
  if (rows.length === 0) throw new AppError(400, "لا توجد أي صفوف بيانات تحت صف العناوين.");

  return { sheetName: sheet.name, ignoredColumns: [...new Set(ignored)], rows };
}

// ── Checking rows ─────────────────────────────────────────────────────────────

/** Validates every row, then marks the ones that already exist in the database or repeat earlier rows. */
async function analyse(rows: SourceRow[], run: Run): Promise<ImportRowResult[]> {
  const results: ImportRowResult[] = rows.map(({ rowNumber, raw }) => {
    const { values, errors, warnings } = validateRow(raw);
    return { rowNumber, values, errors, warnings, status: errors.length ? "invalid" : "valid" };
  });

  const candidates = results.filter((r) => r.status === "valid");
  const nameKeys = [...new Set(candidates.map((r) => personKey(r.values).names))];
  const existing = new Map<string, number>();
  if (nameKeys.length) {
    const found = await run(
      `SELECT id, search_text, birth_date FROM persons WHERE search_text = ANY($1::text[])`,
      [nameKeys],
    );
    for (const row of found) existing.set(`${row.search_text}|${row.birth_date}`, Number(row.id));
  }

  const firstSeen = new Map<string, number>();
  for (const r of candidates) {
    const { full } = personKey(r.values);
    const id = existing.get(full);
    if (id != null) {
      r.status = "duplicate";
      r.duplicateOf = `موجود مسبقاً في السجل (الرقم ${id} في البرنامج)`;
    } else if (firstSeen.has(full)) {
      r.status = "duplicate";
      r.duplicateOf = `مكرر: نفس الشخص في الصف ${firstSeen.get(full)} من الملف`;
    } else {
      firstSeen.set(full, r.rowNumber);
    }
  }
  return results;
}

function toSourceRows(rows: { rowNumber: number; values: Record<string, string> }[]): SourceRow[] {
  return rows.map(({ rowNumber, values }) => ({ rowNumber, raw: values as RawValues }));
}

/** Reads and checks the file; nothing is written to the database. */
export async function previewImport(buffer: Buffer, fileName: string): Promise<ImportPreview> {
  const parsed = await readWorkbook(buffer);
  const rows = await analyse(parsed.rows, (sql, params) => query(sql, params));
  const count = (status: ImportRowResult["status"]) => rows.filter((r) => r.status === status).length;
  return {
    fileName,
    sheetName: parsed.sheetName,
    ignoredColumns: parsed.ignoredColumns,
    totals: {
      rows: rows.length,
      valid: count("valid"),
      duplicate: count("duplicate"),
      invalid: count("invalid"),
      warnings: rows.filter((r) => r.status === "valid" && r.warnings.length > 0).length,
    },
    rows,
  };
}

// ── Importing ─────────────────────────────────────────────────────────────────

const COLUMNS = [
  "record_no",
  "family_name",
  "first_name",
  "father_name",
  "mother_name",
  "birth_date",
  "gender",
  "personal_religion",
  "record_religion",
  "notes",
] as const;

async function insertRows(client: PoolClient, rows: ImportValues[]) {
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const params: unknown[] = [];
    const tuples = chunk.map((v, n) => {
      params.push(
        v.recordNo,
        v.familyName,
        v.firstName,
        v.fatherName,
        v.motherName,
        v.birthDate,
        v.gender,
        v.personalReligion,
        v.recordReligion,
        v.notes,
      );
      const base = n * COLUMNS.length;
      return `(${COLUMNS.map((_, k) => `$${base + k + 1}`).join(",")})`;
    });
    await client.query(`INSERT INTO persons (${COLUMNS.join(", ")}) VALUES ${tuples.join(",")}`, params);
  }
}

/**
 * Checks every row again (the data comes from the browser and the database may have
 * changed since the preview), then adds all valid, non-duplicate people in one
 * transaction: either all of them are added or, on a database error, none.
 */
export async function commitImport(
  rows: { rowNumber: number; values: Record<string, string> }[],
): Promise<ImportSummary> {
  return transaction(async (client) => {
    // One import at a time, so two people importing the same file cannot both add it.
    await client.query("SELECT pg_advisory_xact_lock(742002)");
    const analysed = await analyse(toSourceRows(rows), async (sql, params) => (await client.query(sql, params)).rows);

    const toInsert = analysed.filter((r) => r.status === "valid");
    await insertRows(client, toInsert.map((r) => r.values));

    const issue = (r: ImportRowResult, reasons: string[]): ImportIssue => ({
      rowNumber: r.rowNumber,
      name: displayName(r.values),
      reasons,
    });
    return {
      total: analysed.length,
      imported: toInsert.length,
      skipped: analysed.filter((r) => r.status === "duplicate").map((r) => issue(r, [r.duplicateOf ?? "مكرر"])),
      failed: analysed.filter((r) => r.status === "invalid").map((r) => issue(r, r.errors)),
    };
  });
}

// ── Template ──────────────────────────────────────────────────────────────────

/** An empty workbook with the right column titles, plus an instructions sheet. */
export async function buildTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الأهالي", {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
  });
  sheet.columns = IMPORT_FIELDS.map((f) => ({
    header: f.required ? `${f.label} *` : f.label,
    key: f.key,
    width: f.key === "notes" ? 36 : 22,
    // Text format, so Excel does not turn 5/6/1990 or 17 into a date or number.
    style: { numFmt: "@" } as Partial<ExcelJS.Style>,
  }));
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { horizontal: "center", vertical: "middle" };
  header.height = 24;
  header.eachCell((cell, col) => {
    const required = IMPORT_FIELDS[col - 1]?.required;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: required ? "FF17413A" : "FF4B7F73" } };
  });
  const genderCol = IMPORT_FIELDS.findIndex((f) => f.key === "gender") + 1;
  for (let r = 2; r <= 1001; r++) {
    sheet.getCell(r, genderCol).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"ذكر,أنثى"'],
      showErrorMessage: true,
      errorTitle: "الجنس",
      error: "اختر ذكر أو أنثى",
    };
  }

  const help = workbook.addWorksheet("تعليمات", { views: [{ rightToLeft: true }] });
  help.columns = [{ width: 110 }];
  [
    "طريقة تعبئة الملف",
    "1) اكتب بيانات كل شخص في صف واحد تحت العناوين في ورقة «الأهالي». لا تغيّر العناوين.",
    "2) العمودان المعلّمان بنجمة (*) مطلوبان: الاسم والشهرة. باقي الأعمدة اختيارية ويمكن حذفها.",
    "3) تاريخ الولادة: يوم/شهر/سنة مثل 26/5/1994، أو السنة فقط مثل 1970.",
    "4) الجنس: ذكر أو أنثى.",
    "5) رقم السجل: يُكتب كما هو في السجل، ويمكن أن يحتوي نصاً مثل «17 مكرر».",
    "6) لا يزيد الملف عن 5000 صف ولا عن 5 ميغابايت، والصيغة المقبولة .xlsx فقط.",
    "7) الشخص الموجود مسبقاً (نفس الأسماء ونفس تاريخ الولادة) لا يُضاف مرة ثانية.",
    "8) قبل الإضافة يعرض البرنامج معاينة بكل الأخطاء، ولا يُضاف شيء قبل أن تضغط «تأكيد الاستيراد».",
  ].forEach((line, i) => {
    const row = help.addRow([line]);
    row.alignment = { wrapText: true, vertical: "top" };
    if (i === 0) row.font = { bold: true, size: 14 };
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
