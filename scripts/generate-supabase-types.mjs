import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!projectRef) {
 throw new Error("SUPABASE_PROJECT_REF is required to generate remote Supabase types.");
}

const repoRoot = resolve(import.meta.dirname, "..");
const targetPath = join(repoRoot, "src/types/supabase.generated.ts");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "hanzihome-supabase-types-"));
const temporaryPath = join(temporaryDirectory, "supabase.generated.ts");
const executable = process.platform === "win32" ? "supabase.exe" : "supabase";
const cliPath = join(repoRoot, "node_modules", ".bin", executable);

try {
 const result = spawnSync(
  cliPath,
  ["gen", "types", "typescript", "--project-id", projectRef, "--schema", "public"],
  {
   cwd: repoRoot,
   encoding: "utf8",
   env: process.env,
  },
 );

 if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
 }

 await writeFile(temporaryPath, result.stdout);

 if (process.argv.includes("--check")) {
  const currentTypes = await readFile(targetPath, "utf8");

  if (currentTypes !== result.stdout) {
   throw new Error(
    "Supabase generated types are stale. Run `npm run types:supabase` and commit the result.",
   );
  }

  process.stdout.write("Supabase generated types are current.\n");
 } else {
  await writeFile(targetPath, result.stdout);
  process.stdout.write(`Updated ${targetPath}\n`);
 }
} finally {
 await rm(temporaryDirectory, { force: true, recursive: true });
}
