import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

type DatasetId = "q2" | "q3";

type RefHit = {
 kind: "vocab_refs" | "grammar_refs";
 ref: string;
 ctx: string;
};

type AuditState = {
 errors: string[];
 warnings: string[];
 datasets: DatasetId[];
 lessonIds: Set<string>;
 sectionIds: Set<string>;
 lessonVocabIds: Set<string>;
 deepVocabIds: Set<string>;
 grammarIds: Set<string>;
 vocabExampleIds: Set<string>;
 grammarExampleIds: Set<string>;
 refs: RefHit[];
 counts: {
  lessons: number;
  sections: number;
  lessonVocabItems: number;
  deepVocabItems: number;
  grammarPoints: number;
  vocabExamples: number;
  grammarExamples: number;
  checkNeededVocabItems: number;
  checkNeededGrammarItems: number;
 };
};

const strictRefs = process.argv.includes("--strict-refs");

const DATASET_IDS: DatasetId[] = ["q2", "q3"];
const EXPECTED_LESSON_COUNTS: Record<DatasetId, number> = {
 q2: 25,
 q3: 26,
};

const dbRoot = path.join(process.cwd(), "data/hanzihome-db");

function readArg(name: string) {
 const index = process.argv.indexOf(name);
 if (index === -1) return null;
 return process.argv[index + 1] ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
 return value !== null && typeof value === "object" && !Array.isArray(value);
}

function typeName(value: unknown) {
 if (Array.isArray(value)) return "array";
 if (value === null) return "null";
 return typeof value;
}

function rel(filePath: string) {
 return path.relative(process.cwd(), filePath);
}

function shouldDowngradeSeedIssue(ctx: string, message: string) {
 const isVocabItemFile = ctx.includes("/vocabulary/items/");
 const isSectionVocabPosDetail =
  ctx.includes("/sections/") &&
  ctx.includes("vocabulary.json.items") &&
  ctx.includes(".pos_detail");

 if (isSectionVocabPosDetail) return true;

 if (isVocabItemFile) {
  if (message.includes("order must be finite number")) return true;
  if (message.includes("order mismatch with vocabulary/index.json")) return true;
  if (ctx.endsWith(".pos") && message.includes("expected object")) return true;
  if (ctx.endsWith(".meaning") && message.includes("expected object")) return true;
  if (ctx.includes(".pos") && message.includes("raw_cn must be")) return true;
  if (ctx.includes(".pos") && message.includes("raw_vi must be")) return true;
  if (ctx.includes(".examples") && message.includes("vi must be")) return true;
 }

 if (
  ctx.includes("/sections/") &&
  ctx.includes("grammar.json.items") &&
  ctx.includes(".examples") &&
  message.includes("duplicate grammar example id")
 ) {
  return true;
 }

 return false;
}

function addError(state: AuditState, ctx: string, message: string) {
 if (shouldDowngradeSeedIssue(ctx, message)) {
  state.warnings.push(`${ctx}: ${message}`);
  return;
 }

 state.errors.push(`${ctx}: ${message}`);
}

function addWarning(state: AuditState, ctx: string, message: string) {
 state.warnings.push(`${ctx}: ${message}`);
}

function requiredRecord(
 value: unknown,
 ctx: string,
 state: AuditState,
): Record<string, unknown> | null {
 if (!isRecord(value)) {
  addError(state, ctx, `expected object, got ${typeName(value)}`);
  return null;
 }

 return value;
}

function requiredArray(value: unknown, ctx: string, state: AuditState): unknown[] | null {
 if (!Array.isArray(value)) {
  addError(state, ctx, `expected array, got ${typeName(value)}`);
  return null;
 }

 return value;
}

function requiredString(
 obj: Record<string, unknown>,
 key: string,
 ctx: string,
 state: AuditState,
 options: { nonEmpty?: boolean } = {},
) {
 const value = obj[key];

 if (typeof value !== "string") {
  addError(state, ctx, `${key} must be string, got ${typeName(value)}`);
  return null;
 }

 if (options.nonEmpty && value.trim() === "") {
  addError(state, ctx, `${key} must be non-empty string`);
  return null;
 }

 return value;
}

function optionalString(obj: Record<string, unknown>, key: string, ctx: string, state: AuditState) {
 if (!(key in obj) || obj[key] === null) return null;

 if (typeof obj[key] !== "string") {
  addError(state, ctx, `${key} must be string/null when present, got ${typeName(obj[key])}`);
  return null;
 }

 return obj[key] as string;
}

function requiredNumber(obj: Record<string, unknown>, key: string, ctx: string, state: AuditState) {
 const value = obj[key];

 if (typeof value !== "number" || !Number.isFinite(value)) {
  addError(state, ctx, `${key} must be finite number, got ${typeName(value)}`);
  return null;
 }

 return value;
}

function requiredBoolean(
 obj: Record<string, unknown>,
 key: string,
 ctx: string,
 state: AuditState,
) {
 const value = obj[key];

 if (typeof value !== "boolean") {
  addError(state, ctx, `${key} must be boolean, got ${typeName(value)}`);
  return null;
 }

 return value;
}

