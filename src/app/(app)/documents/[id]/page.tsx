import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/frontend/components/documents/DocumentEditor";
import { Notice } from "@/frontend/components/ui/ui";
import { getDocument } from "@/backend/services/documents";
import { getForm } from "@/shared/forms";
import { load } from "@/backend/database/load";
import { getSettings } from "@/backend/services/settings";

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
