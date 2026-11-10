import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center p-6 text-center">
      <div>
        <p className="text-5xl font-bold text-slate-300">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">الصفحة غير موجودة</h1>
        <p className="mt-1 text-sm text-slate-600">ربما تم حذف هذا السجل أو أن العنوان غير صحيح.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </main>
  );
}
