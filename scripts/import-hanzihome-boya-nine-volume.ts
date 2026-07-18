import { createHash } from "node:crypto";
import { gzip as gzipCallback } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import {
 BOYA_LEGACY_BOOK_IDS,
 BOYA_LEGACY_COURSE_IDS,
 BOYA_NINE_VOLUME_COURSE_ID,
 boyaNineVolumeManifest,
 buildBoyaNineVolumeSeed,
} from "./lib/hanzihome-boya-nine-volume.ts";
import {
 externalSeedCounts,
 externalSeedPackageSchema,
 validateExternalSeedRelationships,
 type ExternalSeedPackage,
} from "./lib/hanzihome-external-seed-package.ts";
import {
 createHanziHomeAdminClient,
 fetchAllRows,
 SEED_TABLES,
} from "./lib/hanzihome-supabase-seed.ts";

type ExistingRow = { id: string; source: string };
type LegacyCourseRow = ExistingRow & { deleted_at: string | null; user_id: string | null };
type LegacyBookRow = ExistingRow & {
 course_id: string;
 deleted_at: string | null;
 user_id: string | null;
};
type LegacyLessonRow = ExistingRow & {
 book_id: string;
 deleted_at: string | null;
 owner_id: string | null;
};
type TargetChildRow = { id: string; lesson_id: string };

const gzip = promisify(gzipCallback);
const CHUNK_BYTES = 512 * 1024;
const STAGING_TABLE = "hanzihome_import_chunks";

const seedTableMappings = [
 ["courses", SEED_TABLES.courses],
 ["books", SEED_TABLES.books],
 ["lessons", SEED_TABLES.lessons],
 ["lessonSections", SEED_TABLES.lessonSections],
 ["lessonTexts", SEED_TABLES.lessonTexts],
 ["vocabItems", SEED_TABLES.vocabItems],
 ["vocabExamples", SEED_TABLES.vocabExamples],
 ["vocabDetailSections", SEED_TABLES.vocabDetailSections],
 ["grammarPoints", SEED_TABLES.grammarPoints],
 ["grammarExamples", SEED_TABLES.grammarExamples],
 ["grammarDetailSections", SEED_TABLES.grammarDetailSections],
] as const;

