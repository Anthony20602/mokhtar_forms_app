import { AppNav } from "@/components/AppNav";
import { authEnabled } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav showLogout={authEnabled()} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 sm:px-4 sm:py-6">{children}</main>
      <footer className="no-print border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        معاملات المختار · نسخة الويب ١٫٠
      </footer>
    </>
  );
}
