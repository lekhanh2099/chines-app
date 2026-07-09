import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type DatasetId = "q2" | "q3";

type JsonRecord = Record<string, unknown>;

type LessonSummary = {
 lessonIndex: number;
 id: string;
 title: {
  zh: string;
  pinyin: string;
  vi: string;
  en?: string;
 };
 folder: string;
 sourceRefs?: unknown;
 counts: LessonCounts;
};

type LessonCounts = {
 sections: number;
 lessonVocabItems: number;
 sourceDeepVocabItems: number;
 materializedVocabItems: number;
 syntheticVocabItems: number;
 hanziOnlyVocabMatches: number;
 relations: number;
 relationTypes?: Record<string, number>;
 checkNeededRelations: number;
 checkNeededVocabItems: number;
 unresolved: number;
 warnings: number;
};

const dbRoot = path.resolve(process.env.HANZIHOME_DB_ROOT ?? "data/hanzihome-db");
const datasets: DatasetId[] = ["q2", "q3"];

function asRecord(value: unknown): JsonRecord {
 return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function asString(value: unknown) {
 return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
 return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function readJson<T = unknown>(filePath: string): Promise<T> {
 return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, value: unknown) {
 const next = `${JSON.stringify(value, null, 2)}\n`;
 const current = await readFile(filePath, "utf8").catch(() => "");

 if (current !== next) {
  await writeFile(filePath, next, "utf8");
 }
}

async function fileExists(filePath: string) {
 try {
  await stat(filePath);
  return true;
 } catch {
  return false;
 }
}

async function listJsonFiles(dir: string) {
 const entries = await readdir(dir, { withFileTypes: true });
 return entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));
}

async function listLessonFolders(datasetRoot: string) {
 const lessonsRoot = path.join(datasetRoot, "lessons");
 const entries = await readdir(lessonsRoot, { withFileTypes: true });

 return entries
  .filter((entry) => entry.isDirectory() && /^lesson_\d+$/u.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));
}

function indexEntryFromSection(section: JsonRecord, file: string) {
 return {
  id: asString(section.id),
  type: asString(section.type),
  order: asNumber(section.order),
  title: asString(section.title),
  title_vi: asString(section.title_vi),
  file,
 };
}

function getVocabKind(item: JsonRecord) {
 const materialized = asRecord(item.materialized);
 return (
  asString(item.materialized_kind) ||
  asString(materialized.kind) ||
  (asString(item.type) === "deep_vocabulary_item"
   ? "source_deep_vocab"
   : "synthetic_from_lesson_vocab")
 );
}

function indexEntryFromVocab(item: JsonRecord, file: string, order: number) {
 const materialized = asRecord(item.materialized);
 const kind = getVocabKind(item);

 return {
  id: asString(item.id),
  order: asNumber(item.order) || order,
  type: asString(item.type),
  materialized_kind: kind,
  source_deep_vocab_id:
   asString(materialized.source_deep_vocab_id) ||
   (kind === "source_deep_vocab" ? asString(item.id) : null),
  source_lesson_vocab_id: asString(materialized.source_lesson_vocab_id) || null,
  check_needed: Boolean(item.check_needed),
  file: `vocabulary/items/${file}`,
 };
}

function countRelationTypes(relations: JsonRecord[]) {
 return relations.reduce<Record<string, number>>((acc, relation) => {
  const type = asString(relation.type) || "unknown";
  acc[type] = (acc[type] ?? 0) + 1;
  return acc;
 }, {});
}

