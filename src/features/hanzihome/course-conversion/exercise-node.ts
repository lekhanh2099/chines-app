import type { JsonFieldValue, JsonObject, JsonValue } from "@/types/json";

import {
 arrayValue,
 asRecord,
 cleanLines,
 firstText,
 isRecordValue,
 recordList,
 stripLeadingPictographs,
 textList,
 textOf,
} from "./conversion-text";
import type { SourceAnswer } from "./exercise-answers";
import {
 answerEntryLabel,
 answerEntryQuestionId,
 answerFromEntry,
 answerFromRecord,
 hasAnswer,
} from "./exercise-answers";
import { writeDrillList, writeRecordTable, writeWordTable, wordEntries } from "./exercise-lists";
import type { ExerciseOutput } from "./exercise-output";
import { writeQuestionList } from "./exercise-questions";

const SUB_NODE_KEYS = [
 "parts",
 "groups",
 "drills",
 "patterns",
 "topics",
 "dialogues",
 "dialogs",
 "passages",
 "communication_points",
 "grammar_focus",
 "grammar_highlights",
];
const QUESTION_KEYS = [
 "questions",
 "questions_B",
 "comprehension_questions",
 "generated_comprehension_questions",
 "tasks",
];
const MIXED_KEYS = ["items", "prompts", "situations", "chunks", "substitutions", "replacements"];
const ANSWER_LIST_KEYS = [
 "answer_key",
 "answers",
 "blanks",
 "sample_answers",
 "model_answers",
 "suggested_answers",
 "cloze_answers",
];
const VOCAB_KEYS = [
 "supplementary_vocabulary",
 "supplementary_words",
 "supplementary_vocab",
 "supplement_vocab",
 "supplemental_vocab",
 "support_vocab",
 "vocabulary_notes",
 "vocabulary",
 "proper_nouns",
 "characters",
 "suggested_generated_items",
];
const MODEL_KEYS = [
 "model",
 "model_zh",
 "model_a",
 "model_b",
 "prompt_a",
 "prompt_b",
 "model_dialogue",
 "pattern_dialogue",
 "example",
 "sample",
 "base",
];
const MODEL_FIELD_KEYS = [
 "a",
 "b",
 "A",
 "B",
 "a1",
 "b1",
 "a2",
 "b2",
 "prompt",
 "answer",
 "input",
 "output",
 "sentence",
 "zh",
];
const DIALOGUE_KEYS = ["dialogue", "dialogue_lines", "lines", "sample_dialogue"];
const BODY_KEYS = [
 "text_with_blanks",
 "passage_with_blanks",
 "passage_blanked",
 "cloze_text",
 "text",
 "passage_text",
 "zh",
];
const COMPLETED_KEYS = [
 "completed_text",
 "passage_complete",
 "completed_text_zh",
 "full_text_answer_reference",
 "sample_retell",
];
const PROMPT_NOTE_KEYS = [
 "prompt",
 "question",
 "situation",
 "context",
 "condition",
 "key_sentence",
];
const INSTRUCTION_KEYS = ["instruction_zh", "subtitle", "function", "scenario", "theme"];
const INSTRUCTION_VI_KEYS = [
 "instruction_vi",
 "subtitle_vi",
 "function_vi",
 "scenario_vi",
 "topic_vi",
];
const TRAILING_NOTE_KEYS = [
 "meaning_vi",
 "key_sentence_vi",
 "note_vi",
 "note",
 "culture_note_vi",
 "idiom_meaning_vi",
 "explanation_vi",
];
const TRAILING_NOTE_LIST_KEYS = ["notes_vi", "notes", "explanations_vi", "suggested_contexts_vi"];
const PROSE_LISTS = [
 { key: "retell_prompts", label: "Gợi ý kể lại" },
 { key: "retell_outline", label: "Dàn ý kể lại" },
 { key: "retell_key_points", label: "Ý chính" },
 { key: "key_phrases", label: "Cụm từ quan trọng" },
 { key: "ba_sentences", label: "Câu chữ 把 trong bài" },
];
const REFERENCES = [
 {
  keys: ["reading_ref", "reading_id", "json_item_id", "linked_reading_id", "linked_section_id"],
  target: "阅读 (Bài đọc)",
 },
 {
  keys: ["communication_ref", "linked_communication_id"],
  target: "交际会话 (Hội thoại giao tiếp)",
 },
 { keys: ["character_writing_ref", "character_refs"], target: "写汉字 (Viết chữ Hán)" },
 { keys: ["exercise_ref", "linked_exercise_id", "source_exercise_id"], target: "练习 (Bài tập)" },
];
const NODE_ENTRY_KEYS = [
 "lines",
 "dialogue",
 "items",
 "prompts",
 "model",
 "pattern_dialogue",
 "questions",
];

