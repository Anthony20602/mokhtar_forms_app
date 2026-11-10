import { route } from "@/backend/api/http";
import { buildTemplate } from "@/backend/services/personImport";

// GET the empty Excel template (column titles + instructions).
export const GET = route(async () => {
  const file = await buildTemplate();
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="people-import-template.xlsx"; filename*=UTF-8''${encodeURIComponent("قالب-استيراد-الأهالي.xlsx")}`,
      "Cache-Control": "no-store",
    },
  });
});
