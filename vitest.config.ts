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
  coverage: {
   provider: "v8",
   reporter: ["text", "html"],
   exclude: ["src/types/supabase.generated.ts", "**/*.d.ts", ".next/**"],
  },
 },
});
