"use client";

import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { api } from "@/frontend/api/client";
import type { Person } from "@/shared/types";

const MAX_SUGGESTIONS = 8;

interface Result {
  items: Person[];
  total: number;
}

/**
 * Search box with a dropdown of matching people. Type to filter, move with the
 * arrow keys, Enter (or a tap / click) opens the person. Enter without choosing
 * anything opens the full results page for what was typed.
 */
export function PersonCombobox({
  autoFocus = false,
  placeholder = "الاسم، الشهرة، اسم الأب أو رقم السجل",
}: {
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  // The text the current results were fetched for (they lag behind while typing).
  const [resultFor, setResultFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const query = q.trim();

  // Fetch suggestions shortly after the last keystroke; a newer keystroke cancels the older request.
  useEffect(() => {
    // Nothing typed: the dropdown is hidden, so there is nothing to fetch.
    if (!query) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api<Result>(
          `/api/persons?q=${encodeURIComponent(query)}&limit=${MAX_SUGGESTIONS}`,
          { signal: controller.signal },
        );
        setResult(data);
        setResultFor(query);
        setError(null);
        setActive(data.items.length ? 0 : -1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setResult(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close when clicking or tapping anywhere else.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  // Keep the highlighted row visible while moving with the keyboard.
  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const showPanel = open && query !== "";
  const hasMore = total > items.length;

  function choose(person: Person) {
    setOpen(false);
    router.push(`/persons/${person.id}`);
  }

  function showAll() {
    setOpen(false);
    router.push(`/persons?q=${encodeURIComponent(query)}`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        if (items.length) setActive((i) => (i + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setOpen(true);
        if (items.length) setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (!query) return;
        // Only trust the highlighted row if it belongs to what is typed right now.
        if (!loading && resultFor === query && showPanel && active >= 0 && items[active]) choose(items[active]);
        else showAll();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        } else if (q) setQ("");
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative text-slate-900">
      <Search className="pointer-events-none absolute start-3.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="text"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label="بحث بالاسم أو الرقم"
        value={q}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border-0 bg-white py-3 ps-11 pe-11 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/30"
      />
      {loading ? (
        <Loader2 className="absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden />
      ) : q ? (
        <button
          type="button"
          onClick={() => {
            setQ("");
            setOpen(false);
          }}
          className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden />
          <span className="sr-only">مسح البحث</span>
        </button>
      ) : null}

      {showPanel ? (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {error ? (
            <p role="alert" className="px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-4 text-center text-sm text-slate-500" aria-live="polite">
              {loading || result === null ? "جارٍ البحث…" : "لا توجد نتائج. جرّب جزءاً من الاسم أو رقم السجل."}
            </p>
          ) : null}

          {items.length ? (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="النتائج"
              className={`max-h-[22rem] overflow-y-auto py-1 transition-opacity ${loading ? "opacity-60" : ""}`}
            >
              {items.map((p, i) => (
                <li
                  key={p.id}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  // Keep focus in the input so tapping a row does not close the list first.
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(p)}
                  onPointerMove={() => i !== active && setActive(i)}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${i === active ? "bg-brand-50" : ""}`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-base font-bold text-brand-800">
                    {(p.firstName || p.familyName || "؟").charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block truncate text-sm font-bold">
                      {p.firstName} {p.fatherName} {p.familyName}
                    </span>
                    <span className="block truncate text-xs text-slate-600">
                      الأم: {p.motherName || "—"}
                      {p.birthDate ? ` · مواليد ${p.birthDate}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    سجل {p.recordNo || "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {items.length ? (
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={showAll}
              className="block w-full border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              {hasMore ? `عرض كل النتائج (${total.toLocaleString("en-US")})` : "عرض في صفحة الأهالي"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
