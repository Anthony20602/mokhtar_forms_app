"use client";

import { ArrowRight, Move, Plus, Printer, RotateCcw, Save, Trash2, Type } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/frontend/api/client";
import { getInputs } from "@/shared/forms";
import type { FormDef, InputDef } from "@/shared/forms/types";
import type { DocData, DocumentRow, ExtraText, Offset, Settings } from "@/shared/types";
import { DeleteButton } from "@/frontend/components/ui/DeleteButton";
import { DocumentSheet, type SheetInteraction } from "@/frontend/components/sheets/DocumentSheet";
import { ScaledSheet } from "@/frontend/components/sheets/ScaledSheet";
import { Button, Notice } from "@/frontend/components/ui/ui";

interface Props {
  form: FormDef;
  settings: Settings;
  initialData: DocData;
  /** Set once the document exists in the database. */
  document?: { id: number; serialNo: number; serialYear: number; updatedAt: string };
  person?: { id: number; name: string } | null;
}

/** Fill in a form on the left, see the printed page live on the right. */
export function DocumentEditor({ form, settings, initialData, document: saved, person }: Props) {
  const router = useRouter();
  const { inputs, groups } = useMemo(() => getInputs(form), [form]);

  const [data, setData] = useState<DocData>(initialData);
  const [dirty, setDirty] = useState(!saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [tab, setTab] = useState<"form" | "preview">("form");
  const isTemplate = form.kind === "template";

  const change = useCallback((updater: (d: DocData) => DocData) => {
    setData(updater);
    setDirty(true);
  }, []);

  const setValue = (key: string, value: string) =>
    change((d) => ({ ...d, values: { ...d.values, [key]: value } }));

  // ── Saving ──────────────────────────────────────────────────────────────
  async function save(): Promise<number | null> {
    setSaving(true);
    setError(null);
    try {
      if (saved) {
        await api<DocumentRow>(`/api/documents/${saved.id}`, {
          method: "PUT",
          body: { data },
        });
        setDirty(false);
        setSavedAt(Date.now());
        return saved.id;
      }
      const created = await api<DocumentRow>("/api/documents", {
        body: { formType: form.type, personId: person?.id ?? null, data },
      });
      setDirty(false);
      return created.id;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveOnly() {
    const id = await save();
    // A brand-new document now has its own address (and serial number).
    if (id != null && !saved) router.replace(`/documents/${id}`);
  }

  async function saveAndPrint() {
    const id = dirty || !saved ? await save() : saved.id;
    if (id == null) return;
    // For a new document, replace the "new" page in the browser history: pressing
    // Back from the print page must not offer to save the same document twice.
    if (saved) router.push(`/documents/${id}/print`);
    else window.location.replace(`/documents/${id}/print`);
  }

  // Ctrl+S saves; warn before losing unsaved work.
  const saveOnlyRef = useRef(saveOnly);
  useEffect(() => {
    saveOnlyRef.current = saveOnly;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveOnlyRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty || !saved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saved]);

  // The browser's Back button can bring this page back with the data it was first
  // loaded with. Re-read the document so edits are never made on top of a stale copy.
  const savedId = saved?.id;
  const loadedVersion = saved?.updatedAt;
  useEffect(() => {
    if (savedId == null) return;
    let cancelled = false;
    api<DocumentRow>(`/api/documents/${savedId}`)
      .then((fresh) => {
        if (cancelled || fresh.updatedAt === loadedVersion) return;
        setData(fresh.data);
        setDirty(false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [savedId, loadedVersion]);

  // ── Positioning on the sheet ────────────────────────────────────────────
  const interaction: SheetInteraction = useMemo(
    () => ({
      moveMode,
      zoom,
      onMoveMark: (key: string, offset: Offset) =>
        change((d) => ({ ...d, offsets: { ...(d.offsets ?? {}), [key]: offset } })),
      onMoveExtra: (id: string, x: number, y: number) =>
        change((d) => ({
          ...d,
          extras: (d.extras ?? []).map((e) => (e.id === id ? { ...e, x, y } : e)),
        })),
    }),
    [moveMode, zoom, change],
  );

  const extras = data.extras ?? [];
  const movedCount = Object.values(data.offsets ?? {}).filter((o) => o.dx || o.dy).length;

  function addExtra() {
    const extra: ExtraText = {
      id: Math.random().toString(36).slice(2, 10),
      text: "",
      x: 180,
      y: Math.min(205 + extras.length * 5, 280),
      size: settings.valueFontSize,
    };
    change((d) => ({ ...d, extras: [...(d.extras ?? []), extra] }));
    setMoveMode(true);
  }
  const updateExtra = (id: string, patch: Partial<ExtraText>) =>
    change((d) => ({
      ...d,
      extras: (d.extras ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  const removeExtra = (id: string) =>
    change((d) => ({ ...d, extras: (d.extras ?? []).filter((e) => e.id !== id) }));

  const status = saving
    ? "جارٍ الحفظ…"
    : dirty
      ? saved
        ? "تعديلات غير محفوظة"
        : "مستند جديد غير محفوظ"
      : savedAt
        ? "تم الحفظ"
        : "محفوظ";

  return (
    <div className="space-y-4">
      {/* Title bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={person ? `/persons/${person.id}` : saved ? "/documents" : "/"}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
            {person ? person.name : "رجوع"}
          </Link>
          <h1 className="truncate text-2xl font-bold text-slate-900">{form.title}</h1>
          <p className="text-sm text-slate-600">
            {saved ? `رقم ${saved.serialNo}/${saved.serialYear} · ` : ""}
            <span className={dirty ? "font-semibold text-amber-700" : "text-emerald-700"}>{status}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {saved ? (
            <DeleteButton
              url={`/api/documents/${saved.id}`}
              redirectTo={person ? `/persons/${person.id}` : "/documents"}
              confirmText="حذف هذا المستند نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
            />
          ) : null}
          <Button variant="secondary" onClick={saveOnly} disabled={saving || (!dirty && Boolean(saved))}>
            <Save className="h-4 w-4" aria-hidden />
            حفظ
          </Button>
          <Button onClick={saveAndPrint} disabled={saving}>
            <Printer className="h-4 w-4" aria-hidden />
            حفظ وطباعة
          </Button>
        </div>
      </div>

      {error ? <Notice>{error}</Notice> : null}

      {/* Phone: switch between the two panes */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1 lg:hidden" role="tablist">
        {(["form", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 text-sm font-semibold ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            {t === "form" ? "البيانات" : "المعاينة"}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Inputs */}
        <div className={`space-y-4 ${tab === "form" ? "" : "hidden lg:block"}`}>
          {groups.map((group) => {
            const groupInputs = inputs.filter((i) => i.group === group);
            if (!groupInputs.length) return null;
            return (
              <fieldset key={group} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <legend className="px-2 text-sm font-bold text-brand-800">{group}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {groupInputs.map((input) => (
                    <FieldInput
                      key={input.key}
                      formType={form.type}
                      input={input}
                      value={data.values[input.key] ?? ""}
                      onChange={(v) => setValue(input.key, v)}
                    />
                  ))}
                </div>
              </fieldset>
            );
          })}

          <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <legend className="px-2 text-sm font-bold text-brand-800">نصوص إضافية على الصفحة</legend>
            {extras.length === 0 ? (
              <p className="mb-3 text-sm text-slate-500">
                لإضافة أي نص حر في أي مكان من الصفحة، ثم سحبه إلى موضعه في المعاينة.
              </p>
            ) : (
              <ul className="mb-3 space-y-2">
                {extras.map((extra) => (
                  <li key={extra.id} className="flex items-center gap-2">
                    <input
                      className="input"
                      value={extra.text}
                      placeholder="النص"
                      aria-label="نص إضافي"
                      onChange={(e) => updateExtra(extra.id, { text: e.target.value })}
                    />
                    <input
                      className="input !w-20 shrink-0"
                      type="number"
                      min={6}
                      max={36}
                      value={extra.size}
                      title="حجم الخط"
                      aria-label="حجم الخط"
                      onChange={(e) => updateExtra(extra.id, { size: Math.min(36, Math.max(6, Number(e.target.value) || 11)) })}
                    />
                    <button
                      type="button"
                      onClick={() => removeExtra(extra.id)}
                      className="shrink-0 rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      <span className="sr-only">حذف النص</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="secondary" onClick={addExtra} disabled={extras.length >= 40}>
              <Plus className="h-4 w-4" aria-hidden />
              إضافة نص
            </Button>
          </fieldset>
        </div>

        {/* Live preview */}
        <div className={`lg:sticky lg:top-16 ${tab === "preview" ? "" : "hidden lg:block"}`}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Button
              variant={moveMode ? "primary" : "secondary"}
              onClick={() => setMoveMode((m) => !m)}
              aria-pressed={moveMode}
              className="!px-3 !py-1.5"
            >
              <Move className="h-4 w-4" aria-hidden />
              {moveMode ? "إنهاء التحريك" : "تحريك الحقول"}
            </Button>
            {movedCount > 0 ? (
              <Button
                variant="ghost"
                className="!px-3 !py-1.5"
                onClick={() => change((d) => ({ ...d, offsets: {} }))}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                إعادة المواضع ({movedCount})
              </Button>
            ) : null}
            {isTemplate ? (
              <label className="ms-auto flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={data.showBackground !== false}
                  onChange={(e) => change((d) => ({ ...d, showBackground: e.target.checked }))}
                />
                طباعة النموذج مع البيانات
              </label>
            ) : null}
          </div>
          {moveMode ? (
            <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs text-sky-900">
              <Type className="h-3.5 w-3.5 shrink-0" aria-hidden />
              اسحب أي حقل أو نص إلى موضعه الصحيح. الحقول المنقولة تظهر باللون البرتقالي.
            </p>
          ) : null}
          {isTemplate && data.showBackground === false ? (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
              ستُطبع البيانات فقط، لوضع ورقة النموذج الرسمي الجاهزة في الطابعة.
            </p>
          ) : null}
          <div className="rounded-2xl bg-slate-300/60 p-2 sm:p-3">
            <ScaledSheet onZoom={setZoom}>
              <DocumentSheet form={form} data={data} settings={settings} interaction={interaction} />
            </ScaledSheet>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  formType,
  input,
  value,
  onChange,
}: {
  formType: string;
  input: InputDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `f-${input.key}`;
  const listId = input.options && input.type !== "select" ? `${formType}-${input.key}-options` : undefined;
  const ltrStyle = input.ltr ? ({ direction: "ltr", textAlign: "right" } as const) : undefined;

  let control;
  if (input.type === "textarea") {
    control = (
      <textarea id={id} className="input" rows={input.rows ?? 3} value={value} onChange={(e) => onChange(e.target.value)} />
    );
  } else if (input.type === "select") {
    control = (
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {input.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        id={id}
        className="input"
        type={input.type ?? "text"}
        inputMode={input.type === "tel" ? "tel" : undefined}
        list={listId}
        value={value}
        style={ltrStyle}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div className={input.wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-700">
        {input.label}
      </label>
      {control}
      {listId ? (
        <datalist id={listId}>
          {input.options!.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      ) : null}
      {input.hint && !value ? <p className="mt-1 text-xs text-slate-500">{input.hint}</p> : null}
    </div>
  );
}
