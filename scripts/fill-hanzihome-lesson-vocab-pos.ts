import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Pos =
 | "noun"
 | "verb"
 | "adjective"
 | "adverb"
 | "particle"
 | "preposition"
 | "conjunction"
 | "measure_word"
 | "pronoun"
 | "numeral"
 | "interjection"
 | "phrase"
 | "noun_phrase"
 | "verb_phrase"
 | "adjective_phrase"
 | "idiom"
 | "proper_noun"
 | "grammar_word"
 | "morpheme"
 | "unknown";

type JsonRecord = Record<string, unknown>;

type Args = {
 datasetDir: string;
};

const exactOverrides = new Map<string, Pos>(
 Object.entries({
  "2::开（药）": "verb_phrase",
  "5::不一定": "adverb",
  "5::高血压": "noun",
  "5::必须": "adverb",
  "6::建筑": "noun",
  "6::过去": "noun",
  "6::更": "adverb",
  "6::高": "adjective",
  "6::低": "adjective",
  "6::迷": "noun",
  "6::光": "adverb",
  "6::代": "noun",
  "8::滑雪": "verb",
  "8::风景区": "noun",
  "8::树": "noun",
  "8::叶": "noun",
  "8::哎呀": "interjection",
  "12::最好": "adverb",
  "19::小偷儿": "noun",
  "19::落": "verb",
  "19::似的": "particle",
  "19::湿": "adjective",
  "19::首都": "noun",
  "19::剧场": "noun",
  "19::机场": "noun",
  "19::算命": "verb_phrase",
  "19::花": "verb",
  "19::抽": "verb",
  "19::烟": "noun",
  "19::点": "verb",
  "19::戒烟": "verb_phrase",
  "20::仙女": "noun",
  "20::富翁": "noun",
  "23::点菜 / 点（菜）": "verb_phrase",
  "23::周": "measure_word",
  "23::零下": "noun",
  "23::开玩笑": "verb_phrase",
  "23::玩笑": "noun",
  "23::奥林匹克": "proper_noun",
  "24::对": "measure_word",
  "24::句": "measure_word",
  "24::伸": "verb",
  "24::面前": "noun",
  "24::弯": "adjective",
  "24::放松": "verb",
  "25::连……也……": "grammar_word",
  "25::一半儿": "numeral",
  "25::通": "adjective",
  "25::笨": "adjective",
 }),
);

function parseArgs(): Args {
 const args = process.argv.slice(2);
 const datasetDir = readArg(args, "--dataset") ?? "data/hanzihome/q2";

 return {
  datasetDir: path.resolve(datasetDir),
 };
}

function readArg(args: string[], key: string): string | undefined {
 const index = args.indexOf(key);
 return index >= 0 ? args[index + 1] : undefined;
}

function isRecord(value: unknown): value is JsonRecord {
 return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(record: JsonRecord, key: string): string {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

function normalizeWordKey(value: string): string {
 return value
  .replace(/[（）()]/g, "")
  .replace(/\s+/g, "")
  .replace(/[\/／].*$/, "")
  .trim();
}

async function readJson(filePath: string): Promise<unknown> {
 return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function writeJson(filePath: string, value: unknown) {
 await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function getNormalizedPos(value: unknown): Pos {
 if (typeof value === "string") return isPos(value) ? value : "unknown";
 if (!isRecord(value)) return "unknown";

 const normalized = stringValue(value, "normalized");
 return isPos(normalized) ? normalized : "unknown";
}

function isPos(value: string): value is Pos {
 return [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "particle",
  "preposition",
  "conjunction",
  "measure_word",
  "pronoun",
  "numeral",
  "interjection",
  "phrase",
  "noun_phrase",
  "verb_phrase",
  "adjective_phrase",
  "idiom",
  "proper_noun",
  "grammar_word",
  "morpheme",
  "unknown",
 ].includes(value);
}

async function buildDeepVocabPosMaps(vocabDir: string) {
 const files = (await readdir(vocabDir))
  .filter((file) => file.endsWith(".json"))
  .sort();
 const byLesson = new Map<number, Map<string, Pos>>();

 for (const file of files) {
  const lesson = await readJson(path.join(vocabDir, file));
  if (!isRecord(lesson)) continue;

  const source = isRecord(lesson.source) ? lesson.source : {};
  const lessonIndexValue = source.lesson_index;
  if (typeof lessonIndexValue !== "number") continue;

  const wordMap = byLesson.get(lessonIndexValue) ?? new Map<string, Pos>();
  const items = Array.isArray(lesson.items) ? lesson.items : [];

  for (const itemValue of items) {
   if (!isRecord(itemValue)) continue;

   const hanzi = stringValue(itemValue, "hanzi");
   const pos = getNormalizedPos(itemValue.pos);
   if (!hanzi || pos === "unknown") continue;

   wordMap.set(hanzi, pos);
   wordMap.set(normalizeWordKey(hanzi), pos);
  }

  byLesson.set(lessonIndexValue, wordMap);
 }

 return byLesson;
}

async function fillLessonFile(filePath: string, deepMaps: Map<number, Map<string, Pos>>) {
 const lesson = await readJson(filePath);
 if (!isRecord(lesson)) return { changed: 0, remainingUnknown: 0 };

 const source = isRecord(lesson.source) ? lesson.source : {};
 const lessonIndex = typeof source.lesson_index === "number" ? source.lesson_index : 0;
 const deepMap = deepMaps.get(lessonIndex) ?? new Map<string, Pos>();
 const lessonRecord = isRecord(lesson.lesson) ? lesson.lesson : {};
 const sections = Array.isArray(lessonRecord.sections) ? lessonRecord.sections : [];
 const vocabSection = sections.find((section): section is JsonRecord => (
  isRecord(section) && stringValue(section, "type") === "vocabulary"
 ));
 const items = Array.isArray(vocabSection?.items) ? vocabSection.items : [];
 let changed = 0;
 let remainingUnknown = 0;

 for (const itemValue of items) {
  if (!isRecord(itemValue) || itemValue.pos !== "unknown") continue;

  const hanzi = stringValue(itemValue, "hanzi");
  const exact = exactOverrides.get(`${lessonIndex}::${hanzi}`);
  const mapped = deepMap.get(hanzi) ?? deepMap.get(normalizeWordKey(hanzi));
  const nextPos = exact ?? mapped ?? "unknown";

  if (nextPos === "unknown") {
   remainingUnknown += 1;
   continue;
  }

  itemValue.pos = nextPos;
  changed += 1;
 }

 if (changed > 0) await writeJson(filePath, lesson);

 return { changed, remainingUnknown };
}

async function main() {
 const args = parseArgs();
 const vocabDir = path.join(args.datasetDir, "vocab");
 const lessonDir = path.join(args.datasetDir, "lessons");
 const deepMaps = await buildDeepVocabPosMaps(vocabDir);
 const files = (await readdir(lessonDir))
  .filter((file) => file.endsWith(".json"))
  .sort();
 let changed = 0;
 let remainingUnknown = 0;

 for (const file of files) {
  const result = await fillLessonFile(path.join(lessonDir, file), deepMaps);
  changed += result.changed;
  remainingUnknown += result.remainingUnknown;
 }

 console.log(JSON.stringify({ ok: true, changed, remainingUnknown }, null, 2));
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
