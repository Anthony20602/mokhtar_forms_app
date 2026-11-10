/**
 * Browser-side call to this app's API. A plain object is sent as JSON; a FormData (file upload)
 * is sent as is. Throws an Error carrying the server's message.
 */
export async function api<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers: options.body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("تعذّر الاتصال بالخادم. تأكّد أن البرنامج يعمل على حاسوب المكتب.");
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new Error(payload?.error ?? `خطأ غير متوقع (${res.status}).`);
  }
  return payload as T;
}
