import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type Dataset = {
 id: string;
 dir: string;
 filePrefix: string;
};

type AuditFile = {
 datasetId: string;
 kind: "lesson" | "vocab";
 file: string;
 path: string;
 payload: unknown;
};

type AuditIssueKind =
 | "duplicate_id"
 | "missing_stable_id"
 | "missing_required_text"
 | "cloze_mismatch"
 | "orphan_ref"
 | "unsupported_editable_node";

type AuditIssue = {
 kind: AuditIssueKind;
 file: string;
 path: string;
 message: string;
 value?: string;
};

type IdOccurrence = {
 file: string;
 path: string;
};

const datasets: Dataset[] = [
 { id: "q2", dir: "data/hanzihome/q2", filePrefix: "hanyu_2_" },
 { id: "q3", dir: "data/hanzihome/q3", filePrefix: "hanyu_3_" },
];

const editableTypes = new Set<string>([
 "lesson",
 "section",
 "vocab_item",
 "vocab_example",
 "vocab_detail_section",
 "proper_noun",
 "character_writing_item",
 "grammar_point",
 "grammar_block",
 "grammar_formula",
 "grammar_example",
 "grammar_block_item",
 "exercise",
 "exercise_question",
 "exercise_matching_item",
 "exercise_answer_key",
 "exercise_word_bank",
 "exercise_dialogue_line",
 "exercise_cloze_segment",
 "exercise_cloze_answer",
 "reading_item",
 "reading_question",
 "text_block",
 "text_line",
 "text_paragraph",
]);
const circledBlankPattern = /[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]\s*(?:[_＿]{2,}|…{2,}|\.\.\.+)/g;

const editableNodeTypeByRawType = new Map<string, string>([
 ["vocabulary_item", "vocab_item"],
 ["proper_noun", "proper_noun"],
 ["character_writing_item", "character_writing_item"],
 ["grammar_point", "grammar_point"],
 ["grammar_overview", "grammar_block"],
 ["grammar_structure", "grammar_block"],
 ["grammar_usage_notes", "grammar_block"],
 ["grammar_negative_form", "grammar_block"],
 ["grammar_question_form", "grammar_block"],
 ["grammar_common_mistakes", "grammar_block"],
 ["note", "grammar_block_item"],
 ["text_narrative", "text_block"],
 ["text_dialogue", "text_block"],
 ["text_reading", "reading_item"],
]);

function asRecord(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" && !Array.isArray(value)
  ? (value as Record<string, unknown>)
  : {};
}

