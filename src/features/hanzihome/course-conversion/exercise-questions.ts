import type { JsonFieldValue, JsonObject, JsonValue } from "@/types/json";

import {
 asRecord,
 containsHan,
 firstText,
 isRecordValue,
 recordList,
 textList,
 textOf,
} from "./conversion-text";
import type { SourceAnswer } from "./exercise-answers";
import { answerEntryLabel, answerFromRecord, hasAnswer } from "./exercise-answers";
import type { ExerciseOutput, QuestionDraft } from "./exercise-output";

const PROMPT_KEYS = [
 "prompt_zh",
 "question_zh",
 "wrong",
 "wrong_sentence",
 "wrong_zh",
 "sentence",
 "zh",
 "text",
 "input",
 "hanzi",
 "prompt_vi",
 "question_vi",
 "situation_vi",
];

const PROMPT_TRANSLATION_KEYS = [
 "prompt_vi",
 "question_vi",
 "wrong_vi",
 "vi",
 "situation_vi",
 "sample_context_vi",
 "image_description_vi",
];

const GIVEN_WORD_KEYS = [
 "given",
 "given_word",
 "required_word",
 "keyword",
 "insert",
 "word",
 "target",
 "hint",
];

const ORDERING_KEYS = ["items", "sentences", "segments"];

const NUMBERED_PROMPT_PATTERN = /^(?:[（(][\d一二三四五六七八九十]+[）)]|[①-⑳]|\d+[.．、])/u;
const TRUE_PATTERN = /^(?:true|đúng|对|正确|√|✓|Đ)(?![\p{L}])/iu;
const FALSE_PATTERN = /^(?:false|sai|错|不对|错误|×|✗|S)(?![\p{L}])/iu;

type LabelledText = { label: string; text: string };

function labelledTexts(value: JsonFieldValue): LabelledText[] {
 if (Array.isArray(value)) {
  return value
   .map((entry, index) => {
    const record = asRecord(entry);
    return {
     label: firstText(record, ["label", "key"]) || String.fromCharCode(65 + index),
     text: isRecordValue(entry) ? firstText(record, ["text", "zh"]) : textOf(entry),
    };
   })
   .filter((entry) => entry.text.length > 0);
 }
 if (isRecordValue(value)) {
  return Object.entries(asRecord(value))
   .map(([label, entry]) => ({ label, text: textOf(entry) }))
   .filter((entry) => entry.text.length > 0);
 }
 const text = textOf(value);
 return text
  ? text
     .split(/\s+\/\s+/u)
     .map((entry, index) => ({ label: String.fromCharCode(65 + index), text: entry }))
  : [];
}

/** Sentences/segments a reorder question asks to put in order, when it has any. */
function orderingItems(record: JsonObject): LabelledText[] {
 for (const key of ORDERING_KEYS) {
  const items = labelledTexts(record[key]);
  if (items.length > 1) return items;
 }
 return isRecordValue(record.prompt) ? labelledTexts(record.prompt) : [];
}

function basePrompt(record: JsonObject): string {
 const prompt = record.prompt;
 const question = record.question;
 return (
  (Array.isArray(prompt) ? textList(prompt).join(" / ") : textOf(prompt)) ||
  (isRecordValue(question) ? firstText(asRecord(question), ["zh", "vi"]) : textOf(question)) ||
  firstText(asRecord(record.statement), ["zh", "vi"]) ||
  firstText(record, PROMPT_KEYS)
 );
}

function promptTranslation(record: JsonObject, prompt: string): string {
 const translation =
  firstText(record, PROMPT_TRANSLATION_KEYS) ||
  firstText(asRecord(record.question), ["vi"]) ||
  firstText(asRecord(record.statement), ["vi"]);
 return translation === prompt ? "" : translation;
}

