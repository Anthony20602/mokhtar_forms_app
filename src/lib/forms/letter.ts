import type { InputDef } from "./types";

// Certificate-style forms (everything except إفادة سكن): an official header, the
// person's details, an editable statement, then date and signature.

export const LETTER_GROUPS = ["الترويسة", "صاحب العلاقة", "نص الإفادة"] as const;
const [G_HEAD, G_PERSON, G_BODY] = LETTER_GROUPS;

export const LETTER_INPUTS: InputDef[] = [
  { key: "title", label: "عنوان المستند", group: G_HEAD, wide: true },
  { key: "serial", label: "الرقم المتسلسل", group: G_HEAD, hint: "يُعطى تلقائياً عند الحفظ" },
  { key: "date", label: "التاريخ", group: G_HEAD, type: "date" },

  { key: "fullName", label: "الاسم الكامل", group: G_PERSON, wide: true },
  { key: "fatherName", label: "اسم الأب", group: G_PERSON },
  { key: "motherName", label: "اسم الأم وشهرتها", group: G_PERSON },
  { key: "birthPlace", label: "محل الولادة", group: G_PERSON },
  { key: "birthDate", label: "تاريخ الولادة", group: G_PERSON, ltr: true },
  { key: "gender", label: "الجنس", group: G_PERSON, options: ["ذكر", "أنثى"] },
  { key: "religion", label: "المذهب (اختياري)", group: G_PERSON, hint: "يُترك فارغاً لعدم إظهاره" },
  { key: "recordNo", label: "رقم السجل", group: G_PERSON },
  { key: "registryPlace", label: "محل القيد", group: G_PERSON },
  { key: "address", label: "عنوان السكن", group: G_PERSON, wide: true },
  { key: "phone", label: "الهاتف", group: G_PERSON, type: "tel", ltr: true },

  { key: "body", label: "نص الإفادة", group: G_BODY, type: "textarea", wide: true, rows: 7 },
  { key: "purpose", label: "أعطيت هذه الإفادة لأجل", group: G_BODY, wide: true },
];

/** Rows of the details table, in print order. Empty values are left out. */
export const LETTER_DETAIL_ROWS: { key: string; label: string }[] = [
  { key: "fullName", label: "الاسم الكامل" },
  { key: "fatherName", label: "اسم الأب" },
  { key: "motherName", label: "اسم الأم وشهرتها" },
  { key: "birthPlace", label: "محل الولادة" },
  { key: "birthDate", label: "تاريخ الولادة" },
  { key: "gender", label: "الجنس" },
  { key: "religion", label: "المذهب" },
  { key: "recordNo", label: "رقم السجل" },
  { key: "registryPlace", label: "محل القيد" },
  { key: "address", label: "عنوان السكن" },
  { key: "phone", label: "الهاتف" },
];
