import type { JsonFieldValue } from "@/types/json";
import type {
 Exercise,
 ReadingItem,
 Section,
} from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { hasRenderableValue } from "../CommonCards";
import {
 arrayValue,
 asRecord,
 getClozeAnswerValues,
 getPassageLikeValue,
 hasClozeAnswerValue,
 stringValue,
} from "../utils";
import {
 firstArrayByKeys,
 firstArraySource,
 formatAnswer,
 hasExercisePassagePayload,
} from "./exercise-utils";
import { getExerciseRendererMeta } from "./exercise-renderer-registry";

type QuestionExerciseModelInput = {
 item: Exercise;
 readingItems?: readonly ReadingItem[];
 readingSections?: readonly Section[];
};

export function questionHasInlineAnswer(value: JsonFieldValue) {
 if (Array.isArray(value)) return value.length > 1;

 const question = asRecord(value);
 const answerRecord = asRecord(question.answer);

 return Boolean(
  stringValue(question, "answer") ||
  stringValue(question, "answer_zh") ||
  stringValue(question, "sample_answer") ||
  stringValue(question, "sample_answer_zh") ||
  stringValue(question, "suggested_answer") ||
  stringValue(question, "suggested_answer_zh") ||
  stringValue(question, "correct") ||
  stringValue(question, "correct_sentence") ||
  stringValue(answerRecord, "zh") ||
  stringValue(answerRecord, "vi") ||
  arrayValue(question, "acceptable_answers").length > 0,
 );
}

function readingReferenceOrder(value: string) {
 const match = /^reading[_-](\d+)(?:[_-][a-z0-9]+)*$/i.exec(value);
 if (!match) return null;

 const order = Number.parseInt(match[1], 10);
 return Number.isFinite(order) ? order : null;
}

function readingSectionReferenceOrder(value: string) {
 const match = /^section_(\d+)_reading$/i.exec(value);
 if (!match) return null;

 const order = Number.parseInt(match[1], 10);
 return Number.isFinite(order) ? order : null;
}

export function resolveReferencedReadingItem(
 readingItems: QuestionExerciseModelInput["readingItems"],
 readingSections: QuestionExerciseModelInput["readingSections"],
 readingReference: string,
) {
 if (!readingReference) return undefined;

 const exactMatch = readingItems?.find((readingItem) => readingItem.id === readingReference);
 if (exactMatch) return exactMatch;

 const referencedOrder = readingReferenceOrder(readingReference);
 if (referencedOrder !== null) {
  const matchingItems =
   readingItems?.filter((readingItem) => readingItem.order === referencedOrder) ?? [];

  return matchingItems.length === 1 ? matchingItems[0] : undefined;
 }

 const sectionOrder = readingSectionReferenceOrder(readingReference);
 if (sectionOrder === null) return undefined;

 // Imported section references retain their source order after runtime section IDs are normalized.
 const matchingItems =
  readingSections
   ?.filter((section) => section.type === "reading" && section.order === sectionOrder)
   .flatMap((section) => (section.type === "reading" ? section.items : [])) ?? [];

 return matchingItems.length === 1 ? matchingItems[0] : undefined;
}

/** Optional supporting payloads (tables, drills, example sets, refs) rendered as extra blocks. */
function buildQuestionExtraPayloads(record: ReturnType<typeof asRecord>, readingReference: string) {
 return [
  {
   title: "Bảng",
   value: record.table,
  },
  {
   title: "Cặp luyện",
   value: firstArrayByKeys(record, ["pairs", "minimal_pairs"]),
  },
  {
   title: "Cụm luyện",
   value: firstArrayByKeys(record, ["phrases"]),
  },
  {
   title: "Drills",
   value: firstArrayByKeys(record, ["drills"]),
  },
  {
   title: "Câu đúng",
   value: firstArrayByKeys(record, ["correct_examples", "correct_sentences"]),
  },
  {
   title: "Câu sai",
   value: firstArrayByKeys(record, ["wrong_examples", "wrong_sentences"]),
  },
  {
   title: "Gợi ý kể lại",
   value: arrayValue(record, "retell_prompts"),
  },
  {
   title: "Bài đọc liên quan",
   value: readingReference,
  },
  {
   title: "Luyện viết chữ liên quan",
   value: stringValue(record, "character_writing_ref"),
  },
 ];
}

