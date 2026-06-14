import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

type Severity = "error" | "warning" | "info";

type IssueCode =
 | "SCHEMA_READ_FAILED"
 | "EMPTY_LESSON_SECTIONS"
 | "EMPTY_SECTION_PAYLOAD"
 | "UNKNOWN_SECTION_TYPE"
 | "UNKNOWN_ITEM_TYPE"
 | "UNMAPPED_SECTION_FIELD"
 | "UNMAPPED_ITEM_FIELD"
 | "ANSWER_SOURCE_CONFLICT"
 | "PASSAGE_WITHOUT_RENDERING"
 | "CLOZE_WITHOUT_ANSWERS"
 | "ANSWERS_WITHOUT_CLOZE_PAYLOAD";

type AuditIssue = {
 severity: Severity;
 code: IssueCode;
 file: string;
 location: string;
 message: string;
};

type AuditSummary = {
 files: number;
 lessons: number;
 sections: number;
 items: number;
 errors: number;
 warnings: number;
 infos: number;
};

const defaultDataRoot = path.join(process.cwd(), "data/hanzihome");

const commonKeys = new Set([
 "id",
 "uuid",
 "type",
 "variant",
 "order",
 "title",
 "title_vi",
 "source_origin",
 "source_ref",
 "source_refs",
 "check_needed",
 "answer_verified",
 "verification_status",
 "verified",
 "tags",
 "metadata",
 "created_at",
 "updated_at",
]);

const sectionKnownKeys = new Set([
 ...commonKeys,
 "blocks",
 "items",
 "summary",
 "content",
 "coverage",
 "coverage_total",
 "lesson_parts",
 "grammar_points",
 "key_patterns",
 "key_sentence_patterns",
 "key_sentences",
 "main_patterns",
 "exercise_types",
 "remaining_check_needed",
 "empty_reason_vi",
]);

const textItemKnownKeys = new Set([
 ...commonKeys,
 "paragraphs",
 "lines",
 "dialogues",
 "speakers",
 "zh",
 "pinyin",
 "vi",
 "translation_vi",
 "text",
 "content",
 "content_vi",
 "audio_key",
 "grammar_refs",
 "vocab_refs",
]);

const vocabItemKnownKeys = new Set([
 ...commonKeys,
 "hanzi",
 "pinyin",
 "meaning_vi",
 "meaning_en",
 "pos",
 "pos_detail",
 "notes",
 "note_vi",
 "grammar_refs",
 "vocab_refs",
]);

const grammarItemKnownKeys = new Set([
 ...commonKeys,
 "level",
 "tags",
 "blocks",
 "structure",
 "pattern",
 "meaning_vi",
 "examples",
 "grammar_refs",
 "vocab_refs",
]);

const exerciseItemKnownKeys = new Set([
 ...commonKeys,
 "instruction",
 "instruction_vi",
 "difficulty",
 "skill_focus",
 "grammar_refs",
 "vocab_refs",
 "rendering",
 "pattern",
 "patterns",
 "model",
 "models",
 "model_a",
 "model_b",
 "prompt",
 "prompt_a",
 "prompt_b",
 "questions",
 "items",
 "parts",
 "groups",
 "chunks",
 "left_items",
 "right_items",
 "word_bank",
 "choices",
 "answer",
 "answers",
 "answer_key",
 "blanks",
 "cloze_answers",
 "acceptable_answers",
 "sample_answer",
 "suggested_answers",
 "correct",
 "correct_sentence",
 "wrong",
 "wrong_sentence",
 "explanation_vi",
 "note_vi",
 "passage",
 "passage_text",
 "passage_with_blanks",
 "passage_blanked",
 "passage_complete",
 "text",
 "text_with_blanks",
 "cloze_text",
 "completed_text",
 "completed_text_zh",
 "completed_passage",
 "paragraphs",
 "segments",
 "supplementary_words",
 "supplementary_vocab",
 "supplementary_vocabulary",
 "supplement_vocab",
 "supplemental_vocab",
 "dialogue",
 "dialogues",
 "practice_tasks",
 "sample_answers",
 "ba_sentences",
]);

