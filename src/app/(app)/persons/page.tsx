import { FileSpreadsheet, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { PersonSearch } from "@/frontend/components/persons/PersonSearch";
import { ButtonLink, Notice, PageHeader } from "@/frontend/components/ui/ui";
import { load } from "@/backend/database/load";
import { searchPersons } from "@/backend/services/persons";
import { firstParam } from "@/shared/params";

export const metadata: Metadata = { title: "الأهالي" };

export default async function PersonsPage(props: PageProps<"/persons">) {
  const params = await props.searchParams;
  const q = firstParam(params.q);
  const { data, error } = await load(() => searchPersons({ q, limit: 30 }));

  return (
    <>
      <PageHeader
        title="سجل الأهالي"
        subtitle="اختر الشخص لعرض بياناته وإصدار معاملة له"
        actions={
          <>
            <ButtonLink href="/persons/import" variant="secondary">
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              استيراد من Excel
            </ButtonLink>
            <ButtonLink href="/persons/new">
              <UserPlus className="h-4 w-4" aria-hidden />
              إضافة شخص
            </ButtonLink>
          </>
        }
      />
      {error ? <Notice>{error}</Notice> : null}
      {data ? <PersonSearch initialQuery={q} initial={data} /> : null}
    </>
  );
}