/** Prompt text of one question record: context, dialogue lines, stem and given words. */
export function promptFromRecord(record: JsonObject): string {
 const parts = [
  textOf(record.context),
  firstText(record, ["situation", "situation_zh"]),
  textList(record.dialogue).join(" "),
  basePrompt(record),
 ].filter((part, index, all) => part && all.indexOf(part) === index);
 if (parts.length === 0) {
  const image = textOf(record.image_description_vi);
  if (image) parts.push(`[Tranh] ${image}`);
 }
 const prompt = parts.join(" ");
 const given = [
  ...GIVEN_WORD_KEYS.map((key) => textOf(record[key])),
  ...textList(record.given_words),
 ].filter((word, index, words) => word && words.indexOf(word) === index && !prompt.includes(word));
 return given.length > 0 && prompt ? `${prompt} (${given.join(" / ")})` : prompt;
}

/** Letter (A–D) of the choice the source answer points at, or "" when it names none. */
function answerLetter(
 record: JsonObject,
 choices: readonly LabelledText[],
 ids: readonly string[],
) {
 const raw = textOf(record.answer_label) || textOf(record.answer);
 if (!raw) return "";
 const index = [
  ids.indexOf(raw),
  choices.findIndex((choice) => choice.label === raw),
  choices.findIndex((choice) => choice.text === raw),
 ].find((candidate) => candidate >= 0);
 return index === undefined || index > 3 ? "" : String.fromCharCode(65 + index);
}

function draftFromRecord(record: JsonObject, answer: SourceAnswer): QuestionDraft {
 const prompt = promptFromRecord(record);
 const choices = labelledTexts(record.choices);
 const choiceIds = recordList(record.choices).map((choice) => textOf(choice.id));
 const letter = hasAnswer(answer) ? answerLetter(record, choices, choiceIds) : "";
 const choiceMeanings = textList(record.choices_vi);
 const notes =
  choiceMeanings.length > 0
   ? [...answer.notes, `Nghĩa các lựa chọn: ${choiceMeanings.join(" | ")}`]
   : answer.notes;
 return {
  prompt,
  translation: promptTranslation(record, prompt),
  choices: choices.map((choice) => choice.text),
  answerLetter: letter,
  answer: { text: answer.text, notes: hasAnswer(answer) ? notes : [] },
 };
}

/** A reorder question: sentences joined by ` / `, answered by the sentences in order. */
function orderingDraft(record: JsonObject, items: readonly LabelledText[], answer: SourceAnswer) {
 const meanings = [
  ...ORDERING_KEYS.flatMap((key) => recordList(record[key]).map((item) => textOf(item.vi))),
  ...textList(record.items_vi),
 ].filter(Boolean);
 const notes =
  meanings.length > 0 ? [...answer.notes, `Dịch: ${meanings.join(" / ")}`] : answer.notes;
 const stem = isRecordValue(record.prompt) ? "" : basePrompt(record);
 const order = answer.text.replace(/[^\p{L}\p{N}]/gu, "").split("");
 const ordered = order.map((label) => items.find((item) => item.label === label)?.text ?? "");
 const resolved = order.length === items.length && ordered.every(Boolean);
 return {
  prompt: resolved
   ? [stem, items.map((item) => item.text).join(" / ")].filter(Boolean).join(" ")
   : [stem, ...items.map((item) => `${item.label}. ${item.text}`)].filter(Boolean).join(" "),
  translation: "",
  choices: [],
  answerLetter: "",
  answer: resolved
   ? { text: ordered.join(" "), notes: [`Thứ tự: ${order.join(" ")}`, ...notes] }
   : { text: answer.text, notes: hasAnswer(answer) ? notes : [] },
 };
}

function numbered(prompt: string, index: number, total: number) {
 return total < 2 || !prompt || NUMBERED_PROMPT_PATTERN.test(prompt)
  ? prompt
  : `(${index + 1}) ${prompt}`;
}

