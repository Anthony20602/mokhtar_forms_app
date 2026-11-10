"use client";

import { BarChart3, FileText, Home, LogOut, Settings, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/frontend/api/client";

const LINKS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/persons", label: "الأهالي", icon: Users },
  { href: "/documents", label: "المستندات", icon: FileText },
  { href: "/stats", label: "إحصاءات", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function AppNav({ showLogout }: { showLogout: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }

  return (
    <header className="no-print sticky top-0 z-30 bg-brand-800 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 py-2 pe-2">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          </span>
          <span className="hidden text-base font-bold sm:inline">معاملات المختار</span>
        </Link>
        <nav className="flex min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-3.5 text-sm font-medium transition-colors sm:px-3 ${
                isActive(href)
                  ? "border-white text-white"
                  : "border-transparent text-white/75 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className={isActive(href) ? "" : "hidden sm:inline"}>{label}</span>
            </Link>
          ))}
        </nav>
        {showLogout ? (
          <button
            type="button"
            onClick={logout}
            title="تسجيل الخروج"
            className="shrink-0 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="sr-only">تسجيل الخروج</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
