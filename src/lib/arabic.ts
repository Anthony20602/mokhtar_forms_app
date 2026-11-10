const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Search key for Arabic text: no diacritics/tatweel, unified letter variants.
 * Keep in sync with normalize_ar() in db/migrations/001_init.sql.
 */
export function normalizeAr(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ً-ٰٕـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export function toLatinDigits(input: string): string {
  return input.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

export function toArabicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

/** Splits registry birth dates such as "26/5/1994", "5-5-1961" or just "1970". */
export function splitBirthDate(value: string): { day: string; month: string; year: string } {
  const parts = toLatinDigits(value ?? "")
    .split(/[\/\-.\s]+/)
    .filter(Boolean);
  if (parts.length >= 3) {
    // Accept both D/M/YYYY and YYYY/M/D.
    return parts[0].length === 4
      ? { day: parts[2], month: parts[1], year: parts[0] }
      : { day: parts[0], month: parts[1], year: parts[2] };
  }
  if (parts.length === 2) return { day: "", month: parts[0], year: parts[1] };
  if (parts.length === 1) return { day: "", month: "", year: parts[0] };
  return { day: "", month: "", year: "" };
}

export function fullName(p: {
  firstName: string;
  fatherName?: string;
  familyName: string;
}): string {
  return [p.firstName, p.fatherName, p.familyName].filter(Boolean).join(" ");
}

/** Today's date as YYYY-MM-DD in the machine's local time zone. */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "2026-11-10" -> "10/11/2026" */
export function formatIsoDate(iso: string): string {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(iso ?? "");
  return m ? `${Number(m[3])}/${Number(m[2])}/${m[1]}` : (iso ?? "");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
