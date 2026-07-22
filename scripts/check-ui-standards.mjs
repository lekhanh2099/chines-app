import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const BASELINE_PATH = path.join(ROOT, "scripts", "ui-standards-baseline.json");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = new Set(["node_modules", ".next", "coverage"]);
const UI_BOUNDARY = `${path.sep}src${path.sep}components${path.sep}ui${path.sep}`;

function listSourceFiles(directory) {
 if (!fs.existsSync(directory)) return [];

 return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  if (IGNORED_DIRECTORIES.has(entry.name)) return [];
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return listSourceFiles(entryPath);
  return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : [];
 });
}

function relative(file) {
 return path.relative(ROOT, file).split(path.sep).join("/");
}

function readBaseline() {
 if (!fs.existsSync(BASELINE_PATH)) {
  throw new Error(`Missing UI baseline: ${relative(BASELINE_PATH)}`);
 }

 const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
 const rules = [
  "directPrimitiveImport",
  "inlineZIndex",
  "arbitraryZIndexClass",
  "legacySelectImport",
  "rawSelect",
 ];

 for (const rule of rules) {
  if (!Array.isArray(parsed[rule]) || parsed[rule].some((value) => typeof value !== "string")) {
   throw new Error(`Invalid baseline entry for ${rule}`);
  }
 }

 return parsed;
}

const baseline = readBaseline();
const hits = {
 directPrimitiveImport: new Set(),
 inlineZIndex: new Set(),
 arbitraryZIndexClass: new Set(),
 legacySelectImport: new Set(),
 rawSelect: new Set(),
};

const directPrimitiveImportPattern =
 /(?:from\s+|import\s*\()["'](?:@base-ui\/react(?:\/[^"']*)?|radix-ui|@radix-ui\/[^"']+)["']/;
const inlineZIndexPattern = /\bzIndex\s*:/;
const arbitraryZIndexPattern = /\bz-\[[^\]]+\]/;
const legacySelectImportPattern = /(?:from\s+|import\s*\()["']@\/components\/ui\/select\/index["']/;
const rawSelectPattern = /<select\b/;

for (const file of listSourceFiles(SRC)) {
 const source = fs.readFileSync(file, "utf8");
 const filePath = relative(file);
 const isSharedUiBoundary = file.includes(UI_BOUNDARY);

 if (!isSharedUiBoundary && directPrimitiveImportPattern.test(source)) {
  hits.directPrimitiveImport.add(filePath);
 }

 if (!isSharedUiBoundary && inlineZIndexPattern.test(source)) {
  hits.inlineZIndex.add(filePath);
 }

 if (!isSharedUiBoundary && arbitraryZIndexPattern.test(source)) {
  hits.arbitraryZIndexClass.add(filePath);
 }

 if (legacySelectImportPattern.test(source)) {
  hits.legacySelectImport.add(filePath);
 }

 if (!isSharedUiBoundary && rawSelectPattern.test(source)) {
  hits.rawSelect.add(filePath);
 }
}

const failures = [];
const staleEntries = [];

for (const [rule, ruleHits] of Object.entries(hits)) {
 const allowed = new Set(baseline[rule]);

 for (const file of [...ruleHits].sort()) {
  if (!allowed.has(file)) failures.push(`${rule}: ${file}`);
 }

 for (const file of [...allowed].sort()) {
  if (!ruleHits.has(file)) staleEntries.push(`${rule}: ${file}`);
 }
}

if (staleEntries.length > 0) {
 console.warn("UI baseline contains resolved or stale entries:");
 console.warn(staleEntries.map((entry) => `- ${entry}`).join("\n"));
 console.warn("Shrink scripts/ui-standards-baseline.json in the same change that resolves debt.");
}

if (failures.length > 0) {
 console.error("New UI-system violations detected:");
 console.error(failures.map((entry) => `- ${entry}`).join("\n"));
 process.exitCode = 1;
} else {
 console.info("UI-system baseline check passed.");
}