/** A line of the question list that is an instruction or a word bank, not a question. */
function isInstructionPrompt(prompt: string) {
 const body = prompt.replace(/^[（(][\d一二三四五六七八九十]+[）)]\s*/u, "");
 if (!containsHan(body)) return true;
 if (/^[(（][^()（）]*[,，/、][^()（）]*[)）]$/u.test(body)) return true;
 return !/[。？！?!_]|[(（]\s+[)）]/u.test(body) && body.split(/[,，、]\s*/u).length >= 4;
}

type Realignment = {
 answers: SourceAnswer[];
 /** False when the source has answers but their pairing with the prompts is unknown. */
 resolved: boolean;
 /** A note line the import stored as the first answer (for example "open answer, for reference"). */
 answerNote: string;
};

const ANSWER_NOTE_PATTERN = /^[(（][^()（）]*[)）]$/u;

/**
 * Some imports zipped the question paragraphs with the answer paragraphs by
 * position. An instruction or word-bank line among the questions then took
 * the first answer, and a note line among the answers took the first
 * question, so every later answer sits one place off. Answers are moved back
 * when they exactly cover the real questions; otherwise the pairing is
 * unknown and the caller lists the answers separately.
 */
function realignAnswers(prompts: readonly string[], source: readonly SourceAnswer[]): Realignment {
 const first = source[0]?.text ?? "";
 const answerNote = ANSWER_NOTE_PATTERN.test(first) && !containsHan(first) ? first : "";
 const answers = answerNote ? [...source.slice(1), { text: "", notes: [] }] : [...source];
 const instruction = prompts.map(isInstructionPrompt);
 const given = answers.filter(hasAnswer);
 const zipped = answers.slice(0, given.length).every(hasAnswer);
 const keep = { answers, resolved: true, answerNote };
 if (!instruction.some(Boolean) || !zipped || given.length === 0) return keep;
 if (!instruction.some((flag, index) => flag && index < given.length)) return keep;
 const questionCount = instruction.filter((flag) => !flag).length;
 if (questionCount !== given.length) return { answers, resolved: false, answerNote };
 let next = 0;
 const moved = instruction.map((flag) => {
  if (flag) return { text: "", notes: [] };
  const answer = given[next];
  next += 1;
  return answer ?? { text: "", notes: [] };
 });
 return { answers: moved, resolved: true, answerNote };
}

function truthMark(answer: SourceAnswer) {
 if (TRUE_PATTERN.test(answer.text)) return "Đ";
 return FALSE_PATTERN.test(answer.text) ? "S" : "";
}

function isTrueFalseList(records: readonly JsonObject[], answers: readonly SourceAnswer[]) {
 const answered = answers.filter(hasAnswer);
 return (
  answered.length > 0 &&
  answered.every((answer) => truthMark(answer)) &&
  records.every((record) => labelledTexts(record.choices).length === 0)
 );
}

function writeTrueFalseTable(
 prompts: readonly string[],
 answers: readonly SourceAnswer[],
 output: ExerciseOutput,
) {
 const rows = [["STT", "Câu", "Đ/S", "Giải thích"]];
 let answered = 0;
 prompts.forEach((prompt, index) => {
  const answer = answers[index] ?? { text: "", notes: [] };
  if (!prompt) return;
  if (!hasAnswer(answer) && isInstructionPrompt(prompt)) {
   rows.push(["", prompt, "", ""]);
   return;
  }
  if (hasAnswer(answer)) answered += 1;
  const mark = truthMark(answer);
  const detail = /^\S+$/u.test(answer.text) ? "" : answer.text;
  rows.push([
   String(rows.filter((row) => row[0] !== "").length),
   prompt.replace(/\s*[(（]\s*[)）]\s*$/u, ""),
   mark,
   [detail, ...answer.notes].filter(Boolean).join(" — "),
  ]);
 });
 const questionRows = rows.slice(1).filter((row) => row[0] !== "").length;
 output.answerTable(rows, [2, 3], answered);
 output.coverage.questions -= rows.length - 1 - questionRows;
 output.coverage.unanswered -= rows.length - 1 - questionRows;
}

