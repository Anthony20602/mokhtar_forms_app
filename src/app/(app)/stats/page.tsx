import type { Metadata } from "next";
import { Card, Notice, PageHeader } from "@/frontend/components/ui/ui";
import { load } from "@/backend/database/load";
import { getStats } from "@/backend/services/persons";

export const metadata: Metadata = { title: "إحصاءات" };

export default async function StatsPage() {
  const { data: stats, error } = await load(getStats);
  if (error || !stats) {
    return (
      <>
        <PageHeader title="إحصاءات السجل" />
        <Notice>{error}</Notice>
      </>
    );
  }
  const other = stats.total - stats.males - stats.females;

  return (
    <>
      <PageHeader title="إحصاءات السجل" subtitle="أرقام محسوبة مباشرة من قاعدة البيانات" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Big label="عدد الأهالي" value={stats.total} />
        <Big label="السجلات (العائلات)" value={stats.families} />
        <Big label="ذكور" value={stats.males} />
        <Big label="إناث" value={stats.females} />
      </div>
      {other > 0 ? (
        <p className="mb-4 text-sm text-slate-600">{other} شخص بدون تحديد الجنس.</p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Bars title="حسب المذهب" rows={stats.byReligion} />
        <Bars title="حسب عقد الولادة" rows={stats.byDecade.map((r) => ({ ...r, label: `${r.label}–${Number(r.label) + 9}` }))} keepOrder />
        <Bars title="أكثر العائلات عدداً" rows={stats.topFamilies} />
      </div>
    </>
  );
}

function Big({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-3xl font-bold tabular-nums text-slate-900">{value.toLocaleString("en-US")}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </Card>
  );
}

function Bars({
  title,
  rows,
  keepOrder,
}: {
  title: string;
  rows: { label: string; count: number }[];
  keepOrder?: boolean;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const list = keepOrder ? rows : [...rows].sort((a, b) => b.count - a.count);
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-bold text-slate-900">{title}</h2>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">لا توجد بيانات.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((row) => (
            <li key={row.label}>
              <div className="mb-0.5 flex justify-between gap-2 text-sm">
                <span className="truncate text-slate-800">{row.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                  {row.count.toLocaleString("en-US")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${(row.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