function stringValue(record: Record<string, unknown>, key: string): string {
 const value = record[key];
 return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function hasText(value: unknown): boolean {
 return typeof value === "string" ? Boolean(value.trim()) : value != null;
}

function joinPath(parent: string, child: string | number): string {
 return parent ? `${parent}.${child}` : String(child);
}

async function readJson(filePath: string): Promise<unknown> {
 return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function loadAuditFiles(dataset: Dataset): Promise<AuditFile[]> {
 const roots = [
  { kind: "lesson" as const, dir: path.join(dataset.dir, "lessons") },
  { kind: "vocab" as const, dir: path.join(dataset.dir, "vocab") },
 ];
 const files: AuditFile[] = [];

 for (const root of roots) {
  const absoluteDir = path.join(process.cwd(), root.dir);
  const names = (await readdir(absoluteDir))
   .filter((file) => file.endsWith(".json") && file.startsWith(dataset.filePrefix))
   .sort();

  for (const name of names) {
   const filePath = path.join(absoluteDir, name);
   files.push({
    datasetId: dataset.id,
    kind: root.kind,
    file: path.join(root.dir, name),
    path: filePath,
    payload: await readJson(filePath),
   });
  }
 }

 return files;
}

function collectIds(
 value: unknown,
 file: string,
 currentPath: string,
 ids: Map<string, IdOccurrence[]>,
) {
 if (Array.isArray(value)) {
  value.forEach((item, index) => collectIds(item, file, joinPath(currentPath, index), ids));
  return;
 }

 const record = asRecord(value);
 if (!Object.keys(record).length) return;

 const id = stringValue(record, "id");
 if (id) {
  const occurrences = ids.get(id) ?? [];
  occurrences.push({ file, path: currentPath || "$" });
  ids.set(id, occurrences);
 }

 for (const [key, child] of Object.entries(record)) {
  collectIds(child, file, joinPath(currentPath, key), ids);
 }
}

function collectRefs(
 value: unknown,
 currentPath: string,
 refs: Array<{
  path: string;
  id: string;
  type: string;
 }>,
) {
 if (Array.isArray(value)) {
  value.forEach((item, index) => collectRefs(item, joinPath(currentPath, index), refs));
  return;
 }

 const record = asRecord(value);
 if (!Object.keys(record).length) return;

 for (const [key, child] of Object.entries(record)) {
  if (
   ["vocab_refs", "grammar_refs", "source_refs", "reading_refs", "question_refs"].includes(key) &&
   Array.isArray(child)
  ) {
   child.forEach((ref, index) => {
    if (typeof ref === "string" && ref.trim()) {
     refs.push({
      path: joinPath(joinPath(currentPath, key), index),
      id: ref.trim(),
      type: key,
     });
    }
   });
   continue;
  }

  collectRefs(child, joinPath(currentPath, key), refs);
 }
}

function checkRequiredText(
 record: Record<string, unknown>,
 file: string,
 currentPath: string,
 issues: AuditIssue[],
) {
 const type = stringValue(record, "type");
 const isDeepVocabItem = /^\$\.items\.\d+$/.test(currentPath);

 if (
  ["vocabulary_item", "proper_noun", "character_writing_item"].includes(type) ||
  isDeepVocabItem
 ) {
  if (!hasText(record.pinyin)) {
   issues.push({
    kind: "missing_required_text",
    file,
    path: currentPath,
    message: "Expected pinyin for vocab/proper noun/character item.",
   });
  }

  if (
   type !== "character_writing_item" &&
   !hasText(record.meaning_vi) &&
   !hasText(asRecord(record.meaning).meaning_vi)
  ) {
   issues.push({
    kind: "missing_required_text",
    file,
    path: currentPath,
    message: "Expected Vietnamese meaning for vocab/proper noun item.",
   });
  }
 }
}

function checkEditableNodeId(
 record: Record<string, unknown>,
 file: string,
 currentPath: string,
 issues: AuditIssue[],
) {
 const rawType = stringValue(record, "type");
 const mappedType = editableNodeTypeByRawType.get(rawType);
 const isExerciseItem = /^\$\.lesson\.sections\.\d+\.items\.\d+$/.test(currentPath);
 const isQuestionLike = /\.(questions|correct_examples|wrong_examples)\.\d+$/.test(currentPath);
 const isDialogueLine =
  /\.(dialogue|lines)\.\d+$/.test(currentPath) &&
  (hasText(record.zh) || hasText(record.text) || hasText(record.speaker));
 const entityType =
  mappedType ||
  (isExerciseItem ? "exercise" : "") ||
  (isQuestionLike ? "exercise_question" : "") ||
  (isDialogueLine ? "text_line" : "");

 if (!entityType) return;

 if (!editableTypes.has(entityType)) {
  issues.push({
   kind: "unsupported_editable_node",
   file,
   path: currentPath,
   message: `Raw node maps to unsupported editable entity "${entityType}".`,
   value: rawType,
  });
  return;
 }

 if (!stringValue(record, "id")) {
  issues.push({
   kind: "missing_stable_id",
   file,
   path: currentPath,
   message: `Editable node "${entityType}" is missing a stable id.`,
   value: rawType,
  });
 }
}

function collectText(value: unknown): string {
 if (typeof value === "string") return value;
 if (Array.isArray(value)) return value.map(collectText).join("\n");
 const record = asRecord(value);
 return Object.values(record).map(collectText).join("\n");
}

function answerCount(value: unknown): number {
 if (Array.isArray(value)) {
  return value.filter((item) => {
   if (typeof item === "string" || typeof item === "number") {
    return Boolean(String(item).trim());
   }
   const record = asRecord(item);
   return ["answer", "value", "zh", "text", "correct"].some((key) => hasText(record[key]));
  }).length;
 }

 const record = asRecord(value);
 return Object.keys(record).length;
}

function checkClozeMismatch(
 record: Record<string, unknown>,
 file: string,
 currentPath: string,
 issues: AuditIssue[],
) {
 const type = stringValue(record, "type");
 const variant = stringValue(record, "variant");
 const renderer = stringValue(asRecord(record.rendering), "renderer");
 const looksLikeCloze =
  type.includes("cloze") ||
  variant.includes("cloze") ||
  renderer.includes("cloze") ||
  "passage" in record;

 if (!looksLikeCloze) return;

 const text = collectText(record.passage ?? record.text ?? record.zh);
 const blanks = text.match(circledBlankPattern)?.length ?? 0;
 if (blanks === 0) return;

 const answers =
  answerCount(record.answers) ||
  answerCount(record.answer_key) ||
  answerCount(record.cloze_answers) ||
  answerCount(asRecord(record.passage).answers) ||
  answerCount(asRecord(record.passage).answer_key);

 if (answers === 0 || answers !== blanks) {
  issues.push({
   kind: "cloze_mismatch",
   file,
   path: currentPath,
   message: `Cloze has ${blanks} blank marker(s) but ${answers} answer(s).`,
  });
 }
}

function walkForIssues(value: unknown, file: string, currentPath: string, issues: AuditIssue[]) {
 if (Array.isArray(value)) {
  value.forEach((item, index) => walkForIssues(item, file, joinPath(currentPath, index), issues));
  return;
 }

 const record = asRecord(value);
 if (!Object.keys(record).length) return;

 checkRequiredText(record, file, currentPath || "$", issues);
 checkEditableNodeId(record, file, currentPath || "$", issues);
 checkClozeMismatch(record, file, currentPath || "$", issues);

 for (const [key, child] of Object.entries(record)) {
  walkForIssues(child, file, joinPath(currentPath, key), issues);
 }
}

function duplicateIdIssues(ids: Map<string, IdOccurrence[]>): AuditIssue[] {
 return [...ids.entries()].flatMap(([id, occurrences]) => {
  if (occurrences.length < 2) return [];

  return occurrences.map((occurrence) => ({
   kind: "duplicate_id" as const,
   file: occurrence.file,
   path: occurrence.path,
   message: `Duplicate id "${id}" appears ${occurrences.length} times.`,
   value: id,
  }));
 });
}

function orphanRefIssues(file: string, payload: unknown, idSet: Set<string>): AuditIssue[] {
 const refs: Array<{ path: string; id: string; type: string }> = [];
 collectRefs(payload, "$", refs);

 return refs
  .filter((ref) => !idSet.has(ref.id))
  .map((ref) => ({
   kind: "orphan_ref" as const,
   file,
   path: ref.path,
   message: `${ref.type} points to missing id "${ref.id}".`,
   value: ref.id,
  }));
}

function groupIssues(issues: AuditIssue[]) {
 return issues.reduce<Record<AuditIssueKind, AuditIssue[]>>(
  (groups, issue) => {
   groups[issue.kind].push(issue);
   return groups;
  },
  {
   duplicate_id: [],
   missing_stable_id: [],
   missing_required_text: [],
   cloze_mismatch: [],
   orphan_ref: [],
   unsupported_editable_node: [],
  },
 );
}

async function main() {
 const files = (await Promise.all(datasets.map((dataset) => loadAuditFiles(dataset)))).flat();
 const ids = new Map<string, IdOccurrence[]>();
 const issues: AuditIssue[] = [];

 for (const file of files) {
  collectIds(file.payload, file.file, "$", ids);
 }

 issues.push(...duplicateIdIssues(ids));

 for (const file of files) {
  const localIds = new Map<string, IdOccurrence[]>();
  collectIds(file.payload, file.file, "$", localIds);
  walkForIssues(file.payload, file.file, "$", issues);
  issues.push(...orphanRefIssues(file.file, file.payload, new Set(localIds.keys())));
 }

 const grouped = groupIssues(issues);
 const summary = Object.fromEntries(
  Object.entries(grouped).map(([kind, values]) => [kind, values.length]),
 );

 console.log("HanziHome data audit");
 console.log("====================");
 console.log(`Files checked: ${files.length}`);
 console.log(`IDs checked: ${ids.size}`);
 console.log(`Issues found: ${issues.length}`);
 console.log(JSON.stringify(summary, null, 2));

 for (const [kind, values] of Object.entries(grouped)) {
  console.log("");
  console.log(`${kind}: ${values.length}`);
  for (const issue of values.slice(0, 30)) {
   console.log(`- ${issue.file} ${issue.path}: ${issue.message}`);
  }
  if (values.length > 30) {
   console.log(`  ... ${values.length - 30} more`);
  }
 }
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
