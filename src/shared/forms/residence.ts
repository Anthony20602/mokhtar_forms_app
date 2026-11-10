import { toArabicDigits } from "../arabic";
import type { InputDef, MarkDef } from "./types";

// ── إفادة سكن — نموذج رقم (إ.س.١٠) ─────────────────────────────────────────────
// The page is A4 (210 × 297 mm). Every box below was measured on the scanned
// official form (public/templates/residence.jpg): the ruled lines give the cell,
// and the printed label inside the cell gives where the free space starts.

export const RESIDENCE_GROUPS = [
  "الترويسة",
  "معلومات عن صاحب العلاقة",
  "المستند المثبت",
  "الشخص الأجنبي",
  "عنوان السكن الحالي",
  "الاتصال",
  "قريب (عند عدم توفر هاتف)",
  "المعاملة",
] as const;

const [G_HEAD, G_PERSON, G_DOC, G_FOREIGN, G_ADDRESS, G_CONTACT, G_RELATIVE, G_PURPOSE] =
  RESIDENCE_GROUPS;

export const RESIDENCE_INPUTS: InputDef[] = [
  { key: "serial", label: "الرقم المتسلسل", group: G_HEAD, hint: "يُعطى تلقائياً عند الحفظ" },
  { key: "date", label: "التاريخ", group: G_HEAD, type: "date" },
  { key: "muhafaza", label: "المحافظة", group: G_HEAD },
  { key: "qadaa", label: "القضاء", group: G_HEAD },
  { key: "town", label: "مختار بلدة / حي", group: G_HEAD, wide: true },

  { key: "firstName", label: "الاسم", group: G_PERSON },
  { key: "lastName", label: "الشهرة", group: G_PERSON },
  { key: "fatherName", label: "اسم الأب", group: G_PERSON },
  { key: "motherName", label: "اسم الأم وشهرتها", group: G_PERSON },
  { key: "birthPlace", label: "محل الولادة", group: G_PERSON },
  { key: "birthDate", label: "تاريخ الولادة (يوم/شهر/سنة)", group: G_PERSON, ltr: true },
  { key: "gender", label: "الجنس", group: G_PERSON, options: ["ذكر", "أنثى"] },
  {
    key: "familyStatus",
    label: "الوضع العائلي",
    group: G_PERSON,
    options: ["أعزب", "عزباء", "متأهل", "متأهلة", "مطلق", "مطلقة", "أرمل", "أرملة"],
  },
  { key: "spouseName", label: "اسم الزوج", group: G_PERSON },
  { key: "spouseLastName", label: "شهرة الزوج", group: G_PERSON },
  { key: "registryPlace", label: "مكان ورقم القيد", group: G_PERSON },
  { key: "registryQadaa", label: "قضاء القيد", group: G_PERSON },
  { key: "registryMuhafaza", label: "محافظة القيد", group: G_PERSON },

  {
    key: "verifiedDoc",
    label: "بعد التثبت من (١)",
    group: G_DOC,
    options: ["بطاقة هوية", "بيان قيد إفرادي", "جواز سفر"],
  },
  { key: "docNumber", label: "رقم المستند", group: G_DOC, ltr: true },
  { key: "docIssueDate", label: "تاريخ الإصدار", group: G_DOC, ltr: true },

  { key: "foreignNationality", label: "الجنسية", group: G_FOREIGN },
  { key: "foreignDoc", label: "نوع ورقم المستند", group: G_FOREIGN },
  { key: "foreignDocIssueDate", label: "تاريخ الإصدار", group: G_FOREIGN, ltr: true },

  { key: "resMuhafaza", label: "المحافظة", group: G_ADDRESS },
  { key: "resQadaa", label: "القضاء", group: G_ADDRESS },
  { key: "city", label: "البلدة / المدينة", group: G_ADDRESS },
  { key: "neighborhood", label: "الحي", group: G_ADDRESS },
  { key: "street", label: "الشارع", group: G_ADDRESS },
  { key: "building", label: "البناية", group: G_ADDRESS },
  { key: "floor", label: "الطابق", group: G_ADDRESS },
  {
    key: "basedOn",
    label: "استناداً إلى (٢)",
    group: G_ADDRESS,
    options: ["سند ملكية", "عقد إيجار", "إيصال كهرباء", "فاتورة هاتف"],
  },

  { key: "homeTel", label: "هاتف المنزل", group: G_CONTACT, type: "tel", ltr: true },
  { key: "mobileTel", label: "هاتف خليوي", group: G_CONTACT, type: "tel", ltr: true },
  { key: "workTel", label: "هاتف العمل", group: G_CONTACT, type: "tel", ltr: true },
  { key: "fax", label: "رقم الفاكس", group: G_CONTACT, type: "tel", ltr: true },
  { key: "poBox", label: "صندوق البريد", group: G_CONTACT, ltr: true },
  { key: "email", label: "بريد إلكتروني", group: G_CONTACT, type: "email", ltr: true },

  { key: "relativeName", label: "اسم القريب", group: G_RELATIVE },
  { key: "relativeRelation", label: "صلة القرابة", group: G_RELATIVE },
  { key: "relativeTel", label: "هاتف القريب", group: G_RELATIVE, type: "tel", ltr: true },

  { key: "purpose", label: "أعطيت هذه الإفادة لأجل معاملة", group: G_PURPOSE, wide: true },
  { key: "notes", label: "ملاحظات (المساحة الفارغة أسفل الجدول)", group: G_PURPOSE, type: "textarea", wide: true, rows: 2 },
];