async function rebuildLesson(dataset: DatasetId, lessonFolder: string) {
 const lessonRoot = path.join(dbRoot, dataset, "lessons", lessonFolder);
 const lessonJsonPath = path.join(lessonRoot, "lesson.json");
 const lessonJson = await readJson<JsonRecord>(lessonJsonPath);
 const sectionFiles = await listJsonFiles(path.join(lessonRoot, "sections"));
 const sections = await Promise.all(
  sectionFiles
   .filter((file) => file !== "index.json")
   .map(async (file) => ({
    file,
    value: await readJson<JsonRecord>(path.join(lessonRoot, "sections", file)),
   })),
 );
 const sectionIndex = sections
  .map(({ file, value }) => indexEntryFromSection(value, file))
  .sort((a, b) => a.order - b.order);

 await writeJson(path.join(lessonRoot, "sections/index.json"), sectionIndex);

 const vocabItemDir = path.join(lessonRoot, "vocabulary/items");
 const vocabFiles = await listJsonFiles(vocabItemDir);
 const vocabItems = await Promise.all(
  vocabFiles.map(async (file, index) => ({
   file,
   value: await readJson<JsonRecord>(path.join(vocabItemDir, file)),
   order: index + 1,
  })),
 );
 const seenVocabIds = new Set<string>();
 for (const item of vocabItems) {
  const id = asString(item.value.id);
  if (!id) throw new Error(`${dataset}/${lessonFolder}/${item.file} missing id`);
  if (seenVocabIds.has(id)) {
   throw new Error(`${dataset}/${lessonFolder} duplicate vocab id: ${id}`);
  }
  seenVocabIds.add(id);
 }
 const vocabIndex = vocabItems
  .map(({ file, value, order }) => indexEntryFromVocab(value, file, order))
  .sort((a, b) => a.order - b.order);

 await writeJson(path.join(lessonRoot, "vocabulary/index.json"), vocabIndex);

 const relationDir = path.join(lessonRoot, "relations");
 const allRelations = await readJson<JsonRecord[]>(path.join(relationDir, "all.json"));
 const unresolved = await readJson<unknown[]>(path.join(relationDir, "unresolved.json"));
 const warnings = await readJson<unknown[]>(path.join(relationDir, "warnings.json"));
 const oldRelationIndex = await readJson<JsonRecord>(path.join(relationDir, "index.json"));
 const relationIndex = {
  ...oldRelationIndex,
  counts: {
   ...asRecord(oldRelationIndex.counts),
   byType: countRelationTypes(allRelations),
   all: allRelations.length,
   checkNeededRelations: allRelations.filter((relation) => relation.check_needed).length,
   unresolved: unresolved.length,
   warnings: warnings.length,
  },
 };

 await writeJson(path.join(relationDir, "index.json"), relationIndex);

 const existingCounts = asRecord(lessonJson.counts);
 const relationTypes = countRelationTypes(allRelations);
 const counts = {
  ...existingCounts,
  sections: sectionIndex.length,
  lessonVocabItems: relationTypes.lesson_vocab_to_vocabulary_item ?? 0,
  sourceDeepVocabItems: vocabIndex.filter((item) => item.materialized_kind === "source_deep_vocab")
   .length,
  materializedVocabItems: vocabIndex.length,
  syntheticVocabItems: vocabIndex.filter(
   (item) => item.materialized_kind === "synthetic_from_lesson_vocab",
  ).length,
  hanziOnlyVocabMatches: asNumber(asRecord(lessonJson.counts).hanziOnlyVocabMatches),
  relations: allRelations.length,
  checkNeededRelations: allRelations.filter((relation) => relation.check_needed).length,
  checkNeededVocabItems: vocabItems.filter((item) => item.value.check_needed).length,
  unresolved: unresolved.length,
  warnings: warnings.length,
 } as LessonCounts;

 const nextLessonJson = {
  ...lessonJson,
  counts,
 };
 await writeJson(lessonJsonPath, nextLessonJson);

 return {
  lessonIndex: asNumber(lessonJson.lessonIndex),
  id: asString(lessonJson.id),
  title: asRecord(lessonJson.title) as LessonSummary["title"],
  folder: `lessons/${lessonFolder}`,
  sourceRefs: lessonJson.sourceRefs,
  counts: {
   ...counts,
   relationTypes,
  },
 } satisfies LessonSummary;
}

function sumCounts(lessons: LessonSummary[]) {
 return lessons.reduce(
  (acc, lesson) => {
   acc.lessons += 1;
   acc.sections += lesson.counts.sections;
   acc.lessonVocabItems += lesson.counts.lessonVocabItems;
   acc.sourceDeepVocabItems += lesson.counts.sourceDeepVocabItems;
   acc.materializedVocabItems += lesson.counts.materializedVocabItems;
   acc.syntheticVocabItems += lesson.counts.syntheticVocabItems;
   acc.relations += lesson.counts.relations;
   acc.checkNeededRelations += lesson.counts.checkNeededRelations;
   acc.checkNeededVocabItems += lesson.counts.checkNeededVocabItems;
   acc.unresolved += lesson.counts.unresolved;
   acc.warnings += lesson.counts.warnings;
   return acc;
  },
  {
   lessons: 0,
   sections: 0,
   lessonVocabItems: 0,
   sourceDeepVocabItems: 0,
   materializedVocabItems: 0,
   syntheticVocabItems: 0,
   relations: 0,
   checkNeededRelations: 0,
   checkNeededVocabItems: 0,
   unresolved: 0,
   warnings: 0,
  },
 );
}