export type ExerciseNodeContext = {
 output: ExerciseOutput;
 /** Answers of enclosing answer keys, by `question_id`. */
 answersById: ReadonlyMap<string, SourceAnswer>;
 positionalAnswers: boolean;
};

/** Pairs Chinese lines with Vietnamese lines when both split into the same number of lines. */
function writePairedLines(
 source: string,
 translation: string,
 write: (zh: string, vi: string) => void,
) {
 const lines = cleanLines(source);
 const translated = cleanLines(translation);
 if (lines.length === translated.length) {
  lines.forEach((line, index) => write(line, translated[index] ?? ""));
  return;
 }
 lines.forEach((line, index) =>
  write(line, index === lines.length - 1 ? translated.join(" ") : ""),
 );
}

function translationText(value: JsonFieldValue) {
 return Array.isArray(value) ? textList(value).join("\n") : typeof value === "string" ? value : "";
}

function dialogueLineText(record: JsonObject) {
 const speaker = textOf(record.speaker);
 const text = firstText(record, ["zh", "text"]);
 return speaker && text ? `${speaker}：${text}` : text;
}

function writeDialogue(value: JsonFieldValue, context: ExerciseNodeContext) {
 if (isRecordValue(value)) {
  writeExerciseNode(asRecord(value), context, 1);
  return;
 }
 if (!Array.isArray(value)) return;
 for (const entry of value) {
  if (isRecordValue(entry)) {
   const record = asRecord(entry);
   context.output.line(dialogueLineText(record), textOf(record.vi));
  } else {
   context.output.line(textOf(entry));
  }
 }
}

function writeModel(value: JsonFieldValue, context: ExerciseNodeContext) {
 const { output } = context;
 if (typeof value === "string") {
  cleanLines(value).forEach((line) => output.note(line));
  return;
 }
 if (Array.isArray(value)) {
  for (const entry of value) {
   if (isRecordValue(entry)) {
    const record = asRecord(entry);
    output.note(dialogueLineText(record), textOf(record.vi));
   } else {
    output.note(textOf(entry));
   }
  }
  return;
 }
 const record = asRecord(value);
 const translation = translationText(record.vi);
 const lines = MODEL_FIELD_KEYS.flatMap((key) => cleanLines(translationText(record[key])));
 lines.forEach((line, index) =>
  output.note(line, index === lines.length - 1 ? cleanLines(translation).join(" ") : ""),
 );
}

function writeHeader(node: JsonObject, context: ExerciseNodeContext, depth: number) {
 const { output } = context;
 const title = stripLeadingPictographs(firstText(node, ["title", "label", "text_title"]));
 const titleVi = stripLeadingPictographs(textOf(node.title_vi));
 if (depth === 0) output.heading(title || titleVi, title ? titleVi : "");
 else if (title || titleVi) output.instruction(title || titleVi, title ? titleVi : "");
 const instruction = node.instruction;
 if (isRecordValue(instruction)) {
  const record = asRecord(instruction);
  const zh = stripLeadingPictographs(textOf(record.zh));
  const vi = stripLeadingPictographs(textOf(record.vi));
  if (zh || vi) output.instruction(zh || vi, zh ? vi : "");
 } else {
  output.instruction(textOf(instruction));
 }
 const topic = node.topic;
 if (isRecordValue(topic))
  output.instruction(firstText(asRecord(topic), ["zh"]), firstText(asRecord(topic), ["vi"]));
 else output.instruction(textOf(topic));
 INSTRUCTION_KEYS.forEach((key) => output.instruction(textOf(node[key])));
 INSTRUCTION_VI_KEYS.forEach((key) => output.instruction(textOf(node[key])));
}

