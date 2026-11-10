import { getDocument } from "@/lib/documents";
import { formTitle } from "@/lib/forms/registry";
import { notFound, parseId, route } from "@/lib/http";
import { renderDocumentPdf } from "@/lib/printing";

type Ctx = RouteContext<"/api/documents/[id]/pdf">;

// GET /api/documents/12/pdf            -> opens in the PDF viewer of the browser
// GET /api/documents/12/pdf?download=1 -> saves as a file
export const GET = route<Ctx>(async (req, ctx) => {
  const id = parseId((await ctx.params).id);
  const doc = await getDocument(id);
  if (!doc) throw notFound("المستند");

  const pdf = await renderDocumentPdf(id, req.nextUrl.port || process.env.PORT || "3000");
  const name = `${formTitle(doc.formType)} - ${doc.personName || doc.id} - ${doc.serialNo}.pdf`;
  const disposition = req.nextUrl.searchParams.has("download") ? "attachment" : "inline";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `${disposition}; filename="document-${doc.id}.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "no-store",
    },
  });
});
