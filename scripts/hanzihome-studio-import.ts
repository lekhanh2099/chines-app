import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
 assertStudioInventoryBaseline,
 buildStudioImportPreview,
 loadStudioInventory,
 studioLessonMappingSchema,
} from "./hanzihome-studio-inventory.ts";

function defaultStudioRoot() {
 return resolve(import.meta.dirname, "..", "..", "hanzi-studio");
}

function argument(name: string): string | null {
 const index = process.argv.indexOf(name);
 return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

export async function createStudioImportPreview(
 studioRoot: string,
 lessonMappings: Parameters<typeof buildStudioImportPreview>[1] = {},
) {
 const preview = await buildStudioImportPreview(studioRoot, lessonMappings);
 if (preview.documents.some((document) => document.unresolvedReferences.length > 0)) {
  return {
   ...preview,
   status: "blocked",
   reason: "Canonical HanziHome lesson IDs must be supplied before database writes.",
  };
 }
 return { ...preview, status: "ready", reason: null };
}

async function main() {
 const root = resolve(argument("--root") ?? process.env.HANZI_STUDIO_ROOT ?? defaultStudioRoot());
 if (process.argv.includes("--write")) {
  throw new Error(
   "--write is guarded until a canonical lesson map, generated Supabase types, and a named non-production target are available.",
  );
 }
 if (process.argv.includes("--check")) {
  const inventory = await loadStudioInventory(root);
  assertStudioInventoryBaseline(inventory);
  process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
  return;
 }
 const mappingPath = argument("--lesson-map");
 const lessonMappings =
  mappingPath === null
   ? {}
   : studioLessonMappingSchema.parse(JSON.parse(await readFile(resolve(mappingPath), "utf8")));
 const preview = await createStudioImportPreview(root, lessonMappings);
 const output = argument("--preview");
 if (output !== null) {
  const target = resolve(output);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
 }
 process.stdout.write(`${JSON.stringify(preview, null, 2)}\n`);
 if (preview.status === "blocked") process.exitCode = 2;
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) await main();
