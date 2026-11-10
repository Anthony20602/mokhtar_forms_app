import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DocumentList } from "@/components/DocumentList";
import { Button, Card, EmptyState, Notice, PageHeader, buttonClass } from "@/components/ui";
import { listDocuments } from "@/lib/documents";
import { FORMS } from "@/lib/forms";
import { load } from "@/lib/load";

export const metadata: Metadata = { title: "المستندات" };

const PAGE_SIZE = 40;

export default async function DocumentsPage(props: PageProps<"/documents">) {
  const params = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(params.q);
  const formType = one(params.form);
  const page = Math.max(1, Number(one(params.page)) || 1);

  const { data, error } = await load(() =>
    listDocuments({ q, formType: formType || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (formType) sp.set("form", formType);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `/documents?${qs}` : "/documents";
  };

  return (
    <>
      <PageHeader title="المستندات الصادرة" subtitle="كل معاملة تم حفظها، لإعادة فتحها أو طباعتها" />

      <form className="mb-4 flex flex-wrap gap-2" action="/documents">
        <label className="relative min-w-48 flex-1">
          <span className="sr-only">بحث</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input name="q" defaultValue={q} className="input !ps-9" placeholder="اسم صاحب العلاقة أو الرقم المتسلسل" />
        </label>
        <select name="form" defaultValue={formType} className="input !w-auto min-w-44" aria-label="نوع المستند">
          <option value="">كل الأنواع</option>
          {FORMS.map((f) => (
            <option key={f.type} value={f.type}>
              {f.title}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          بحث
        </Button>
      </form>

      {error ? <Notice>{error}</Notice> : null}

      {data ? (
        data.items.length ? (
          <>
            <p className="mb-2 text-sm text-slate-600">{data.total.toLocaleString("en-US")} مستند</p>
            <Card>
              <DocumentList items={data.items} />
            </Card>
            {pages > 1 ? (
              <nav className="mt-4 flex items-center justify-center gap-3" aria-label="الصفحات">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className={buttonClass("secondary")}>
                    السابق
                  </Link>
                ) : null}
                <span className="text-sm text-slate-600">
                  صفحة {page} من {pages}
                </span>
                {page < pages ? (
                  <Link href={pageHref(page + 1)} className={buttonClass("secondary")}>
                    التالي
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </>
        ) : (
          <EmptyState
            title={q || formType ? "لا توجد مستندات مطابقة" : "لم يصدر أي مستند بعد"}
            hint="ابحث عن شخص في سجل الأهالي ثم اختر المعاملة لإصدار مستند."
          />
        )
      ) : null}
    </>
  );
}
