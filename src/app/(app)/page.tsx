import { FileText, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DocumentList } from "@/frontend/components/documents/DocumentList";
import { PersonCombobox } from "@/frontend/components/persons/PersonCombobox";
import { ButtonLink, Card, Notice } from "@/frontend/components/ui/ui";
import { listDocuments } from "@/backend/services/documents";
import { load } from "@/backend/database/load";
import { getStats } from "@/backend/services/persons";

export default async function HomePage() {
  const { data, error } = await load(async () => {
    const [stats, recent] = await Promise.all([getStats(), listDocuments({ limit: 6 })]);
    return { stats, recent };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-bl from-brand-700 to-brand-800 px-5 py-8 text-white shadow-sm sm:px-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-start">
          <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-lg">
            <Image src="/logo.png" alt="" width={80} height={80} priority className="h-20 w-20 object-contain" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold">معاملات المختار</h1>
            <p className="mt-1 text-white/80">ابحث عن صاحب العلاقة ثم اختر المعاملة المطلوبة</p>
            <div className="mt-5">
              <PersonCombobox autoFocus />
            </div>
          </div>
        </div>
      </section>

      {error ? <Notice>{error}</Notice> : null}

      {data ? (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="عدد الأهالي" value={data.stats.total} href="/persons" />
            <StatCard label="عدد السجلات (العائلات)" value={data.stats.families} href="/stats" />
            <StatCard label="مستندات هذه السنة" value={data.stats.documentsThisYear} href="/documents" />
            <StatCard label="مجموع المستندات" value={data.stats.documents} href="/documents" />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <FileText className="h-4 w-4 text-brand-600" aria-hidden />
                  آخر المستندات
                </h2>
                <Link href="/documents" className="text-sm font-semibold text-brand-700 hover:underline">
                  عرض الكل
                </Link>
              </div>
              {data.recent.items.length ? (
                <DocumentList items={data.recent.items} />
              ) : (
                <p className="px-4 py-10 text-center text-sm text-slate-500">
                  لم يصدر أي مستند بعد. ابحث عن شخص للبدء.
                </p>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="mb-3 font-bold text-slate-900">اختصارات</h2>
              <div className="flex flex-col gap-2">
                <ButtonLink href="/persons" variant="secondary" className="justify-start">
                  <Users className="h-4 w-4" aria-hidden />
                  تصفح سجل الأهالي
                </ButtonLink>
                <ButtonLink href="/persons/new" variant="secondary" className="justify-start">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  إضافة شخص جديد
                </ButtonLink>
                <ButtonLink href="/documents/new?form=residence" variant="secondary" className="justify-start">
                  <FileText className="h-4 w-4" aria-hidden />
                  إفادة سكن فارغة (لغير المسجلين)
                </ButtonLink>
              </div>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50/40"
    >
      <p className="text-3xl font-bold tabular-nums text-slate-900">{value.toLocaleString("en-US")}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </Link>
  );
}
