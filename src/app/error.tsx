"use client";

import { useEffect } from "react";

// Last-resort screen for an unexpected failure while rendering a page.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid flex-1 place-items-center p-6 text-center">
      <div>
        <h1 className="text-xl font-bold text-slate-900">حدث خطأ غير متوقع</h1>
        <p className="mt-1 text-sm text-slate-600">
          حاول مرة أخرى. إذا تكرر الخطأ، أعد تشغيل البرنامج على حاسوب المكتب.
        </p>
        {error.digest ? (
          <p dir="ltr" className="mt-1 text-xs text-slate-400">
            ref: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
