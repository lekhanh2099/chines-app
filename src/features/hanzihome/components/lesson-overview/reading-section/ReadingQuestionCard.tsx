import type { JsonFieldValue } from "@/types/json";
import { ExerciseQuestionCard } from "../CommonCards";
import { answerToString, arrayValue, asRecord, stringValue } from "../utils";
import { formatAnswer, objectText } from "./reading-utils";
import type { LessonDisplayMode } from "../types";

export function ReadingQuestionCard({
 itemId,
 readingType,
 questionValue,
 index,
 showAnswers = false,
 displayMode,
}: {
 itemId: string;
 readingType: string;
 questionValue: JsonFieldValue;
 index: number;
 showAnswers?: boolean;
 displayMode: LessonDisplayMode;
}) {
 if (Array.isArray(questionValue)) {
  const values = questionValue.map(answerToString);
  const title = values[0] || "Câu hỏi";
  const answer = readingType === "reading_multiple_choice" ? values.at(-1) : values[1];

  return (
   <ExerciseQuestionCard
    key={`${itemId}-question-${index}`}
    index={index + 1}
    title={title}
    answer={answer}
    showAnswer={showAnswers}
    displayMode={displayMode}
   />
  );
 }

 if (
  typeof questionValue === "string" ||
  typeof questionValue === "number" ||
  typeof questionValue === "boolean"
 ) {
  return (
   <ExerciseQuestionCard
    key={`${itemId}-question-${index}`}
    index={index + 1}
    title={String(questionValue)}
    displayMode={displayMode}
   />
  );
 }

 const question = asRecord(questionValue);
 const nestedQuestion = asRecord(question.question);
 const statement = asRecord(question.statement);
 const answerRecord = asRecord(question.answer);

 const choices = arrayValue(question, "choices")
  .map((choiceValue) => {
   const choice = asRecord(choiceValue);
   return (
    stringValue(choice, "text") ||
    stringValue(choice, "zh") ||
    stringValue(choice, "label") ||
    answerToString(choiceValue)
   );
  })
  .filter(Boolean);

 const title =
  stringValue(question, "prompt") ||
  stringValue(question, "question") ||
  stringValue(question, "text") ||
  stringValue(nestedQuestion, "zh") ||
  stringValue(nestedQuestion, "vi") ||
  stringValue(statement, "zh") ||
  stringValue(statement, "vi") ||
  "Câu hỏi";

 const answer =
  formatAnswer(question.answer) ||
  stringValue(answerRecord, "zh") ||
  stringValue(answerRecord, "vi") ||
  stringValue(question, "sample_answer") ||
  stringValue(question, "correct_answer_label") ||
  stringValue(question, "correct") ||
  stringValue(question, "correct_sentence");

 const note =
  stringValue(question, "explanation_vi") ||
  stringValue(question, "note_vi") ||
  objectText(question.evidence, ["quote"]);

 return (
  <ExerciseQuestionCard
   key={stringValue(question, "id") || `${itemId}-question-${index}`}
   index={index + 1}
   title={choices.length > 0 ? `${title} (${choices.join(" / ")})` : title}
   answer={answer}
   showAnswer={showAnswers}
   note={note}
   displayMode={displayMode}
  />
 );
}
