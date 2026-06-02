import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type ImportArgs = {
 inputDir: string;
 outputDir: string;
 course: "q2" | "q3";
 clean: boolean;
};

type JsonRecord = Record<string, unknown>;
type SummaryGrammarPoint = JsonRecord & {
 id: string;
 title: string;
};

const stringLikeKeys = new Set([
 "audio_key",
 "content_vi",
 "en",
 "explanation_vi",
 "meaning_en",
 "meaning_vi",
 "note",
 "note_vi",
 "pattern",
 "pinyin",
 "speaker",
 "structure",
 "summary_vi",
 "text",
 "title",
 "title_vi",
 "vi",
 "zh",
]);

type ExistingUuidMaps = {
 byPathAndId: Map<string, string>;
 byUniqueId: Map<string, string>;
};

function parseArgs(): ImportArgs {
 const args = process.argv.slice(2);
 const inputDir = readArg(args, "--in");
 const outputDir = readArg(args, "--out");
 const course = readArg(args, "--course");

 if (!inputDir || !outputDir || !course) {
  throw new Error(
   "Usage: node --experimental-strip-types scripts/import-hanzihome-lessons.ts --in <input-dir> --out <output-dir> --course q2|q3 [--clean]",
  );
 }

 if (course !== "q2" && course !== "q3") {
  throw new Error(`Unsupported course "${course}". Expected q2 or q3.`);
 }

 return {
  inputDir: path.resolve(inputDir),
  outputDir: path.resolve(outputDir),
  course,
  clean: args.includes("--clean"),
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

function numberValue(record: JsonRecord, key: string): number | undefined {
 const value = record[key];
 return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function arrayValue(record: JsonRecord, key: string): unknown[] {
 const value = record[key];
 return Array.isArray(value) ? value : [];
}

async function readJson(filePath: string): Promise<unknown> {
 return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function writeJson(filePath: string, value: unknown) {
 await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function getLessonIndex(input: unknown, fallbackIndex: number): number {
 const root = isRecord(input) ? input : {};
 const source = isRecord(root.source) ? root.source : {};
 const lesson = isRecord(root.lesson) ? root.lesson : {};
 const sourceIndex = numberValue(source, "lesson_index");
 const lessonNumber = numberValue(lesson, "lesson_number");

 return sourceIndex ?? lessonNumber ?? fallbackIndex;
}

function getCourseBookPrefix(course: ImportArgs["course"], volume: string, lessonIndex: number): string {
 const courseNumber = course === "q3" ? 3 : 2;
 const part = volume.includes("下") || lessonIndex >= 13 ? 2 : 1;

 return `${courseNumber}_${part}`;
}

function getOutputFileName(input: unknown, course: ImportArgs["course"], fallbackIndex: number): string {
 const root = isRecord(input) ? input : {};
 const source = isRecord(root.source) ? root.source : {};
 const lessonIndex = getLessonIndex(input, fallbackIndex);
 const volume = stringValue(source, "volume");
 const bookPrefix = getCourseBookPrefix(course, volume, lessonIndex);

 return `hanyu_${bookPrefix}_lesson_${String(lessonIndex).padStart(2, "0")}.json`;
}

function collectExistingUuidMaps(value: unknown): ExistingUuidMaps {
 const pathAndIdEntries = new Map<string, string>();
 const ids = new Map<string, string[]>();

 function visit(current: unknown, pointer: string) {
  if (Array.isArray(current)) {
   current.forEach((entry, index) => visit(entry, `${pointer}/${index}`));
   return;
  }

  if (!isRecord(current)) return;

  const id = stringValue(current, "id");
  const uuid = stringValue(current, "uuid");
  if (id && uuid) {
   pathAndIdEntries.set(`${pointer}#${id}`, uuid);
   ids.set(id, [...(ids.get(id) ?? []), uuid]);
  }

  for (const [key, entry] of Object.entries(current)) {
   visit(entry, `${pointer}/${key}`);
  }
 }

 visit(value, "");

 return {
  byPathAndId: pathAndIdEntries,
  byUniqueId: new Map(
   Array.from(ids.entries())
    .filter(([, values]) => values.length === 1)
    .map(([id, values]) => [id, values[0] ?? ""]),
  ),
 };
}

function addStableUuids(value: unknown, maps: ExistingUuidMaps): unknown {
 const used = new Set<string>();

 function nextUuid(current: JsonRecord, pointer: string) {
  const existing = stringValue(current, "uuid");
  if (existing && !used.has(existing)) return existing;

  const id = stringValue(current, "id");
  const byPath = id ? maps.byPathAndId.get(`${pointer}#${id}`) : undefined;
  const byId = id ? maps.byUniqueId.get(id) : undefined;
  const candidate = byPath || byId;

  if (candidate && !used.has(candidate)) return candidate;

  let uuid = randomUUID();
  while (used.has(uuid)) uuid = randomUUID();
  return uuid;
 }

 function visit(current: unknown, pointer: string): unknown {
  if (Array.isArray(current)) {
   return current.map((entry, index) => visit(entry, `${pointer}/${index}`));
  }

  if (!isRecord(current)) return current;

  const output: JsonRecord = {};
  for (const [key, entry] of Object.entries(current)) {
   output[key] = visit(entry, `${pointer}/${key}`);
  }

  if (stringValue(output, "id")) {
   const uuid = nextUuid(output, pointer);
   output.uuid = uuid;
   used.add(uuid);
  }

  return output;
 }

 return visit(value, "");
}

function normalizeStringLikeValues(value: unknown): unknown {
 if (Array.isArray(value)) {
  return value.map(normalizeStringLikeValues);
 }

 if (!isRecord(value)) return value;

 const output: JsonRecord = {};
 for (const [key, entry] of Object.entries(value)) {
  if (
   stringLikeKeys.has(key) &&
   Array.isArray(entry) &&
   entry.every((item) => typeof item === "string" || typeof item === "number")
  ) {
   output[key] = entry.map(String).join("\n");
  } else {
   output[key] = normalizeStringLikeValues(entry);
  }
 }

 return output;
}

function buildLessonSummary(lesson: JsonRecord, sections: JsonRecord[]): JsonRecord {
 const summarySection = sections.find((section) => stringValue(section, "type") === "summary");
 const embeddedSummary = isRecord(summarySection?.summary) ? summarySection.summary : {};
 const grammarSection = sections.find((section) => stringValue(section, "type") === "grammar");
 const exercisesSection = sections.find((section) => stringValue(section, "type") === "exercises");

 const embeddedLessonParts = arrayValue(embeddedSummary, "lesson_parts").filter(
  (entry): entry is string => typeof entry === "string" && Boolean(entry.trim()),
 );
 const derivedLessonParts = sections
  .map((section) => stringValue(section, "title_vi") || stringValue(section, "title"))
  .filter(Boolean);

 return {
  lesson_parts: embeddedLessonParts.length > 0 ? embeddedLessonParts : derivedLessonParts,
  grammar_points:
   arrayValue(embeddedSummary, "grammar_points").length > 0
    ? normalizeSummaryGrammarPoints(arrayValue(embeddedSummary, "grammar_points"))
    : arrayValue(grammarSection ?? {}, "items").map((itemValue) => {
      const item = isRecord(itemValue) ? itemValue : {};
      return {
       id: stringValue(item, "id"),
       title: stringValue(item, "title_vi") || stringValue(item, "title"),
      };
     }).filter((item) => item.id || item.title),
  main_patterns:
   arrayValue(embeddedSummary, "main_patterns").length > 0
    ? arrayValue(embeddedSummary, "main_patterns")
    : arrayValue(embeddedSummary, "key_patterns").map((pattern) => ({
      pattern: typeof pattern === "string" ? pattern : String(pattern),
     })),
  exercise_types: arrayValue(exercisesSection ?? {}, "items")
   .map((itemValue) => stringValue(isRecord(itemValue) ? itemValue : {}, "title_vi") || stringValue(isRecord(itemValue) ? itemValue : {}, "title"))
   .filter(Boolean),
  check_needed: Boolean(lesson.check_needed),
 };
}

function normalizeSummaryGrammarPoints(values: unknown[]): SummaryGrammarPoint[] {
	 return values
	  .map((value, index) => {
	   if (typeof value === "string") {
	    return {
	     id: `summary_grammar_${String(index + 1).padStart(2, "0")}`,
     title: value,
    };
   }

   if (!isRecord(value)) return null;

	   return {
	    ...value,
	    id: stringValue(value, "id") || `summary_grammar_${String(index + 1).padStart(2, "0")}`,
	    title: stringValue(value, "title") || stringValue(value, "title_vi") || stringValue(value, "pattern"),
	   };
	  })
	  .filter(
	   (value): value is SummaryGrammarPoint =>
	    Boolean(value?.id) && Boolean(value?.title),
	  );
	}

function normalizeLessonSummary(summary: unknown): JsonRecord {
 const source = isRecord(summary) ? { ...summary } : {};
 source.grammar_points = normalizeSummaryGrammarPoints(
  arrayValue(source, "grammar_points"),
 );

 return source;
}

function normalizeCharacterWritingSection(section: JsonRecord): JsonRecord {
 const items = arrayValue(section, "items").map((itemValue, index) => {
  const item: JsonRecord = isRecord(itemValue) ? { ...itemValue } : { text: itemValue };
  item.id = stringValue(item, "id") || `character_${String(index + 1).padStart(2, "0")}`;
  item.type = stringValue(item, "type") || "character_writing_item";
  item.order = numberValue(item, "order") ?? index + 1;
  item.hanzi =
   stringValue(item, "hanzi") ||
   stringValue(item, "character") ||
   stringValue(item, "text");

  return item;
 });

 return { ...section, items };
}

function normalizeReadingSection(section: JsonRecord): JsonRecord {
 const items = arrayValue(section, "items");
 const blocks = arrayValue(section, "blocks");

 const rawItems = items.length > 0 ? items : blocks;
 if (rawItems.length === 0) return section;

 return {
  ...section,
  items: rawItems.map((itemValue, index) => {
   const item: JsonRecord = isRecord(itemValue) ? { ...itemValue } : { text: itemValue };
   item.id = stringValue(item, "id") || `reading_${String(index + 1).padStart(2, "0")}`;
   item.type = stringValue(item, "type") || "reading_text";
   item.order = numberValue(item, "order") ?? index + 1;

   if (stringValue(item, "type") === "reading_cloze") {
    const passage = item.passage;
    if (typeof passage === "string") {
     item.passage = {
      id: `${item.id}_passage`,
      segments: [
       {
        id: `${item.id}_passage_text`,
        type: "text",
        text: passage,
       },
      ],
     };
    }

    const answerValues = arrayValue(item, "answers");
    const answerKeyValues = arrayValue(item, "answer_key");
    const answers = answerValues.length > 0 ? answerValues : answerKeyValues;
    item.answers = answers.map((answerValue, answerIndex) => {
     if (isRecord(answerValue)) return answerValue;

     return {
      blank_id: `${answerIndex + 1}`,
      answer: String(answerValue),
     };
    });
    item.answer_key = answerKeyValues.map((answerValue, answerIndex) => {
     if (isRecord(answerValue)) return answerValue;

     return {
      blank_id: `${answerIndex + 1}`,
      answer: String(answerValue),
     };
    });
   }

   return item;
  }),
 };
}

function normalizeSection(sectionValue: unknown, index: number): JsonRecord {
 const section = isRecord(sectionValue) ? { ...sectionValue } : {};
 const sectionType = stringValue(section, "type") || "other";
 section.id = stringValue(section, "id") || `section_${String(index + 1).padStart(2, "0")}_${sectionType}`;
 section.order = numberValue(section, "order") ?? index + 1;
 section.title = stringValue(section, "title") || sectionType;
 if (isRecord(section.items)) section.items = [section.items];

 if (sectionType === "reading") return normalizeReadingSection(section);
 if (sectionType === "character_writing") return normalizeCharacterWritingSection(section);

 return section;
}

function normalizeLessonDocument(input: unknown): unknown {
 if (!isRecord(input)) return input;

 const root: JsonRecord = { ...input };
 const lesson = isRecord(root.lesson) ? { ...root.lesson } : {};
 const sections = arrayValue(lesson, "sections").map(normalizeSection);

 lesson.sections = sections;
 lesson.summary = normalizeLessonSummary(
  isRecord(lesson.summary) ? lesson.summary : buildLessonSummary(lesson, sections),
 );

 root.lesson = lesson;
 root.content_type = stringValue(root, "content_type") || "chinese_textbook_lesson";

 return root;
}

async function getInputFiles(inputDir: string) {
 const files = (await readdir(inputDir))
  .filter((file) => file.endsWith(".json"))
  .sort((a, b) => {
   const numberA = Number.parseInt(a, 10);
   const numberB = Number.parseInt(b, 10);
   if (Number.isFinite(numberA) && Number.isFinite(numberB)) return numberA - numberB;
   return a.localeCompare(b);
  });

 if (files.length === 0) throw new Error(`No JSON files found in ${inputDir}`);

 return files;
}

async function main() {
 const args = parseArgs();
 await mkdir(args.outputDir, { recursive: true });
 const inputFiles = await getInputFiles(args.inputDir);

 const prepared = await Promise.all(
  inputFiles.map(async (file, index) => {
   const raw = await readJson(path.join(args.inputDir, file));
   const outputFile = getOutputFileName(raw, args.course, index + 1);
   const outputPath = path.join(args.outputDir, outputFile);
   let existing: unknown = {};

   try {
    existing = await readJson(outputPath);
   } catch {
    existing = {};
   }

   const normalized = normalizeStringLikeValues(normalizeLessonDocument(raw));
   const withUuids = addStableUuids(normalized, collectExistingUuidMaps(existing));

   return { inputFile: file, outputFile, outputPath, value: withUuids };
  }),
 );

 if (args.clean) {
  const expectedFiles = new Set(prepared.map((entry) => entry.outputFile));
  const currentFiles = (await readdir(args.outputDir)).filter((file) => file.endsWith(".json"));
  await Promise.all(
   currentFiles
    .filter((file) => !expectedFiles.has(file))
    .map((file) => rm(path.join(args.outputDir, file))),
  );
 }

 for (const entry of prepared) {
  await writeJson(entry.outputPath, entry.value);
 }

 console.log(
  JSON.stringify(
   {
    ok: true,
    course: args.course,
    imported: prepared.length,
    outputDir: args.outputDir,
    files: prepared.map((entry) => ({
     from: entry.inputFile,
     to: entry.outputFile,
    })),
   },
   null,
   2,
  ),
 );
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
