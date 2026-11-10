"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/frontend/api/client";
import { Button } from "@/frontend/components/ui/ui";

/** Asks for confirmation, calls DELETE on `url`, then goes to `redirectTo`. */
export function DeleteButton({
  url,
  redirectTo,
  confirmText,
  label = "حذف",
}: {
  url: string;
  redirectTo: string;
  confirmText: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    try {
      await api(url, { method: "DELETE" });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      window.alert((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Button variant="danger" onClick={remove} disabled={busy}>
      <Trash2 className="h-4 w-4" aria-hidden />
      {busy ? "جارٍ الحذف…" : label}
    </Button>
  );
}
