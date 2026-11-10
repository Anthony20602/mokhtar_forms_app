"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/frontend/api/client";
import type { Person } from "@/shared/types";
import { Button, Chip, EmptyState, Notice } from "@/frontend/components/ui/ui";

const PAGE_SIZE = 30;

interface Result {
  items: Person[];
  total: number;
}

/** Live search over the villagers: results update as you type. */
export function PersonSearch({ initialQuery, initial }: { initialQuery: string; initial: Result }) {
  const [q, setQ] = useState(initialQuery);
  const [result, setResult] = useState<Result>(initial);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    // The server already rendered the results for the initial query.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api<Result>(
          `/api/persons?q=${encodeURIComponent(q)}&limit=${PAGE_SIZE}`,
          { signal: controller.signal },
        );
        setResult(data);
        setError(null);
        // Keep the address shareable / restorable with the Back button.
        window.history.replaceState(null, "", q ? `/persons?q=${encodeURIComponent(q)}` : "/persons");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError((err as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await api<Result>(
        `/api/persons?q=${encodeURIComponent(q)}&limit=${PAGE_SIZE}&offset=${result.items.length}`,
      );
      setResult((prev) => ({ items: [...prev.items, ...data.items], total: data.total }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          autoComplete="off"
          aria-label="بحث بالاسم أو الرقم"
          placeholder="الاسم، الشهرة، اسم الأب، اسم الأم أو رقم السجل"
          className="input !rounded-xl !py-3 !ps-11 !pe-11 !text-base shadow-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">مسح البحث</span>
          </button>
        ) : null}
      </div>

      <p className="text-sm text-slate-600" aria-live="polite">
        {loading ? "جارٍ البحث…" : `${result.total.toLocaleString("en-US")} نتيجة`}
        {!loading && q.trim() === "" ? " (كل السجل)" : ""}
      </p>

      {error ? <Notice>{error}</Notice> : null}

      {result.items.length === 0 && !loading && !error ? (
        <EmptyState
          title="لا توجد نتائج"
          hint="جرّب كتابة جزء من الاسم فقط، أو رقم السجل. يمكن كتابة أكثر من كلمة (الاسم والشهرة معاً)."
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {result.items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/persons/${p.id}`}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50/40"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 text-lg font-bold text-brand-800">
                  {(p.firstName || p.familyName || "؟").charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-slate-900">
                    {p.firstName} {p.familyName}
                  </span>
                  <span className="block truncate text-sm text-slate-600">
                    الأب: {p.fatherName || "—"} · الأم: {p.motherName || "—"}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    <Chip>سجل {p.recordNo || "—"}</Chip>
                    {p.birthDate ? <Chip>مواليد {p.birthDate}</Chip> : null}
                    {p.gender ? <Chip>{p.gender}</Chip> : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result.items.length < result.total ? (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "جارٍ التحميل…" : `عرض المزيد (${(result.total - result.items.length).toLocaleString("en-US")} متبقٍ)`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