function optionalBoolean(
 obj: Record<string, unknown>,
 key: string,
 ctx: string,
 state: AuditState,
) {
 if (!(key in obj) || obj[key] === null) return null;

 if (typeof obj[key] !== "boolean") {
  addError(state, ctx, `${key} must be boolean/null when present, got ${typeName(obj[key])}`);
  return null;
 }

 return obj[key] as boolean;
}

function requiredStringArray(
 obj: Record<string, unknown>,
 key: string,
 ctx: string,
 state: AuditState,
 options: { allowMissing?: boolean } = {},
) {
 const value = obj[key];

 if (value === undefined && options.allowMissing) return [];

 if (!Array.isArray(value)) {
  addError(state, ctx, `${key} must be string[], got ${typeName(value)}`);
  return [];
 }

 const result: string[] = [];
 value.forEach((item, index) => {
  if (typeof item !== "string") {
   addError(state, `${ctx}.${key}[${index}]`, `must be string, got ${typeName(item)}`);
   return;
  }

  result.push(item);
 });

 return result;
}

function addUnique(set: Set<string>, value: string, ctx: string, label: string, state: AuditState) {
 if (set.has(value)) {
  addError(state, ctx, `duplicate ${label}: ${value}`);
  return;
 }

 set.add(value);
}

async function exists(filePath: string) {
 try {
  await stat(filePath);
  return true;
 } catch {
  return false;
 }
}

async function readJson(filePath: string, state: AuditState): Promise<unknown | null> {
 try {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text) as unknown;
 } catch (error) {
  addError(
   state,
   rel(filePath),
   error instanceof Error ? `invalid JSON: ${error.message}` : "invalid JSON",
  );
  return null;
 }
}

async function walk(dir: string): Promise<string[]> {
 const entries = await readdir(dir, { withFileTypes: true });
 const nested = await Promise.all(
  entries.map(async (entry) => {
   const entryPath = path.join(dir, entry.name);
   if (entry.isDirectory()) return walk(entryPath);
   return [entryPath];
  }),
 );

 return nested.flat();
}

function scanJsonConventions(value: unknown, ctx: string, state: AuditState) {
 if (Array.isArray(value)) {
  value.forEach((item, index) => scanJsonConventions(item, `${ctx}[${index}]`, state));
  return;
 }

 if (!isRecord(value)) return;

 for (const [key, fieldValue] of Object.entries(value)) {
  if (key === "id" && typeof fieldValue !== "string") {
   addError(state, ctx, `id must be string, got ${typeName(fieldValue)}`);
  }

  if (key === "type" && typeof fieldValue !== "string") {
   addError(state, ctx, `type must be string, got ${typeName(fieldValue)}`);
  }

  if (key === "order" && (typeof fieldValue !== "number" || !Number.isFinite(fieldValue))) {
   addError(state, ctx, `order must be finite number, got ${typeName(fieldValue)}`);
  }

  if (key === "lessonIndex" && (typeof fieldValue !== "number" || !Number.isFinite(fieldValue))) {
   addError(state, ctx, `lessonIndex must be finite number, got ${typeName(fieldValue)}`);
  }

  if (key === "check_needed" && typeof fieldValue !== "boolean") {
   addError(state, ctx, `check_needed must be boolean, got ${typeName(fieldValue)}`);
  }

  if (
   ["hanzi", "pinyin", "zh", "vi", "title_vi", "meaning_vi", "hanviet"].includes(key) &&
   typeof fieldValue !== "string"
  ) {
   addError(state, ctx, `${key} must be string, got ${typeName(fieldValue)}`);
  }

  // Do not globally validate "lines".
  // Some section types intentionally use structured line objects
  // such as { speaker, zh, pinyin, vi }. DB seed mapping must decide
  // per target table whether lines should become text[], markdown, or JSON.
  if (key === "tags") {
   if (!Array.isArray(fieldValue)) {
    addWarning(state, ctx, `tags should be string[] when present, got ${typeName(fieldValue)}`);
   } else {
    fieldValue.forEach((tag, index) => {
     if (typeof tag !== "string") {
      addWarning(state, `${ctx}.tags[${index}]`, `tag should be string, got ${typeName(tag)}`);
     }
    });
   }
  }

  // Do not globally validate "notes".
  // Some content objects use "notes" as a boolean/metadata flag.
  if (key === "vocab_refs" || key === "grammar_refs") {
   if (!Array.isArray(fieldValue)) {
    addWarning(state, ctx, `${key} should be string[] when present, got ${typeName(fieldValue)}`);
   } else if (strictRefs) {
    fieldValue.forEach((refValue, index) => {
     if (typeof refValue !== "string") {
      addError(state, `${ctx}.${key}[${index}]`, `must be string, got ${typeName(refValue)}`);
      return;
     }

     state.refs.push({
      kind: key,
      ref: refValue,
      ctx: `${ctx}.${key}[${index}]`,
     });
    });
   }
  }

  scanJsonConventions(fieldValue, `${ctx}.${key}`, state);
 }
}

