import { Printer } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/shared/arabic";
import { formTitle } from "@/shared/forms/registry";
import type { DocumentSummary } from "@/shared/types";

/** Rows of issued documents; each row opens the document for editing / reprinting. */
export function DocumentList({
  items,
  showPerson = true,
}: {
  items: DocumentSummary[];
  showPerson?: boolean;
}) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((doc) => (
        <li key={doc.id}>
          <Link
            href={`/documents/${doc.id}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-slate-50"
          >
            <span className="w-16 shrink-0 text-xs font-semibold tabular-nums text-slate-500">
              {doc.serialNo}/{doc.serialYear}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">
                {formTitle(doc.formType)}
              </span>
              {showPerson ? (
                <span className="block truncate text-sm text-slate-600">
                  {doc.personName || "—"}
                </span>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
              {doc.printCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-brand-700" title="عدد مرات الطباعة">
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                  {doc.printCount}
                </span>
              ) : (
                <span className="text-amber-700">لم يُطبع</span>
              )}
              <span dir="ltr" className="tabular-nums">
                {formatDateTime(doc.createdAt)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
