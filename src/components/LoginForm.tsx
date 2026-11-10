"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/client";
import { Button, Notice } from "./ui";

export function LoginForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/login", { body: { password } });
      // Full reload so every page is requested again with the new session cookie.
      window.location.href = next;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-start">
      <label className="block">
        <span className="sr-only">كلمة المرور</span>
        <input
          type="password"
          className="input !py-2.5 text-center"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          autoComplete="current-password"
          autoFocus
          required
        />
      </label>
      {error ? <Notice>{error}</Notice> : null}
      <Button type="submit" disabled={busy} className="w-full !py-2.5">
        {busy ? "جارٍ الدخول…" : "دخول"}
      </Button>
    </form>
  );
}
