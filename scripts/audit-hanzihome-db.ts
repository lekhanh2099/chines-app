import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

type DatasetId = "q2" | "q3";

const dbRoot = path.join(process.cwd(), "data/hanzihome-db");
const sourceRoot = path.join(process.cwd(), "src");
const packageJsonPath = path.join(process.cwd(), "package.json");
const datasets: DatasetId[] = ["q2", "q3"];

async function readJson<T = unknown>(filePath: string): Promise<T> {
 return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function exists(filePath: string) {
 try {
  await stat(filePath);
  return true;
 } catch {
  return false;
 }
}

async function walk(dir: string): Promise<string[]> {
 const entries = await readdir(dir, { withFileTypes: true });
 const nested = await Promise.all(
  entries.map(async (entry) => {
   const entryPath = path.join(dir, entry.name);
   if (entry.isDirectory()) return walk(entryPath);
   return [entryPath];
  }),
 );

 return nested.flat();
}

function asRecord(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" && !Array.isArray(value)
  ? (value as Record<string, unknown>)
  : {};
}

function asString(value: unknown) {
 return typeof value === "string" ? value : "";
}

async function listLessonFolders(dataset: DatasetId) {
 const lessonsRoot = path.join(dbRoot, dataset, "lessons");
 const entries = await readdir(lessonsRoot, { withFileTypes: true });
 return entries
  .filter((entry) => entry.isDirectory() && /^lesson_\d+$/u.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));
}

async function auditRuntimeImports(errors: string[]) {
 const files = (await walk(sourceRoot)).filter((file) => /\.(ts|tsx)$/u.test(file));
 const blockedPatterns = [
  "data/hanzihome/q2",
  "data/hanzihome/q3",
  "hanzihome_radicals_clean",
  "q2VocabJson",
  "q3VocabJson",
  "q2LessonJson",
  "q3LessonJson",
 ];

 for (const file of files) {
  const relativePath = path.relative(process.cwd(), file);
  if (relativePath === "src/features/hanzihome/static-json/q2-static-json.ts") {
   continue;
  }

  const text = await readFile(file, "utf8");
  for (const pattern of blockedPatterns) {
   if (text.includes(pattern)) {
    errors.push(`Runtime source imports legacy data pattern "${pattern}" in ${relativePath}`);
   }
  }
 }

 const packageJson = await readFile(packageJsonPath, "utf8");
 for (const pattern of blockedPatterns) {
  if (packageJson.includes(pattern)) {
   errors.push(`package.json still references legacy data pattern "${pattern}"`);
  }
 }
}

async function auditLesson(dataset: DatasetId, lessonFolder: string, errors: string[]) {
 const lessonRoot = path.join(dbRoot, dataset, "lessons", lessonFolder);
 const sectionIndex = await readJson<Array<{ file: string }>>(
  path.join(lessonRoot, "sections/index.json"),
 );
 const vocabIndex = await readJson<
  Array<{
   id: string;
   file: string;
   materialized_kind?: string;
   check_needed?: boolean;
  }>
 >(path.join(lessonRoot, "vocabulary/index.json"));
 const allRelations = await readJson<Array<{ to?: { path?: string } }>>(
  path.join(lessonRoot, "relations/all.json"),
 );
 const unresolved = await readJson<unknown[]>(
  path.join(lessonRoot, "relations/unresolved.json"),
 );

 for (const item of sectionIndex) {
  if (!(await exists(path.join(lessonRoot, "sections", item.file)))) {
   errors.push(`${dataset}/${lessonFolder}: missing section file ${item.file}`);
  }
 }

 const seenVocabIds = new Set<string>();
 for (const item of vocabIndex) {
  if (!item.id) errors.push(`${dataset}/${lessonFolder}: vocab index item missing id`);
  if (seenVocabIds.has(item.id)) {
   errors.push(`${dataset}/${lessonFolder}: duplicate vocab id ${item.id}`);
  }
  seenVocabIds.add(item.id);

  const itemPath = path.join(lessonRoot, item.file);
  if (!(await exists(itemPath))) {
   errors.push(`${dataset}/${lessonFolder}: missing vocab file ${item.file}`);
   continue;
  }

  const payload = asRecord(await readJson(itemPath));
  const materialized = asRecord(payload.materialized);
  const kind =
   item.materialized_kind ||
   asString(payload.materialized_kind) ||
   asString(materialized.kind);
  if (kind === "synthetic_from_lesson_vocab" && payload.check_needed !== true) {
   errors.push(`${dataset}/${lessonFolder}: synthetic vocab ${item.id} must have check_needed=true`);
  }
  if (kind === "source_deep_vocab" && !payload.meaning) {
   errors.push(`${dataset}/${lessonFolder}: source deep vocab ${item.id} lost meaning payload`);
  }
 }

 for (const relation of allRelations) {
  const targetPath = relation.to?.path;
  if (targetPath && targetPath.includes("vocabulary/items/")) {
   const relativeTarget = targetPath.replace(/^.*?vocabulary\/items\//u, "vocabulary/items/");
   if (!(await exists(path.join(lessonRoot, relativeTarget)))) {
    errors.push(`${dataset}/${lessonFolder}: missing relation target ${targetPath}`);
   }
  }
 }

 if (unresolved.length !== 0) {
  errors.push(`${dataset}/${lessonFolder}: unresolved count must be 0, got ${unresolved.length}`);
 }

 if (await exists(path.join(lessonRoot, "source/lesson.raw.json"))) {
  errors.push(`${dataset}/${lessonFolder}: source/lesson.raw.json must not exist`);
 }
 if (await exists(path.join(lessonRoot, "source/deep-vocab.raw.json"))) {
  errors.push(`${dataset}/${lessonFolder}: source/deep-vocab.raw.json must not exist`);
 }
}

async function main() {
 const errors: string[] = [];
 const rootManifest = asRecord(await readJson(path.join(dbRoot, "manifest.json")));
 const rootCounts = asRecord(rootManifest.counts);

 if (rootCounts.lessons !== 51) {
  errors.push(`root manifest lessons must be 51, got ${String(rootCounts.lessons)}`);
 }
 if (rootCounts.unresolved !== 0) {
  errors.push(`root manifest unresolved must be 0, got ${String(rootCounts.unresolved)}`);
 }
 if (asRecord(rootManifest.options).sourceCopied !== false) {
  errors.push("root manifest options.sourceCopied must be false");
 }
 if (asRecord(rootManifest.options).indexMode !== "slim") {
  errors.push("root manifest options.indexMode must be slim");
 }

 for (const dataset of datasets) {
  const manifest = asRecord(await readJson(path.join(dbRoot, dataset, "manifest.json")));
  const lessons = await listLessonFolders(dataset);
  if (asRecord(manifest.counts).lessons !== lessons.length) {
   errors.push(`${dataset}: manifest lesson count mismatch`);
  }

  await Promise.all(
   lessons.map((lessonFolder) => auditLesson(dataset, lessonFolder, errors)),
  );
 }

 await auditRuntimeImports(errors);

 if (errors.length > 0) {
  console.error(`HanziHome DB audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
  return;
 }

 console.log("HanziHome DB audit OK.");
}

main().catch((error) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