export const RESIDENCE_MARKS: MarkDef[] = [
  // Header, left box: serial number and date ("  /  / ٢٠٢" is pre-printed).
  { key: "serial", label: "الرقم المتسلسل", x: 22.4, y: 37.9, w: 19.8, h: 4.8, valign: "bottom", ltr: true },
  { key: "dateDay", label: "اليوم", x: 42.8, y: 47.3, w: 8.4, h: 4.8, ltr: true },
  { key: "dateMonth", label: "الشهر", x: 32.4, y: 47.3, w: 8.8, h: 4.8, ltr: true },
  { key: "dateYearDigit", label: "آخر رقم من السنة", x: 27.2, y: 47.3, w: 3.6, h: 4.8, align: "left", ltr: true },
  // Header, right box.
  { key: "muhafaza", label: "المحافظة", x: 133.4, y: 45.4, w: 31, h: 4.8, valign: "bottom" },
  { key: "qadaa", label: "القضاء", x: 133.4, y: 54.5, w: 31, h: 4.8, valign: "bottom" },
  { key: "town", label: "مختار بلدة / حي", x: 133.4, y: 63.8, w: 31, h: 4.8, valign: "bottom" },

  // معلومات عن صاحب العلاقة
  { key: "firstName", label: "الاسم", x: 115.4, y: 78.9, w: 40.6, h: 8.6 },
  { key: "lastName", label: "الشهرة", x: 64.6, y: 78.9, w: 40.2, h: 8.6 },
  { key: "fatherName", label: "اسم الأب", x: 12.8, y: 78.9, w: 39, h: 8.6 },
  { key: "motherName", label: "اسم الأم وشهرتها", x: 102.5, y: 87.9, w: 50.7, h: 9.6 },
  { key: "birthPlace", label: "محل الولادة", x: 64.6, y: 87.9, w: 27.4, h: 9.6 },
  { key: "birthDay", label: "يوم الولادة", x: 33.5, y: 93.8, w: 9.2, h: 3.8, size: 9, ltr: true },
  { key: "birthMonth", label: "شهر الولادة", x: 23.1, y: 93.8, w: 10, h: 3.8, size: 9, ltr: true },
  { key: "birthYear", label: "سنة الولادة", x: 12.2, y: 93.8, w: 10.5, h: 3.8, size: 9, ltr: true },
  { key: "gender", label: "الجنس", x: 142.6, y: 97.9, w: 12.2, h: 8.9 },
  { key: "familyStatus", label: "الوضع العائلي", x: 108.8, y: 97.9, w: 14.4, h: 8.9 },
  { key: "spouseName", label: "اسم الزوج", x: 64.6, y: 97.9, w: 29.8, h: 8.9 },
  { key: "spouseLastName", label: "شهرة الزوج", x: 12.8, y: 97.9, w: 35.6, h: 8.9 },
  { key: "registryPlace", label: "مكان ورقم القيد", x: 100.6, y: 107.2, w: 52.4, h: 7.9 },
  { key: "registryQadaa", label: "قضاء القيد", x: 64.8, y: 107.2, w: 27, h: 7.9 },
  { key: "registryMuhafaza", label: "محافظة القيد", x: 12.8, y: 107.2, w: 38.4, h: 7.9 },

  // بعد التثبت من (١)
  { key: "verifiedDoc", label: "بعد التثبت من", x: 124.4, y: 115.5, w: 31, h: 8.6 },
  { key: "docNumber", label: "رقم المستند", x: 64.8, y: 115.5, w: 53.8, h: 8.6, ltr: true },
  { key: "docIssueDate", label: "تاريخ الإصدار", x: 12.8, y: 115.5, w: 32.8, h: 8.6, ltr: true },

  // الشخص الأجنبي
  { key: "foreignNationality", label: "الجنسية", x: 124.4, y: 124.5, w: 28.6, h: 9.7 },
  { key: "foreignDoc", label: "نوع ورقم المستند", x: 64.8, y: 124.5, w: 47.2, h: 9.7 },
  { key: "foreignDocIssueDate", label: "تاريخ الإصدار (أجنبي)", x: 12.8, y: 124.5, w: 32.8, h: 9.7, ltr: true },

  // عنوان السكن الحالي
  { key: "resMuhafaza", label: "محافظة السكن", x: 89, y: 134.6, w: 62.9, h: 7.9 },
  { key: "resQadaa", label: "قضاء السكن", x: 12.8, y: 134.6, w: 65.5, h: 7.9 },
  { key: "city", label: "البلدة / المدينة", x: 89, y: 142.9, w: 56.8, h: 8.8 },
  { key: "neighborhood", label: "الحي", x: 12.8, y: 142.9, w: 67.7, h: 8.8 },
  { key: "street", label: "الشارع", x: 89, y: 152.1, w: 66, h: 8.1 },
  { key: "building", label: "البناية", x: 46.4, y: 152.1, w: 32.6, h: 8.1 },
  { key: "floor", label: "الطابق", x: 12.8, y: 152.1, w: 23.7, h: 8.1 },
  { key: "basedOn", label: "استناداً إلى", x: 12.8, y: 160.6, w: 148.2, h: 7.3 },

  // على مسؤولية صاحب العلاقة
  { key: "homeTel", label: "هاتف المنزل", x: 117.6, y: 168.3, w: 37.9, h: 9.8, ltr: true },
  { key: "mobileTel", label: "هاتف خليوي", x: 64.8, y: 168.3, w: 41.6, h: 9.8, ltr: true },
  { key: "workTel", label: "هاتف العمل", x: 12.8, y: 168.3, w: 42.8, h: 9.8, ltr: true },
  { key: "fax", label: "رقم الفاكس", x: 117.6, y: 178.5, w: 36.2, h: 8.2, ltr: true },
  { key: "poBox", label: "صندوق البريد", x: 87, y: 178.5, w: 18, h: 8.2, ltr: true },
  { key: "email", label: "بريد إلكتروني", x: 12.8, y: 178.5, w: 61.2, h: 8.2, ltr: true, size: 10 },
  { key: "relativeName", label: "اسم القريب", x: 117.7, y: 193.1, w: 36.6, h: 8.2 },
  { key: "relativeRelation", label: "صلة القرابة", x: 65.9, y: 193.1, w: 40.8, h: 8.2 },
  { key: "relativeTel", label: "هاتف القريب", x: 12.8, y: 193.1, w: 41.3, h: 8.2, ltr: true },

  // Blank band under the table, then the purpose line.
  { key: "notes", label: "ملاحظات", x: 14, y: 202.3, w: 173, h: 12.6, align: "right", valign: "top", wrap: true, size: 10 },
  { key: "purpose", label: "لأجل معاملة", x: 13.5, y: 215.9, w: 118.5, h: 7, align: "right" },
];

/**
 * Values as they are written on the paper: the stored inputs plus the pieces the
 * form wants split up (date boxes) and in Arabic-Indic digits to match its
 * pre-printed "٢٠٢".
 */
export function residenceDisplay(values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...values };

  const date = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(values.date ?? "");
  out.dateDay = date ? toArabicDigits(Number(date[3])) : "";
  out.dateMonth = date ? toArabicDigits(Number(date[2])) : "";
  out.dateYearDigit = date ? toArabicDigits(date[1].slice(-1)) : "";

  const birth = (values.birthDate ?? "").split(/[\/\-.\s]+/).filter(Boolean);
  let day = "";
  let month = "";
  let year = "";
  if (birth.length >= 3) {
    if (birth[0].length === 4) [year, month, day] = birth;
    else [day, month, year] = birth;
  } else if (birth.length === 2) [month, year] = birth;
  else if (birth.length === 1) [year] = birth;
  out.birthDay = day;
  out.birthMonth = month;
  out.birthYear = year;
  return out;
}
