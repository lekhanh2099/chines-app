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
  hasAnyArray(block, [
   "examples",
   "formulas",
   "notes_vi",
   "items",
   "questions",
   "correct_examples",
   "wrong_examples",
  ])
 );
}

function hasRenderableExercise(itemValue: unknown): boolean {
 const item = asRecord(itemValue);
 if (
  hasAnyText(item, [
   "title",
   "title_vi",
   "pattern",
   "empty_reason_vi",
   "passage",
   "text",
   "sample",
   "model_zh",
  ])
 ) {
  return true;
 }
 if (hasText(item.instruction)) return true;
 if (
  hasAnyArray(item, [
   "parts",
   "items",
   "questions",
   "dialogues",
   "dialogue",
   "practice_tasks",
   "chunks",
   "drills",
   "groups",
   "patterns",
   "prompts",
   "supplementary_vocab",
   "supplementary_words",
   "word_bank",
   "left_items",
   "right_items",
   "answer_key",
   "model",
   "models",
  ])
 )
  return true;

 return hasText(item.model);
}

function hasRenderableReading(itemValue: unknown): boolean {
 const item = asRecord(itemValue);
 if (hasAnyText(item, ["title", "title_vi", "text", "vi", "passage"])) return true;
 if (
  hasAnyArray(item, [
   "supplementary_words",
   "supplementary_vocab",
   "items",
   "paragraphs",
   "questions",
   "word_bank",
   "answers",
   "answer_key",
   "cloze_segments",
  ])
 )
  return true;

 const passage = asRecord(item.passage);
 return hasAnyArray(passage, ["segments"]) || hasText(item.passage);
}

