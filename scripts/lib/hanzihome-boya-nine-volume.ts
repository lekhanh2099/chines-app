import type { JsonFieldValue } from "../../src/types/json.ts";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
 buildPortableHanziHomeSeedData,
 type HanziHomeSeedData,
 type PortableSeedCourseConfig,
} from "./hanzihome-supabase-seed.ts";

export const BOYA_NINE_VOLUME_COURSE_ID = "boya-nine-volume-second-edition";
export const BOYA_LEGACY_COURSE_IDS = ["boya-preintermediate", "boya-intermediate"];
export const BOYA_LEGACY_BOOK_IDS = [
 "boya-preintermediate-1",
 "boya-preintermediate-2",
 "boya-intermediate-2",
];

const BOOKS = [
 {
  package: "intermediate",
  volume: "boya_intermediate_v1",
  id: "boya-9e-intermediate-1",
  title: "Boya 9 quyển · Trung cấp I",
  shortTitle: "Trung cấp I",
  targetLessonPrefix: "boya-9e-intermediate-1",
 },
 {
  package: "intermediate",
  volume: "boya_intermediate_v2",
  id: "boya-9e-intermediate-2",
  title: "Boya 9 quyển · Trung cấp II",
  shortTitle: "Trung cấp II",
  targetLessonPrefix: "boya-9e-intermediate-2",
 },
 {
  package: "advanced",
  volume: "boya_advanced_v1",
  id: "boya-9e-advanced-1",
  title: "Boya 9 quyển · Cao cấp I",
  shortTitle: "Cao cấp I",
  targetLessonPrefix: "boya-9e-advanced-1",
 },
 {
  package: "advanced",
  volume: "boya_advanced_v2",
  id: "boya-9e-advanced-2",
  title: "Boya 9 quyển · Cao cấp II",
  shortTitle: "Cao cấp II",
  targetLessonPrefix: "boya-9e-advanced-2",
 },
];

export type BoyaVocabularyNormalization = {
 sourceCount: number;
 normalizedCount: number;
 removed: Array<{
  lessonId: string;
  word: string;
  pinyin: string;
  removedId: string;
  keptId: string;
 }>;
};

function vocabNaturalKey(item: HanziHomeSeedData["vocabItems"][number]) {
 return `${item.lesson_id}\u0000${item.word}\u0000${item.pinyin}`;
}

function vocabRichnessScore(
 item: HanziHomeSeedData["vocabItems"][number],
 seed: HanziHomeSeedData,
) {
 return (
  (item.han_viet ? 10 : 0) +
  (item.meaning_en ? 2 : 0) +
  (item.tags?.length ?? 0) +
  seed.vocabExamples.filter((example) => example.vocab_item_id === item.id).length * 4 +
  seed.vocabDetailSections.filter((detail) => detail.vocab_item_id === item.id).length * 2
 );
}

function normalizePayloadReferences<T>(value: T, replacements: ReadonlyMap<string, string>): T {
 if (typeof value === "string") return (replacements.get(value) ?? value) as T;
 if (Array.isArray(value)) {
  return value
   .filter((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return true;
    const id = (entry as Record<string, JsonFieldValue>).id;
    return typeof id !== "string" || !replacements.has(id);
   })
   .map((entry) => normalizePayloadReferences(entry, replacements)) as T;
 }
 if (!value || typeof value !== "object") return value;

 return Object.fromEntries(
  Object.entries(value).map(([key, entry]) => [
   key,
   normalizePayloadReferences(entry, replacements),
  ]),
 ) as T;
}

export function normalizeBoyaVocabularyDuplicates(seed: HanziHomeSeedData): {
 seed: HanziHomeSeedData;
 report: BoyaVocabularyNormalization;
} {
 const groups = new Map<string, HanziHomeSeedData["vocabItems"]>();
 for (const item of seed.vocabItems) {
  const key = vocabNaturalKey(item);
  groups.set(key, [...(groups.get(key) ?? []), item]);
 }

 const replacements = new Map<string, string>();
 const removed: BoyaVocabularyNormalization["removed"] = [];
 for (const items of groups.values()) {
  if (items.length < 2) continue;

  const ranked = items.toSorted((left, right) => {
   const scoreDifference = vocabRichnessScore(right, seed) - vocabRichnessScore(left, seed);
   return scoreDifference || left.item_order - right.item_order || left.id.localeCompare(right.id);
  });
  const keeper = ranked[0];
  for (const duplicate of ranked.slice(1)) {
   replacements.set(duplicate.id, keeper.id);
   removed.push({
    lessonId: duplicate.lesson_id,
    word: duplicate.word,
    pinyin: duplicate.pinyin,
    removedId: duplicate.id,
    keptId: keeper.id,
   });
  }
 }

 const removedIds = new Set(replacements.keys());
 return {
  seed: {
   ...seed,
   vocabItems: seed.vocabItems.filter((item) => !removedIds.has(item.id)),
   vocabExamples: seed.vocabExamples.filter((example) => !removedIds.has(example.vocab_item_id)),
   vocabDetailSections: seed.vocabDetailSections.filter(
    (detail) => !removedIds.has(detail.vocab_item_id),
   ),
   lessonSections: seed.lessonSections.map((section) => ({
    ...section,
    payload: normalizePayloadReferences(section.payload, replacements),
   })),
  },
  report: {
   sourceCount: seed.vocabItems.length,
   normalizedCount: seed.vocabItems.length - removedIds.size,
   removed,
  },
 };
}

function packageRootFor(
 packageName: (typeof BOOKS)[number]["package"],
 roots: { intermediate: string; advanced: string },
) {
 return packageName === "intermediate" ? roots.intermediate : roots.advanced;
}

