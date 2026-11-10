"use client";

import { ArrowRight, Download, Printer, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { PrinterInfo } from "@/lib/types";
import { Button, buttonClass } from "./ui";

/**
 * Actions above the print preview. Never printed itself.
 *  - "طباعة": the print dialog of the device you are holding (PC, phone, tablet).
 *  - "طابعة المكتب": the server PC sends the page straight to one of its printers,
 *    which is how a phone prints without having the printer installed.
 */
export function PrintToolbar({
  documentId,
  title,
  defaultPrinter,
}: {
  documentId: number;
  title: string;
  defaultPrinter: string;
}) {
  const [printers, setPrinters] = useState<PrinterInfo[] | null>(null);
  const [printer, setPrinter] = useState(defaultPrinter);
  const [copies, setCopies] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<{ printers: PrinterInfo[] }>("/api/printers")
      .then(({ printers: list }) => {
        setPrinters(list);
        setPrinter((current) => {
          if (current && list.some((p) => p.name === current)) return current;
          return list.find((p) => p.isDefault)?.name ?? list[0]?.name ?? "";
        });
      })
      .catch(() => setPrinters([]));
  }, []);

  async function printHere() {
    setMessage(null);
    // Wait for the Arabic fonts so the dialog's preview matches the screen.
    await document.fonts.ready.catch(() => {});
    window.print();
    api(`/api/documents/${documentId}/print`, { body: { mode: "browser" } }).catch(() => {});
  }

  async function printOnOfficePrinter() {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/api/documents/${documentId}/print`, {
        body: { mode: "server", printer: printer || undefined, copies },
      });
      setMessage({ ok: true, text: `تم إرسال المستند إلى الطابعة${printer ? ` (${printer})` : ""}.` });
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <Link href={`/documents/${documentId}`} className={buttonClass("ghost", "!px-2")}>
          <ArrowRight className="h-4 w-4" aria-hidden />
          تعديل
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-bold text-slate-900">{title}</h1>

        <Button onClick={printHere}>
          <Printer className="h-4 w-4" aria-hidden />
          طباعة
        </Button>
        <a href={`/api/documents/${documentId}/pdf?download=1`} className={buttonClass("secondary")}>
          <Download className="h-4 w-4" aria-hidden />
          PDF
        </a>
      </div>

      {printers && printers.length > 0 ? (
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-3 py-2">
            <span className="text-sm font-semibold text-slate-700">طابعة المكتب:</span>
            <select
              className="input !w-auto min-w-0 max-w-full flex-1 !py-1.5 sm:max-w-xs"
              value={printer}
              onChange={(e) => setPrinter(e.target.value)}
              aria-label="الطابعة"
            >
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                  {p.isDefault ? " (الافتراضية)" : ""}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-slate-700">
              نسخ
              <input
                type="number"
                min={1}
                max={20}
                value={copies}
                onChange={(e) => setCopies(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                className="input !w-16 !py-1.5"
              />
            </label>
            <Button variant="secondary" onClick={printOnOfficePrinter} disabled={busy} className="!py-1.5">
              <Send className="h-4 w-4" aria-hidden />
              {busy ? "جارٍ الإرسال…" : "إرسال إلى الطابعة"}
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          role="status"
          className={`px-3 py-2 text-center text-sm font-semibold ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
