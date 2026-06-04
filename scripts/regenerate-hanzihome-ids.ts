import { randomUUID } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Dataset = "q2" | "q3";
type Scope = "lessons" | "vocab";
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type JsonValue = string | number | boolean | null | JsonArray | JsonObject;

type IdOccurrence = {
 filePath: string;
 jsonPath: string;
 parent: JsonObject;
};

type FileRecord = {
 filePath: string;
 data: JsonValue;
 changed: boolean;
};

type CliOptions = {
 datasets: Dataset[];
 scopes: Scope[];
 write: boolean;
 regenerateAll: boolean;
};

const DATA_ROOT = path.join(process.cwd(), "data", "hanzihome");

function parseCsvOption<TValue extends string>(
 rawValue: string | undefined,
 allowedValues: readonly TValue[],
 fallbackValues: TValue[],
) {
 if (!rawValue || rawValue === "all") return fallbackValues;

 const parsedValues = rawValue
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

 const invalidValues = parsedValues.filter(
  (value) => !allowedValues.includes(value as TValue),
 );

 if (invalidValues.length > 0) {
  throw new Error(
   `Invalid option value: ${invalidValues.join(", ")}. Allowed: all, ${allowedValues.join(", ")}`,
  );
 }

 return parsedValues as TValue[];
}

function parseOptions(argv: string[]): CliOptions {
 const args = new Map<string, string | boolean>();

 for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index];
  if (!arg?.startsWith("--")) continue;

  const [key, inlineValue] = arg.slice(2).split("=", 2);
  const nextValue = argv[index + 1];
  const value =
   inlineValue ??
   (nextValue && !nextValue.startsWith("--") ? nextValue : true);

  if (value === nextValue) index += 1;
  args.set(key, value);
 }

 const datasetValue = args.get("dataset");
 const scopeValue = args.get("scope");

 return {
  datasets: parseCsvOption(
   typeof datasetValue === "string" ? datasetValue : undefined,
   ["q2", "q3"] as const,
   ["q2", "q3"],
  ),
  scopes: parseCsvOption(
   typeof scopeValue === "string" ? scopeValue : undefined,
   ["lessons", "vocab"] as const,
   ["lessons", "vocab"],
  ),
  write: args.has("write"),
  regenerateAll: args.has("all"),
 };
}

function isJsonObject(value: JsonValue): value is JsonObject {
 return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapePathSegment(value: string) {
 return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function collectIds(
 value: JsonValue,
 filePath: string,
 jsonPath: string,
 occurrencesById: Map<string, IdOccurrence[]>,
) {
 if (Array.isArray(value)) {
  value.forEach((item, index) => {
   collectIds(item, filePath, `${jsonPath}/${index}`, occurrencesById);
  });
  return;
 }

 if (!isJsonObject(value)) return;

 if (typeof value.id === "string") {
  const current = occurrencesById.get(value.id) ?? [];
  current.push({
   filePath,
   jsonPath: `${jsonPath}/id`,
   parent: value,
  });
  occurrencesById.set(value.id, current);
 }

 Object.entries(value).forEach(([key, item]) => {
  collectIds(
   item,
   filePath,
   `${jsonPath}/${escapePathSegment(key)}`,
   occurrencesById,
  );
 });
}

function rewriteReferences(
 value: JsonValue,
 idReplacements: Map<string, string>,
): JsonValue {
 if (typeof value === "string") {
  return idReplacements.get(value) ?? value;
 }

 if (Array.isArray(value)) {
  return value.map((item) => rewriteReferences(item, idReplacements));
 }

 if (!isJsonObject(value)) return value;

 for (const [key, item] of Object.entries(value)) {
  if (key === "id") continue;
  value[key] = rewriteReferences(item, idReplacements);
 }

 return value;
}

async function readJsonFiles(dataset: Dataset, scope: Scope) {
 const directory = path.join(DATA_ROOT, dataset, scope);
 const entries = await readdir(directory, { withFileTypes: true });
 const fileNames = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, "en"));

 return Promise.all(
  fileNames.map(async (fileName): Promise<FileRecord> => {
   const filePath = path.join(directory, fileName);
   const raw = await readFile(filePath, "utf8");
   return {
    filePath,
    data: JSON.parse(raw) as JsonValue,
    changed: false,
   };
  }),
 );
}

