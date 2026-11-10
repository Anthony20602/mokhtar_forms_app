import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Architecture rules (see README, "Project structure"):
//   src/backend   server-only code: may use shared, never frontend
//   src/frontend  browser UI and API client: may use shared, never backend
//   src/shared    pure code both sides need: imports neither backend nor frontend
// (src/app holds the Next.js routes and may use all three.)
const forbid = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns: patterns.map((group) => ({ group: [group.path], message: group.why })) }],
});
const noBackend = { path: "@/backend/**", why: "Frontend code must not import backend code. Call the HTTP API (src/frontend/api/client.ts) instead." };
const noFrontend = { path: "@/frontend/**", why: "Backend and shared code must not depend on frontend code." };

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ["src/frontend/**"], rules: forbid(noBackend) },
  { files: ["src/backend/**"], rules: forbid(noFrontend) },
  { files: ["src/shared/**"], rules: forbid(noBackend, noFrontend) },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