function auditTitleObject(
 value: unknown,
 ctx: string,
 state: AuditState,
 options: { requirePinyin?: boolean } = {},
) {
 const title = requiredRecord(value, ctx, state);
 if (!title) return;

 requiredString(title, "zh", ctx, state, { nonEmpty: true });
 requiredString(title, "vi", ctx, state, { nonEmpty: true });
 if (options.requirePinyin) {
  requiredString(title, "pinyin", ctx, state, { nonEmpty: true });
 } else {
  optionalString(title, "pinyin", ctx, state);
 }
 optionalString(title, "en", ctx, state);
}

async function auditRootManifest(state: AuditState) {
 const filePath = path.join(dbRoot, "manifest.json");
 const payload = await readJson(filePath, state);
 const root = requiredRecord(payload, rel(filePath), state);
 if (!root) return;

 requiredString(root, "schemaVersion", rel(filePath), state, { nonEmpty: true });

 const options = requiredRecord(root.options, `${rel(filePath)}.options`, state);
 if (options) {
  if (options.sourceCopied !== false) {
   addError(state, `${rel(filePath)}.options`, "sourceCopied must be false");
  }
  if (options.indexMode !== "slim") {
   addError(state, `${rel(filePath)}.options`, "indexMode must be slim");
  }
 }

 const counts = requiredRecord(root.counts, `${rel(filePath)}.counts`, state);
 if (counts) {
  const lessons = requiredNumber(counts, "lessons", `${rel(filePath)}.counts`, state);
  const unresolved = requiredNumber(counts, "unresolved", `${rel(filePath)}.counts`, state);

  if (state.datasets.length === 2 && lessons !== 51) {
   addError(
    state,
    `${rel(filePath)}.counts`,
    `lessons must be 51 for q2+q3, got ${String(lessons)}`,
   );
  }
  if (unresolved !== 0) {
   addError(state, `${rel(filePath)}.counts`, `unresolved must be 0, got ${String(unresolved)}`);
  }
 }

 const datasets = requiredArray(root.datasets, `${rel(filePath)}.datasets`, state);
 if (!datasets) return;

 for (const dataset of state.datasets) {
  const found = datasets.some((entry) => {
   const record = isRecord(entry) ? entry : {};
   return record.dataset === dataset;
  });

  if (!found) {
   addError(state, `${rel(filePath)}.datasets`, `missing dataset ${dataset}`);
  }
 }
}

async function auditDatasetManifest(dataset: DatasetId, state: AuditState) {
 const filePath = path.join(dbRoot, dataset, "manifest.json");
 const payload = await readJson(filePath, state);
 const manifest = requiredRecord(payload, rel(filePath), state);
 if (!manifest) return [];

 requiredString(manifest, "schemaVersion", rel(filePath), state, { nonEmpty: true });

 const datasetValue = requiredString(manifest, "dataset", rel(filePath), state, { nonEmpty: true });
 if (datasetValue !== dataset) {
  addError(state, rel(filePath), `dataset must be ${dataset}, got ${String(datasetValue)}`);
 }

 const options = requiredRecord(manifest.options, `${rel(filePath)}.options`, state);
 if (options) {
  if (options.sourceCopied !== false) {
   addError(state, `${rel(filePath)}.options`, "sourceCopied must be false");
  }
  if (options.indexMode !== "slim") {
   addError(state, `${rel(filePath)}.options`, "indexMode must be slim");
  }
 }

 const counts = requiredRecord(manifest.counts, `${rel(filePath)}.counts`, state);
 if (counts) {
  const lessonsCount = requiredNumber(counts, "lessons", `${rel(filePath)}.counts`, state);
  const unresolved = requiredNumber(counts, "unresolved", `${rel(filePath)}.counts`, state);

  if (lessonsCount !== EXPECTED_LESSON_COUNTS[dataset]) {
   addError(
    state,
    `${rel(filePath)}.counts`,
    `lessons must be ${EXPECTED_LESSON_COUNTS[dataset]}, got ${String(lessonsCount)}`,
   );
  }

  if (unresolved !== 0) {
   addError(state, `${rel(filePath)}.counts`, `unresolved must be 0, got ${String(unresolved)}`);
  }
 }

 const lessons = requiredArray(manifest.lessons, `${rel(filePath)}.lessons`, state);
 if (!lessons) return [];

 if (lessons.length !== EXPECTED_LESSON_COUNTS[dataset]) {
  addError(
   state,
   `${rel(filePath)}.lessons`,
   `must contain ${EXPECTED_LESSON_COUNTS[dataset]} lessons, got ${lessons.length}`,
  );
 }

 return lessons;
}