const readingItemKnownKeys = new Set([
 ...commonKeys,
 "instruction",
 "instruction_vi",
 "source_text_ref",
 "source_ref",
 "rendering",
 "supplementary_words",
 "supplementary_vocab",
 "supplementary_vocabulary",
 "supplement_vocab",
 "supplemental_vocab",
 "word_bank",
 "paragraphs",
 "passage",
 "passage_text",
 "passage_with_blanks",
 "passage_blanked",
 "passage_complete",
 "text",
 "text_with_blanks",
 "cloze_text",
 "completed_text",
 "completed_text_zh",
 "completed_passage",
 "pinyin",
 "vi",
 "translation_vi",
 "segments",
 "questions",
 "generated_comprehension_questions",
 "answers",
 "answer_key",
 "blanks",
 "cloze_answers",
 "retell_outline",
 "retell_key_points",
 "retell_prompts",
 "sample_retelling",
 "sample_retell",
 "sample_retell_generated",
 "ba_sentences",
 "exercise_ref",
 "linked_reading_id",
 "grammar_refs",
 "vocab_refs",
]);

const characterWritingKnownKeys = new Set([
 ...commonKeys,
 "hanzi",
 "pinyin",
 "vocab_ref",
 "stroke_count",
 "radical",
 "stroke_order_key",
 "practice",
 "notes",
 "note_vi",
]);

const genericItemKnownKeys = new Set([
 ...commonKeys,
 "hanzi",
 "zh",
 "text",
 "pinyin",
 "vi",
 "meaning_vi",
 "content",
 "content_vi",
 "note",
 "note_vi",
 "notes",
 "items",
 "blocks",
 "questions",
 "answers",
 "answer_key",
 "examples",
 "lines",
 "dialogue",
 "dialogues",
 "practice_tasks",
 "grammar_refs",
 "vocab_refs",
]);

const knownSectionTypes = new Set([
 "text",
 "vocabulary",
 "proper_nouns",
 "proper_names",
 "notes",
 "grammar",
 "exercises",
 "communication",
 "reading",
 "reading_comprehension",
 "character_writing",
 "writing_characters",
 "summary",
]);

const knownItemTypes = new Set([
 "text_narrative",
 "dialogue",
 "vocabulary_item",
 "note",
 "grammar_point",
 "grammar_item",
 "grammar_overview",
 "grammar_structure",
 "grammar_question_form",
 "grammar_negative_form",
 "grammar_comparison",
 "grammar_common_mistakes",
 "grammar_usage_notes",
 "grammar_micro_practice",
 "phonetics",
 "read_aloud",
 "minimal_pair",
 "substitution",
 "substitution_drill",
 "choose_words_fill_blank",
 "fill_blank",
 "answer_with_pattern",
 "complete_dialogue",
 "correct_sentence",
 "multiple_choice",
 "communication_dialogue",
 "reading_text",
 "reading_short_answer",
 "reading_true_false",
 "reading_cloze",
 "reading_fill_blank",
 "reading_multiple_choice",
 "character_writing_item",
]);

const clozePayloadKeys = [
 "passage",
 "passage_with_blanks",
 "passage_blanked",
 "text_with_blanks",
 "cloze_text",
 "paragraphs",
 "segments",
];

const answerSourceKeys = ["blanks", "answers", "answer_key", "cloze_answers"];

