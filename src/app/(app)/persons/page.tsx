import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { PersonSearch } from "@/components/PersonSearch";
import { ButtonLink, Notice, PageHeader } from "@/components/ui";
import { load } from "@/lib/load";
import { searchPersons } from "@/lib/persons";

export const metadata: Metadata = { title: "الأهالي" };

export default async function PersonsPage(props: PageProps<"/persons">) {
  const params = await props.searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q) ?? "";
  const { data, error } = await load(() => searchPersons({ q, limit: 30 }));

  return (
    <>
      <PageHeader
        title="سجل الأهالي"
        subtitle="اختر الشخص لعرض بياناته وإصدار معاملة له"
        actions={
          <ButtonLink href="/persons/new">
            <UserPlus className="h-4 w-4" aria-hidden />
            إضافة شخص
          </ButtonLink>
        }
      />
      {error ? <Notice>{error}</Notice> : null}
      {data ? <PersonSearch initialQuery={q} initial={data} /> : null}
    </>
  );
}