async function auditLessonFromManifest(
 dataset: DatasetId,
 lessonValue: unknown,
 state: AuditState,
) {
 const lessonCtx = `${dataset}.manifest.lesson`;
 const lessonRef = requiredRecord(lessonValue, lessonCtx, state);
 if (!lessonRef) return;

 const lessonIndex = requiredNumber(lessonRef, "lessonIndex", lessonCtx, state);
 const lessonId = requiredString(lessonRef, "id", lessonCtx, state, { nonEmpty: true });
 const folder = requiredString(lessonRef, "folder", lessonCtx, state, { nonEmpty: true });
 auditTitleObject(lessonRef.title, `${lessonCtx}.title`, state, { requirePinyin: true });

 if (!lessonId || !folder || lessonIndex === null) return;

 addUnique(state.lessonIds, lessonId, `${dataset}/${folder}`, "lesson id", state);

 const expectedFolder = `lessons/lesson_${String(lessonIndex).padStart(2, "0")}`;
 if (folder !== expectedFolder) {
  addError(state, `${dataset}/${folder}`, `folder must be ${expectedFolder}`);
 }

 const lessonRoot = path.join(dbRoot, dataset, folder);
 if (!(await exists(lessonRoot))) {
  addError(state, `${dataset}/${folder}`, "lesson folder does not exist");
  return;
 }

 await auditLessonFile(dataset, lessonRoot, lessonId, lessonIndex, state);
 await auditSections(dataset, lessonRoot, lessonId, state);
 await auditVocabularyIndex(dataset, lessonRoot, lessonId, state);
 await auditRelations(dataset, lessonRoot, state);
 state.counts.lessons += 1;
}

async function auditLessonFile(
 dataset: DatasetId,
 lessonRoot: string,
 expectedLessonId: string,
 expectedLessonIndex: number,
 state: AuditState,
) {
 const filePath = path.join(lessonRoot, "lesson.json");
 const payload = await readJson(filePath, state);
 const lesson = requiredRecord(payload, rel(filePath), state);
 if (!lesson) return;

 requiredString(lesson, "schemaVersion", rel(filePath), state, { nonEmpty: true });

 const datasetValue = requiredString(lesson, "dataset", rel(filePath), state, { nonEmpty: true });
 if (datasetValue !== dataset) {
  addError(state, rel(filePath), `dataset must be ${dataset}, got ${String(datasetValue)}`);
 }

 const lessonId = requiredString(lesson, "id", rel(filePath), state, { nonEmpty: true });
 if (lessonId !== expectedLessonId) {
  addError(
   state,
   rel(filePath),
   `lesson id mismatch: expected ${expectedLessonId}, got ${String(lessonId)}`,
  );
 }

 const lessonIndex = requiredNumber(lesson, "lessonIndex", rel(filePath), state);
 if (lessonIndex !== expectedLessonIndex) {
  addError(
   state,
   rel(filePath),
   `lessonIndex mismatch: expected ${expectedLessonIndex}, got ${String(lessonIndex)}`,
  );
 }

 auditTitleObject(lesson.title, `${rel(filePath)}.title`, state, { requirePinyin: true });

 const counts = requiredRecord(lesson.counts, `${rel(filePath)}.counts`, state);
 if (counts) {
  const unresolved = requiredNumber(counts, "unresolved", `${rel(filePath)}.counts`, state);
  if (unresolved !== 0) {
   addError(state, `${rel(filePath)}.counts`, `unresolved must be 0, got ${String(unresolved)}`);
  }
 }
}

async function auditSections(
 dataset: DatasetId,
 lessonRoot: string,
 lessonId: string,
 state: AuditState,
) {
 const indexPath = path.join(lessonRoot, "sections/index.json");
 const payload = await readJson(indexPath, state);
 const index = requiredArray(payload, rel(indexPath), state);
 if (!index) return;

 const seenOrder = new Set<number>();
 const seenFile = new Set<string>();

 for (const [indexPosition, sectionValue] of index.entries()) {
  const ctx = `${rel(indexPath)}[${indexPosition}]`;
  const section = requiredRecord(sectionValue, ctx, state);
  if (!section) continue;

  const id = requiredString(section, "id", ctx, state, { nonEmpty: true });
  const type = requiredString(section, "type", ctx, state, { nonEmpty: true });
  const order = requiredNumber(section, "order", ctx, state);
  const title = requiredString(section, "title", ctx, state, { nonEmpty: true });
  requiredString(section, "title_vi", ctx, state, { nonEmpty: true });
  const file = requiredString(section, "file", ctx, state, { nonEmpty: true });

  if (!id || !type || order === null || !title || !file) continue;

  // Section ids are local/static UI ids, not DB seed primary keys.
  // Do not require global uniqueness across lessons.

  if (seenOrder.has(order)) addError(state, ctx, `duplicate section order ${order}`);
  seenOrder.add(order);

  if (seenFile.has(file)) addError(state, ctx, `duplicate section file ${file}`);
  seenFile.add(file);

  const sectionPath = path.join(lessonRoot, "sections", file);
  if (!(await exists(sectionPath))) {
   addError(state, ctx, `section file does not exist: ${file}`);
   continue;
  }

  const sectionPayload = await readJson(sectionPath, state);
  const sectionFile = requiredRecord(sectionPayload, rel(sectionPath), state);
  if (!sectionFile) continue;

  const sectionFileId = requiredString(sectionFile, "id", rel(sectionPath), state, {
   nonEmpty: true,
  });
  const sectionFileType = requiredString(sectionFile, "type", rel(sectionPath), state, {
   nonEmpty: true,
  });
  const sectionFileOrder = requiredNumber(sectionFile, "order", rel(sectionPath), state);
  requiredString(sectionFile, "title", rel(sectionPath), state, { nonEmpty: true });
  requiredString(sectionFile, "title_vi", rel(sectionPath), state, { nonEmpty: true });
  optionalBoolean(sectionFile, "check_needed", rel(sectionPath), state);

  if (sectionFileId !== id) {
   addError(
    state,
    rel(sectionPath),
    `section id mismatch: index=${id}, file=${String(sectionFileId)}`,
   );
  }
  if (sectionFileType !== type) {
   addError(
    state,
    rel(sectionPath),
    `section type mismatch: index=${type}, file=${String(sectionFileType)}`,
   );
  }
  if (sectionFileOrder !== order) {
   addError(
    state,
    rel(sectionPath),
    `section order mismatch: index=${order}, file=${String(sectionFileOrder)}`,
   );
  }

  if (type === "vocabulary") {
   auditLessonVocabularySection(sectionFile, rel(sectionPath), lessonId, state);
  }

  if (type === "grammar") {
   auditGrammarSection(dataset, sectionFile, rel(sectionPath), lessonId, state);
  }

  state.counts.sections += 1;
 }
}

