import type { JsonFieldValue } from "../src/types/json.ts";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function readJson<T = JsonFieldValue>(filePath: string): Promise<T> {
 return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function asRecord(value: JsonFieldValue): Record<string, JsonFieldValue> {
 return value && typeof value === "object" && !Array.isArray(value)
  ? (value as Record<string, JsonFieldValue>)
  : {};
}

async function main() {
 const dbRoot = path.resolve(process.env.HANZIHOME_DB_ROOT ?? "data/hanzihome-db");
 const rootPath = path.join(dbRoot, "manifest.json");
 const rootManifest = asRecord(await readJson(rootPath));
 const datasets = rootManifest.datasets;
 const errors: string[] = [];

 if (asRecord(rootManifest.counts).lessons !== 51) {
  errors.push("root manifest must report 51 lessons");
 }
 if (!Array.isArray(datasets) || datasets.length !== 2) {
  errors.push("root manifest must include q2 and q3 datasets");
 }

 for (const datasetId of ["q2", "q3"]) {
  const manifest = asRecord(await readJson(path.join(dbRoot, datasetId, "manifest.json")));
  const lessons = Array.isArray(manifest.lessons) ? manifest.lessons : [];
  const expected = datasetId === "q2" ? 25 : 26;

  if (lessons.length !== expected) {
   errors.push(`${datasetId} manifest lessons must be ${expected}, got ${lessons.length}`);
  }

  for (const lessonValue of lessons) {
   const lesson = asRecord(lessonValue);
   const lessonRoot = path.join(dbRoot, datasetId, asRecord(lesson).folder as string);
   const sections = await readJson<JsonFieldValue[]>(path.join(lessonRoot, "sections/index.json"));
   const vocab = await readJson<Array<{ file: string }>>(
    path.join(lessonRoot, "vocabulary/index.json"),
   );

   if (sections.length === 0) {
    errors.push(`${datasetId}/${String(lesson.folder)} has no sections`);
   }
   if (vocab.length === 0) {
    errors.push(`${datasetId}/${String(lesson.folder)} has no vocab`);
   }
   for (const vocabEntry of vocab) {
    const item = asRecord(await readJson(path.join(lessonRoot, vocabEntry.file)));
    const pos = asRecord(item.pos);
    const posDetail = asRecord(item.pos_detail);
    const meaning = asRecord(item.meaning);
    const meaningVi =
     typeof meaning.meaning_vi === "string"
      ? meaning.meaning_vi
      : typeof item.meaning_vi === "string"
        ? item.meaning_vi
        : "";
    const normalizedPos =
     typeof pos.normalized === "string"
      ? pos.normalized
      : typeof posDetail.normalized === "string"
        ? posDetail.normalized
        : typeof posDetail.schema_compatible_pos === "string"
          ? posDetail.schema_compatible_pos
          : typeof item.pos === "string" && item.pos.trim()
            ? item.pos
            : "unknown";

    if (!item.id || !item.hanzi || !item.pinyin || !meaningVi || !normalizedPos) {
     errors.push(
      `${datasetId}/${String(lesson.folder)}/${vocabEntry.file} missing runtime vocab fields`,
     );
    }
   }
  }
 }

 if (errors.length > 0) {
  console.error(`HanziHome DB runtime audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
  return;
 }

 console.log("HanziHome DB runtime audit OK.");
}

main().catch((error) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