function markChanged(files: FileRecord[], filePath: string) {
 const file = files.find((item) => item.filePath === filePath);
 if (file) file.changed = true;
}

function regenerateIds(files: FileRecord[], options: CliOptions) {
 const occurrencesById = new Map<string, IdOccurrence[]>();

 files.forEach((file) => {
  collectIds(file.data, file.filePath, "", occurrencesById);
 });

 const duplicateEntries = Array.from(occurrencesById.entries()).filter(
  ([, occurrences]) => occurrences.length > 1,
 );
 const idReplacements = new Map<string, string>();

 if (options.regenerateAll) {
  for (const [oldId, occurrences] of occurrencesById.entries()) {
   let uniqueReplacement: string | null = null;

   occurrences.forEach((occurrence) => {
    const nextId = randomUUID();
    occurrence.parent.id = nextId;
    if (occurrences.length === 1) {
     uniqueReplacement = nextId;
    }
    markChanged(files, occurrence.filePath);
   });

   if (uniqueReplacement) {
    idReplacements.set(oldId, uniqueReplacement);
   }
  }
 } else {
  for (const [, occurrences] of duplicateEntries) {
   occurrences.slice(1).forEach((occurrence) => {
    occurrence.parent.id = randomUUID();
    markChanged(files, occurrence.filePath);
   });
  }
 }

 if (idReplacements.size > 0) {
  files.forEach((file) => {
   rewriteReferences(file.data, idReplacements);
   file.changed = true;
  });
 }

 return {
  totalIds: Array.from(occurrencesById.values()).reduce(
   (sum, occurrences) => sum + occurrences.length,
   0,
  ),
  duplicateEntries,
  changedFiles: files.filter((file) => file.changed),
 };
}

function printDuplicateReport(duplicateEntries: Array<[string, IdOccurrence[]]>) {
 if (duplicateEntries.length === 0) {
  console.log("No duplicate ids found.");
  return;
 }

 console.log(`Duplicate ids found: ${duplicateEntries.length}`);
 duplicateEntries.slice(0, 50).forEach(([id, occurrences]) => {
  console.log(`- ${id}`);
  occurrences.forEach((occurrence) => {
   console.log(`  ${path.relative(process.cwd(), occurrence.filePath)}${occurrence.jsonPath}`);
  });
 });

 if (duplicateEntries.length > 50) {
  console.log(`... ${duplicateEntries.length - 50} more duplicate id groups`);
 }
}

async function main() {
 const options = parseOptions(process.argv.slice(2));
 const files = (
  await Promise.all(
   options.datasets.flatMap((dataset) =>
    options.scopes.map((scope) => readJsonFiles(dataset, scope)),
   ),
  )
 ).flat();

 const result = regenerateIds(files, options);

 console.log(
  `Scanned ${files.length} files, ${result.totalIds} ids. Mode: ${
   options.regenerateAll ? "all ids" : "duplicate ids only"
  }.`,
 );
 printDuplicateReport(result.duplicateEntries);

 if (!options.write) {
  console.log("Dry run only. Add --write to update JSON files.");
  return;
 }

 await Promise.all(
  result.changedFiles.map((file) =>
   writeFile(file.filePath, `${JSON.stringify(file.data, null, 2)}\n`),
  ),
 );

 console.log(`Updated ${result.changedFiles.length} files.`);
}

main().catch((error: unknown) => {
 const message = error instanceof Error ? error.message : String(error);
 console.error(message);
 process.exitCode = 1;
});