export type QuestionListOptions = {
 /** Answers from a sibling answer list, one per entry; empty when the list has none. */
 siblingAnswers: readonly SourceAnswer[];
 /** The section zipped question and answer paragraphs by position (see `realignAnswers`). */
 positionalAnswers: boolean;
};

function tupleDraft(values: readonly JsonValue[], sibling: SourceAnswer): QuestionDraft {
 const texts = textList([...values]);
 const body = texts.length >= 3 && !containsHan(texts[0] ?? "") ? texts.slice(1) : texts;
 const answerText = body.length > 1 ? (body.at(-1) ?? "") : "";
 return {
  prompt: body.length > 1 ? body.slice(0, -1).join(" / ") : (body[0] ?? ""),
  translation: "",
  choices: [],
  answerLetter: "",
  answer: hasAnswer(sibling) ? sibling : { text: answerText, notes: [] },
 };
}

/** Writes a list of questions; entries are records, bare strings or `[prompt, answer]` tuples. */
export function writeQuestionList(
 entries: readonly JsonValue[],
 options: QuestionListOptions,
 output: ExerciseOutput,
) {
 const records = entries.map((entry) => (isRecordValue(entry) ? asRecord(entry) : {}));
 const prompts = entries.map((entry, index) =>
  isRecordValue(entry) ? promptFromRecord(records[index] ?? {}) : textOf(entry),
 );
 const ownAnswers = records.map((record, index) => {
  const own = answerFromRecord(record);
  return hasAnswer(own) ? own : (options.siblingAnswers[index] ?? { text: "", notes: [] });
 });
 const realignment = options.positionalAnswers
  ? realignAnswers(prompts, ownAnswers)
  : { answers: ownAnswers, resolved: true, answerNote: "" };
 const aligned = realignment.answers;
 output.note(realignment.answerNote);
 if (!realignment.resolved) {
  output.coverage.unaligned = true;
  const none = { text: "", notes: [] };
  prompts.forEach((prompt, index) => {
   if (isInstructionPrompt(prompt)) output.note(prompt);
   else output.question(draftFromRecord(records[index] ?? {}, none));
  });
  output.answerKey("Đáp án", aligned.filter(hasAnswer));
  return;
 }
 if (aligned.some((answer, index) => answer.text !== (ownAnswers[index]?.text ?? ""))) {
  output.coverage.realigned = true;
 }
 if (isTrueFalseList(records, aligned)) {
  writeTrueFalseTable(prompts, aligned, output);
  return;
 }
 const promptless: SourceAnswer[] = [];
 const moved = output.coverage.realigned;
 let position = -1;
 entries.forEach((entry, index) => {
  const answer = aligned[index] ?? { text: "", notes: [] };
  const record = records[index] ?? {};
  if (Array.isArray(entry)) {
   position += 1;
   const draft = tupleDraft(entry, answer);
   output.question({ ...draft, prompt: numbered(draft.prompt, position, entries.length) });
   return;
  }
  const prompt = prompts[index] ?? "";
  if (moved && !hasAnswer(answer) && isInstructionPrompt(prompt)) {
   output.note(prompt);
   return;
  }
  position += 1;
  const ordering = orderingItems(record);
  if (ordering.length > 1) {
   const draft = orderingDraft(record, ordering, answer);
   output.question({ ...draft, prompt: numbered(draft.prompt, position, entries.length) });
   return;
  }
  const hasChoices = labelledTexts(record.choices).length > 0;
  if (!prompt && !hasChoices) {
   if (hasAnswer(answer)) promptless.push(answer);
   return;
  }
  const draft = isRecordValue(entry)
   ? draftFromRecord(record, answer)
   : { prompt, translation: "", choices: [], answerLetter: "", answer };
  output.question({
   ...draft,
   prompt: draft.prompt
    ? numbered(draft.prompt, position, entries.length)
    : answerEntryLabel(entry) || `(${position + 1})`,
  });
 });
 output.answerKey("Đáp án", promptless);
}
