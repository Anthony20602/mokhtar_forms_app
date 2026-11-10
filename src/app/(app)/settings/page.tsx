import os from "node:os";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { SettingsForm } from "@/frontend/components/settings/SettingsForm";
import { Card, Notice, PageHeader } from "@/frontend/components/ui/ui";
import { authEnabled } from "@/backend/auth/auth";
import { queryOne } from "@/backend/database/db";
import { load } from "@/backend/database/load";
import { getSettings } from "@/backend/services/settings";

export const metadata: Metadata = { title: "الإعدادات" };

/** Addresses of this PC on the local network, for opening the app from a phone. */
function lanAddresses(): string[] {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((n): n is os.NetworkInterfaceInfo => Boolean(n) && n!.family === "IPv4" && !n!.internal)
    .map((n) => n.address);
}

export default async function SettingsPage() {
  const { data, error } = await load(async () => {
    const [settings, db] = await Promise.all([
      getSettings(),
      queryOne<{ version: string; name: string; persons: number; documents: number }>(
        `SELECT current_setting('server_version') AS version, current_database() AS name,
                (SELECT count(*)::int FROM persons) AS persons,
                (SELECT count(*)::int FROM documents) AS documents`,
      ),
    ]);
    return { settings, db };
  });
  const port = ((await headers()).get("host") ?? "").split(":")[1] ?? "3000";
  const addresses = lanAddresses();

  return (
    <>
      <PageHeader title="الإعدادات" />
      {error ? <Notice>{error}</Notice> : null}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">{data ? <SettingsForm initial={data.settings} /> : null}</div>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-2 font-bold text-slate-900">الفتح من الهاتف</h2>
            <p className="mb-2 text-sm text-slate-600">
              صِل الهاتف بنفس شبكة الواي فاي، ثم افتح في المتصفح:
            </p>
            {addresses.length ? (
              <ul className="space-y-1">
                {addresses.map((ip) => (
                  <li key={ip} dir="ltr" className="rounded-lg bg-slate-100 px-3 py-1.5 text-center font-mono text-sm font-semibold text-slate-900">
                    http://{ip}:{port}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-amber-700">هذا الحاسوب غير متصل بأي شبكة حالياً.</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {authEnabled()
                ? "الدخول محمي بكلمة مرور (APP_PASSWORD)."
                : "الدخول غير محمي بكلمة مرور: أي جهاز على الشبكة يستطيع فتح البرنامج. لتفعيل الحماية ضع APP_PASSWORD في الملف ‎.env.local ثم أعد تشغيل البرنامج."}
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="mb-2 font-bold text-slate-900">قاعدة البيانات</h2>
            {data?.db ? (
              <dl className="space-y-1 text-sm">
                <Row label="الحالة" value="متصلة" ok />
                <Row label="PostgreSQL" value={data.db.version} />
                <Row label="القاعدة" value={data.db.name} />
                <Row label="الأهالي" value={data.db.persons.toLocaleString("en-US")} />
                <Row label="المستندات" value={data.db.documents.toLocaleString("en-US")} />
              </dl>
            ) : (
              <p className="text-sm font-semibold text-red-700">غير متصلة</p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              نسخة احتياطية: شغّل <code dir="ltr" className="rounded bg-slate-100 px-1">npm run db:backup</code> في مجلد البرنامج.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-600">{label}</dt>
      <dd dir="auto" className={`font-semibold ${ok ? "text-emerald-700" : "text-slate-900"}`}>
        {value}
      </dd>
    </div>
  );
}
