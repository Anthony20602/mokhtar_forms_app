import type { Metadata } from "next";
import { PersonImport } from "@/frontend/components/persons/PersonImport";
import { PageHeader } from "@/frontend/components/ui/ui";

export const metadata: Metadata = { title: "استيراد من Excel" };

export default function ImportPersonsPage() {
  return (
    <>
      <PageHeader title="استيراد أشخاص من Excel" subtitle="أضف عدة أشخاص دفعة واحدة، مع فحص الملف ومعاينة قبل الإضافة" />
      <PersonImport />
    </>
  );
}
