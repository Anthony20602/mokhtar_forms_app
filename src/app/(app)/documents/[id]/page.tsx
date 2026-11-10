import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/DocumentEditor";
import { Notice } from "@/components/ui";
import { getDocument } from "@/lib/documents";
import { getForm } from "@/lib/forms";
import { load } from "@/lib/load";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "مستند" };

export default async function DocumentPage(props: PageProps<"/documents/[id]">) {
  const id = Number((await props.params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { data, error } = await load(async () => {
    const [doc, settings] = await Promise.all([getDocument(id), getSettings()]);
    return { doc, settings };
  });
  if (error) return <Notice>{error}</Notice>;
  if (!data?.doc) notFound();
  const { doc, settings } = data;

  const form = getForm(doc.formType);
  if (!form) return <Notice>نوع هذا المستند ({doc.formType}) لم يعد معرّفاً في البرنامج.</Notice>;

  return (
    <DocumentEditor
      // A fresh editor per saved version, so it never keeps typing on top of stale state.
      key={`${doc.id}:${doc.updatedAt}`}
      form={form}
      settings={settings}
      initialData={doc.data}
      document={{ id: doc.id, serialNo: doc.serialNo, serialYear: doc.serialYear, updatedAt: doc.updatedAt }}
      person={doc.personId ? { id: doc.personId, name: doc.personName || "صاحب العلاقة" } : null}
    />
  );
}
