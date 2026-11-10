import { NextResponse } from "next/server";
import { z } from "zod";
import { createDocument, listDocuments } from "@/lib/documents";
import { getForm } from "@/lib/forms/registry";
import { AppError, route } from "@/lib/http";
import { documentCreateSchema, listQuerySchema } from "@/lib/validation";

const filterSchema = listQuerySchema.extend({
  personId: z.coerce.number().int().positive().optional(),
  formType: z.string().max(60).optional(),
});

// GET /api/documents?q=...&personId=..&formType=..&limit=..&offset=..
export const GET = route(async (req) => {
  const params = filterSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return listDocuments(params);
});

export const POST = route(async (req) => {
  const input = documentCreateSchema.parse(await req.json());
  if (!getForm(input.formType)) throw new AppError(400, "نوع المستند غير معروف.");
  const doc = await createDocument({
    formType: input.formType,
    personId: input.personId ?? null,
    data: input.data,
  });
  return NextResponse.json(doc, { status: 201 });
});
