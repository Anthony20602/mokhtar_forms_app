import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { describeDbError } from "./db";

/** An error whose message is safe and useful to show to the person using the app. */
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = "العنصر") => new AppError(404, `${what} غير موجود.`);

/**
 * Wraps a route handler: plain return values become JSON, and every failure
 * becomes a JSON `{ error }` body with a fitting status code.
 */
export function route<C>(
  handler: (req: NextRequest, ctx: C) => Promise<unknown>,
): (req: NextRequest, ctx: C) => Promise<Response> {
  return async (req, ctx) => {
    try {
      const result = await handler(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const where = first?.path?.length ? ` (${first.path.join(".")})` : "";
        return NextResponse.json(
          { error: `بيانات غير صالحة${where}: ${first?.message ?? ""}`, issues: err.issues },
          { status: 400 },
        );
      }
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: "صيغة الطلب غير صالحة." }, { status: 400 });
      }
      const dbMessage = describeDbError(err);
      if (dbMessage) {
        console.error(`[api] ${req.method} ${req.nextUrl.pathname}: database unavailable`);
        return NextResponse.json({ error: dbMessage }, { status: 503 });
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname} failed:`, err);
      return NextResponse.json({ error: "حدث خطأ غير متوقع في الخادم." }, { status: 500 });
    }
  };
}

export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "رقم غير صالح.");
  return id;
}
