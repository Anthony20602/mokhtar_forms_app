import { normalizeAr, toLatinDigits } from "@/shared/arabic";
import type { ImportField, ImportValues } from "@/shared/types";

// Rules for one imported row. Pure functions (no database, no Excel), so the same
// checks run for the preview and again when the import is confirmed.

export const MAX_IMPORT_ROWS = 5000;
export const MIN_BIRTH_YEAR = 1850;

export interface ImportFieldDef {
  key: ImportField;
  /** Column title used in the template and in messages. */
  label: string;
  required?: boolean;
  /** Longest accepted text (same limits as the person form). */
  max: number;
  /** Other column titles that are accepted for this field. */
  aliases: string[];
}

export const IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "firstName", label: "الاسم", required: true, max: 120, aliases: ["الاسم الأول", "الاسم الشخصي", "first name", "first_name", "firstname", "name"] },
  { key: "familyName", label: "الشهرة", required: true, max: 120, aliases: ["الاسم العائلي", "العائلة", "family name", "family_name", "last name", "last_name", "surname"] },
  { key: "fatherName", label: "اسم الأب", max: 120, aliases: ["الأب", "father name", "father_name", "father"] },
  { key: "motherName", label: "اسم الأم وشهرتها", max: 160, aliases: ["اسم الأم", "الأم", "mother name", "mother_name", "mother"] },
  { key: "recordNo", label: "رقم السجل", max: 40, aliases: ["السجل", "رقم القيد", "record", "record no", "record_no", "record_id"] },
  { key: "birthDate", label: "تاريخ الولادة", max: 40, aliases: ["الولادة", "تاريخ الميلاد", "birth date", "birth_date", "birthdate", "dob"] },
  { key: "gender", label: "الجنس", max: 20, aliases: ["gender", "sex"] },
  { key: "personalReligion", label: "المذهب الشخصي", max: 80, aliases: ["المذهب", "الدين الشخصي", "personal religion", "personal_religion", "religion"] },
  { key: "recordReligion", label: "مذهب السجل", max: 80, aliases: ["الدين في السجل", "record religion", "record_religion"] },
  { key: "notes", label: "ملاحظات", max: 2000, aliases: ["notes", "note", "ملاحظة"] },
];

/** Header text reduced to a comparison key: no spaces/punctuation, Arabic spelling variants unified. */
export function normalizeHeader(text: string): string {
  return normalizeAr(String(text ?? "")).replace(/[\s_\-./:()*]+/g, "");
}

const HEADER_TO_FIELD = new Map<string, ImportField>();
for (const field of IMPORT_FIELDS) {
  for (const name of [field.label, ...field.aliases]) HEADER_TO_FIELD.set(normalizeHeader(name), field.key);
}

export function fieldForHeader(header: string): ImportField | undefined {
  return HEADER_TO_FIELD.get(normalizeHeader(header));
}

export const fieldLabel = (key: ImportField) => IMPORT_FIELDS.find((f) => f.key === key)!.label;

