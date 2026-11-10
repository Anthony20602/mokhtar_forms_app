import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PersonForm } from "@/frontend/components/persons/PersonForm";
import { Notice, PageHeader } from "@/frontend/components/ui/ui";
import { load } from "@/backend/database/load";
import { getPerson, getReligionOptions } from "@/backend/services/persons";

export const metadata: Metadata = { title: "تعديل بيانات" };

export default async function EditPersonPage(props: PageProps<"/persons/[id]/edit">) {
  const id = Number((await props.params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { data, error } = await load(async () => {
    const [person, religions] = await Promise.all([getPerson(id), getReligionOptions()]);
    return { person, religions };
  });
  if (error) return <Notice>{error}</Notice>;
  if (!data?.person) notFound();

  return (
    <>
      <PageHeader
        title="تعديل البيانات"
        subtitle={`${data.person.firstName} ${data.person.familyName}`}
      />
      <PersonForm person={data.person} religions={data.religions} />
    </>
  );
}
