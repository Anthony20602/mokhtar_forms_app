import type { MetadataRoute } from "next";

// Lets a phone "Add to Home screen" and open the app like an installed one.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "معاملات المختار",
    short_name: "المختار",
    description: "سجلات الأهالي وإصدار إفادات ومعاملات المختار",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#17413a",
    icons: [{ src: "/logo.png", sizes: "any", type: "image/png" }],
  };
}
