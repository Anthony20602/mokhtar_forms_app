import { FileSpreadsheet } from "lucide-react";
import type { Metadata } from "next";
import { PersonForm } from "@/frontend/components/persons/PersonForm";
import { ButtonLink, Notice, PageHeader } from "@/frontend/components/ui/ui";
import { load } from "@/backend/database/load";
import { getReligionOptions } from "@/backend/services/persons";
import { firstParam } from "@/shared/params";

export const metadata: Metadata = { title: "إضافة شخص" };

export default async function NewPersonPage(props: PageProps<"/persons/new">) {
  const params = await props.searchParams;
  const { data: religions, error } = await load(getReligionOptions);

  return (
    <>
      <PageHeader
        title="إضافة شخص جديد"
        subtitle="يُضاف إلى سجل الأهالي ويمكن إصدار المعاملات له مباشرة"
        actions={
          <ButtonLink href="/persons/import" variant="secondary">
            <FileSpreadsheet className="h-4 w-4" aria-hidden />
            استيراد عدة أشخاص من Excel
          </ButtonLink>
        }
      />
      {error ? <Notice>{error}</Notice> : null}
      {religions ? (
        <PersonForm
          religions={religions}
          // "Add a family member" on a person page passes the shared registry data along.
          defaults={{ recordNo: firstParam(params.recordNo), familyName: firstParam(params.familyName) }}
        />
      ) : null}
    </>
  );
}
