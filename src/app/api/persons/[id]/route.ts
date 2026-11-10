import { notFound, parseId, route } from "@/lib/http";
import { deletePerson, getPerson, updatePerson } from "@/lib/persons";
import { personInputSchema } from "@/lib/validation";

type Ctx = RouteContext<"/api/persons/[id]">;

export const GET = route<Ctx>(async (_req, ctx) => {
  const person = await getPerson(parseId((await ctx.params).id));
  if (!person) throw notFound("الشخص");
  return person;
});

export const PUT = route<Ctx>(async (req, ctx) => {
  const id = parseId((await ctx.params).id);
  const person = await updatePerson(id, personInputSchema.parse(await req.json()));
  if (!person) throw notFound("الشخص");
  return person;
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  if (!(await deletePerson(parseId((await ctx.params).id)))) throw notFound("الشخص");
  return { ok: true };
});