export async function verifyPackageSha256Sums(packageRoot: string) {
 const sumsPath = path.join(packageRoot, "SHA256SUMS.txt");
 const lines = (await readFile(sumsPath, "utf8"))
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter(Boolean);
 const verified: string[] = [];
 for (const line of lines) {
  const match = /^([a-f0-9]{64})\s+(.+)$/u.exec(line);
  if (!match) throw new Error(`Invalid SHA256SUMS entry in ${sumsPath}: ${line}`);
  const [, expected, relativePath] = match;
  const content = await readFile(path.join(packageRoot, relativePath));
  const actual = createHash("sha256").update(content).digest("hex");
  if (actual !== expected) throw new Error(`Checksum mismatch: ${relativePath}`);
  verified.push(relativePath);
 }
 return { sumsPath, verifiedFiles: verified.length };
}

export async function buildBoyaNineVolumeSeed(params: {
 intermediateRoot: string;
 advancedRoot: string;
 importedAt?: string;
}) {
 const roots = {
  intermediate: path.resolve(params.intermediateRoot),
  advanced: path.resolve(params.advancedRoot),
 };
 const checksums = {
  intermediate: await verifyPackageSha256Sums(roots.intermediate),
  advanced: await verifyPackageSha256Sums(roots.advanced),
 };
 const books: PortableSeedCourseConfig["books"] = BOOKS.map((book, index) => ({
  datasetRoot: path.join(packageRootFor(book.package, roots), "portable-seed-layout", book.volume),
  datasetId: book.volume,
  id: book.id,
  title: book.title,
  shortTitle: book.shortTitle,
  order: index + 1,
  targetLessonPrefix: book.targetLessonPrefix,
 }));
 const sourceSeed = await buildPortableHanziHomeSeedData(
  {
   id: BOYA_NINE_VOLUME_COURSE_ID,
   slug: BOYA_NINE_VOLUME_COURSE_ID,
   title: "Boya 9 quyển · Bản 2",
   subtitle: "第二版 · hiện có 4/5 quyển Trung–Cao cấp · thiếu Cao cấp III",
   order: 90,
   type: "boya",
   books,
  },
  params.importedAt,
 );
 const normalized = normalizeBoyaVocabularyDuplicates(sourceSeed);
 return { seed: normalized.seed, checksums, normalization: normalized.report };
}

export function boyaNineVolumeManifest(params: {
 seed: HanziHomeSeedData;
 checksums: {
  intermediate: { sumsPath: string; verifiedFiles: number };
  advanced: { sumsPath: string; verifiedFiles: number };
 };
 normalization?: BoyaVocabularyNormalization;
}) {
 const { seed } = params;
 const countsByBook = Object.fromEntries(
  seed.books.map((book) => {
   const lessons = seed.lessons.filter((lesson) => lesson.book_id === book.id);
   const lessonIds = new Set(lessons.map((lesson) => lesson.id));
   return [
    book.id,
    {
     lessons: lessons.length,
     vocabItems: seed.vocabItems.filter((item) => lessonIds.has(item.lesson_id)).length,
     grammarPoints: seed.grammarPoints.filter((point) => lessonIds.has(point.lesson_id)).length,
     lessonSections: seed.lessonSections.filter((section) => lessonIds.has(section.lesson_id))
      .length,
    },
   ];
  }),
 );
 return {
  generatedAt: new Date().toISOString(),
  mode: "replace-legacy",
  courseId: BOYA_NINE_VOLUME_COURSE_ID,
  replaces: {
   courseIds: [...BOYA_LEGACY_COURSE_IDS],
   bookIds: [...BOYA_LEGACY_BOOK_IDS],
  },
  sourcePackages: {
   intermediate: {
    sha256SumsFile: path.basename(params.checksums.intermediate.sumsPath),
    verifiedFiles: params.checksums.intermediate.verifiedFiles,
   },
   advanced: {
    sha256SumsFile: path.basename(params.checksums.advanced.sumsPath),
    verifiedFiles: params.checksums.advanced.verifiedFiles,
   },
  },
  counts: {
   courses: seed.courses.length,
   books: seed.books.length,
   lessons: seed.lessons.length,
   lessonSections: seed.lessonSections.length,
   lessonTexts: seed.lessonTexts.length,
   vocabItems: seed.vocabItems.length,
   vocabExamples: seed.vocabExamples.length,
   vocabDetailSections: seed.vocabDetailSections.length,
   grammarPoints: seed.grammarPoints.length,
   grammarExamples: seed.grammarExamples.length,
   grammarDetailSections: seed.grammarDetailSections.length,
  },
  countsByBook,
  sourceStatus: {
   partialLessonIds: seed.lessons
    .filter((lesson) => lesson.tags?.includes("partial_source"))
    .map((lesson) => lesson.id),
   checkNeededVocabIds: seed.vocabItems
    .filter((item) => item.tags?.includes("check-needed"))
    .map((item) => item.id),
   vocabExamplesMissingPinyin: seed.vocabExamples.filter((example) => !example.pinyin).length,
   vocabularyNormalization: params.normalization ?? null,
  },
  ids: {
   courses: seed.courses.map((row) => row.id),
   books: seed.books.map((row) => row.id),
   lessons: seed.lessons.map((row) => row.id),
  },
  knownSourceLimits: [
   "Cao cấp III chưa có trong package.",
   "Ví dụ và kết hợp từ Cao cấp chưa có pinyin ở nguồn; adapter không tự sinh.",
   "Một số bài Cao cấp được nguồn đánh dấu partial_source hoặc check_needed.",
   "Một mục từ synthetic trùng hoàn toàn với mục deep-vocabulary được loại khỏi runtime; manifest giữ provenance normalization.",
  ],
 };
}
