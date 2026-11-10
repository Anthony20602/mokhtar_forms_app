import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  // Only ever return to a path inside this app.
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  return (
    <main className="grid flex-1 place-items-center bg-gradient-to-bl from-brand-700 to-brand-800 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
        <span className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-brand-50">
          <Image src="/logo.png" alt="" width={64} height={64} priority className="h-16 w-16 object-contain" />
        </span>
        <h1 className="mt-3 text-xl font-bold text-slate-900">معاملات المختار</h1>
        <p className="mb-5 text-sm text-slate-600">أدخل كلمة المرور للمتابعة</p>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
