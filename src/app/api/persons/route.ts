import { NextResponse } from "next/server";
import { route } from "@/lib/http";
import { createPerson, searchPersons } from "@/lib/persons";
import { listQuerySchema, personInputSchema } from "@/lib/validation";

// GET /api/persons?q=...&limit=30&offset=0
export const GET = route(async (req) => {
  const params = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return searchPersons(params);
});

export const POST = route(async (req) => {
  const person = await createPerson(personInputSchema.parse(await req.json()));
  return NextResponse.json(person, { status: 201 });
});