function writeWordBanks(node: JsonObject, context: ExerciseNodeContext) {
 const { output } = context;
 for (const key of ["word_bank", "word_bank_A", "word_bank_B"]) {
  const bank = node[key];
  if (Array.isArray(bank)) {
   output.wordBank(textList(bank));
  } else if (isRecordValue(bank)) {
   for (const group of Object.values(asRecord(bank))) {
    if (Array.isArray(group)) output.wordBank(textList(group));
    else output.note(textOf(group));
   }
  } else {
   output.note(textOf(bank));
  }
 }
 const words = textList(node.word_bank);
 const meanings = textList(node.word_bank_vi);
 if (meanings.length > 0 && meanings.length === words.length) {
  output.note(
   `Nghĩa: ${words.map((word, index) => `${word} = ${meanings[index] ?? ""}`).join("; ")}`,
  );
 }
}

function writeModels(node: JsonObject, context: ExerciseNodeContext) {
 const pattern = textOf(node.pattern);
 if (pattern) context.output.note(`Mẫu câu: ${pattern}`);
 for (const key of MODEL_KEYS) {
  const value = node[key];
  if (value === undefined || value === null || value === "") continue;
  if (Array.isArray(value) && value.length === 0) continue;
  context.output.note("Mẫu (例):");
  writeModel(value, context);
 }
}

function writeBody(node: JsonObject, context: ExerciseNodeContext) {
 const { output } = context;
 const passage = node.passage;
 if (isRecordValue(passage)) writeExerciseNode(asRecord(passage), context, 1);
 else if (typeof passage === "string") cleanLines(passage).forEach((line) => output.line(line));
 const cloze = node.cloze;
 if (isRecordValue(cloze)) writeExerciseNode(asRecord(cloze), context, 1);

 const translation = translationText(node.vi) || translationText(node.translation_vi);
 const bodyKey = BODY_KEYS.find((key) => typeof node[key] === "string" && node[key] !== "");
 const paragraphs = arrayValue(node, "paragraphs");
 const segments = recordList(node.segments);
 if (bodyKey) {
  writePairedLines(translationText(node[bodyKey]), translation, (zh, vi) => output.line(zh, vi));
 } else if (segments.length > 0) {
  const text = segments.map((segment) => textOf(segment.text) || "___").join("");
  writePairedLines(text, translation, (zh, vi) => output.line(zh, vi));
 }
 for (const paragraph of paragraphs) {
  if (isRecordValue(paragraph)) {
   const record = asRecord(paragraph);
   writePairedLines(translationText(record.zh), translationText(record.vi), (zh, vi) =>
    output.line(zh, vi),
   );
  } else {
   output.line(textOf(paragraph));
  }
 }
 if (!bodyKey && segments.length === 0 && paragraphs.length > 0 && translation) {
  output.note(`Dịch: ${cleanLines(translation).join(" ")}`);
 }
 if (!bodyKey && segments.length === 0 && paragraphs.length === 0 && translation) {
  output.note(cleanLines(translation).join(" "));
 }
}