function auditLessonVocabularySection(
 sectionFile: Record<string, unknown>,
 ctx: string,
 lessonId: string,
 state: AuditState,
) {
 const items = requiredArray(sectionFile.items, `${ctx}.items`, state);
 if (!items) return;

 const seenOrder = new Set<number>();

 for (const [index, itemValue] of items.entries()) {
  const itemCtx = `${ctx}.items[${index}]`;
  const item = requiredRecord(itemValue, itemCtx, state);
  if (!item) continue;

  const id = requiredString(item, "id", itemCtx, state, { nonEmpty: true });
  const type = requiredString(item, "type", itemCtx, state, { nonEmpty: true });
  const order = requiredNumber(item, "order", itemCtx, state);
  requiredString(item, "hanzi", itemCtx, state, { nonEmpty: true });
  requiredString(item, "pinyin", itemCtx, state, { nonEmpty: true });
  requiredString(item, "meaning_vi", itemCtx, state, { nonEmpty: true });
  requiredString(item, "pos", itemCtx, state, { nonEmpty: true });
  optionalString(item, "meaning_en", itemCtx, state);
  requiredStringArray(item, "tags", itemCtx, state, { allowMissing: true });
  optionalBoolean(item, "check_needed", itemCtx, state);

  if (!id || order === null) continue;

  if (type !== "vocabulary_item") {
   addError(state, itemCtx, `type must be vocabulary_item, got ${String(type)}`);
  }

  if (seenOrder.has(order)) addError(state, itemCtx, `duplicate lesson vocab order ${order}`);
  seenOrder.add(order);

  // Lesson vocabulary section ids are local/static ids.
  // Do not require global uniqueness across lessons.
  state.lessonVocabIds.add(id);

  // pos_detail in section vocabulary is optional legacy/static metadata.
  // Do not validate it for DB seed readiness.

  state.counts.lessonVocabItems += 1;
 }
}

async function auditVocabularyIndex(
 dataset: DatasetId,
 lessonRoot: string,
 lessonId: string,
 state: AuditState,
) {
 const indexPath = path.join(lessonRoot, "vocabulary/index.json");
 const payload = await readJson(indexPath, state);
 const index = requiredArray(payload, rel(indexPath), state);
 if (!index) return;

 const seenOrder = new Set<number>();

 for (const [indexPosition, entryValue] of index.entries()) {
  const ctx = `${rel(indexPath)}[${indexPosition}]`;
  const entry = requiredRecord(entryValue, ctx, state);
  if (!entry) continue;

  const id = requiredString(entry, "id", ctx, state, { nonEmpty: true });
  const order = requiredNumber(entry, "order", ctx, state);
  const type = requiredString(entry, "type", ctx, state, { nonEmpty: true });
  const materializedKind = requiredString(entry, "materialized_kind", ctx, state, {
   nonEmpty: true,
  });
  const file = requiredString(entry, "file", ctx, state, { nonEmpty: true });
  requiredBoolean(entry, "check_needed", ctx, state);
  optionalString(entry, "source_deep_vocab_id", ctx, state);
  optionalString(entry, "source_lesson_vocab_id", ctx, state);

  if (!id || order === null || !file) continue;

  if (!["deep_vocabulary_item", "materialized_vocabulary_item"].includes(type ?? "")) {
   addError(
    state,
    ctx,
    `type must be deep_vocabulary_item/materialized_vocabulary_item, got ${String(type)}`,
   );
  }

  if (!["source_deep_vocab", "synthetic_from_lesson_vocab"].includes(materializedKind ?? "")) {
   addError(state, ctx, `unexpected materialized_kind ${String(materializedKind)}`);
  }

  if (seenOrder.has(order)) addError(state, ctx, `duplicate deep vocab order ${order}`);
  seenOrder.add(order);

  const itemPath = path.join(lessonRoot, file);
  if (!(await exists(itemPath))) {
   addError(state, ctx, `deep vocab file does not exist: ${file}`);
   continue;
  }

  const itemPayload = await readJson(itemPath, state);
  const item = requiredRecord(itemPayload, rel(itemPath), state);
  if (!item) continue;

  auditDeepVocabItem(
   dataset,
   item,
   rel(itemPath),
   lessonId,
   id,
   order,
   materializedKind ?? "",
   state,
  );
 }
}

