import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / binary-carrying packages must be loaded with Node's own require.
  serverExternalPackages: ["pg", "pdf-to-printer"],
  // Lets phones and other PCs on the office network open the dev server too.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