function writeCompletedText(node: JsonObject, context: ExerciseNodeContext) {
 const completed = [
  ...COMPLETED_KEYS.map((key) => cleanLines(translationText(node[key])).join(" ")),
  recordList(node.completed_paragraphs)
   .map((paragraph) => textOf(paragraph.zh))
   .join(" "),
  firstText(asRecord(node.sample_retelling), ["zh"]),
  firstText(asRecord(node.sample_retell_generated), ["zh"]),
 ].filter(Boolean);
 completed.forEach((text) => context.output.answerKey("Bài hoàn chỉnh", [{ text, notes: [] }]));
}

type AnswerList = { entries: JsonValue[]; used: Set<number> };

function answerLists(node: JsonObject): AnswerList[] {
 return ANSWER_LIST_KEYS.map((key) => ({
  entries: arrayValue(node, key),
  used: new Set<number>(),
 })).filter((list) => list.entries.length > 0);
}

/** Answers of sibling answer lists for a question list: by `question_id`, else by position. */
function siblingAnswers(
 entries: readonly JsonValue[],
 lists: readonly AnswerList[],
 inherited: ReadonlyMap<string, SourceAnswer>,
): SourceAnswer[] {
 const ids = entries.map((entry) => (isRecordValue(entry) ? textOf(asRecord(entry).id) : ""));
 const answers = ids.map((id) => inherited.get(id) ?? { text: "", notes: [] });
 for (const list of lists) {
  const entryIds = list.entries.map(answerEntryQuestionId);
  const matchedById = entryIds.some((id) => id && ids.includes(id));
  if (!matchedById && (list.used.size > 0 || list.entries.length !== entries.length)) continue;
  list.entries.forEach((entry, index) => {
   const target = matchedById ? ids.indexOf(entryIds[index] ?? "") : index;
   if (target < 0) return;
   list.used.add(index);
   const answer = answerFromEntry(entry);
   const current = answers[target];
   if (current && !hasAnswer(current) && hasAnswer(answer)) answers[target] = answer;
  });
 }
 return answers;
}

function isNodeEntry(entry: JsonValue) {
 if (!isRecordValue(entry)) return false;
 const record = asRecord(entry);
 return NODE_ENTRY_KEYS.some((key) => arrayValue(record, key).length > 0);
}

function writeMixedList(
 entries: JsonValue[],
 lists: readonly AnswerList[],
 context: ExerciseNodeContext,
 depth: number,
) {
 const { output } = context;
 if (entries.length === 0) return;
 if (wordEntries(entries).length === entries.length) {
  writeWordTable(recordList(entries), output);
  return;
 }
 if (entries.every(isNodeEntry)) {
  entries.forEach((entry) => writeExerciseNode(asRecord(entry), context, depth + 1));
  return;
 }
 const answers = siblingAnswers(entries, lists, context.answersById);
 if (!answers.some(hasAnswer) && writeDrillList(entries, output)) return;
 writeQuestionList(
  entries,
  { siblingAnswers: answers, positionalAnswers: context.positionalAnswers },
  output,
 );
}

function writeLeftoverAnswers(lists: readonly AnswerList[], context: ExerciseNodeContext) {
 for (const list of lists) {
  const rest = list.entries.filter((_, index) => !list.used.has(index));
  const answers = rest.map(answerFromEntry);
  const labels = rest.map(answerEntryLabel);
  const kept = answers.map((answer, index) => ({ answer, label: labels[index] ?? "" }));
  const present = kept.filter((entry) => hasAnswer(entry.answer));
  context.output.answerKey(
   "Đáp án",
   present.map((entry) => entry.answer),
   present.map((entry) => entry.label),
  );
 }
}

function writeTables(node: JsonObject, context: ExerciseNodeContext) {
 const { output } = context;
 const headers = textList(node.data_headers);
 writeRecordTable(recordList(node.table), headers, output);
 writeRecordTable(recordList(node.data), headers, output);
 const rows = arrayValue(node, "rows").map((row) => textList(row));
 if (headers.length > 0 && rows.length > 0) output.table([headers, ...rows]);
 const left = textList(node.left);
 const right = textList(node.right);
 if (left.length > 0 && right.length > 0) {
  const size = Math.max(left.length, right.length);
  const pairs = Array.from({ length: size }, (_, index) => [
   left[index] ? `${index + 1}. ${left[index]}` : "",
   right[index] ? `${String.fromCharCode(65 + index)}. ${right[index]}` : "",
  ]);
  output.table([["Cột A", "Cột B"], ...pairs]);
 }
}

