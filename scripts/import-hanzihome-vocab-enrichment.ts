import type { JsonFieldValue } from "../src/types/json.ts";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
 createHanziHomeAdminClient,
 fetchAllRows,
 materializeVocabEnrichment,
 SEED_TABLES,
} from "./lib/hanzihome-supabase-seed.ts";

type DatabaseVocabItem = {
 id: string;
 lesson_id: string;
 book_id: string;
 source: string;
};

type DatabaseChildRow = {
 id: string;
 vocab_item_id: string;
 lesson_id: string;
 source: string;
 section_key?: string;
};

type Enrichment = ReturnType<typeof materializeVocabEnrichment>;

function optionValues(name: string) {
 return process.argv.flatMap((value, index, args) =>
  value === name && args[index + 1] ? [args[index + 1]] : [],
 );
}

function option(name: string) {
 const values = optionValues(name);
 return values.at(-1) ?? null;
}

function duplicateIds(rows: ReadonlyArray<{ id: string }>) {
 const seen = new Set<string>();
 const duplicates = new Set<string>();
 for (const row of rows) {
  if (seen.has(row.id)) duplicates.add(row.id);
  seen.add(row.id);
 }
 return [...duplicates];
}

function assertNoDuplicates(label: string, rows: ReadonlyArray<{ id: string }>) {
 const duplicates = duplicateIds(rows);
 if (duplicates.length > 0) {
  throw new Error(`${label}: duplicate IDs ${duplicates.slice(0, 10).join(", ")}`);
 }
}

function lessonIdFromItemPath(itemPath: string) {
 const normalized = itemPath.split(path.sep).join("/");
 const match = normalized.match(
  /\/data\/lessons\/([^/]+)\/([^/]+)\/vocabulary\/items\/[^/]+\.json$/,
 );
 if (!match?.[1] || !match[2]) throw new Error(`Cannot resolve lesson ID from ${itemPath}`);
 return `${match[1]}-${match[2]}`;
}

async function loadPackageRoot(packageRoot: string, importedAt: string) {
 const entries = await readdir(packageRoot, { recursive: true, withFileTypes: true });
 const itemPaths = entries
  .filter(
   (entry) =>
    entry.isFile() &&
    entry.name.endsWith(".json") &&
    entry.parentPath.split(path.sep).join("/").includes("/vocabulary/items"),
  )
  .map((entry) => path.join(entry.parentPath, entry.name))
  .toSorted();
 if (itemPaths.length === 0) throw new Error(`No vocabulary items found under ${packageRoot}`);

 const enrichments = await Promise.all(
  itemPaths.map(async (itemPath) =>
   materializeVocabEnrichment({
    rawItem: JSON.parse(await readFile(itemPath, "utf8")),
    lessonId: lessonIdFromItemPath(itemPath),
    importedAt,
   }),
  ),
 );
 return { packageRoot, enrichments };
}

function summarizePackage(packageRoot: string, enrichments: Enrichment[]) {
 return {
  package: path.basename(packageRoot),
  vocabItems: enrichments.length,
  examples: enrichments.reduce((total, item) => total + item.examples.length, 0),
  collocationSections: enrichments.filter((item) => item.collocationDetail).length,
  collocationLines: enrichments.reduce(
   (total, item) => total + (item.collocationDetail?.lines.length ?? 0),
   0,
  ),
 };
}

