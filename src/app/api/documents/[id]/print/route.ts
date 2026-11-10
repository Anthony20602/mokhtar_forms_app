import { getDocument, markPrinted } from "@/lib/documents";
import { notFound, parseId, route } from "@/lib/http";
import { printPdf, renderDocumentPdf } from "@/lib/printing";
import { getSettings } from "@/lib/settings";
import { printRequestSchema } from "@/lib/validation";

type Ctx = RouteContext<"/api/documents/[id]/print">;

// POST { mode: "server", printer?, copies? }  -> prints on a printer attached to this PC
// POST { mode: "browser" }                    -> only records that the device printed it itself
export const POST = route<Ctx>(async (req, ctx) => {
  const id = parseId((await ctx.params).id);
  const body = printRequestSchema.parse(await req.json().catch(() => ({})));
  if (!(await getDocument(id))) throw notFound("المستند");

  if (body.mode === "server") {
    const printer = body.printer ?? (await getSettings()).defaultPrinter;
    const pdf = await renderDocumentPdf(id, req.nextUrl.port || process.env.PORT || "3000");
    await printPdf(pdf, { printer: printer || undefined, copies: body.copies });
  }
  await markPrinted(id, body.copies);
  return { ok: true };
});
