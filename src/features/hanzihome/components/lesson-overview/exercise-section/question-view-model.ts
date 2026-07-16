import { answerToString, arrayValue, asRecord, nonEmptyStrings, stringValue } from "../utils";
import {
 answerFromRecord,
 firstTextByKeys,
 formatAnswer,
 objectText,
 promptFromQuestionRecord,
} from "./exercise-utils";

export type ExerciseQuestionViewModel = {
 id: string;
 title: string;
 answer: string;
 note: string;
 meaning: string;
 choices: unknown[];
 context: unknown;
 cue: unknown;
 target: unknown;
 left: unknown;
 right: unknown;
 statement: unknown;
 evidence: unknown;
 dialogue: unknown[];
 givenWords: string[];
 requiresSourceVisual: boolean;
 sourcePrintedPages: number[];
};

function tupleQuestionModel(
 exerciseType: string,
 values: unknown[],
 index: number,
 answerOverride: unknown,
): ExerciseQuestionViewModel {
 const strings = values.map(answerToString);

 if (exerciseType === "correct_sentence") {
  return emptyQuestionModel({
   id: `question-${index}`,
   title: strings[0] || "Câu cần sửa",
   answer: strings[1] || formatAnswer(answerOverride),
  });
 }

 if (exerciseType === "choose_words_fill_blank" && strings.length >= 3) {
  return emptyQuestionModel({
   id: strings[0] || `question-${index}`,
   title: strings[1] || "Câu điền từ",
   answer: strings[2] || formatAnswer(answerOverride),
  });
 }

 const [first = "", second = "", third = ""] = strings;
 return emptyQuestionModel({
  id: `question-${index}`,
  title: first || "Câu hỏi",
  answer: third || second || formatAnswer(answerOverride),
 });
}

function emptyQuestionModel(values: Partial<ExerciseQuestionViewModel>): ExerciseQuestionViewModel {
 return {
  id: values.id ?? "",
  title: values.title ?? "",
  answer: values.answer ?? "",
  note: values.note ?? "",
  meaning: values.meaning ?? "",
  choices: values.choices ?? [],
  context: values.context,
  cue: values.cue,
  target: values.target,
  left: values.left,
  right: values.right,
  statement: values.statement,
  evidence: values.evidence,
  dialogue: values.dialogue ?? [],
  givenWords: values.givenWords ?? [],
  requiresSourceVisual: values.requiresSourceVisual ?? false,
  sourcePrintedPages: values.sourcePrintedPages ?? [],
 };
}

function sourcePrintedPages(question: Record<string, unknown>) {
 return arrayValue(question, "source_pages")
  .map((value) => asRecord(value).printedPage)
  .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

export function buildExerciseQuestionViewModel({
 exerciseType,
 value,
 index,
 answerOverride,
}: {
 exerciseType: string;
 value: unknown;
 index: number;
 answerOverride?: unknown;
}): ExerciseQuestionViewModel {
 if (Array.isArray(value)) {
  return tupleQuestionModel(exerciseType, value, index, answerOverride);
 }

 if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
  return emptyQuestionModel({
   id: `question-${index}`,
   title: String(value),
   answer: formatAnswer(answerOverride),
  });
 }

 const question = asRecord(value);
 const answerOverrideRecord = asRecord(answerOverride);
 const answer = formatAnswer(answerOverride) || answerFromRecord(question);
 const dialogue = arrayValue(question, "dialogue");
 const givenWords = [
  stringValue(question, "given"),
  stringValue(question, "given_word"),
  ...nonEmptyStrings(arrayValue(question, "given_words")),
 ].filter(Boolean);

 const title =
  exerciseType === "complete_dialogue" && dialogue.length > 0
   ? "Hoàn thành đoạn hội thoại"
   : promptFromQuestionRecord(question);

 return emptyQuestionModel({
  id: stringValue(question, "id") || `question-${index}`,
  title,
  answer,
  note:
   stringValue(question, "explanation_vi") ||
   stringValue(question, "answer_note_vi") ||
   stringValue(question, "note_vi") ||
   stringValue(answerOverrideRecord, "explanation_vi") ||
   stringValue(answerOverrideRecord, "answer_note_vi") ||
   stringValue(answerOverrideRecord, "note_vi") ||
   objectText(question.evidence, ["quote"]),
  meaning: stringValue(question, "answer_vi") || stringValue(answerOverrideRecord, "answer_vi"),
  choices: arrayValue(question, "choices"),
  context: firstTextByKeys(question, [
   "context",
   "context_zh",
   "situation",
   "situation_zh",
   "scenario",
   "scenario_zh",
  ]),
  cue: firstTextByKeys(question, [
   "cue",
   "cue_zh",
   "source",
   "source_zh",
   "source_sentence",
   "original",
   "original_zh",
   "original_sentence",
   "base_sentence",
  ]),
  target: firstTextByKeys(question, [
   "target",
   "target_zh",
   "target_sentence",
   "expected",
   "expected_zh",
   "completed",
   "completed_sentence",
   "response_prompt",
  ]),
  left: firstTextByKeys(question, ["a", "A", "left", "left_text"]),
  right: firstTextByKeys(question, ["b", "B", "right", "right_text"]),
  statement: question.statement,
  evidence: question.evidence,
  dialogue,
  givenWords,
  requiresSourceVisual: question.requires_source_visual === true,
  sourcePrintedPages: sourcePrintedPages(question),
 });
}