/** Trim, collapse runs of spaces, drop invisible direction marks that Excel/Word paste in. */
export function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/[​-‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const MALE = new Set(["ذكر", "ذكور", "ذ", "رجل", "m", "male"]);
const FEMALE = new Set(["انثي", "اناث", "انثى", "ا", "امراه", "ف", "f", "female"]);

export function normalizeGender(input: string): string | undefined {
  const key = normalizeAr(input);
  if (MALE.has(key)) return "ذكر";
  if (FEMALE.has(key)) return "أنثى";
  return undefined;
}

/** "26/5/1994" or "1970" (the registry's two formats). Returns an error message for anything else. */
export function normalizeBirthDate(input: string, now = new Date()): { value: string } | { error: string } {
  const text = toLatinDigits(input).trim();
  if (!text) return { value: "" };
  const thisYear = now.getFullYear();
  const format = `تاريخ الولادة "${input}" غير صالح: اكتب يوم/شهر/سنة (مثل 26/5/1994) أو السنة فقط`;
  const parts = text.split(/[\/\-.\s]+/).filter(Boolean);
  if (parts.length === 0 || parts.some((p) => !/^\d+$/.test(p))) return { error: format };

  const checkYear = (y: number) =>
    y < MIN_BIRTH_YEAR || y > thisYear ? `سنة الولادة ${y} خارج المدى المعقول (${MIN_BIRTH_YEAR}–${thisYear})` : null;

  if (parts.length === 1) {
    if (!/^\d{4}$/.test(parts[0])) return { error: format };
    const problem = checkYear(Number(parts[0]));
    return problem ? { error: problem } : { value: parts[0] };
  }
  if (parts.length !== 3) return { error: format };

  let [d, m, y] = parts;
  if (d.length === 4) [y, m, d] = [d, m, y]; // year first: 1994/5/26
  if (y.length !== 4 || d.length > 2 || m.length > 2) return { error: format };
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  const yearProblem = checkYear(year);
  if (yearProblem) return { error: yearProblem };
  const date = new Date(year, month - 1, day);
  if (month < 1 || month > 12 || day < 1 || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { error: `تاريخ الولادة ${day}/${month}/${year} غير موجود في التقويم` };
  }
  if (date.getTime() > now.getTime()) return { error: `تاريخ الولادة ${day}/${month}/${year} في المستقبل` };
  return { value: `${day}/${month}/${year}` };
}

export type RawValues = Partial<Record<ImportField, unknown>>;

export interface RowValidation {
  values: ImportValues;
  errors: string[];
  warnings: string[];
}

export function validateRow(raw: RawValues): RowValidation {
  const values = {} as ImportValues;
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const field of IMPORT_FIELDS) values[field.key] = cleanText(raw[field.key]);

  for (const field of IMPORT_FIELDS) {
    const value = values[field.key];
    if (field.required && !value) errors.push(`${field.label} مطلوب`);
    else if (value.length > field.max) errors.push(`${field.label} أطول من ${field.max} حرفاً`);
  }

  if (values.gender) {
    const gender = normalizeGender(values.gender);
    if (gender) values.gender = gender;
    else errors.push(`الجنس "${values.gender}" غير معروف (المسموح: ذكر أو أنثى)`);
  }

  if (values.birthDate) {
    const result = normalizeBirthDate(values.birthDate);
    if ("error" in result) errors.push(result.error);
    else values.birthDate = result.value;
  }

  if (values.recordNo && !/^[\p{L}\p{N} /\-.]+$/u.test(values.recordNo)) {
    errors.push(`رقم السجل "${values.recordNo}" يحتوي على رموز غير مسموحة`);
  }

  // Not blocking, but worth a look.
  if (/\d/.test(values.firstName) || /\d/.test(values.familyName)) warnings.push("الاسم أو الشهرة يحتوي على أرقام");
  if (!values.fatherName) warnings.push("اسم الأب فارغ");
  if (!values.motherName) warnings.push("اسم الأم فارغ");
  if (!values.recordNo) warnings.push("رقم السجل فارغ");
  if (!values.birthDate && !errors.some((e) => e.startsWith("تاريخ الولادة"))) warnings.push("تاريخ الولادة فارغ");
  if (!values.gender) warnings.push("الجنس فارغ");

  return { values, errors, warnings };
}

/** Two rows are the same person when names (any Arabic spelling) and birth date match. */
export function personKey(values: ImportValues): { names: string; full: string } {
  // Same text the database stores in persons.search_text.
  const names = normalizeAr([values.firstName, values.fatherName, values.familyName, values.motherName].join(" "));
  return { names, full: `${names}|${values.birthDate}` };
}

export function displayName(values: Pick<ImportValues, "firstName" | "fatherName" | "familyName">): string {
  return [values.firstName, values.fatherName, values.familyName].filter(Boolean).join(" ");
}
