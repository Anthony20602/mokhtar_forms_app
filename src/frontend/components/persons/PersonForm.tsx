"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/frontend/api/client";
import type { Person, PersonInput } from "@/shared/types";
import { Button, ButtonLink, Card, Notice } from "@/frontend/components/ui/ui";

const EMPTY: PersonInput = {
  recordNo: "",
  familyName: "",
  firstName: "",
  fatherName: "",
  motherName: "",
  birthDate: "",
  gender: "",
  personalReligion: "",
  recordReligion: "",
  notes: "",
};

const FIELDS: { key: keyof PersonInput; label: string; hint?: string; ltr?: boolean }[] = [
  { key: "firstName", label: "الاسم" },
  { key: "familyName", label: "الشهرة" },
  { key: "fatherName", label: "اسم الأب" },
  { key: "motherName", label: "اسم الأم وشهرتها" },
  { key: "recordNo", label: "رقم السجل" },
  { key: "birthDate", label: "تاريخ الولادة", hint: "يوم/شهر/سنة أو السنة فقط", ltr: true },
];

/** Add / edit one villager. `person` given = edit mode. */
export function PersonForm({
  person,
  religions,
  defaults,
}: {
  person?: Person;
  religions: string[];
  defaults?: Partial<PersonInput>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PersonInput>(() => {
    if (!person) return { ...EMPTY, ...defaults };
    const input = { ...EMPTY };
    for (const key of Object.keys(EMPTY) as (keyof PersonInput)[]) input[key] = person[key];
    return input;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof PersonInput, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() && !form.familyName.trim()) {
      setError("أدخل الاسم أو الشهرة على الأقل.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await api<Person>(person ? `/api/persons/${person.id}` : "/api/persons", {
        method: person ? "PUT" : "POST",
        body: form,
      });
      router.push(`/persons/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Card className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">{f.label}</span>
              <input
                className="input"
                value={form[f.key]}
                dir={f.ltr ? "ltr" : undefined}
                style={f.ltr ? { textAlign: "right" } : undefined}
                onChange={(e) => set(f.key, e.target.value)}
                autoComplete="off"
              />
              {f.hint ? <span className="mt-1 block text-xs text-slate-500">{f.hint}</span> : null}
            </label>
          ))}

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">الجنس</span>
            <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">—</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
              {form.gender && !["ذكر", "أنثى"].includes(form.gender) ? (
                <option value={form.gender}>{form.gender}</option>
              ) : null}
            </select>
          </label>
          <span className="hidden sm:block" />

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">المذهب الشخصي</span>
            <input
              className="input"
              list="religion-options"
              value={form.personalReligion}
              onChange={(e) => set("personalReligion", e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">مذهب السجل</span>
            <input
              className="input"
              list="religion-options"
              value={form.recordReligion}
              onChange={(e) => set("recordReligion", e.target.value)}
              autoComplete="off"
            />
          </label>
          <datalist id="religion-options">
            {religions.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-slate-700">ملاحظات</span>
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4">
            <Notice>{error}</Notice>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden />
            {saving ? "جارٍ الحفظ…" : "حفظ"}
          </Button>
          <ButtonLink href={person ? `/persons/${person.id}` : "/persons"} variant="secondary">
            إلغاء
          </ButtonLink>
        </div>
      </Card>
    </form>
  );
}