async function rebuildDataset(dataset: DatasetId) {
 const datasetRoot = path.join(dbRoot, dataset);
 const oldManifest = await readJson<JsonRecord>(path.join(datasetRoot, "manifest.json"));
 const lessonFolders = await listLessonFolders(datasetRoot);
 const lessons = await Promise.all(lessonFolders.map((folder) => rebuildLesson(dataset, folder)));
 const oldLessons = Array.isArray(oldManifest.lessons) ? oldManifest.lessons.map(asRecord) : [];
 const oldLessonsById = new Map(oldLessons.map((lesson) => [asString(lesson.id), lesson]));
 const sortedLessons = lessons
  .sort((a, b) => a.lessonIndex - b.lessonIndex)
  .map((lesson) => {
   const existing = oldLessonsById.get(lesson.id) ?? {};
   return {
    ...existing,
    ...lesson,
    counts: {
     ...asRecord(existing.counts),
     ...lesson.counts,
    },
   } as LessonSummary;
  });
 const nextCounts = sumCounts(sortedLessons);
 const counts = {
  ...asRecord(oldManifest.counts),
  ...nextCounts,
 };
 const manifest = {
  ...oldManifest,
  counts,
  lessons: sortedLessons,
 };

 await writeJson(path.join(datasetRoot, "manifest.json"), manifest);

 return { dataset, counts };
}

async function validateStructure() {
 const errors: string[] = [];

 for (const dataset of datasets) {
  const datasetRoot = path.join(dbRoot, dataset);
  for (const lessonFolder of await listLessonFolders(datasetRoot)) {
   const lessonRoot = path.join(datasetRoot, "lessons", lessonFolder);
   const sectionIndex = await readJson<Array<{ file: string }>>(
    path.join(lessonRoot, "sections/index.json"),
   );
   const vocabIndex = await readJson<Array<{ file: string }>>(
    path.join(lessonRoot, "vocabulary/index.json"),
   );
   const allRelations = await readJson<Array<{ to?: { path?: string } }>>(
    path.join(lessonRoot, "relations/all.json"),
   );
   const unresolved = await readJson<unknown[]>(path.join(lessonRoot, "relations/unresolved.json"));

   for (const item of sectionIndex) {
    if (!(await fileExists(path.join(lessonRoot, "sections", item.file)))) {
     errors.push(`${dataset}/${lessonFolder} missing section ${item.file}`);
    }
   }
   for (const item of vocabIndex) {
    if (!(await fileExists(path.join(lessonRoot, item.file)))) {
     errors.push(`${dataset}/${lessonFolder} missing vocab ${item.file}`);
    }
   }
   for (const relation of allRelations) {
    const targetPath = relation.to?.path;
    if (targetPath && targetPath.includes("vocabulary/items/")) {
     const relativeTarget = targetPath.replace(/^.*?vocabulary\/items\//u, "vocabulary/items/");
     if (!(await fileExists(path.join(lessonRoot, relativeTarget)))) {
      errors.push(`${dataset}/${lessonFolder} missing relation target ${targetPath}`);
     }
    }
   }
   if (unresolved.length > 0) {
    errors.push(`${dataset}/${lessonFolder} unresolved relation count ${unresolved.length}`);
   }
  }
 }

 if (errors.length > 0) {
  throw new Error(`HanziHome DB rebuild validation failed:\n${errors.join("\n")}`);
 }
}

async function main() {
 const datasetSummaries = await Promise.all(datasets.map(rebuildDataset));
 const rootCounts = datasetSummaries.reduce(
  (acc, summary) => {
   acc.datasets += 1;
   acc.lessons += summary.counts.lessons;
   acc.relations += summary.counts.relations;
   acc.unresolved += summary.counts.unresolved;
   acc.warnings += summary.counts.warnings;
   acc.syntheticVocabItems += summary.counts.syntheticVocabItems;
   acc.checkNeededRelations += summary.counts.checkNeededRelations;
   acc.checkNeededVocabItems += summary.counts.checkNeededVocabItems;
   return acc;
  },
  {
   datasets: 0,
   lessons: 0,
   relations: 0,
   unresolved: 0,
   warnings: 0,
   syntheticVocabItems: 0,
   checkNeededRelations: 0,
   checkNeededVocabItems: 0,
  },
 );
 const oldRootManifest = await readJson<JsonRecord>(path.join(dbRoot, "manifest.json"));
 const rootManifest = {
  ...oldRootManifest,
  datasets: datasetSummaries.map((summary) => ({
   dataset: summary.dataset,
   output: `data/hanzihome-db/${summary.dataset}`,
   counts: summary.counts,
  })),
  counts: {
   ...asRecord(oldRootManifest.counts),
   ...rootCounts,
  },
 };

 await writeJson(path.join(dbRoot, "manifest.json"), rootManifest);
 await validateStructure();

 console.log(
  `HanziHome DB rebuild OK: ${rootCounts.lessons} lessons, ${rootCounts.relations} relations, ${rootCounts.unresolved} unresolved.`,
 );
}

main().catch((error) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
