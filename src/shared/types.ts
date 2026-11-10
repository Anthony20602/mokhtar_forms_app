// Plain data shapes shared by the server and the browser.

export interface Person {
  id: number;
  recordNo: string;
  familyName: string;
  firstName: string;
  fatherName: string;
  motherName: string;
  birthDate: string;
  gender: string;
  personalReligion: string;
  recordReligion: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PersonInput = Omit<Person, "id" | "createdAt" | "updatedAt">;

export interface Settings {
  mukhtarName: string;
  town: string;
  qadaa: string;
  muhafaza: string;
  phone: string;
  /** Windows printer name used by "print on the office printer". Empty = system default. */
  defaultPrinter: string;
  /** Millimetres to shift the printed data, to line it up on pre-printed forms. */
  printOffsetX: number;
  printOffsetY: number;
  /** Font size (pt) of the values written on official templates. */
  valueFontSize: number;
}

export interface Offset {
  dx: number;
  dy: number;
}

export interface ExtraText {
  id: string;
  text: string;
  /** Position of the text's top-right corner, in mm from the page's top-left. */
  x: number;
  y: number;
  size: number;
}

export interface DocData {
  values: Record<string, string>;
  /** Per-field nudges (mm) made by dragging a value on the preview. */
  offsets?: Record<string, Offset>;
  extras?: ExtraText[];
  /** false = print only the data, for paper that already has the form printed on it. */
  showBackground?: boolean;
}

export interface DocumentRow {
  id: number;
  formType: string;
  personId: number | null;
  personName: string;
  serialYear: number;
  serialNo: number;
  data: DocData;
  printCount: number;
  lastPrintedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DocumentSummary = Omit<DocumentRow, "data">;

export interface Stats {
  total: number;
  males: number;
  females: number;
  families: number;
  documents: number;
  documentsThisYear: number;
  byReligion: { label: string; count: number }[];
  byDecade: { label: string; count: number }[];
  topFamilies: { label: string; count: number }[];
}

export interface PrinterInfo {
  name: string;
  isDefault: boolean;
}

// ── Excel import of people ─────────────────────────────────────────────────

/** The person fields an Excel file can fill in. */
export type ImportField = keyof PersonInput;
export type ImportValues = Record<ImportField, string>;

export interface ImportRowResult {
  /** Row number in the Excel sheet, as the user sees it. */
  rowNumber: number;
  /** The row after cleaning (trimmed text, normalised gender and birth date). */
  values: ImportValues;
  status: "valid" | "duplicate" | "invalid";
  /** Why a row is invalid. */
  errors: string[];
  /** Things worth a look that do not stop the import. */
  warnings: string[];
  /** For duplicates: what it duplicates. */
  duplicateOf?: string;
}

export interface ImportPreview {
  fileName: string;
  sheetName: string;
  /** Columns in the file that were not recognised and will be ignored. */
  ignoredColumns: string[];
  totals: { rows: number; valid: number; duplicate: number; invalid: number; warnings: number };
  rows: ImportRowResult[];
}

export interface ImportIssue {
  rowNumber: number;
  name: string;
  reasons: string[];
}

export interface ImportSummary {
  total: number;
  imported: number;
  /** Rows left out because the person already exists (or repeats an earlier row). */
  skipped: ImportIssue[];
  /** Rows left out because of invalid data. */
  failed: ImportIssue[];
}