function option(name: string) {
 const index = process.argv.indexOf(name);
 return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function sha256(content: string | Buffer) {
 return createHash("sha256").update(content).digest("hex");
}

function idHash(ids: string[]) {
 return sha256(ids.toSorted().join("\n"));
}

function splitUtf8(text: string, maxBytes: number) {
 const chunks: string[] = [];
 let start = 0;
 while (start < text.length) {
  let low = start + 1;
  let high = Math.min(text.length, start + maxBytes);
  let end = low;
  while (low <= high) {
   const middle = Math.floor((low + high) / 2);
   const bytes = Buffer.byteLength(text.slice(start, middle), "utf8");
   if (bytes <= maxBytes) {
    end = middle;
    low = middle + 1;
   } else {
    high = middle - 1;
   }
  }
  if (end < text.length) {
   const previous = text.charCodeAt(end - 1);
   const next = text.charCodeAt(end);
   if (previous >= 0xd800 && previous <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
    end -= 1;
   }
  }
  chunks.push(text.slice(start, end));
  start = end;
 }
 return chunks;
}

async function assertNewIdsAvailable(
 seed: ExternalSeedPackage,
 client: ReturnType<typeof createHanziHomeAdminClient>,
) {
 for (const [collection, table] of seedTableMappings) {
  const expectedIds = new Set(seed[collection].map((row) => row.id));
  const existing = await fetchAllRows<ExistingRow>(client, table, "id,source");
  const collisions = existing.filter((row) => expectedIds.has(row.id));
  if (collisions.length > 0) {
   throw new Error(
    `${table}: replacement blocked by existing IDs ${collisions
     .slice(0, 10)
     .map((row) => row.id)
     .join(", ")}`,
   );
  }
 }
}

async function assertLegacyReplacementReady(client: ReturnType<typeof createHanziHomeAdminClient>) {
 const [courses, books, lessons] = await Promise.all([
  fetchAllRows<LegacyCourseRow>(client, SEED_TABLES.courses, "id,source,deleted_at,user_id"),
  fetchAllRows<LegacyBookRow>(client, SEED_TABLES.books, "id,course_id,source,deleted_at,user_id"),
  fetchAllRows<LegacyLessonRow>(
   client,
   SEED_TABLES.lessons,
   "id,book_id,source,deleted_at,owner_id",
  ),
 ]);
 const legacyCourses = courses.filter((row) =>
  BOYA_LEGACY_COURSE_IDS.includes(row.id as (typeof BOYA_LEGACY_COURSE_IDS)[number]),
 );
 const legacyBooks = books.filter((row) =>
  BOYA_LEGACY_BOOK_IDS.includes(row.id as (typeof BOYA_LEGACY_BOOK_IDS)[number]),
 );
 const legacyLessons = lessons.filter((row) =>
  BOYA_LEGACY_BOOK_IDS.includes(row.book_id as (typeof BOYA_LEGACY_BOOK_IDS)[number]),
 );
 if (legacyCourses.length !== 2 || legacyBooks.length !== 3 || legacyLessons.length !== 42) {
  throw new Error(
   `Legacy replacement scope drifted: courses=${legacyCourses.length}, books=${legacyBooks.length}, lessons=${legacyLessons.length}`,
  );
 }
 const unsafe = [...legacyCourses, ...legacyBooks, ...legacyLessons].find(
  (row) =>
   row.source !== "seed" ||
   row.deleted_at !== null ||
   ("user_id" in row && row.user_id !== null) ||
   ("owner_id" in row && row.owner_id !== null),
 );
 if (unsafe) throw new Error(`Legacy replacement contains an unsafe row: ${unsafe.id}`);
 return legacyLessons.map((row) => row.id);
}

async function writeBackup(params: {
 client: ReturnType<typeof createHanziHomeAdminClient>;
 backupDir: string;
 targetLessonIds: string[];
}) {
 const targetLessons = new Set(params.targetLessonIds);
 const [draftResult, ...childCollections] = await Promise.all([
  params.client.from("hanzihome_lesson_drafts").select("*").order("id", { ascending: true }),
  ...[
   ["lessonSections", SEED_TABLES.lessonSections],
   ["lessonTexts", SEED_TABLES.lessonTexts],
   ["vocabItems", SEED_TABLES.vocabItems],
   ["vocabExamples", SEED_TABLES.vocabExamples],
   ["vocabDetailSections", SEED_TABLES.vocabDetailSections],
   ["grammarPoints", SEED_TABLES.grammarPoints],
   ["grammarExamples", SEED_TABLES.grammarExamples],
   ["grammarDetailSections", SEED_TABLES.grammarDetailSections],
  ].map(async ([collection, table]) => ({
   collection,
   rows: (await fetchAllRows<TargetChildRow>(params.client, table, "id,lesson_id")).filter((row) =>
    targetLessons.has(row.lesson_id),
   ),
  })),
 ]);
 if (draftResult.error)
  throw new Error(`Cannot export legacy drafts: ${draftResult.error.message}`);
 if (draftResult.data.length !== 6) {
  throw new Error(`Expected 6 legacy drafts before cleanup, received ${draftResult.data.length}`);
 }

 const timestamp = new Date().toISOString().replaceAll(/[:.]/gu, "-");
 const backupDir = path.resolve(params.backupDir);
 await mkdir(backupDir, { recursive: true });
 const draftsJson = `${JSON.stringify(
  { exportedAt: new Date().toISOString(), rows: draftResult.data },
  null,
  2,
 )}\n`;
 const draftsCompressed = await gzip(Buffer.from(draftsJson, "utf8"), { level: 9 });
 const draftsPath = path.join(
  backupDir,
  `hanzihome-lesson-drafts-before-cleanup-${timestamp}.json.gz`,
 );
 await writeFile(draftsPath, draftsCompressed);
 await writeFile(
  `${draftsPath}.sha256`,
  `${sha256(draftsCompressed)}  ${path.basename(draftsPath)}\n`,
 );

 const targetManifest = {
  exportedAt: new Date().toISOString(),
  courseIds: [...BOYA_LEGACY_COURSE_IDS],
  bookIds: [...BOYA_LEGACY_BOOK_IDS],
  lessons: { count: params.targetLessonIds.length, idHash: idHash(params.targetLessonIds) },
  collections: Object.fromEntries(
   childCollections.map(({ collection, rows }) => [
    collection,
    { count: rows.length, idHash: idHash(rows.map((row) => row.id)) },
   ]),
  ),
  drafts: { count: draftResult.data.length, backupSha256: sha256(draftsCompressed) },
 };
 const manifestPath = path.join(backupDir, `boya-legacy-removal-manifest-${timestamp}.json`);
 const manifestJson = `${JSON.stringify(targetManifest, null, 2)}\n`;
 await writeFile(manifestPath, manifestJson, "utf8");
 await writeFile(
  `${manifestPath}.sha256`,
  `${sha256(manifestJson)}  ${path.basename(manifestPath)}\n`,
  "utf8",
 );
 return { draftsPath, manifestPath };
}

async function stageSeed(params: {
 client: ReturnType<typeof createHanziHomeAdminClient>;
 importKey: string;
 seedText: string;
}) {
 const clearResult = await params.client.from(STAGING_TABLE).delete().gte("part", 0);
 if (clearResult.error)
  throw new Error(`Cannot clear stale import staging: ${clearResult.error.message}`);

 const chunks = splitUtf8(params.seedText, CHUNK_BYTES);
 for (let index = 0; index < chunks.length; index += 2) {
  const rows = chunks.slice(index, index + 2).map((payload, offset) => ({
   import_key: params.importKey,
   part: index + offset,
   total_parts: chunks.length,
   payload,
  }));
  const result = await params.client.from(STAGING_TABLE).insert(rows);
  if (result.error) {
   throw new Error(
    `Cannot upload staging parts ${index}-${index + rows.length - 1}: ${result.error.message}`,
   );
  }
 }
 const verification = await params.client
  .from(STAGING_TABLE)
  .select("part,total_parts")
  .eq("import_key", params.importKey)
  .order("part", { ascending: true });
 if (verification.error) throw new Error(`Cannot verify staging: ${verification.error.message}`);
 if (
  verification.data.length !== chunks.length ||
  verification.data.some((row, index) => row.part !== index || row.total_parts !== chunks.length)
 ) {
  throw new Error("Staging parts are incomplete or out of order.");
 }
 return chunks.length;
}

async function main() {
 const intermediateRoot = option("--intermediate-root");
 const advancedRoot = option("--advanced-root");
 if (!intermediateRoot || !advancedRoot) {
  throw new Error("Required: --intermediate-root <dir> --advanced-root <dir>");
 }
 const apply = process.argv.includes("--apply");
 const replaceLegacy = process.argv.includes("--replace-legacy");
 const skipRemoteCollisionCheck = process.argv.includes("--skip-remote-collision-check");
 const manifestOutput = option("--manifest-output");
 const seedOutput = option("--seed-output");
 const backupDir = option("--backup-dir");
 const importedAt = option("--imported-at") ?? undefined;
 const built = await buildBoyaNineVolumeSeed({ intermediateRoot, advancedRoot, importedAt });
 const seed = externalSeedPackageSchema.parse({ ...built.seed, radicals: [] });
 const relationshipErrors = validateExternalSeedRelationships(seed);
 if (relationshipErrors.length > 0) throw new Error(relationshipErrors.join("\n"));

 const manifest = boyaNineVolumeManifest({
  seed: built.seed,
  checksums: built.checksums,
  normalization: built.normalization,
 });
 const seedText = `${JSON.stringify(seed)}\n`;
 const seedSha256 = sha256(seedText);
 console.table(externalSeedCounts(seed));
 console.table(manifest.countsByBook);
 console.log(`Validated replacement package: ${BOYA_NINE_VOLUME_COURSE_ID}`);
 console.log(`Seed SHA-256: ${seedSha256}`);
 if (manifestOutput) {
  const outputPath = path.resolve(manifestOutput);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ ...manifest, seedSha256 }, null, 2)}\n`, "utf8");
  console.log(`Audit manifest written: ${outputPath}`);
 }
 if (seedOutput) {
  const outputPath = path.resolve(seedOutput);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, seedText, "utf8");
  console.log(`Normalized seed written: ${outputPath}`);
 }

 const client = skipRemoteCollisionCheck ? null : createHanziHomeAdminClient();
 let targetLessonIds: string[] = [];
 if (client) {
  await assertNewIdsAvailable(seed, client);
  targetLessonIds = await assertLegacyReplacementReady(client);
 }
 if (!apply) {
  console.log(
   skipRemoteCollisionCheck
    ? "Local replacement dry-run passed. Remote checks were explicitly skipped; nothing was written."
    : "Replacement dry-run passed with 0 write, 0 update and 0 delete. Nothing was written.",
  );
  return;
 }

 if (!replaceLegacy) throw new Error("Apply requires the explicit --replace-legacy flag.");
 if (!backupDir) throw new Error("Apply requires --backup-dir <durable-directory>.");
 if (!client) throw new Error("Apply requires a Supabase admin client.");
 const backup = await writeBackup({ client, backupDir, targetLessonIds });
 console.log(`Draft backup written: ${backup.draftsPath}`);
 console.log(`Legacy manifest written: ${backup.manifestPath}`);

 const importKey = option("--import-key") ?? `boya-9e-${seedSha256.slice(0, 16)}`;
 if (!/^[a-z0-9][a-z0-9._-]{7,127}$/u.test(importKey)) {
  throw new Error(`Invalid import key: ${importKey}`);
 }
 const chunkCount = await stageSeed({ client, importKey, seedText });
 console.log(`Uploaded ${chunkCount} verified staging parts.`);
 const result = await client.rpc("hanzihome_cutover_boya_legacy_to_nine_volume", {
  p_import_key: importKey,
  p_expected_sha256: seedSha256,
 });
 if (result.error) throw new Error(`Atomic Boya cutover failed: ${result.error.message}`);
 console.log("Atomic Boya cutover completed; legacy courses are soft-hidden pending QA.");
 console.log(result.data);
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