function writeTrailingNotes(node: JsonObject, context: ExerciseNodeContext) {
 const { output } = context;
 for (const list of PROSE_LISTS) {
  const lines = textList(node[list.key]);
  if (lines.length === 0) continue;
  output.note(`${list.label}:`);
  lines.forEach((line) => output.note(line));
 }
 for (const key of VOCAB_KEYS) {
  const entries = arrayValue(node, key);
  const records = wordEntries(entries);
  if (records.length > 0) writeWordTable(records, output);
  else if (entries.length > 0) output.wordBank(textList(entries));
 }
 TRAILING_NOTE_KEYS.forEach((key) => output.note(cleanLines(translationText(node[key])).join(" ")));
 TRAILING_NOTE_LIST_KEYS.forEach((key) => textList(node[key]).forEach((line) => output.note(line)));
}

function referenceTarget(node: JsonObject) {
 return (
  REFERENCES.find((reference) =>
   reference.keys.some((key) => textOf(node[key]) || arrayValue(node, key).length > 0),
  )?.target ?? ""
 );
}

/**
 * Writes one exercise-like payload node. The payloads have no fixed shape per
 * `type`, so the walk is driven by which keys are present: heading and
 * instruction, word bank, model, passage, dialogue, question lists, nested
 * parts, then answers that belong to no single prompt, vocabulary and notes.
 */
export function writeExerciseNode(node: JsonObject, parent: ExerciseNodeContext, depth: number) {
 const { output } = parent;
 const lists = answerLists(node);
 const answersById = new Map(parent.answersById);
 for (const list of lists) {
  for (const entry of list.entries) {
   const id = answerEntryQuestionId(entry);
   const answer = answerFromEntry(entry);
   if (id && hasAnswer(answer)) answersById.set(id, answer);
  }
 }
 const context: ExerciseNodeContext = { ...parent, answersById };

 writeHeader(node, context, depth);
 writeWordBanks(node, context);
 writeModels(node, context);
 if (depth > 0) PROMPT_NOTE_KEYS.forEach((key) => output.note(textOf(node[key])));
 const hint = [textOf(node.given), textOf(node.hint), textOf(node.answer_hint)].filter(Boolean);
 if (depth > 0 && hint.length > 0) output.note(`Gợi ý: ${hint.join(" / ")}`);
 writeBody(node, context);
 DIALOGUE_KEYS.forEach((key) => writeDialogue(node[key], context));
 writeTables(node, context);
 for (const key of QUESTION_KEYS) {
  const entries = arrayValue(node, key);
  if (entries.length === 0) continue;
  writeQuestionList(
   entries,
   {
    siblingAnswers: siblingAnswers(entries, lists, answersById),
    positionalAnswers: context.positionalAnswers,
   },
   output,
  );
 }
 MIXED_KEYS.forEach((key) => writeMixedList(arrayValue(node, key), lists, context, depth));
 for (const key of SUB_NODE_KEYS) {
  recordList(node[key]).forEach((child) => writeExerciseNode(child, context, depth + 1));
 }
 if (depth > 0) {
  const own = answerFromRecord(node);
  if (hasAnswer(own)) output.answerKey("Đáp án", [own]);
 }
 writeLeftoverAnswers(lists, context);
 writeCompletedText(node, context);
 writeTrailingNotes(node, context);

 const target = referenceTarget(node);
 if (depth === 0 && target && output.coverage.contentBlocks === 0) {
  output.coverage.referenceOnly = true;
  output.instruction(`Nội dung của mục này nằm ở phần ${target} của bài.`);
 }
}