/** Derives every payload slice the question-family exercise renderer shows. */
export function buildQuestionExerciseModel({
 item,
 readingItems,
 readingSections,
}: QuestionExerciseModelInput) {
 const record = asRecord(item);

 const questions = arrayValue(record, "questions");
 const items = arrayValue(record, "items");
 const groups = arrayValue(record, "groups");
 const parts = arrayValue(record, "parts");

 const leftSource = firstArraySource(record, [
  "left_items",
  "left",
  "column_a",
  "a_items",
  "prompts",
 ]);
 const leftItems = leftSource?.values ?? [];

 const rightSource = firstArraySource(record, [
  "right_items",
  "right",
  "column_b",
  "b_items",
  "responses",
 ]);
 const rightItems = rightSource?.values ?? [];

 const answerKey =
  arrayValue(record, "blanks").length > 0
   ? arrayValue(record, "blanks")
   : arrayValue(record, "answer_key").length > 0
     ? arrayValue(record, "answer_key")
     : arrayValue(record, "answers");

 const wordBank = arrayValue(record, "word_bank");
 const readingReference =
  stringValue(record, "reading_ref") ||
  stringValue(record, "reading_id") ||
  stringValue(record, "json_item_id") ||
  stringValue(record, "linked_reading_id") ||
  stringValue(record, "linked_section_id");
 const referencedReading = resolveReferencedReadingItem(
  readingItems,
  readingSections,
  readingReference,
 );
 const referencedReadingRecord = asRecord(referencedReading);

 const supplementaryWords = [
  ...arrayValue(record, "supplementary_words"),
  ...arrayValue(record, "supplementary_vocab"),
  ...arrayValue(record, "supplementary_vocabulary"),
  ...arrayValue(record, "supplement_vocab"),
  ...arrayValue(record, "supplemental_vocab"),
 ];

 const pattern = stringValue(record, "pattern");
 const model = asRecord(record.model);
 const hasPassagePayload = hasExercisePassagePayload(record);
 const directClozeAnswers = getClozeAnswerValues(record);
 const referencedClozeAnswers = getClozeAnswerValues(referencedReadingRecord);
 const passage =
  (hasPassagePayload ? getPassageLikeValue(record, { includeText: true }) : undefined) ??
  getPassageLikeValue(referencedReadingRecord, { includeText: true });
 const passageRecord = asRecord(passage);
 const passageTitle = stringValue(passageRecord, "title_vi") || stringValue(passageRecord, "title");
 const showPassageTitle =
  Boolean(passageTitle) && passageTitle !== item.title && passageTitle !== item.title_vi;
 const passageClozeAnswers = getClozeAnswerValues(asRecord(passage));
 const clozeAnswers =
  directClozeAnswers.length > 0
   ? directClozeAnswers
   : referencedClozeAnswers.length > 0
     ? referencedClozeAnswers
     : passageClozeAnswers;
 const clozeAnswerCount = clozeAnswers.filter(hasClozeAnswerValue).length;
 const rendering = asRecord(record.rendering);
 const renderer = stringValue(rendering, "renderer");
 const variant = stringValue(record, "variant");
 const isReadingCloze =
  Boolean(passage) &&
  clozeAnswerCount > 0 &&
  (item.type === "reading_fill_blank" ||
   item.type === "reading_cloze" ||
   variant.includes("cloze") ||
   renderer.includes("cloze"));
 const questionsOnlyProvideClozeAnswers =
  isReadingCloze &&
  questions.length > 0 &&
  questions.every((questionValue) => {
   const question = asRecord(questionValue);

   return (
    hasClozeAnswerValue(questionValue) &&
    !stringValue(question, "prompt") &&
    !stringValue(question, "question") &&
    !stringValue(question, "text") &&
    !stringValue(asRecord(question.statement), "zh") &&
    !stringValue(asRecord(question.statement), "vi")
   );
  });
 const hasStructuredQuestionGroups = parts.length > 0 || groups.length > 0;
 const isReadingExercise = getExerciseRendererMeta(item.type).family === "reading";
 const questionAnswersAreInline =
  questions.length > 0 &&
  questions.every((questionValue, index) => {
   return questionHasInlineAnswer(questionValue) || Boolean(formatAnswer(answerKey[index]));
  });
 const shouldRenderAggregateAnswerKey = !isReadingCloze && !questionAnswersAreInline;

 const scenarioText =
  stringValue(record, "scenario_vi") ||
  stringValue(record, "scenario") ||
  stringValue(record, "situation_vi");

 const functionText = stringValue(record, "function_vi") || stringValue(record, "function");

 const extraPayloads = buildQuestionExtraPayloads(record, readingReference);

 const hasStructuredPayload =
  items.length > 0 ||
  parts.length > 0 ||
  groups.length > 0 ||
  leftItems.length > 0 ||
  rightItems.length > 0 ||
  questions.length > 0 ||
  Boolean(passage) ||
  extraPayloads.some((payload) => hasRenderableValue(payload.value));

 return {
  record,
  questions,
  items,
  groups,
  parts,
  leftSource,
  leftItems,
  rightSource,
  rightItems,
  answerKey,
  wordBank,
  supplementaryWords,
  pattern,
  model,
  passage,
  showPassageTitle,
  clozeAnswers,
  isReadingCloze,
  questionsOnlyProvideClozeAnswers,
  hasStructuredQuestionGroups,
  isReadingExercise,
  shouldRenderAggregateAnswerKey,
  scenarioText,
  functionText,
  extraPayloads,
  hasStructuredPayload,
 };
}
