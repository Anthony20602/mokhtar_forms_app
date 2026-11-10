import { deleteDocument, getDocument, updateDocument } from "@/lib/documents";
import { notFound, parseId, route } from "@/lib/http";
import { documentUpdateSchema } from "@/lib/validation";

type Ctx = RouteContext<"/api/documents/[id]">;

export const GET = route<Ctx>(async (_req, ctx) => {
  const doc = await getDocument(parseId((await ctx.params).id));
  if (!doc) throw notFound("المستند");
  return doc;
});

export const PUT = route<Ctx>(async (req, ctx) => {
  const id = parseId((await ctx.params).id);
  const { data } = documentUpdateSchema.parse(await req.json());
  const doc = await updateDocument(id, data);
  if (!doc) throw notFound("المستند");
  return doc;
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  if (!(await deleteDocument(parseId((await ctx.params).id)))) throw notFound("المستند");
  return { ok: true };
});
