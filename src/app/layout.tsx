import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cairo";
import "@fontsource-variable/noto-naskh-arabic";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "معاملات المختار", template: "%s · معاملات المختار" },
  description: "سجلات الأهالي وإصدار إفادات ومعاملات المختار",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17413a",
};

// Every page reads live data from PostgreSQL, so nothing is pre-rendered at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