async function main() {
 const packageRoots = optionValues("--package-root").map((value) => path.resolve(value));
 if (packageRoots.length === 0) {
  throw new Error("Required: at least one --package-root <extracted-book-directory>");
 }

 const importedAt = new Date().toISOString();
 const packages = await Promise.all(
  packageRoots.map((packageRoot) => loadPackageRoot(packageRoot, importedAt)),
 );
 const enrichments = packages.flatMap((entry) => entry.enrichments);
 const vocabExamples = enrichments.flatMap((item) => item.examples);
 const collocationDetails = enrichments.flatMap((item) =>
  item.collocationDetail ? [item.collocationDetail] : [],
 );

 assertNoDuplicates(
  "vocabItems",
  enrichments.map((item) => ({ id: item.vocabItemId })),
 );
 assertNoDuplicates("vocabExamples", vocabExamples);
 assertNoDuplicates("collocationDetails", collocationDetails);
 console.table(
  packages.map(({ packageRoot, enrichments: packageEnrichments }) =>
   summarizePackage(packageRoot, packageEnrichments),
  ),
 );

 const outputPath = option("--output-payload");
 if (outputPath) {
  await writeFile(
   path.resolve(outputPath),
   JSON.stringify({
    targetVocabItemIds: enrichments.map((item) => item.vocabItemId),
    courses: [],
    books: [],
    lessons: [],
    lessonSections: [],
    lessonTexts: [],
    vocabItems: [],
    vocabExamples,
    vocabDetailSections: collocationDetails,
    grammarPoints: [],
    grammarExamples: [],
    grammarDetailSections: [],
   }),
   "utf8",
  );
  console.log(`Wrote validated RPC payload: ${path.resolve(outputPath)}`);
 }

 if (process.argv.includes("--source-only")) {
  console.log("Source-only validation passed. Nothing was written to Supabase.");
  return;
 }

 const client = createHanziHomeAdminClient();
 const [databaseItems, databaseExamples, databaseDetails] = await Promise.all([
  fetchAllRows<DatabaseVocabItem>(client, SEED_TABLES.vocabItems, "id,lesson_id,book_id,source"),
  fetchAllRows<DatabaseChildRow>(
   client,
   SEED_TABLES.vocabExamples,
   "id,vocab_item_id,lesson_id,source",
  ),
  fetchAllRows<DatabaseChildRow>(
   client,
   SEED_TABLES.vocabDetailSections,
   "id,vocab_item_id,lesson_id,source,section_key",
  ),
 ]);

 const incomingItems = new Map(enrichments.map((row) => [row.vocabItemId, row]));
 const databaseItemById = new Map(databaseItems.map((row) => [row.id, row]));
 for (const [itemId, item] of incomingItems) {
  const databaseItem = databaseItemById.get(itemId);
  const expectedLessonId = item.examples[0]?.lesson_id ?? item.collocationDetail?.lesson_id;
  if (
   !databaseItem ||
   databaseItem.source !== "seed" ||
   (expectedLessonId && databaseItem.lesson_id !== expectedLessonId)
  ) {
   throw new Error(`Supabase vocab parent mismatch: ${itemId}`);
  }
 }

 const targetItemIds = new Set(incomingItems.keys());
 const incomingExampleIds = new Set(vocabExamples.map((row) => row.id));
 const incomingDetailIds = new Set(collocationDetails.map((row) => row.id));
 const staleExamples = databaseExamples.filter(
  (row) => targetItemIds.has(row.vocab_item_id) && !incomingExampleIds.has(row.id),
 );
 const staleCollocations = databaseDetails.filter(
  (row) =>
   row.section_key === "collocations" &&
   targetItemIds.has(row.vocab_item_id) &&
   !incomingDetailIds.has(row.id),
 );
 if (staleExamples.length > 0 || staleCollocations.length > 0) {
  throw new Error(
   `Refusing non-exact refresh: ${staleExamples.length} stale examples, ${staleCollocations.length} stale collocation sections`,
  );
 }
 console.log(`Validated ${targetItemIds.size} vocabulary parents against Supabase.`);

 if (!process.argv.includes("--apply")) {
  console.log("Dry-run passed. Nothing was written to Supabase.");
  return;
 }

 const result = await client.rpc("hanzihome_refresh_external_seed_package", {
  p_seed: {
   targetVocabItemIds: enrichments.map((item) => item.vocabItemId),
   courses: [],
   books: [],
   lessons: [],
   lessonSections: [],
   lessonTexts: [],
   vocabItems: [],
   vocabExamples,
   vocabDetailSections: collocationDetails,
   grammarPoints: [],
   grammarExamples: [],
   grammarDetailSections: [],
  },
 });
 if (result.error) throw new Error(`Supabase enrichment refresh failed: ${result.error.message}`);
 console.log("Supabase vocabulary enrichment completed.");
 console.table(result.data as Record<string, number>);
}

main().catch((error: JsonFieldValue) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
