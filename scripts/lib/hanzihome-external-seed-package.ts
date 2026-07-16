import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { SectionSchema } from "../../src/features/hanzihome/schemas/hanyu-lesson.schema.ts";

const seedRowSchema = z.looseObject({
 id: z.string().min(1),
 source: z.literal("seed"),
});

const courseSchema = seedRowSchema.extend({
 slug: z.string().min(1),
 title: z.string().min(1),
 course_order: z.number().int().positive(),
});
const bookSchema = seedRowSchema.extend({
 course_id: z.string().min(1),
 title: z.string().min(1),
 book_order: z.number().int().positive(),
});
const lessonSchema = seedRowSchema.extend({
 course_id: z.string().min(1),
 book_id: z.string().min(1),
 lesson_number: z.number().int().positive(),
 lesson_order: z.number().int().positive(),
 title_zh: z.string().min(1),
});
const lessonSectionSchema = seedRowSchema.extend({
 lesson_id: z.string().min(1),
 source_section_id: z.string().min(1),
 section_key: z.string().min(1),
 section_type: z.string().min(1),
 section_order: z.number().int().positive(),
 payload: SectionSchema,
});
const lessonTextSchema = seedRowSchema.extend({
 lesson_id: z.string().min(1),
 text_key: z.string().min(1),
 content: z.string(),
 content_format: z.string().min(1),
});
const vocabItemSchema = seedRowSchema.extend({
 lesson_id: z.string().min(1),
 course_id: z.string().min(1),
 book_id: z.string().min(1),
 item_order: z.number().int().positive(),
 word: z.string().min(1),
 pinyin: z.string().min(1),
 meaning: z.string().min(1),
});
const vocabExampleSchema = seedRowSchema.extend({
 vocab_item_id: z.string().min(1),
 lesson_id: z.string().min(1),
 example_order: z.number().int().positive(),
 zh: z.string().min(1),
});
const vocabDetailSectionSchema = seedRowSchema.extend({
 vocab_item_id: z.string().min(1),
 lesson_id: z.string().min(1),
 section_key: z.string().min(1),
 section_order: z.number().int().positive(),
});
const grammarPointSchema = seedRowSchema.extend({
 lesson_id: z.string().min(1),
 course_id: z.string().min(1),
 book_id: z.string().min(1),
 point_order: z.number().int().positive(),
 title: z.string().min(1),
});
const grammarExampleSchema = seedRowSchema.extend({
 grammar_point_id: z.string().min(1),
 lesson_id: z.string().min(1),
 example_order: z.number().int().positive(),
 zh: z.string().min(1),
});
const grammarDetailSectionSchema = seedRowSchema.extend({
 grammar_point_id: z.string().min(1),
 lesson_id: z.string().min(1),
 section_key: z.string().min(1),
 section_order: z.number().int().positive(),
});

export const externalSeedPackageSchema = z.object({
 courses: z.array(courseSchema).min(1),
 books: z.array(bookSchema).min(1),
 lessons: z.array(lessonSchema).min(1),
 lessonSections: z.array(lessonSectionSchema).min(1),
 lessonTexts: z.array(lessonTextSchema),
 vocabItems: z.array(vocabItemSchema),
 vocabExamples: z.array(vocabExampleSchema),
 vocabDetailSections: z.array(vocabDetailSectionSchema),
 grammarPoints: z.array(grammarPointSchema),
 grammarExamples: z.array(grammarExampleSchema),
 grammarDetailSections: z.array(grammarDetailSectionSchema),
 radicals: z.array(z.unknown()).max(0),
 datasets: z.unknown().optional(),
});

export type ExternalSeedPackage = z.infer<typeof externalSeedPackageSchema>;

const BOYA_COURSE_LABELS: Record<string, { title: string; subtitle: string }> = {
 "boya-elementary": { title: "Boya · Sơ cấp", subtitle: "初级起步篇 · Quyển I–II" },
 "boya-preintermediate": {
  title: "Boya · Cận trung cấp",
  subtitle: "准中级加速篇 · Quyển I–II",
 },
 "boya-intermediate": {
  title: "Boya · Trung cấp",
  subtitle: "中级冲刺篇 · hiện có Quyển II",
 },
};

const BOYA_BOOK_LABELS: Record<string, { title: string; short_title: string }> = {
 "boya-elementary-1": {
  title: "Boya Sơ cấp · Quyển 1",
  short_title: "Sơ cấp · Quyển 1",
 },
 "boya-elementary-2": {
  title: "Boya Sơ cấp · Quyển 2",
  short_title: "Sơ cấp · Quyển 2",
 },
 "boya-preintermediate-1": {
  title: "Boya Cận trung cấp · Quyển 1",
  short_title: "Cận trung cấp · Quyển 1",
 },
 "boya-preintermediate-2": {
  title: "Boya Cận trung cấp · Quyển 2",
  short_title: "Cận trung cấp · Quyển 2",
 },
 "boya-intermediate-2": {
  title: "Boya Trung cấp · Quyển 2",
  short_title: "Trung cấp · Quyển 2",
 },
};

