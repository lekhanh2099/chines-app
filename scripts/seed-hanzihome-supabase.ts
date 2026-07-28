import type { JsonFieldValue } from "../src/types/json.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
 buildHanziHomeSeedData,
 createHanziHomeAdminClient,
 fetchAllRows,
 HANZIHOME_DATASETS,
 insertRowsInBatches,
 SEED_TABLES,
 validateHanziHomeSeedData,
 type HanziHomeDatasetScope,
 type HanziHomeSeedData,
} from "./lib/hanzihome-supabase-seed.ts";

const SeedModeSchema = z.enum(["init-only", "replace-seed"]);
type SeedMode = z.infer<typeof SeedModeSchema>;

type CliOptions = {
 dataset: HanziHomeDatasetScope;
 mode: SeedMode;
 dryRun: boolean;
 confirmReplaceSeed: boolean;
};

type ExistingIdentity = {
 id: string;
 source: string;
};

type CollectionKey = keyof typeof SEED_TABLES;

function readOption(name: string) {
 const index = process.argv.indexOf(name);
 return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function parseOptions(): CliOptions {
 const datasetValue = readOption("--dataset") ?? "all";
 const modeValue = readOption("--mode") ?? "init-only";
 const explicitMode = readOption("--mode") !== null;

 if (
  datasetValue !== "all" &&
  !HANZIHOME_DATASETS.includes(datasetValue as (typeof HANZIHOME_DATASETS)[number])
 ) {
  throw new Error(`Invalid --dataset "${datasetValue}". Use q2, q3, or all.`);
 }
 if (modeValue !== "init-only" && modeValue !== "replace-seed") {
  throw new Error(`Invalid --mode "${modeValue}". Use init-only or replace-seed.`);
 }

 return {
  dataset: datasetValue as HanziHomeDatasetScope,
  mode: modeValue,
  dryRun: process.argv.includes("--dry-run") || !explicitMode,
  confirmReplaceSeed: process.argv.includes("--confirm-replace-seed"),
 };
}

function printCounts(seed: HanziHomeSeedData) {
 console.table({
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
  radicals: seed.radicals.length,
 });
}

function collectionRows(seed: HanziHomeSeedData, collection: CollectionKey) {
 switch (collection) {
  case "courses":
   return seed.courses;
  case "books":
   return seed.books;
  case "lessons":
   return seed.lessons;
  case "lessonSections":
   return seed.lessonSections;
  case "lessonTexts":
   return seed.lessonTexts;
  case "vocabItems":
   return seed.vocabItems;
  case "vocabExamples":
   return seed.vocabExamples;
  case "vocabDetailSections":
   return seed.vocabDetailSections;
  case "grammarPoints":
   return seed.grammarPoints;
  case "grammarExamples":
   return seed.grammarExamples;
  case "grammarDetailSections":
   return seed.grammarDetailSections;
  case "radicals":
   return seed.radicals;
 }
}

async function assertNoCustomIdCollisions(client: SupabaseClient, seed: HanziHomeSeedData) {
 for (const collection of Object.keys(SEED_TABLES) as CollectionKey[]) {
  const table = SEED_TABLES[collection];
  const expectedIds = new Set(collectionRows(seed, collection).map((row) => row.id));
  const existing = await fetchAllRows<ExistingIdentity>(client, table, "id,source");
  const conflicts = existing.filter((row) => expectedIds.has(row.id) && row.source !== "seed");
  if (conflicts.length > 0) {
   throw new Error(
    `${table} has canonical IDs owned by non-seed rows: ${conflicts
     .slice(0, 10)
     .map((row) => row.id)
     .join(", ")}`,
   );
  }
 }
}

async function seedInitOnly(client: SupabaseClient, seed: HanziHomeSeedData) {
 const report: Record<string, { inserted: number; skipped: number }> = {};

 for (const collection of Object.keys(SEED_TABLES) as CollectionKey[]) {
  const table = SEED_TABLES[collection];
  const rows = collectionRows(seed, collection);
  const existing = await fetchAllRows<ExistingIdentity>(client, table, "id,source");
  const existingIds = new Set(existing.map((row) => row.id));
  const customConflicts = existing.filter(
   (row) => existingIds.has(row.id) && row.source !== "seed",
  );
  const expectedIds = new Set(rows.map((row) => row.id));
  const relevantConflicts = customConflicts.filter((row) => expectedIds.has(row.id));
  if (relevantConflicts.length > 0) {
   throw new Error(
    `${table} contains non-seed rows with canonical IDs: ${relevantConflicts
     .slice(0, 10)
     .map((row) => row.id)
     .join(", ")}`,
   );
  }

  const missingRows = rows.filter((row) => !existingIds.has(row.id));
  await insertRowsInBatches(client, table, missingRows);
  report[table] = {
   inserted: missingRows.length,
   skipped: rows.length - missingRows.length,
  };
 }

 return report;
}

async function upsertSeedParents(client: SupabaseClient, seed: HanziHomeSeedData) {
 const courseResult = await client
  .from(SEED_TABLES.courses)
  .upsert(seed.courses, { onConflict: "id" });
 if (courseResult.error) {
  throw new Error(`Failed replacing seed courses: ${courseResult.error.message}`);
 }

 const bookResult = await client.from(SEED_TABLES.books).upsert(seed.books, { onConflict: "id" });
 if (bookResult.error) {
  throw new Error(`Failed replacing seed books: ${bookResult.error.message}`);
 }
}

async function seedReplace(client: SupabaseClient, seed: HanziHomeSeedData) {
 await assertNoCustomIdCollisions(client, seed);

 const courseIds = seed.courses.map((course) => course.id);
 const deleteResult = await client
  .from(SEED_TABLES.lessons)
  .delete()
  .eq("source", "seed")
  .in("course_id", courseIds);
 if (deleteResult.error) {
  throw new Error(`Failed deleting selected seed lessons: ${deleteResult.error.message}`);
 }

 const deleteRadicalsResult = await client.from(SEED_TABLES.radicals).delete().eq("source", "seed");
 if (deleteRadicalsResult.error) {
  throw new Error(`Failed deleting seed radicals: ${deleteRadicalsResult.error.message}`);
 }

 await upsertSeedParents(client, seed);

 const childOrder: CollectionKey[] = [
  "lessons",
  "lessonSections",
  "lessonTexts",
  "vocabItems",
  "vocabExamples",
  "vocabDetailSections",
  "grammarPoints",
  "grammarExamples",
  "grammarDetailSections",
  "radicals",
 ];
 const report: Record<string, { inserted: number; skipped: number }> = {
  [SEED_TABLES.courses]: { inserted: seed.courses.length, skipped: 0 },
  [SEED_TABLES.books]: { inserted: seed.books.length, skipped: 0 },
 };
 for (const collection of childOrder) {
  const rows = collectionRows(seed, collection);
  await insertRowsInBatches(client, SEED_TABLES[collection], rows);
  report[SEED_TABLES[collection]] = { inserted: rows.length, skipped: 0 };
 }
 return report;
}

async function main() {
 const options = parseOptions();
 console.log("HanziHome Supabase seed");
 console.log(`dataset=${options.dataset} mode=${options.mode} dryRun=${options.dryRun}`);

 if (options.mode === "replace-seed" && !options.dryRun && !options.confirmReplaceSeed) {
  throw new Error("replace-seed requires --confirm-replace-seed. No data was changed.");
 }

 const seed = await buildHanziHomeSeedData(options.dataset);
 const validation = validateHanziHomeSeedData(seed, options.dataset);
 printCounts(seed);
 console.log(
  `local duplicate PKs=${validation.duplicateIds}; missing parents=${validation.missingParents}`,
 );

 if (validation.errors.length > 0) {
  console.error(validation.errors.join("\n"));
  throw new Error(`Seed validation failed with ${validation.errors.length} error(s).`);
 }

 if (options.dryRun) {
  console.log("Dry-run passed. Nothing was written to Supabase.");
  return;
 }

 const client = createHanziHomeAdminClient();
 const report =
  options.mode === "replace-seed"
   ? await seedReplace(client, seed)
   : await seedInitOnly(client, seed);
 console.table(report);
 console.log("Supabase seed completed.");
}

main().catch((error: JsonFieldValue) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