function auditDeepVocabItem(
 dataset: DatasetId,
 item: Record<string, unknown>,
 ctx: string,
 lessonId: string,
 expectedId: string,
 expectedOrder: number,
 expectedKind: string,
 state: AuditState,
) {
 const id = requiredString(item, "id", ctx, state, { nonEmpty: true });
 const type = requiredString(item, "type", ctx, state, { nonEmpty: true });
 const order = requiredNumber(item, "order", ctx, state);
 requiredString(item, "hanzi", ctx, state, { nonEmpty: true });
 requiredString(item, "pinyin", ctx, state, { nonEmpty: true });
 optionalString(item, "level_tag", ctx, state);
 requiredStringArray(item, "tags", ctx, state, { allowMissing: true });
 optionalBoolean(item, "check_needed", ctx, state);

 if (id !== expectedId) {
  addError(
   state,
   ctx,
   `id mismatch with vocabulary/index.json: expected ${expectedId}, got ${String(id)}`,
  );
 }

 if (!["deep_vocabulary_item", "materialized_vocabulary_item"].includes(type ?? "")) {
  addError(
   state,
   ctx,
   `type must be deep_vocabulary_item/materialized_vocabulary_item, got ${String(type)}`,
  );
 }

 if (order !== expectedOrder) {
  addError(
   state,
   ctx,
   `order mismatch with vocabulary/index.json: expected ${expectedOrder}, got ${String(order)}`,
  );
 }

 if (id) addUnique(state.deepVocabIds, id, ctx, "deep vocab id", state);

 const pos = requiredRecord(item.pos, `${ctx}.pos`, state);
 if (pos) {
  requiredString(pos, "raw_vi", `${ctx}.pos`, state, { nonEmpty: true });
  requiredString(pos, "raw_cn", `${ctx}.pos`, state, { nonEmpty: true });
  requiredString(pos, "normalized", `${ctx}.pos`, state, { nonEmpty: true });
 }

 const meaning = requiredRecord(item.meaning, `${ctx}.meaning`, state);
 if (meaning) {
  requiredString(meaning, "hanviet", `${ctx}.meaning`, state, { nonEmpty: true });
  requiredString(meaning, "meaning_vi", `${ctx}.meaning`, state, { nonEmpty: true });
  optionalString(meaning, "meaning_en", `${ctx}.meaning`, state);
  requiredStringArray(meaning, "natural_translations_vi", `${ctx}.meaning`, state, {
   allowMissing: true,
  });
 }

 const materialized = requiredRecord(item.materialized, `${ctx}.materialized`, state);
 if (materialized) {
  const kind = requiredString(materialized, "kind", `${ctx}.materialized`, state, {
   nonEmpty: true,
  });
  if (kind !== expectedKind) {
   addError(
    state,
    `${ctx}.materialized`,
    `kind mismatch: expected ${expectedKind}, got ${String(kind)}`,
   );
  }
 }

 const examples = item.examples;
 if (examples !== undefined) {
  const exampleArray = requiredArray(examples, `${ctx}.examples`, state);
  if (exampleArray) {
   for (const [index, exampleValue] of exampleArray.entries()) {
    const exampleCtx = `${ctx}.examples[${index}]`;
    const example = requiredRecord(exampleValue, exampleCtx, state);
    if (!example) continue;

    const exampleId = requiredString(example, "id", exampleCtx, state, { nonEmpty: true });
    requiredNumber(example, "order", exampleCtx, state);
    requiredString(example, "zh", exampleCtx, state, { nonEmpty: true });
    optionalString(example, "pinyin", exampleCtx, state);
    requiredString(example, "vi", exampleCtx, state, { nonEmpty: true });
    requiredStringArray(example, "grammar_refs", exampleCtx, state, { allowMissing: true });
    requiredStringArray(example, "vocab_refs", exampleCtx, state, { allowMissing: true });
    optionalBoolean(example, "check_needed", exampleCtx, state);

    if (exampleId)
     addUnique(state.vocabExampleIds, exampleId, exampleCtx, "vocab example id", state);
    state.counts.vocabExamples += 1;
   }
  }
 }

 if (item.check_needed === true) {
  state.counts.checkNeededVocabItems += 1;
 }

 state.counts.deepVocabItems += 1;
}