export function normalizeBoyaCatalogLabels(seed: Pick<ExternalSeedPackage, "courses" | "books">) {
 return {
  courses: seed.courses.map((course) => ({
   ...course,
   ...(BOYA_COURSE_LABELS[course.id] ?? {}),
  })),
  books: seed.books.map((book) => ({
   ...book,
   ...(BOYA_BOOK_LABELS[book.id] ?? {}),
  })),
 };
}

export const EXTERNAL_SEED_COLLECTIONS = [
 "courses",
 "books",
 "lessons",
 "lessonSections",
 "lessonTexts",
 "vocabItems",
 "vocabExamples",
 "vocabDetailSections",
 "grammarPoints",
 "grammarExamples",
 "grammarDetailSections",
] as const;

export type ExternalSeedCollection = (typeof EXTERNAL_SEED_COLLECTIONS)[number];

function duplicateIds(rows: ReadonlyArray<{ id: string }>) {
 const seen = new Set<string>();
 const duplicates = new Set<string>();
 for (const row of rows) {
  if (seen.has(row.id)) duplicates.add(row.id);
  seen.add(row.id);
 }
 return [...duplicates];
}

function missingParents(
 rows: ReadonlyArray<Record<string, unknown>>,
 parentKey: string,
 parentIds: ReadonlySet<string>,
) {
 return rows
  .filter((row) => typeof row[parentKey] !== "string" || !parentIds.has(row[parentKey]))
  .map((row) => String(row.id));
}

export function validateExternalSeedRelationships(seed: ExternalSeedPackage) {
 const errors: string[] = [];
 for (const collection of EXTERNAL_SEED_COLLECTIONS) {
  const duplicates = duplicateIds(seed[collection]);
  if (duplicates.length > 0) {
   errors.push(`${collection}: duplicate IDs ${duplicates.slice(0, 10).join(", ")}`);
  }
 }

 const courseIds = new Set(seed.courses.map((row) => row.id));
 const bookIds = new Set(seed.books.map((row) => row.id));
 const lessonIds = new Set(seed.lessons.map((row) => row.id));
 const vocabIds = new Set(seed.vocabItems.map((row) => row.id));
 const grammarIds = new Set(seed.grammarPoints.map((row) => row.id));
 const checks: Array<
  [string, ReadonlyArray<Record<string, unknown>>, string, ReadonlySet<string>]
 > = [
  ["books", seed.books, "course_id", courseIds],
  ["lessons.course", seed.lessons, "course_id", courseIds],
  ["lessons.book", seed.lessons, "book_id", bookIds],
  ["lessonSections", seed.lessonSections, "lesson_id", lessonIds],
  ["lessonTexts", seed.lessonTexts, "lesson_id", lessonIds],
  ["vocabItems", seed.vocabItems, "lesson_id", lessonIds],
  ["vocabExamples.item", seed.vocabExamples, "vocab_item_id", vocabIds],
  ["vocabExamples.lesson", seed.vocabExamples, "lesson_id", lessonIds],
  ["vocabDetails.item", seed.vocabDetailSections, "vocab_item_id", vocabIds],
  ["grammarPoints", seed.grammarPoints, "lesson_id", lessonIds],
  ["grammarExamples.point", seed.grammarExamples, "grammar_point_id", grammarIds],
  ["grammarExamples.lesson", seed.grammarExamples, "lesson_id", lessonIds],
  ["grammarDetails.point", seed.grammarDetailSections, "grammar_point_id", grammarIds],
 ];
 for (const [label, rows, parentKey, parentIds] of checks) {
  const missing = missingParents(rows, parentKey, parentIds);
  if (missing.length > 0)
   errors.push(`${label}: missing parents for ${missing.slice(0, 10).join(", ")}`);
 }
 return errors;
}

export async function loadExternalSeedPackage(packageRoot: string) {
 const seedPath = path.join(packageRoot, "seed", "supabase-seed.json");
 const raw = JSON.parse(await readFile(seedPath, "utf8")) as unknown;
 const seed = externalSeedPackageSchema.parse(raw);
 const errors = validateExternalSeedRelationships(seed);
 if (errors.length > 0) throw new Error(errors.join("\n"));
 return { seed, seedPath };
}

export async function verifyPackageChecksum(packageRoot: string, relativePath: string) {
 const checksums = z
  .record(z.string(), z.string())
  .parse(JSON.parse(await readFile(path.join(packageRoot, "checksums.json"), "utf8")) as unknown);
 const expected = checksums[relativePath];
 if (!expected) throw new Error(`Missing checksum for ${relativePath}`);
 const content = await readFile(path.join(packageRoot, relativePath));
 const actual = createHash("sha256").update(content).digest("hex");
 if (actual !== expected) throw new Error(`Checksum mismatch for ${relativePath}`);
}

export function externalSeedCounts(seed: ExternalSeedPackage) {
 return Object.fromEntries(
  EXTERNAL_SEED_COLLECTIONS.map((collection) => [collection, seed[collection].length]),
 );
}
