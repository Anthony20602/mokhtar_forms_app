import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/frontend/components/documents/DocumentEditor";
import { Notice } from "@/frontend/components/ui/ui";
import { latestDocumentFor } from "@/backend/services/documents";
import { load } from "@/backend/database/load";
import { getPerson } from "@/backend/services/persons";
import { getSettings } from "@/backend/services/settings";
import { fullName } from "@/shared/arabic";
import { getForm } from "@/shared/forms";
import { buildInitialData } from "@/shared/forms/prefill";
import { firstParam } from "@/shared/params";

export const metadata: Metadata = { title: "مستند جديد" };

// /documents/new?form=residence&person=123  (person is optional: blank form)
export default async function NewDocumentPage(props: PageProps<"/documents/new">) {
  const params = await props.searchParams;
  const form = getForm(firstParam(params.form));
  if (!form) notFound();
  const personId = Number(firstParam(params.person));

  const { data, error } = await load(async () => {
    const [settings, person] = await Promise.all([
      getSettings(),
      Number.isInteger(personId) && personId > 0 ? getPerson(personId) : null,
    ]);
    const previous = person ? await latestDocumentFor(person.id, form.type) : null;
    return { settings, person, initialData: buildInitialData(form, person, settings, previous?.data ?? null) };
  });
  if (error) return <Notice>{error}</Notice>;
  if (!data) notFound();

  return (
    <DocumentEditor
      form={form}
      settings={data.settings}
      initialData={data.initialData}
      person={data.person ? { id: data.person.id, name: fullName(data.person) } : null}
    />
  );
}
