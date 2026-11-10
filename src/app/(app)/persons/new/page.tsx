import type { Metadata } from "next";
import { PersonForm } from "@/components/PersonForm";
import { Notice, PageHeader } from "@/components/ui";
import { load } from "@/lib/load";
import { getReligionOptions } from "@/lib/persons";

export const metadata: Metadata = { title: "إضافة شخص" };

export default async function NewPersonPage(props: PageProps<"/persons/new">) {
  const params = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const { data: religions, error } = await load(getReligionOptions);

  return (
    <>
      <PageHeader title="إضافة شخص جديد" subtitle="يُضاف إلى سجل الأهالي ويمكن إصدار المعاملات له مباشرة" />
      {error ? <Notice>{error}</Notice> : null}
      {religions ? (
        <PersonForm
          religions={religions}
          // "Add a family member" on a person page passes the shared registry data along.
          defaults={{ recordNo: one(params.recordNo), familyName: one(params.familyName) }}
        />
      ) : null}
    </>
  );
}