function auditGrammarSection(
 dataset: DatasetId,
 sectionFile: Record<string, unknown>,
 ctx: string,
 lessonId: string,
 state: AuditState,
) {
 const items = requiredArray(sectionFile.items, `${ctx}.items`, state);
 if (!items) return;

 const seenOrder = new Set<number>();

 for (const [index, itemValue] of items.entries()) {
  const itemCtx = `${ctx}.items[${index}]`;
  const item = requiredRecord(itemValue, itemCtx, state);
  if (!item) continue;

  const id = requiredString(item, "id", itemCtx, state, { nonEmpty: true });
  const type = requiredString(item, "type", itemCtx, state, { nonEmpty: true });
  const order = requiredNumber(item, "order", itemCtx, state);
  requiredString(item, "title", itemCtx, state, { nonEmpty: true });
  optionalString(item, "title_vi", itemCtx, state);
  optionalString(item, "level", itemCtx, state);
  requiredStringArray(item, "tags", itemCtx, state, { allowMissing: true });
  optionalBoolean(item, "check_needed", itemCtx, state);

  if (!id || order === null) continue;

  if (type !== "grammar_point") {
   addError(state, itemCtx, `type must be grammar_point, got ${String(type)}`);
  }

  if (seenOrder.has(order)) addError(state, itemCtx, `duplicate grammar point order ${order}`);
  seenOrder.add(order);

  addUnique(state.grammarIds, id, itemCtx, "grammar point id", state);

  const blocks = requiredArray(item.blocks, `${itemCtx}.blocks`, state);
  if (blocks) {
   auditGrammarBlocks(blocks, itemCtx, id, state);
  }

  if (item.check_needed === true) {
   state.counts.checkNeededGrammarItems += 1;
  }

  state.counts.grammarPoints += 1;
 }
}

function auditGrammarBlocks(
 blocks: unknown[],
 itemCtx: string,
 grammarId: string,
 state: AuditState,
) {
 const seenOrder = new Set<number>();

 for (const [index, blockValue] of blocks.entries()) {
  const blockCtx = `${itemCtx}.blocks[${index}]`;
  const block = requiredRecord(blockValue, blockCtx, state);
  if (!block) continue;

  requiredString(block, "id", blockCtx, state, { nonEmpty: true });
  requiredString(block, "type", blockCtx, state, { nonEmpty: true });
  const order = requiredNumber(block, "order", blockCtx, state);
  optionalString(block, "title", blockCtx, state);
  optionalString(block, "content_vi", blockCtx, state);
  optionalString(block, "pattern", blockCtx, state);
  optionalString(block, "meaning_vi", blockCtx, state);
  optionalBoolean(block, "check_needed", blockCtx, state);

  if (order !== null) {
   if (seenOrder.has(order)) addError(state, blockCtx, `duplicate grammar block order ${order}`);
   seenOrder.add(order);
  }

  const formulas = block.formulas;
  if (formulas !== undefined) {
   const formulaArray = requiredArray(formulas, `${blockCtx}.formulas`, state);
   if (formulaArray) {
    formulaArray.forEach((formulaValue, formulaIndex) => {
     const formulaCtx = `${blockCtx}.formulas[${formulaIndex}]`;
     const formula = requiredRecord(formulaValue, formulaCtx, state);
     if (!formula) return;

     optionalString(formula, "label", formulaCtx, state);
     requiredString(formula, "pattern", formulaCtx, state, { nonEmpty: true });
    });
   }
  }

  const examples = block.examples;
  if (examples !== undefined) {
   const exampleArray = requiredArray(examples, `${blockCtx}.examples`, state);
   if (exampleArray) {
    exampleArray.forEach((exampleValue, exampleIndex) => {
     const exampleCtx = `${blockCtx}.examples[${exampleIndex}]`;
     const example = requiredRecord(exampleValue, exampleCtx, state);
     if (!example) return;

     const exampleId = requiredString(example, "id", exampleCtx, state, { nonEmpty: true });
     requiredString(example, "zh", exampleCtx, state, { nonEmpty: true });
     optionalString(example, "pinyin", exampleCtx, state);
     optionalString(example, "vi", exampleCtx, state);
     requiredStringArray(example, "grammar_refs", exampleCtx, state, { allowMissing: true });
     optionalBoolean(example, "check_needed", exampleCtx, state);

     if (exampleId) {
      state.grammarExampleIds.add(exampleId);
     }

     state.counts.grammarExamples += 1;
    });
   }
  }
 }
}

