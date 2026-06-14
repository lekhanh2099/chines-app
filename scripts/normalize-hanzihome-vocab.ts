import { createHash } from "node:crypto";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type DatasetId = "q2" | "q3";
type JsonRecord = Record<string, unknown>;

const datasets: Array<{ id: DatasetId; courseNumber: 2 | 3 }> = [
 { id: "q2", courseNumber: 2 },
 { id: "q3", courseNumber: 3 },
];

const refKeys = new Set(["item_id", "vocab_ref", "grammar_ref", "source_item_id"]);

function isRecord(value: unknown): value is JsonRecord {
 return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(record: JsonRecord, key: string) {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

function numberValue(record: JsonRecord, key: string) {
 const value = record[key];
 return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function readJson(filePath: string): Promise<unknown> {
 return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function writeJson(filePath: string, value: unknown) {
 await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function stableUuidFromKey(key: string) {
 const bytes = Buffer.from(createHash("sha256").update(key).digest("hex").slice(0, 32), "hex");
 bytes[6] = (bytes[6] & 0x0f) | 0x40;
 bytes[8] = (bytes[8] & 0x3f) | 0x80;
 const hex = bytes.toString("hex");

 return [
  hex.slice(0, 8),
  hex.slice(8, 12),
  hex.slice(12, 16),
  hex.slice(16, 20),
  hex.slice(20, 32),
 ].join("-");
}

function isUuid(value: string) {
 return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function getLessonIndex(value: unknown, fallbackIndex: number) {
 const root = isRecord(value) ? value : {};
 const source = isRecord(root.source) ? root.source : {};
 const lesson = isRecord(root.lesson) ? root.lesson : {};
 const indexFromSource = numberValue(source, "lesson_index");
 const id = stringValue(lesson, "id");
 const idMatch = /lesson_(\d+)/.exec(id);

 return indexFromSource || Number(idMatch?.[1]) || fallbackIndex;
}

function getExpectedFileName(courseNumber: 2 | 3, lessonIndex: number) {
 const bookPart = lessonIndex >= 13 ? 2 : 1;

 return `hanyu_${courseNumber}_${bookPart}_lesson_${String(lessonIndex).padStart(2, "0")}_deep_vocab.json`;
}

function getExpectedLessonId(courseNumber: 2 | 3, lessonIndex: number) {
 return getExpectedFileName(courseNumber, lessonIndex).replace(/\.json$/, "");
}

function normalizeExampleLevel(value: unknown) {
 if (value === "application" || value === "lesson" || value === "lesson_context") {
  return "applied";
 }

 return value;
}

function collectIdMap(value: unknown, seedKey: string) {
 const idMap = new Map<string, string>();

 function visit(current: unknown, pointer: string) {
  if (Array.isArray(current)) {
   current.forEach((entry, index) => visit(entry, `${pointer}/${index}`));
   return;
  }

  if (!isRecord(current)) return;

  const id = stringValue(current, "id");
  if (id) {
   idMap.set(
    id,
    isUuid(id) ? id : stableUuidFromKey(`hanzihome-vocab:${seedKey}:${pointer}:${id}`),
   );
  }

  for (const [key, entry] of Object.entries(current)) {
   visit(entry, `${pointer}/${key}`);
  }
 }

 visit(value, "");
 return idMap;
}

function normalizeIdsAndRefs(value: unknown, idMap: Map<string, string>): unknown {
 function mapRef(value: unknown) {
  return typeof value === "string" ? idMap.get(value) || value : value;
 }

 function visit(current: unknown, keyName = ""): unknown {
  if (Array.isArray(current)) {
   if (keyName.endsWith("_refs")) return current.map(mapRef);
   return current.map((entry) => visit(entry));
  }

  if (typeof current === "string") {
   return refKeys.has(keyName) ? idMap.get(current) || current : current;
  }

  if (!isRecord(current)) return current;

  const output: JsonRecord = {};
  for (const [key, entry] of Object.entries(current)) {
   if (key === "id" && typeof entry === "string") {
    output[key] = idMap.get(entry) || entry;
   } else {
    output[key] = visit(entry, key);
   }
  }

  return output;
 }

 return visit(value);
}

function normalizeVocabularyDocument(
 raw: unknown,
 options: {
  courseNumber: 2 | 3;
  lessonIndex: number;
  lessonDocumentId?: string;
 },
) {
 if (!isRecord(raw)) return raw;

 const expectedLegacyLessonId = getExpectedLessonId(options.courseNumber, options.lessonIndex);
 const root: JsonRecord = { ...raw };
 const source = isRecord(root.source) ? { ...root.source } : {};
 const lesson = isRecord(root.lesson) ? { ...root.lesson } : {};
 const oldLessonId = stringValue(lesson, "id");
 const title = isRecord(lesson.title) ? { ...lesson.title } : {};

 source.lesson_index = options.lessonIndex;
 lesson.id = options.lessonDocumentId || expectedLegacyLessonId;
 lesson.title = title;
 root.source = source;
 root.lesson = lesson;

 const idMap = collectIdMap(root, expectedLegacyLessonId);
 if (oldLessonId) idMap.set(oldLessonId, String(lesson.id));
 idMap.set(String(lesson.id), String(lesson.id));

 const normalized = normalizeIdsAndRefs(root, idMap);
 if (!isRecord(normalized)) return normalized;

 for (const item of Array.isArray(normalized.items) ? normalized.items : []) {
  if (!isRecord(item)) continue;

  for (const example of Array.isArray(item.examples) ? item.examples : []) {
   if (!isRecord(example)) continue;
   example.level = normalizeExampleLevel(example.level);
  }
 }

 return normalized;
}

async function getLessonDocumentIds(datasetDir: string) {
 const lessonDir = path.join(datasetDir, "lessons");
 const lessonFiles = (await readdir(lessonDir)).filter((file) => file.endsWith(".json"));
 const idsByIndex = new Map<number, string>();

 for (const file of lessonFiles) {
  const value = await readJson(path.join(lessonDir, file));
  const root = isRecord(value) ? value : {};
  const lesson = isRecord(root.lesson) ? root.lesson : {};
  const metadata = isRecord(lesson.metadata) ? lesson.metadata : {};
  const lessonIndex = numberValue(metadata, "lesson_index") || getLessonIndex(value, 0);
  const lessonId = stringValue(lesson, "id");

  if (lessonIndex && lessonId) idsByIndex.set(lessonIndex, lessonId);
 }

 return idsByIndex;
}

async function normalizeDataset(dataset: { id: DatasetId; courseNumber: 2 | 3 }) {
 const datasetDir = path.join(process.cwd(), "data/hanzihome", dataset.id);
 const vocabDir = path.join(datasetDir, "vocab");
 const lessonDocumentIds = await getLessonDocumentIds(datasetDir);
 const files = (await readdir(vocabDir)).filter((file) => file.endsWith(".json")).sort();
 let changed = 0;
 let renamed = 0;

 for (const [index, file] of files.entries()) {
  const filePath = path.join(vocabDir, file);
  const raw = await readJson(filePath);
  const lessonIndex = getLessonIndex(raw, index + 1);
  const expectedFileName = getExpectedFileName(dataset.courseNumber, lessonIndex);
  const normalized = normalizeVocabularyDocument(raw, {
   courseNumber: dataset.courseNumber,
   lessonIndex,
   lessonDocumentId: lessonDocumentIds.get(lessonIndex),
  });
  const nextFilePath = path.join(vocabDir, expectedFileName);
  const before = JSON.stringify(raw);
  const after = JSON.stringify(normalized);

  if (file !== expectedFileName) {
   await writeJson(nextFilePath, normalized);
   await rm(filePath);
   renamed += 1;
   changed += 1;
   continue;
  }

  if (before !== after) {
   await writeJson(filePath, normalized);
   changed += 1;
  }
 }

 return { id: dataset.id, changed, renamed };
}

async function main() {
 const results = await Promise.all(datasets.map(normalizeDataset));
 console.log(JSON.stringify({ ok: true, datasets: results }, null, 2));
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
