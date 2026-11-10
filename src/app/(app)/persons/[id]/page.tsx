import { ArrowRight, Pencil, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/frontend/components/ui/DeleteButton";
import { DocumentList } from "@/frontend/components/documents/DocumentList";
import { FormIcon } from "@/frontend/components/ui/FormIcon";
import { ButtonLink, Card, Notice } from "@/frontend/components/ui/ui";
import { listDocuments } from "@/backend/services/documents";
import { FORMS } from "@/shared/forms/registry";
import { load } from "@/backend/database/load";
import { getFamily, getPerson } from "@/backend/services/persons";

export const metadata: Metadata = { title: "بيانات الشخص" };

export default async function PersonPage(props: PageProps<"/persons/[id]">) {
  const id = Number((await props.params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { data, error } = await load(async () => {
    const person = await getPerson(id);
    if (!person) return null;
    const [family, documents] = await Promise.all([
      getFamily(person.recordNo, person.id),
      listDocuments({ personId: person.id, limit: 20 }),
    ]);
    return { person, family, documents };
  });
  if (error) return <Notice>{error}</Notice>;
  if (!data) notFound();
  const { person, family, documents } = data;

  const details: [string, string][] = [
    ["رقم السجل", person.recordNo],
    ["اسم الأب", person.fatherName],
    ["اسم الأم وشهرتها", person.motherName],
    ["تاريخ الولادة", person.birthDate],
    ["الجنس", person.gender],
    ["المذهب الشخصي", person.personalReligion],
    ["مذهب السجل", person.recordReligion],
    ["الرقم في البرنامج", String(person.id)],
  ];

  return (
    <div className="space-y-5">
      <Link href="/persons" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowRight className="h-4 w-4" aria-hidden />
        العودة إلى البحث
      </Link>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-800">
            {(person.firstName || person.familyName || "؟").charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {person.firstName} {person.familyName}
            </h1>
            <p className="text-slate-600">
              {person.fatherName ? `ابن/ة ${person.fatherName}` : ""}
              {person.fatherName && person.motherName ? " و" : ""}
              {person.motherName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/persons/${person.id}/edit`} variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              تعديل
            </ButtonLink>
            <DeleteButton
              url={`/api/persons/${person.id}`}
              redirectTo="/persons"
              confirmText={`حذف ${person.firstName} ${person.familyName} من السجل نهائياً؟ لا يمكن التراجع عن هذا الإجراء. (المستندات الصادرة له تبقى محفوظة)`}
            />
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="text-sm font-semibold text-slate-900">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        {person.notes ? (
          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {person.notes}
          </p>
        ) : null}
      </Card>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="h-5 w-1 rounded bg-brand-600" />
          إصدار معاملة
        </h2>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {FORMS.map((form) => (
            <li key={form.type}>
              <Link
                href={`/documents/new?form=${form.type}&person=${person.id}`}
                className="flex h-full flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-center shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50/50"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <FormIcon name={form.icon} className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold leading-snug text-slate-800">{form.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="border-b border-slate-100 px-4 py-3 font-bold text-slate-900">
            المستندات الصادرة له ({documents.total})
          </h2>
          {documents.items.length ? (
            <DocumentList items={documents.items} showPerson={false} />
          ) : (
            <p className="px-4 py-8 text-center text-sm text-slate-500">لم يصدر له أي مستند بعد.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-bold text-slate-900">
              أفراد السجل نفسه {person.recordNo ? `(${person.recordNo})` : ""} · {family.length}
            </h2>
            <Link
              href={`/persons/new?recordNo=${encodeURIComponent(person.recordNo)}&familyName=${encodeURIComponent(person.familyName)}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              إضافة فرد
            </Link>
          </div>
          {family.length ? (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {family.map((m) => (
                <li key={m.id}>
                  <Link href={`/persons/${m.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {m.firstName} {m.familyName}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        الأب: {m.fatherName || "—"} · الأم: {m.motherName || "—"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-500">{m.birthDate}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-slate-500">لا يوجد أفراد آخرون على هذا السجل.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
