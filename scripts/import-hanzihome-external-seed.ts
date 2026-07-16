import path from "node:path";

import {
 createHanziHomeAdminClient,
 fetchAllRows,
 SEED_TABLES,
} from "./lib/hanzihome-supabase-seed.ts";
import {
 externalSeedCounts,
 loadExternalSeedPackage,
 normalizeBoyaCatalogLabels,
 verifyPackageChecksum,
 type ExternalSeedPackage,
} from "./lib/hanzihome-external-seed-package.ts";

type ExistingRow = { id: string; source: string };

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

async function assertNoExistingIds(seed: ExternalSeedPackage) {
 const client = createHanziHomeAdminClient();
 for (const [collection, table] of seedTableMappings) {
  const expectedIds = new Set(seed[collection].map((row) => row.id));
  const existing = await fetchAllRows<ExistingRow>(client, table, "id,source");
  const collisions = existing.filter((row) => expectedIds.has(row.id));
  if (collisions.length > 0) {
   throw new Error(
    `${table}: existing IDs ${collisions
     .slice(0, 10)
     .map((row) => row.id)
     .join(", ")}`,
   );
  }
 }
 return client;
}

async function assertRefreshIsSeedOnly(seed: ExternalSeedPackage) {
 const client = createHanziHomeAdminClient();
 const existingCounts: Record<string, number> = {};

 for (const [collection, table] of seedTableMappings) {
  const expectedIds = new Set(seed[collection].map((row) => row.id));
  const existing = await fetchAllRows<ExistingRow>(client, table, "id,source");
  const collisions = existing.filter((row) => expectedIds.has(row.id));
  const unsafe = collisions.filter((row) => row.source !== "seed");
  if (unsafe.length > 0) {
   throw new Error(
    `${table}: refresh would replace non-seed IDs ${unsafe
     .slice(0, 10)
     .map((row) => row.id)
     .join(", ")}`,
   );
  }
  existingCounts[collection] = collisions.length;
 }

 console.log("Existing seed rows eligible for refresh:");
 console.table(existingCounts);
 return client;
}

async function main() {
 const rootValue = option("--package-root");
 if (!rootValue) throw new Error("Required: --package-root <extracted-package-directory>");
 const packageRoot = path.resolve(rootValue);
 const apply = process.argv.includes("--apply");
 const refresh = process.argv.includes("--refresh");
 const { seed: sourceSeed } = await loadExternalSeedPackage(packageRoot);
 const seed = { ...sourceSeed, ...normalizeBoyaCatalogLabels(sourceSeed) };
 await verifyPackageChecksum(packageRoot, "seed/supabase-seed.json");
 console.table(externalSeedCounts(seed));
 console.log(`Package validated: ${packageRoot}`);

 const refreshClient = refresh ? await assertRefreshIsSeedOnly(seed) : null;

 if (!apply) {
  console.log("Dry-run passed. Nothing was written to Supabase.");
  return;
 }

 const client = refreshClient ?? (await assertNoExistingIds(seed));
 const rpcName = refresh
  ? "hanzihome_refresh_external_seed_package"
  : "hanzihome_import_external_seed_package";
 const result = await client.rpc(rpcName, { p_seed: seed });
 if (result.error) {
  throw new Error(`Atomic ${refresh ? "refresh" : "import"} failed: ${result.error.message}`);
 }
 console.log(`Atomic Supabase ${refresh ? "refresh" : "import"} completed.`);
 console.table(result.data as Record<string, number>);
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
