import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/DocumentEditor";
import { Notice } from "@/components/ui";
import { fullName } from "@/lib/arabic";
import { latestDocumentFor } from "@/lib/documents";
import { getForm } from "@/lib/forms";
import { buildInitialData } from "@/lib/forms/prefill";
import { load } from "@/lib/load";
import { getPerson } from "@/lib/persons";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "مستند جديد" };

// /documents/new?form=residence&person=123  (person is optional: blank form)
export default async function NewDocumentPage(props: PageProps<"/documents/new">) {
  const params = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const form = getForm(one(params.form));
  if (!form) notFound();
  const personId = Number(one(params.person));

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