function asRecord(value: unknown): JsonRecord {
 return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function stringValue(record: JsonRecord, key: string): string {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

function arrayValue(record: JsonRecord, key: string): unknown[] {
 const value = record[key];
 return Array.isArray(value) ? value : [];
}

function answerToString(value: unknown): string {
 if (typeof value === "string") return value.trim();
 if (typeof value === "number" || typeof value === "boolean") return String(value);
 if (Array.isArray(value)) {
  return value.map(answerToString).filter(Boolean).join(" / ");
 }
 return "";
}

function hasRenderableValue(value: unknown): boolean {
 if (typeof value === "string") return Boolean(value.trim());
 if (typeof value === "number" || typeof value === "boolean") return true;
 if (Array.isArray(value)) return value.some(hasRenderableValue);

 const record = asRecord(value);
 return Object.values(record).some(hasRenderableValue);
}

async function pathExists(targetPath: string) {
 try {
  await stat(targetPath);
  return true;
 } catch {
  return false;
 }
}

async function isLessonJsonFile(filePath: string) {
 try {
  const input = JSON.parse(await readFile(filePath, "utf8")) as unknown;
  const root = asRecord(input);
  const lesson = asRecord(root.lesson);
  const sections = arrayValue(lesson, "sections");

  return sections.length > 0;
 } catch {
  return false;
 }
}

async function getLessonFiles(root: string) {
 const files: string[] = [];

 async function visit(targetPath: string) {
  const targetStat = await stat(targetPath).catch(() => null);
  if (!targetStat) return;

  if (targetStat.isFile()) {
   if (!targetPath.endsWith(".json")) return;
   if (await isLessonJsonFile(targetPath)) files.push(targetPath);
   return;
  }

  if (!targetStat.isDirectory()) return;

  const entries = await readdir(targetPath, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
   if (entry.name === "node_modules" || entry.name === ".next") continue;
   if (entry.name.startsWith(".")) continue;

   await visit(path.join(targetPath, entry.name));
  }
 }

 await visit(root);

 return files.sort();
}

async function readJson(filePath: string): Promise<unknown> {
 return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

function addIssue(issues: AuditIssue[], issue: AuditIssue) {
 issues.push(issue);
}

function getKnownKeysForSection(sectionType: string) {
 if (sectionType === "text") return new Set([...sectionKnownKeys, "blocks"]);
 if (sectionType === "vocabulary") return new Set([...sectionKnownKeys, "items"]);
 if (sectionType === "notes") return new Set([...sectionKnownKeys, "items"]);
 if (sectionType === "grammar") return new Set([...sectionKnownKeys, "items", "blocks"]);
 if (sectionType === "exercises") return new Set([...sectionKnownKeys, "items", "blocks"]);
 if (sectionType === "reading" || sectionType === "reading_comprehension") {
  return new Set([...sectionKnownKeys, "items", "blocks", ...readingItemKnownKeys]);
 }
 if (sectionType === "character_writing" || sectionType === "writing_characters") {
  return new Set([...sectionKnownKeys, "items"]);
 }
 if (sectionType === "summary") return new Set([...sectionKnownKeys]);
 return sectionKnownKeys;
}

function getKnownKeysForItem(sectionType: string, itemType: string) {
 if (sectionType === "text") return textItemKnownKeys;
 if (sectionType === "vocabulary") return vocabItemKnownKeys;
 if (sectionType === "grammar") return grammarItemKnownKeys;
 if (sectionType === "exercises") return exerciseItemKnownKeys;
 if (sectionType === "reading" || sectionType === "reading_comprehension") {
  return readingItemKnownKeys;
 }
 if (
  sectionType === "character_writing" ||
  sectionType === "writing_characters" ||
  itemType === "character_writing_item"
 ) {
  return characterWritingKnownKeys;
 }
 return genericItemKnownKeys;
}

function auditRenderableExtraFields({
 issues,
 file,
 location,
 record,
 knownKeys,
 code,
}: {
 issues: AuditIssue[];
 file: string;
 location: string;
 record: JsonRecord;
 knownKeys: Set<string>;
 code: "UNMAPPED_SECTION_FIELD" | "UNMAPPED_ITEM_FIELD";
}) {
 const extraFields = Object.entries(record)
  .filter(([key, value]) => !knownKeys.has(key) && hasRenderableValue(value))
  .map(([key]) => key);

 if (extraFields.length === 0) return;

 addIssue(issues, {
  severity: "info",
  code,
  file,
  location,
  message: `Có field renderable chưa map đẹp: ${extraFields.join(", ")}`,
 });
}

function numberValue(record: JsonRecord, key: string): number | null {
 const value = record[key];

 if (typeof value === "number" && Number.isFinite(value)) return value;
 if (typeof value !== "string") return null;

 const direct = Number.parseInt(value.trim(), 10);
 return Number.isFinite(direct) ? direct : null;
}

function numberFromLabelSuffix(label: string): number | null {
 const direct = Number.parseInt(label, 10);
 if (Number.isFinite(direct)) return direct;

 const suffix = label.match(/(\d+)$/)?.[1];
 const suffixNumber = suffix ? Number.parseInt(suffix, 10) : Number.NaN;

 return Number.isFinite(suffixNumber) ? suffixNumber : null;
}

function answerIndexFromRecord(record: JsonRecord, fallback: number) {
 const directNumber =
  numberValue(record, "blank") ??
  numberValue(record, "index") ??
  numberValue(record, "number") ??
  numberValue(record, "order") ??
  numberValue(record, "blank_number");

 if (directNumber !== null) return `${directNumber}`;

 const label =
  stringValue(record, "blank_id") ||
  stringValue(record, "question_id") ||
  stringValue(record, "label") ||
  stringValue(record, "id");

 if (label) {
  const suffix = numberFromLabelSuffix(label);
  return suffix ? `${suffix}` : label;
 }

 return `${fallback + 1}`;
}

function answerTextFromRecord(record: JsonRecord) {
 return (
  stringValue(record, "answer") ||
  stringValue(record, "answer_zh") ||
  stringValue(record, "value") ||
  stringValue(record, "text") ||
  stringValue(record, "zh") ||
  stringValue(record, "sample_answer") ||
  arrayValue(record, "acceptable_answers").map(answerToString).filter(Boolean).join(" / ")
 );
}

function normalizeAnswerSource(values: unknown[]) {
 const map = new Map<string, string>();

 values.forEach((value, index) => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
   const answer = answerToString(value);
   if (answer) map.set(`${index + 1}`, answer);
   return;
  }

  const record = asRecord(value);
  const answer = answerTextFromRecord(record);
  if (!answer) return;

  map.set(answerIndexFromRecord(record, index), answer);
 });

 return map;
}

function auditAnswerSourceConflicts({
 issues,
 file,
 location,
 record,
}: {
 issues: AuditIssue[];
 file: string;
 location: string;
 record: JsonRecord;
}) {
 const sources = answerSourceKeys
  .map((key) => ({
   key,
   values: arrayValue(record, key),
  }))
  .filter((source) => source.values.length > 0);

 if (sources.length <= 1) return;

 const normalizedSources = sources.map((source) => ({
  key: source.key,
  values: normalizeAnswerSource(source.values),
 }));

 for (let i = 0; i < normalizedSources.length; i += 1) {
  for (let j = i + 1; j < normalizedSources.length; j += 1) {
   const left = normalizedSources[i];
   const right = normalizedSources[j];

   if (!left || !right) continue;

   for (const [label, leftAnswer] of left.values.entries()) {
    const rightAnswer = right.values.get(label);
    if (!rightAnswer || rightAnswer === leftAnswer) continue;

    addIssue(issues, {
     severity: "warning",
     code: "ANSWER_SOURCE_CONFLICT",
     file,
     location,
     message: `${left.key}[${label}] = "${leftAnswer}" nhưng ${right.key}[${label}] = "${rightAnswer}"`,
    });
   }
  }
 }
}

function hasClozePayload(record: JsonRecord) {
 return clozePayloadKeys.some((key) => hasRenderableValue(record[key]));
}

function hasClozeAnswers(record: JsonRecord) {
 return answerSourceKeys.some((key) => arrayValue(record, key).length > 0);
}

function hasBlankLikeText(record: JsonRecord) {
 const candidateTexts = [
  stringValue(record, "text"),
  stringValue(record, "zh"),
  stringValue(record, "text_with_blanks"),
  stringValue(record, "passage_with_blanks"),
  stringValue(record, "passage_blanked"),
  stringValue(record, "cloze_text"),
  stringValue(record, "passage_text"),
  ...arrayValue(record, "paragraphs").map((paragraph) => {
   if (typeof paragraph === "string") return paragraph;
   const paragraphRecord = asRecord(paragraph);
   return stringValue(paragraphRecord, "zh") || stringValue(paragraphRecord, "text");
  }),
 ].filter(Boolean);

 return candidateTexts.some((text) =>
  /[_＿]{2,}|…{2,}|①|②|③|\(\s*\d+\s*\)|（\s*\d+\s*）/.test(text),
 );
}

function auditClozeShape({
 issues,
 file,
 location,
 record,
}: {
 issues: AuditIssue[];
 file: string;
 location: string;
 record: JsonRecord;
}) {
 const type = stringValue(record, "type");
 const variant = stringValue(record, "variant");
 const rendering = asRecord(record.rendering);
 const renderer = stringValue(rendering, "renderer");
 const looksLikeCloze =
  type.includes("cloze") ||
  type.includes("fill_blank") ||
  variant.includes("cloze") ||
  renderer.includes("cloze") ||
  hasBlankLikeText(record);

 if (!looksLikeCloze) return;

 if (!hasClozePayload(record)) {
  addIssue(issues, {
   severity: "warning",
   code: "ANSWERS_WITHOUT_CLOZE_PAYLOAD",
   file,
   location,
   message: "Có dấu hiệu cloze nhưng không thấy passage/text/paragraphs/segments.",
  });
 }

 if (!hasClozeAnswers(record)) {
  addIssue(issues, {
   severity: "warning",
   code: "CLOZE_WITHOUT_ANSWERS",
   file,
   location,
   message: "Có dấu hiệu cloze nhưng không thấy blanks/answers/answer_key/cloze_answers.",
  });
 }

 if (!renderer && hasBlankLikeText(record)) {
  addIssue(issues, {
   severity: "info",
   code: "PASSAGE_WITHOUT_RENDERING",
   file,
   location,
   message: "Có blank-like text nhưng thiếu rendering.renderer.",
  });
 }
}

function auditItem({
 issues,
 file,
 sectionType,
 sectionIndex,
 item,
 itemIndex,
}: {
 issues: AuditIssue[];
 file: string;
 sectionType: string;
 sectionIndex: number;
 item: unknown;
 itemIndex: number;
}) {
 const record = asRecord(item);
 if (!hasRenderableValue(record)) return;

 const itemType = stringValue(record, "type");
 const location = `sections[${sectionIndex}].items/blocks[${itemIndex}]${itemType ? `:${itemType}` : ""}`;

 if (itemType && !knownItemTypes.has(itemType)) {
  addIssue(issues, {
   severity: "info",
   code: "UNKNOWN_ITEM_TYPE",
   file,
   location,
   message: `Item type chưa nằm trong danh sách renderer đã biết: ${itemType}`,
  });
 }

 auditRenderableExtraFields({
  issues,
  file,
  location,
  record,
  knownKeys: getKnownKeysForItem(sectionType, itemType),
  code: "UNMAPPED_ITEM_FIELD",
 });

 auditAnswerSourceConflicts({ issues, file, location, record });
 auditClozeShape({ issues, file, location, record });
}

function auditSection({
 issues,
 file,
 section,
 sectionIndex,
}: {
 issues: AuditIssue[];
 file: string;
 section: unknown;
 sectionIndex: number;
}) {
 const record = asRecord(section);
 const sectionType = stringValue(record, "type");
 const location = `sections[${sectionIndex}]${sectionType ? `:${sectionType}` : ""}`;

 if (!sectionType || !knownSectionTypes.has(sectionType)) {
  addIssue(issues, {
   severity: "info",
   code: "UNKNOWN_SECTION_TYPE",
   file,
   location,
   message: sectionType
    ? `Section type chưa nằm trong danh sách đã biết: ${sectionType}`
    : "Section thiếu type.",
  });
 }

 const items = [...arrayValue(record, "items"), ...arrayValue(record, "blocks")];

 if (items.length === 0 && !hasRenderableValue(record)) {
  addIssue(issues, {
   severity: "warning",
   code: "EMPTY_SECTION_PAYLOAD",
   file,
   location,
   message: "Section không có items/blocks và không thấy payload renderable.",
  });
 }

 auditRenderableExtraFields({
  issues,
  file,
  location,
  record,
  knownKeys: getKnownKeysForSection(sectionType),
  code: "UNMAPPED_SECTION_FIELD",
 });

 auditAnswerSourceConflicts({ issues, file, location, record });
 auditClozeShape({ issues, file, location, record });

 items.forEach((item, itemIndex) =>
  auditItem({
   issues,
   file,
   sectionType,
   sectionIndex,
   item,
   itemIndex,
  }),
 );
}

function auditLesson(file: string, input: unknown, issues: AuditIssue[]) {
 const root = asRecord(input);
 const lesson = asRecord(root.lesson);
 const sections = arrayValue(lesson, "sections");

 if (sections.length === 0) {
  addIssue(issues, {
   severity: "error",
   code: "EMPTY_LESSON_SECTIONS",
   file,
   location: "lesson.sections",
   message: "Lesson không có sections.",
  });
  return {
   sections: 0,
   items: 0,
  };
 }

 let itemCount = 0;

 sections.forEach((section, sectionIndex) => {
  const sectionRecord = asRecord(section);
  itemCount +=
   arrayValue(sectionRecord, "items").length + arrayValue(sectionRecord, "blocks").length;

  auditSection({
   issues,
   file,
   section,
   sectionIndex,
  });
 });

 return {
  sections: sections.length,
  items: itemCount,
 };
}

function countIssues(issues: AuditIssue[], severity: Severity) {
 return issues.filter((issue) => issue.severity === severity).length;
}

function printIssue(issue: AuditIssue) {
 const prefix =
  issue.severity === "error" ? "ERROR" : issue.severity === "warning" ? "WARN " : "INFO ";

 console.log(`${prefix} ${issue.code} | ${issue.file} | ${issue.location} | ${issue.message}`);
}

function parseArgs() {
 const args = process.argv.slice(2);
 const datasetArg = args.find((arg) => arg.startsWith("--dataset="))?.replace("--dataset=", "");
 const limitArg = args.find((arg) => arg.startsWith("--limit="))?.replace("--limit=", "");
 const onlyProblems = args.includes("--problems-only");

 return {
  root: path.resolve(datasetArg || defaultDataRoot),
  limit: limitArg ? Number.parseInt(limitArg, 10) : 250,
  onlyProblems,
 };
}

async function main() {
 const args = parseArgs();

 if (!(await pathExists(args.root))) {
  throw new Error(`Không tìm thấy data root: ${args.root}`);
 }

 const files = await getLessonFiles(args.root);
 const issues: AuditIssue[] = [];
 const summary: AuditSummary = {
  files: files.length,
  lessons: 0,
  sections: 0,
  items: 0,
  errors: 0,
  warnings: 0,
  infos: 0,
 };

 for (const file of files) {
  const relativeFile = path.relative(process.cwd(), file);

  try {
   const input = await readJson(file);
   const result = auditLesson(relativeFile, input, issues);

   summary.lessons += 1;
   summary.sections += result.sections;
   summary.items += result.items;
  } catch (error) {
   addIssue(issues, {
    severity: "error",
    code: "SCHEMA_READ_FAILED",
    file: relativeFile,
    location: "(root)",
    message: error instanceof Error ? error.message : String(error),
   });
  }
 }

 summary.errors = countIssues(issues, "error");
 summary.warnings = countIssues(issues, "warning");
 summary.infos = countIssues(issues, "info");

 const visibleIssues = args.onlyProblems
  ? issues.filter((issue) => issue.severity !== "info")
  : issues;

 console.log("");
 console.log("HanziHome overview UI audit");
 console.log("--------------------------");
 console.log(`Data root: ${args.root}`);
 console.log(`Files: ${summary.files}`);
 console.log(`Lessons: ${summary.lessons}`);
 console.log(`Sections: ${summary.sections}`);
 console.log(`Items: ${summary.items}`);
 console.log(`Errors: ${summary.errors}`);
 console.log(`Warnings: ${summary.warnings}`);
 console.log(`Infos: ${summary.infos}`);
 console.log("");

 if (visibleIssues.length === 0) {
  console.log("Không có issue.");
  return;
 }

 visibleIssues.slice(0, args.limit).forEach(printIssue);

 if (visibleIssues.length > args.limit) {
  console.log("");
  console.log(`Đang chỉ hiện ${args.limit}/${visibleIssues.length} issue. Tăng bằng --limit=1000.`);
 }
}

main().catch((error) => {
 console.error(error);
 process.exitCode = 1;
});
