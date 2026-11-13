import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
 resolve: {
  alias: {
   "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
 },
 test: {
  environment: "node",
  globals: true,
  // Same placeholders as CI: unit tests never need (or reach) a real Supabase
  // project, and modules that validate public env at import must still load.
  env: {
   NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_ci_placeholder",
  },
  exclude: ["node_modules/**", ".next/**", "coverage/**", "dist/**", "e2e/**"],
  coverage: {
   provider: "v8",
   reporter: ["text", "html"],
   exclude: ["src/types/supabase.generated.ts", "**/*.d.ts", ".next/**"],
  },
 },
});
