import { z } from "zod";

const text = (max: number) => z.string().trim().max(max).default("");

export const personInputSchema = z
  .object({
    recordNo: text(40),
    familyName: text(120),
    firstName: text(120),
    fatherName: text(120),
    motherName: text(160),
    birthDate: text(40),
    gender: text(20),
    personalReligion: text(80),
    recordReligion: text(80),
    notes: text(2000),
  })
  .refine((p) => p.firstName !== "" || p.familyName !== "", {
    message: "الاسم أو الشهرة مطلوب",
    path: ["firstName"],
  });

const offsetSchema = z.object({
  dx: z.number().min(-300).max(300),
  dy: z.number().min(-300).max(300),
});

export const docDataSchema = z.object({
  values: z.record(z.string().max(60), z.string().max(4000)),
  offsets: z.record(z.string().max(60), offsetSchema).optional(),
  extras: z
    .array(
      z.object({
        id: z.string().max(40),
        text: z.string().max(500),
        x: z.number().min(-50).max(260),
        y: z.number().min(-50).max(350),
        size: z.number().min(5).max(40),
      }),
    )
    .max(60)
    .optional(),
  showBackground: z.boolean().optional(),
});

export const documentCreateSchema = z.object({
  formType: z.string().min(1).max(60),
  personId: z.number().int().positive().nullable().optional(),
  data: docDataSchema,
});

export const documentUpdateSchema = z.object({ data: docDataSchema });

export const settingsSchema = z.object({
  mukhtarName: text(120),
  town: text(120),
  qadaa: text(120),
  muhafaza: text(120),
  phone: text(60),
  defaultPrinter: text(200),
  printOffsetX: z.coerce.number().min(-30).max(30).default(0),
  printOffsetY: z.coerce.number().min(-30).max(30).default(0),
  valueFontSize: z.coerce.number().min(6).max(18).default(11),
});

export const printRequestSchema = z.object({
  mode: z.enum(["server", "browser"]).default("server"),
  printer: z.string().max(200).optional(),
  copies: z.number().int().min(1).max(20).default(1),
});

export const listQuerySchema = z.object({
  q: z.string().max(200).default(""),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});
