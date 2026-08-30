import { readFile, rm, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";

const repoRoot = process.cwd();
const routeDir = path.join(
 repoRoot,
 "src/app/[locale]/(app)/han-thuong-mai",
);
const dataDir = path.join(routeDir, "_data");
const loaderPath = path.join(routeDir, "_lib/business-chinese-data.ts");

const encodedParts = [];
const partPaths = [];

for (let index = 1; index <= 7; index += 1) {
 const suffix = String(index).padStart(2, "0");
 const partPath = path.join(dataDir, `content-part-${suffix}.ts`);
 const source = await readFile(partPath, "utf8");
 const match = source.match(/=\s*"([A-Za-z0-9+/=]+)"\s*;/);
 if (match === null) {
  throw new Error(`Cannot extract base64 payload from ${partPath}`);
 }
 encodedParts.push(match[1]);
 partPaths.push(partPath);
}

const jsonText = gunzipSync(
 Buffer.from(encodedParts.join(""), "base64"),
).toString("utf8");
const data = JSON.parse(jsonText);

if (data?.meta?.lessonCount !== 20 || data?.meta?.vocabCount !== 393) {
 throw new Error(
  `Unexpected metadata: ${JSON.stringify(data?.meta ?? null)}`,
 );
}

const books = [data?.books?.tm2, data?.books?.tm3];
if (books.some((book) => !Array.isArray(book?.lessons))) {
 throw new Error("Business Chinese JSON is missing tm2/tm3 lessons");
}

const lessonCount = books.reduce((sum, book) => sum + book.lessons.length, 0);
const vocabCount = books.reduce(
 (sum, book) =>
  sum +
  book.lessons.reduce(
   (bookSum, lesson) => bookSum + (Array.isArray(lesson.vocab) ? lesson.vocab.length : 0),
   0,
  ),
 0,
);

if (lessonCount !== 20 || vocabCount !== 393) {
 throw new Error(
  `Unexpected parsed totals: lessons=${lessonCount}, vocab=${vocabCount}`,
 );
}

await writeFile(
 path.join(dataDir, "business-chinese.json"),
 `${JSON.stringify(data, null, 2)}\n`,
 "utf8",
);

for (const partPath of partPaths) {
 await rm(partPath);
}

const loader = await readFile(loaderPath, "utf8");
const withoutZlib = loader.replace(
 'import { gunzipSync } from "node:zlib";\n',
 "",
);
const withJsonImport = withoutZlib.replace(
 /import contentChunk1[\s\S]*?import contentChunk6 from "\.\.\/_data\/content-chunk-6";\n/,
 'import businessChineseJson from "../_data/business-chinese.json";\n',
);
const migratedLoader = withJsonImport.replace(
 /function loadBusinessChineseData\(\) \{[\s\S]*?\n\}\n\nconst businessChineseData = loadBusinessChineseData\(\);/,
 "const businessChineseData = businessChineseDataSchema.parse(businessChineseJson);",
);

if (
 migratedLoader === loader ||
 migratedLoader.includes("contentChunk") ||
 migratedLoader.includes("gunzipSync") ||
 migratedLoader.includes("Buffer.from(encoded")
) {
 throw new Error("Failed to migrate business-chinese-data.ts to direct JSON import");
}

await writeFile(loaderPath, migratedLoader, "utf8");

console.log(
 `Generated direct JSON: ${lessonCount} lessons, ${vocabCount} vocabulary items`,
);
