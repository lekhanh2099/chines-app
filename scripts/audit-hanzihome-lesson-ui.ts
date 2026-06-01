import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const lessonSchemaModulePath =
 "../src/features/hanzihome/static-json/schemas/hanyuLesson.schema.ts";

type Dataset = {
 id: string;
 dir: string;
 filePrefix: string;
};

type AuditIssue = {
 file: string;
 lesson: string;
 section: string;
 item?: string;
 reason: string;
};

const datasets: Dataset[] = [
 { id: "q2", dir: "data/hanzihome/q2", filePrefix: "hanyu_2_" },
 { id: "q3", dir: "data/hanzihome/q3", filePrefix: "hanyu_3_" },
];

function asRecord(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" && !Array.isArray(value)
  ? (value as Record<string, unknown>)
  : {};
}

function arrayValue(record: Record<string, unknown>, key: string): unknown[] {
 const value = record[key];
 return Array.isArray(value) ? value : [];
}

function stringValue(record: Record<string, unknown>, key: string): string {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

function hasText(value: unknown): boolean {
 if (typeof value === "string") return Boolean(value.trim());
 if (typeof value === "number" || typeof value === "boolean") return true;
 if (Array.isArray(value)) return value.some(hasText);
 const record = asRecord(value);
 return Object.values(record).some(hasText);
}

function hasAnyArray(record: Record<string, unknown>, keys: string[]): boolean {
 return keys.some((key) => arrayValue(record, key).length > 0);
}

function hasAnyText(record: Record<string, unknown>, keys: string[]): boolean {
 return keys.some((key) => hasText(record[key]));
}

function hasRenderableTextBlock(blockValue: unknown): boolean {
 const block = asRecord(blockValue);
 if (hasAnyArray(block, ["lines", "paragraphs", "comprehension_questions"])) return true;
 return hasAnyText(block, ["title", "title_vi"]);
}

function hasRenderableGrammarBlock(blockValue: unknown): boolean {
 const block = asRecord(blockValue);
 return (
  hasAnyText(block, ["content_vi", "pattern", "meaning_vi", "wrong_pattern", "title"]) ||
  hasAnyArray(block, ["examples", "formulas", "notes_vi", "items", "questions", "correct_examples", "wrong_examples"])
 );
}

function hasRenderableExercise(itemValue: unknown): boolean {
 const item = asRecord(itemValue);
 if (hasAnyText(item, ["pattern", "empty_reason_vi"])) return true;
 if (hasAnyArray(item, [
  "parts",
  "items",
  "questions",
  "dialogues",
  "dialogue",
  "practice_tasks",
  "chunks",
  "groups",
  "word_bank",
  "left_items",
  "right_items",
  "answer_key",
  "model",
  "models",
 ])) return true;

 return hasText(item.model);
}

function hasRenderableReading(itemValue: unknown): boolean {
 const item = asRecord(itemValue);
 if (hasAnyText(item, ["text", "vi"])) return true;
 if (hasAnyArray(item, [
  "supplementary_words",
  "items",
  "paragraphs",
  "questions",
  "word_bank",
  "answers",
  "answer_key",
  "cloze_segments",
 ])) return true;

 const passage = asRecord(item.passage);
 return hasAnyArray(passage, ["segments"]) || hasText(item.passage);
}

function auditLessonFile(
 file: string,
 input: unknown,
 schema: { parse(input: unknown): { lesson: { id: string; sections: Array<Record<string, unknown>> } } },
): AuditIssue[] {
 const lesson = schema.parse(input);
 const issues: AuditIssue[] = [];

 for (const section of lesson.lesson.sections) {
  const sectionLabel = `${section.order}. ${section.type} ${section.title}`;
  const sectionRecord = asRecord(section);

  if (section.type === "text") {
   const blocks = arrayValue(section, "blocks");
   if (!blocks.some(hasRenderableTextBlock)) {
    issues.push({ file, lesson: lesson.lesson.id, section: sectionLabel, reason: "text section has no renderable block lines/paragraphs" });
   }
   continue;
  }

  if (section.type === "grammar") {
   for (const itemValue of arrayValue(section, "items")) {
    const item = asRecord(itemValue);
    const blocks = arrayValue(item, "blocks");
    if (blocks.length === 0 || !blocks.some(hasRenderableGrammarBlock)) {
     issues.push({ file, lesson: lesson.lesson.id, section: sectionLabel, item: stringValue(item, "id"), reason: "grammar point has no renderable blocks" });
    }
   }
   continue;
  }

  if (section.type === "exercises") {
   for (const itemValue of arrayValue(section, "items")) {
    const item = asRecord(itemValue);
    if (!hasRenderableExercise(item)) {
     issues.push({ file, lesson: lesson.lesson.id, section: sectionLabel, item: stringValue(item, "id"), reason: `exercise ${stringValue(item, "type")} has no supported renderable payload` });
    }
   }
   continue;
  }

  if (section.type === "reading") {
   for (const itemValue of arrayValue(section, "items")) {
    const item = asRecord(itemValue);
    if (!hasRenderableReading(item)) {
     issues.push({ file, lesson: lesson.lesson.id, section: sectionLabel, item: stringValue(item, "id"), reason: `reading item ${stringValue(item, "type")} has no supported renderable payload` });
    }
   }
   continue;
  }

  if (section.type === "proper_nouns") continue;

  if (hasAnyText(sectionRecord, ["empty_reason_vi"])) continue;

  if (!hasAnyArray(sectionRecord, ["items", "blocks"])) {
   issues.push({ file, lesson: lesson.lesson.id, section: sectionLabel, reason: "section has no items/blocks" });
  }
 }

 return issues;
}

async function readJson(filePath: string): Promise<unknown> {
 return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function main() {
 const { HanyuLessonSchema } = await import(lessonSchemaModulePath);
 const issues: AuditIssue[] = [];
 const summaries: Array<{ id: string; lessonDocuments: number }> = [];

 for (const dataset of datasets) {
  const lessonDir = path.join(process.cwd(), dataset.dir, "lessons");
  const lessonFiles = (await readdir(lessonDir))
   .filter((file) => file.endsWith(".json") && file.startsWith(dataset.filePrefix))
   .sort();

  for (const file of lessonFiles) {
   issues.push(...auditLessonFile(
    path.join(dataset.dir, "lessons", file),
    await readJson(path.join(lessonDir, file)),
    HanyuLessonSchema,
   ));
  }

  summaries.push({ id: dataset.id, lessonDocuments: lessonFiles.length });
 }

 if (issues.length > 0) {
  console.error(JSON.stringify({ ok: false, summaries, issues }, null, 2));
  process.exitCode = 1;
  return;
 }

 console.log(JSON.stringify({ ok: true, summaries }, null, 2));
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