const clozeMarkerPattern =
 /(?:[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|\d+|[（(]\s*\d+\s*[）)]|\[\s*\d+\s*\])\s*(?:[_＿]{2,}|…{2,}|\.\.\.+)/g;

function hasAnswerValue(value: unknown): boolean {
 if (typeof value === "string" || typeof value === "number") {
  return Boolean(String(value).trim());
 }

 const record = asRecord(value);
 return hasAnyText(record, ["answer", "answer_zh", "value", "text", "zh", "sample_answer"]);
}

function firstAnswerSource(item: Record<string, unknown>): unknown[] {
 const passage = asRecord(item.passage);
 const keys = [
  "blanks",
  "answers",
  "answer_key",
  "cloze_answers",
  "suggested_answers",
  "questions",
 ];

 for (const key of keys) {
  const values = arrayValue(item, key);
  if (values.some(hasAnswerValue)) return values;
 }

 for (const key of keys) {
  const values = arrayValue(passage, key);
  if (values.some(hasAnswerValue)) return values;
 }

 return [];
}

function passageText(item: Record<string, unknown>): string {
 const passage = asRecord(item.passage);
 const directTextKeys = [
  "text_with_blanks",
  "passage_with_blanks",
  "passage_blanked",
  "cloze_text",
  "passage_text",
  "text",
  "zh",
 ];

 for (const key of directTextKeys) {
  const value = stringValue(passage, key) || stringValue(item, key);
  if (value) return value;
 }

 const paragraphText = arrayValue(passage, "paragraphs")
  .concat(arrayValue(item, "paragraphs"))
  .map((paragraph) => stringValue(asRecord(paragraph), "zh"))
  .filter(Boolean)
  .join("\n");

 if (paragraphText) return paragraphText;

 return arrayValue(item, "parts")
  .map(asRecord)
  .filter((part) => stringValue(part, "type") === "cloze_text")
  .flatMap((part) => arrayValue(part, "items"))
  .map((partItem) => {
   const record = asRecord(partItem);
   return stringValue(record, "text") || stringValue(record, "zh");
  })
  .filter(Boolean)
  .join("\n");
}

function auditReadingCloze(
 file: string,
 lesson: string,
 section: string,
 item: Record<string, unknown>,
): AuditIssue[] {
 const rendering = asRecord(item.rendering);
 const renderer = stringValue(rendering, "renderer");
 const variant = stringValue(item, "variant");
 const type = stringValue(item, "type");
 const isReadingCloze =
  type === "reading_fill_blank" || variant.includes("cloze") || renderer.includes("cloze");

 if (!isReadingCloze) return [];

 const text = passageText(item);
 const markerCount = text.match(clozeMarkerPattern)?.length ?? 0;
 const answerCount = firstAnswerSource(item).filter(hasAnswerValue).length;
 const itemId = stringValue(item, "id");
 const readingReference =
  stringValue(item, "reading_ref") ||
  stringValue(item, "reading_id") ||
  stringValue(item, "linked_reading_id");
 const issues: AuditIssue[] = [];

 if (!text && !readingReference) {
  issues.push({
   file,
   lesson,
   section,
   item: itemId,
   reason: `reading cloze "${type}" has no passage/text/paragraphs or reading_ref`,
  });
 }

 if (text && markerCount > 0 && answerCount === 0) {
  issues.push({
   file,
   lesson,
   section,
   item: itemId,
   reason: `reading cloze has ${markerCount} blank markers but no answer-bearing blanks/answers/answer_key/cloze_answers/suggested_answers/questions`,
  });
 }

 if (markerCount > 0 && answerCount > 0 && markerCount !== answerCount) {
  issues.push({
   file,
   lesson,
   section,
   item: itemId,
   reason: `reading cloze marker/answer mismatch: ${markerCount} markers, ${answerCount} answers`,
  });
 }

 return issues;
}

function auditMinimalPairGroups(
 file: string,
 lesson: string,
 section: string,
 parentItem: Record<string, unknown>,
): AuditIssue[] {
 const issues: AuditIssue[] = [];

 function visit(value: unknown, pathLabel: string) {
  if (Array.isArray(value)) {
   value.forEach((child, index) => visit(child, `${pathLabel}[${index}]`));
   return;
  }

  const record = asRecord(value);
  if (Object.keys(record).length === 0) return;

  if (stringValue(record, "type") === "minimal_pair_group") {
   const groupId = stringValue(record, "id") || pathLabel;
   const items = arrayValue(record, "items");

   if (items.length === 0) {
    issues.push({
     file,
     lesson,
     section,
     item: stringValue(parentItem, "id"),
     reason: `minimal_pair_group "${groupId}" has no items`,
    });
   }

   items.forEach((pairValue, index) => {
    const pair = asRecord(pairValue);
    const left = stringValue(pair, "left");
    const right = stringValue(pair, "right");

    if (!left || !right) {
     issues.push({
      file,
      lesson,
      section,
      item: stringValue(parentItem, "id"),
      reason: `minimal_pair_group "${groupId}" item ${index + 1} must be an object with left/right strings`,
     });
    }
   });
  }

  for (const child of Object.values(record)) {
   visit(child, pathLabel);
  }
 }

 visit(parentItem, stringValue(parentItem, "id") || "exercise");
 return issues;
}

function auditLessonFile(
 file: string,
 input: unknown,
 schema: {
  parse(input: unknown): { lesson: { id: string; sections: Array<Record<string, unknown>> } };
 },
): AuditIssue[] {
 const lesson = schema.parse(input);
 const issues: AuditIssue[] = [];

 for (const section of lesson.lesson.sections) {
  const sectionLabel = `${section.order}. ${section.type} ${section.title}`;
  const sectionRecord = asRecord(section);

  if (section.type === "text") {
   const blocks = arrayValue(section, "blocks");
   if (!blocks.some(hasRenderableTextBlock)) {
    issues.push({
     file,
     lesson: lesson.lesson.id,
     section: sectionLabel,
     reason: "text section has no renderable block lines/paragraphs",
    });
   }
   continue;
  }

  if (section.type === "grammar") {
   for (const itemValue of arrayValue(section, "items")) {
    const item = asRecord(itemValue);
    const blocks = arrayValue(item, "blocks");
    if (blocks.length === 0 || !blocks.some(hasRenderableGrammarBlock)) {
     issues.push({
      file,
      lesson: lesson.lesson.id,
      section: sectionLabel,
      item: stringValue(item, "id"),
      reason: "grammar point has no renderable blocks",
     });
    }
   }
   continue;
  }

  if (section.type === "exercises") {
   for (const itemValue of arrayValue(section, "items")) {
    const item = asRecord(itemValue);
    if (!hasRenderableExercise(item)) {
     issues.push({
      file,
      lesson: lesson.lesson.id,
      section: sectionLabel,
      item: stringValue(item, "id"),
      reason: `exercise ${stringValue(item, "type")} has no supported renderable payload`,
     });
    }
    issues.push(...auditReadingCloze(file, lesson.lesson.id, sectionLabel, item));
    issues.push(...auditMinimalPairGroups(file, lesson.lesson.id, sectionLabel, item));
   }
   continue;
  }

  if (section.type === "reading") {
   for (const itemValue of arrayValue(section, "items")) {
    const item = asRecord(itemValue);
    if (!hasRenderableReading(item)) {
     issues.push({
      file,
      lesson: lesson.lesson.id,
      section: sectionLabel,
      item: stringValue(item, "id"),
      reason: `reading item ${stringValue(item, "type")} has no supported renderable payload`,
     });
    }
   }
   continue;
  }

  if (section.type === "proper_nouns") continue;

  if (section.type === "summary") {
   const embeddedSummary = asRecord(sectionRecord.summary);
   const contentSummary = asRecord(sectionRecord.content);
   if (
    hasAnyText(sectionRecord, ["empty_reason_vi"]) ||
    hasAnyArray(sectionRecord, [
     "items",
     "blocks",
     "lesson_parts",
     "grammar_points",
     "key_patterns",
     "key_sentences",
     "key_sentence_patterns",
    ]) ||
    hasAnyArray(embeddedSummary, [
     "lesson_parts",
     "grammar_points",
     "key_patterns",
     "key_sentences",
     "key_sentence_patterns",
    ]) ||
    hasAnyArray(contentSummary, [
     "lesson_parts",
     "grammar_points",
     "key_patterns",
     "key_sentences",
     "key_sentence_patterns",
    ])
   ) {
    continue;
   }
   continue;
  }

  if (hasAnyText(sectionRecord, ["empty_reason_vi"])) continue;

  if (!hasAnyArray(sectionRecord, ["items", "blocks"])) {
   issues.push({
    file,
    lesson: lesson.lesson.id,
    section: sectionLabel,
    reason: "section has no items/blocks",
   });
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
   issues.push(
    ...auditLessonFile(
     path.join(dataset.dir, "lessons", file),
     await readJson(path.join(lessonDir, file)),
     HanyuLessonSchema,
    ),
   );
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
