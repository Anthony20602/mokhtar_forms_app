import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintToolbar } from "@/frontend/components/documents/PrintToolbar";
import { DocumentSheet } from "@/frontend/components/sheets/DocumentSheet";
import { ScaledSheet } from "@/frontend/components/sheets/ScaledSheet";
import { Notice } from "@/frontend/components/ui/ui";
import { getDocument } from "@/backend/services/documents";
import { getForm } from "@/shared/forms";
import { load } from "@/backend/database/load";
import { getSettings } from "@/backend/services/settings";

export const metadata: Metadata = { title: "طباعة" };

// The page that gets printed: nothing but the A4 sheet (the toolbar hides itself
// on paper). The server's headless browser opens this same page to make the PDF.
export default async function PrintPage(props: PageProps<"/documents/[id]/print">) {
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
  if (!form) notFound();

  return (
    <div className="flex-1 bg-slate-300/70 print:bg-white">
      <PrintToolbar
        documentId={doc.id}
        title={`${form.title}${doc.personName ? ` · ${doc.personName}` : ""}`}
        defaultPrinter={settings.defaultPrinter}
      />
      <div className="mx-auto max-w-5xl p-3 sm:p-6 print:m-0 print:max-w-none print:p-0">
        <ScaledSheet maxZoom={1.25}>
          <DocumentSheet form={form} data={doc.data} settings={settings} />
        </ScaledSheet>
      </div>
    </div>
  );
}
