import { NextResponse } from "next/server";
import { route } from "@/backend/api/http";
import { createPerson, searchPersons } from "@/backend/services/persons";
import { listQuerySchema, personInputSchema } from "@/backend/api/validation";

// GET /api/persons?q=...&limit=30&offset=0
export const GET = route(async (req) => {
  const params = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return searchPersons(params);
});

export const POST = route(async (req) => {
  const person = await createPerson(personInputSchema.parse(await req.json()));
  return NextResponse.json(person, { status: 201 });
});
