"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/client";
import type { PrinterInfo, Settings } from "@/lib/types";
import { Button, Card, Notice } from "./ui";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState<Settings>(initial);
  const [printers, setPrinters] = useState<PrinterInfo[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<{ printers: PrinterInfo[] }>("/api/printers")
      .then((r) => setPrinters(r.printers))
      .catch(() => setPrinters([]));
  }, []);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await api<Settings>("/api/settings", { method: "PUT", body: form });
      setForm(saved);
      setMessage({ ok: true, text: "تم حفظ الإعدادات." });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  const text = (key: "mukhtarName" | "town" | "qadaa" | "muhafaza" | "phone", label: string, hint?: string) => (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input className="input" value={form[key]} onChange={(e) => set(key, e.target.value)} autoComplete="off" />
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );

  const number = (key: "printOffsetX" | "printOffsetY" | "valueFontSize", label: string, hint: string, step: number) => (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="input"
        type="number"
        step={step}
        dir="ltr"
        style={{ textAlign: "right" }}
        value={form[key]}
        onChange={(e) => set(key, Number(e.target.value))}
      />
      <span className="mt-1 block text-xs text-slate-500">{hint}</span>
    </label>
  );

  // Keep a saved printer selectable even while it is switched off / unplugged.
  const printerNames = printers?.map((p) => p.name) ?? [];
  if (form.defaultPrinter && !printerNames.includes(form.defaultPrinter)) printerNames.push(form.defaultPrinter);

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card className="p-4 sm:p-6">
        <h2 className="mb-1 text-lg font-bold text-slate-900">بيانات المختار</h2>
        <p className="mb-4 text-sm text-slate-600">تُعبّأ تلقائياً في ترويسة كل مستند جديد.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("mukhtarName", "اسم المختار", "يظهر تحت التوقيع في الإفادات")}
          {text("town", "البلدة / الحي")}
          {text("qadaa", "القضاء")}
          {text("muhafaza", "المحافظة")}
          {text("phone", "هاتف المكتب")}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-1 text-lg font-bold text-slate-900">الطباعة</h2>
        <p className="mb-4 text-sm text-slate-600">
          الطابعة الافتراضية تُستخدم عند الضغط على «إرسال إلى الطابعة» من أي جهاز (حاسوب أو هاتف).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-slate-700">طابعة المكتب الافتراضية</span>
            <select className="input" value={form.defaultPrinter} onChange={(e) => set("defaultPrinter", e.target.value)}>
              <option value="">الطابعة الافتراضية في ويندوز</option>
              {printerNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              {printers == null
                ? "جارٍ قراءة الطابعات…"
                : printers.length
                  ? `${printers.length} طابعة معرّفة على حاسوب المكتب.`
                  : "لم يتم العثور على طابعات معرّفة على هذا الحاسوب."}
            </span>
          </label>
          {number("valueFontSize", "حجم خط البيانات على النماذج (pt)", "الحجم المعتاد ١١", 0.5)}
          <span className="hidden sm:block" />
          {number("printOffsetX", "إزاحة أفقية (ملم)", "موجب = إلى اليمين. للطباعة على ورق النموذج الجاهز فقط", 0.5)}
          {number("printOffsetY", "إزاحة عمودية (ملم)", "موجب = إلى الأسفل. للطباعة على ورق النموذج الجاهز فقط", 0.5)}
        </div>
      </Card>

      {message ? <Notice tone={message.ok ? "success" : "error"}>{message.text}</Notice> : null}

      <Button type="submit" disabled={saving}>
        <Save className="h-4 w-4" aria-hidden />
        {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
      </Button>
    </form>
  );
}