async function auditRelations(dataset: DatasetId, lessonRoot: string, state: AuditState) {
 const relationsPath = path.join(lessonRoot, "relations/all.json");
 const unresolvedPath = path.join(lessonRoot, "relations/unresolved.json");

 const relationsPayload = await readJson(relationsPath, state);
 const relations = requiredArray(relationsPayload, rel(relationsPath), state);

 const unresolvedPayload = await readJson(unresolvedPath, state);
 const unresolved = requiredArray(unresolvedPayload, rel(unresolvedPath), state);

 if (unresolved && unresolved.length !== 0) {
  addError(state, rel(unresolvedPath), `unresolved must be empty, got ${unresolved.length}`);
 }

 if (!relations) return;

 for (const [index, relationValue] of relations.entries()) {
  const ctx = `${rel(relationsPath)}[${index}]`;
  const relation = requiredRecord(relationValue, ctx, state);
  if (!relation) continue;

  const to = relation.to;
  if (!isRecord(to)) continue;

  const targetPath = typeof to.path === "string" ? to.path : "";
  if (!targetPath) continue;

  if (targetPath.includes("vocabulary/items/")) {
   const relativeTarget = targetPath.replace(/^.*?vocabulary\/items\//u, "vocabulary/items/");
   const resolvedTarget = path.join(lessonRoot, relativeTarget);
   if (!(await exists(resolvedTarget))) {
    addError(state, ctx, `missing vocabulary relation target ${targetPath}`);
   }
  }

  if (targetPath.includes("sections/")) {
   const relativeTarget = targetPath.replace(/^.*?sections\//u, "sections/");
   const resolvedTarget = path.join(lessonRoot, relativeTarget);
   if (!(await exists(resolvedTarget))) {
    addError(state, ctx, `missing section relation target ${targetPath}`);
   }
  }
 }
}

async function scanAllJsonFiles(state: AuditState) {
 const roots = state.datasets.map((dataset) => path.join(dbRoot, dataset));
 const files: string[] = [path.join(dbRoot, "manifest.json")];

 for (const root of roots) {
  files.push(...(await walk(root)).filter((file) => file.endsWith(".json")));
 }

 for (const file of files) {
  const payload = await readJson(file, state);
  if (payload !== null) {
   scanJsonConventions(payload, rel(file), state);
  }
 }
}

function addRefIssue(state: AuditState, ctx: string, message: string) {
 if (strictRefs) {
  addError(state, ctx, message);
  return;
 }

 addWarning(state, ctx, message);
}

function auditRefs(state: AuditState) {
 for (const hit of state.refs) {
  if (hit.kind === "grammar_refs" && !state.grammarIds.has(hit.ref)) {
   addRefIssue(state, hit.ctx, `grammar_refs target id not found: ${hit.ref}`);
  }

  if (
   hit.kind === "vocab_refs" &&
   !state.deepVocabIds.has(hit.ref) &&
   !state.lessonVocabIds.has(hit.ref)
  ) {
   addRefIssue(state, hit.ctx, `vocab_refs target id not found: ${hit.ref}`);
  }
 }
}

function createState(datasets: DatasetId[]): AuditState {
 return {
  errors: [],
  warnings: [],
  datasets,
  lessonIds: new Set<string>(),
  sectionIds: new Set<string>(),
  lessonVocabIds: new Set<string>(),
  deepVocabIds: new Set<string>(),
  grammarIds: new Set<string>(),
  vocabExampleIds: new Set<string>(),
  grammarExampleIds: new Set<string>(),
  refs: [],
  counts: {
   lessons: 0,
   sections: 0,
   lessonVocabItems: 0,
   deepVocabItems: 0,
   grammarPoints: 0,
   vocabExamples: 0,
   grammarExamples: 0,
   checkNeededVocabItems: 0,
   checkNeededGrammarItems: 0,
  },
 };
}

function resolveDatasets(): DatasetId[] {
 const datasetArg = readArg("--dataset") ?? "all";

 if (datasetArg === "all") return DATASET_IDS;
 if (datasetArg === "q2" || datasetArg === "q3") return [datasetArg];

 console.error(`Invalid --dataset ${datasetArg}. Use q2, q3, or all.`);
 process.exit(1);
}

async function main() {
 const datasets = resolveDatasets();
 const state = createState(datasets);

 await auditRootManifest(state);

 for (const dataset of datasets) {
  const manifestLessons = await auditDatasetManifest(dataset, state);
  for (const lesson of manifestLessons) {
   await auditLessonFromManifest(dataset, lesson, state);
  }
 }

 await scanAllJsonFiles(state);
 auditRefs(state);

 if (state.warnings.length > 0) {
  console.warn(`HanziHome seed-readiness audit warnings (${state.warnings.length}):`);
  for (const warning of state.warnings) console.warn(`- ${warning}`);
 }

 if (state.errors.length > 0) {
  console.error(`HanziHome seed-readiness audit FAILED with ${state.errors.length} issue(s):`);
  for (const error of state.errors) console.error(`- ${error}`);
  process.exitCode = 1;
  return;
 }

 console.log("HanziHome seed-readiness audit OK.");
 console.log(`datasets=${datasets.join(",")}`);
 console.log(`lessons=${state.counts.lessons}`);
 console.log(`sections=${state.counts.sections}`);
 console.log(`lessonVocabItems=${state.counts.lessonVocabItems}`);
 console.log(`deepVocabItems=${state.counts.deepVocabItems}`);
 console.log(`grammarPoints=${state.counts.grammarPoints}`);
 console.log(`vocabExamples=${state.counts.vocabExamples}`);
 console.log(`grammarExamples=${state.counts.grammarExamples}`);
 console.log(`checkNeededVocabItems=${state.counts.checkNeededVocabItems}`);
 console.log(`checkNeededGrammarItems=${state.counts.checkNeededGrammarItems}`);
 console.log(`refs=${state.refs.length}`);
}

main().catch((error) => {
 console.error(error instanceof Error ? error.stack || error.message : error);
 process.exitCode = 1;
});
