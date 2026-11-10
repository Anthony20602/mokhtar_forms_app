import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  authEnabled,
  checkPassword,
  createSessionToken,
  sessionMaxAge,
} from "@/lib/auth";
import { AppError, route } from "@/lib/http";

export const POST = route(async (req) => {
  const { password } = z.object({ password: z.string().max(200) }).parse(await req.json());
  if (authEnabled() && !checkPassword(password)) {
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    throw new AppError(401, "كلمة المرور غير صحيحة.");
  }
  const res = NextResponse.json({ ok: true });
  if (authEnabled()) {
    res.cookies.set(SESSION_COOKIE, createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: sessionMaxAge,
    });
  }
  return res;
});
