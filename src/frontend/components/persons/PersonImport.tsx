"use client";

import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type DragEvent } from "react";
import { api } from "@/frontend/api/client";
import type { ImportPreview, ImportRowResult, ImportSummary } from "@/shared/types";
import { Button, ButtonLink, Card, Notice } from "../ui/ui";

type Phase = "pick" | "checking" | "preview" | "importing" | "done";
type Filter = "all" | "valid" | "warnings" | "duplicate" | "invalid";

const PAGE = 100;
const MAX_MB = 5;

const STATUS = {
  valid: { label: "صالح", cls: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  duplicate: { label: "مكرر", cls: "bg-amber-50 text-amber-900 border-amber-200", icon: AlertTriangle },
  invalid: { label: "خطأ", cls: "bg-red-50 text-red-800 border-red-200", icon: XCircle },
} as const;

/** Spreadsheet-safe CSV (BOM so Excel reads Arabic correctly; leading = + - @ neutralised). */
function downloadCsv(filename: string, rows: string[][]) {
  const cell = (v: string) => {
    const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const text = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fullName = (r: ImportRowResult) =>
  [r.values.firstName, r.values.fatherName, r.values.familyName].filter(Boolean).join(" ");

/** Pick an Excel file, review every row, then confirm the import. */
export function PersonImport() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setPhase("pick");
    setPreview(null);
    setSummary(null);
    setError(null);
    setFilter("all");
    setShown(PAGE);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function check(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("الصيغة المقبولة هي Excel الحديث (.xlsx) فقط.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`حجم الملف أكبر من ${MAX_MB} ميغابايت.`);
      return;
    }
    setPhase("checking");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<ImportPreview>("/api/persons/import/preview", { body: form });
      setPreview(result);
      setFilter("all");
      setShown(PAGE);
      setPhase("preview");
    } catch (err) {
      setError((err as Error).message);
      setPhase("pick");
    }
  }

  async function confirm() {
    if (!preview) return;
    setPhase("importing");
    setError(null);
    try {
      const result = await api<ImportSummary>("/api/persons/import", {
        body: { rows: preview.rows.map((r) => ({ rowNumber: r.rowNumber, values: r.values })) },
      });
      setSummary(result);
      setPhase("done");
    } catch (err) {
      setError((err as Error).message);
      setPhase("preview");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void check(e.dataTransfer.files[0]);
  }

  // ── 1. pick a file ──
  if (phase === "pick" || phase === "checking") {
    return (
      <div className="space-y-4">
        <Card className="p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-bold text-slate-900">1. جهّز الملف</h2>
          <p className="mb-3 text-sm text-slate-600">
            استخدم القالب الجاهز: الاسم والشهرة مطلوبان، وباقي الأعمدة اختيارية. تاريخ الولادة بصيغة يوم/شهر/سنة أو السنة
            فقط، والجنس ذكر أو أنثى.
          </p>
          <a href="/api/persons/import/template" download className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
            <Download className="h-4 w-4" aria-hidden />
            تنزيل قالب Excel
          </a>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="mb-3 text-lg font-bold text-slate-900">2. اختر الملف</h2>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
              dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-brand-500 hover:bg-slate-50"
            } ${phase === "checking" ? "pointer-events-none opacity-60" : ""}`}
          >
            <FileSpreadsheet className="h-9 w-9 text-brand-600" aria-hidden />
            <span className="font-semibold text-slate-800">
              {phase === "checking" ? "جارٍ فحص الملف…" : "اسحب ملف Excel إلى هنا أو اضغط للاختيار"}
            </span>
            <span className="text-xs text-slate-500">.xlsx · حتى {MAX_MB} ميغابايت · حتى 5000 صف</span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              disabled={phase === "checking"}
              onChange={(e) => void check(e.target.files?.[0])}
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">لا يُضاف أي شيء قبل أن تراجع المعاينة وتضغط «تأكيد الاستيراد».</p>
          {error ? (
            <div className="mt-3">
              <Notice>{error}</Notice>
            </div>
          ) : null}
        </Card>
      </div>
    );
  }

  // ── 3. summary ──
  if (phase === "done" && summary) {
    const problems = [...summary.failed.map((i) => ({ ...i, kind: "فشل" })), ...summary.skipped.map((i) => ({ ...i, kind: "تخطي" }))].sort(
      (a, b) => a.rowNumber - b.rowNumber,
    );
    return (
      <div className="space-y-4">
        <Card className="p-4 sm:p-6">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
            ملخص الاستيراد
          </h2>
          <p className="mb-4 text-sm text-slate-600">{preview?.fileName}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Count label="صفوف الملف" value={summary.total} />
            <Count label="تمت إضافتهم" value={summary.imported} tone="ok" />
            <Count label="تم تخطّيهم (مكررون)" value={summary.skipped.length} tone="warn" />
            <Count label="فشلوا (أخطاء)" value={summary.failed.length} tone="bad" />
          </div>
        </Card>

        {problems.length ? (
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="font-bold text-slate-900">الصفوف التي لم تُضف ({problems.length})</h3>
              <Button
                variant="secondary"
                className="!px-3 !py-1.5"
                onClick={() =>
                  downloadCsv("import-not-added.csv", [
                    ["الصف", "الاسم", "الحالة", "السبب"],
                    ...problems.map((p) => [String(p.rowNumber), p.name, p.kind, p.reasons.join(" | ")]),
                  ])
                }
              >
                <Download className="h-4 w-4" aria-hidden />
                تنزيل القائمة (CSV)
              </Button>
            </div>
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {problems.map((p) => (
                <li key={`${p.kind}-${p.rowNumber}`} className="px-4 py-2.5 text-sm">
                  <span className="font-semibold text-slate-900">
                    الصف {p.rowNumber}: {p.name || "—"}
                  </span>
                  <span className={`ms-2 rounded-full px-2 py-0.5 text-xs ${p.kind === "فشل" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>
                    {p.kind}
                  </span>
                  <span className="block text-slate-600">{p.reasons.join(" · ")}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/persons">عرض سجل الأهالي</ButtonLink>
          <Button variant="secondary" onClick={reset}>
            استيراد ملف آخر
          </Button>
        </div>
      </div>
    );
  }

  // ── 2. preview ──
  if (!preview) return null;
  const t = preview.totals;
  const matches = (r: ImportRowResult) =>
    filter === "all" ||
    (filter === "warnings" ? r.status === "valid" && r.warnings.length > 0 : r.status === filter);
  const rows = preview.rows.filter(matches);
  const importing = phase === "importing";

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-brand-600" aria-hidden />
          <h2 className="min-w-0 flex-1 truncate font-bold text-slate-900" dir="auto">
            {preview.fileName}
          </h2>
          <span className="text-xs text-slate-500">ورقة «{preview.sheetName}»</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Count label="كل الصفوف" value={t.rows} />
          <Count label="جاهزة للإضافة" value={t.valid} tone="ok" />
          <Count label="مكررة (ستُتخطّى)" value={t.duplicate} tone="warn" />
          <Count label="فيها أخطاء (لن تُضاف)" value={t.invalid} tone="bad" />
        </div>
        {preview.ignoredColumns.length ? (
          <p className="mt-3 text-xs text-slate-500">أعمدة غير معروفة سيتم تجاهلها: {preview.ignoredColumns.join("، ")}</p>
        ) : null}
      </Card>

      {t.invalid + t.duplicate > 0 ? (
        <Notice tone="info">
          {t.invalid ? `${t.invalid} صف فيه أخطاء ولن يُضاف. ` : ""}
          {t.duplicate ? `${t.duplicate} صف مكرر سيتم تخطّيه. ` : ""}
          يمكنك تصحيح الملف وإعادة رفعه، أو استيراد الصفوف الجاهزة الآن.
        </Notice>
      ) : null}
      {error ? <Notice>{error}</Notice> : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="تصفية الصفوف">
        {(
          [
            ["all", "الكل", t.rows],
            ["valid", "جاهزة", t.valid],
            ["warnings", "جاهزة مع ملاحظات", t.warnings],
            ["duplicate", "مكررة", t.duplicate],
            ["invalid", "أخطاء", t.invalid],
          ] as [Filter, string, number][]
        ).map(([key, label, n]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => {
              setFilter(key);
              setShown(PAGE);
            }}
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${filter === key ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            {label} ({n})
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-start text-xs text-slate-600">
              <tr>
                {["الصف", "الاسم", "اسم الأم", "السجل", "الولادة", "الجنس", "الحالة", "ملاحظات"].map((h) => (
                  <th key={h} className="px-3 py-2 text-start font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, shown).map((r) => {
                const st = STATUS[r.status];
                const Icon = st.icon;
                // Rows that will not be added only list why; warnings matter for rows that will be.
                const messages =
                  r.status === "invalid"
                    ? r.errors
                    : [...(r.duplicateOf ? [r.duplicateOf] : []), ...(r.status === "valid" ? r.warnings : [])];
                return (
                  <tr key={r.rowNumber} className={r.status === "invalid" ? "bg-red-50/40" : r.status === "duplicate" ? "bg-amber-50/40" : ""}>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{r.rowNumber}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{fullName(r) || "—"}</td>
                    <td className="px-3 py-2 text-slate-700">{r.values.motherName || "—"}</td>
                    <td className="px-3 py-2 text-slate-700">{r.values.recordNo || "—"}</td>
                    <td className="px-3 py-2 tabular-nums text-slate-700">{r.values.birthDate || "—"}</td>
                    <td className="px-3 py-2 text-slate-700">{r.values.gender || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {messages.length ? (
                        <ul className="space-y-0.5">
                          {messages.map((m, i) => (
                            <li key={i} className={i < r.errors.length ? "font-semibold text-red-700" : r.duplicateOf && m === r.duplicateOf ? "text-amber-800" : "text-slate-500"}>
                              {m}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                    لا توجد صفوف في هذه الفئة.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {rows.length > shown ? (
          <div className="border-t border-slate-100 p-3 text-center">
            <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
              عرض المزيد ({(rows.length - shown).toLocaleString("en-US")} متبقٍ)
            </Button>
          </div>
        ) : null}
      </Card>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button onClick={confirm} disabled={importing || t.valid === 0}>
          <Upload className="h-4 w-4" aria-hidden />
          {importing ? "جارٍ الاستيراد…" : `تأكيد الاستيراد (${t.valid.toLocaleString("en-US")} شخص)`}
        </Button>
        <Button variant="secondary" onClick={reset} disabled={importing}>
          اختيار ملف آخر
        </Button>
        {t.valid === 0 ? <span className="text-sm text-red-700">لا توجد صفوف صالحة للإضافة.</span> : null}
        <Link href="/persons" className="ms-auto text-sm text-slate-500 hover:underline">
          إلغاء
        </Link>
      </div>
    </div>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : tone === "bad" ? "text-red-700" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value.toLocaleString("en-US")}</p>
      <p className="text-xs text-slate-600">{label}</p>
    </div>
  );
}
