import { Fragment } from "react";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { ExerciseQuestionCard } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";

export function WritingExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const questions = arrayValue(record, "questions");
 const modelAnswers = arrayValue(record, "model_answers");

 return (
  <div className="grid gap-3">
   {questions.map((question, index) => {
    const questionRecord = asRecord(question);
    const title =
     (typeof question === "string" ? question : "") ||
     stringValue(questionRecord, "prompt") ||
     stringValue(questionRecord, "question") ||
     `Câu ${index + 1}`;
    const answerValue = modelAnswers[index];
    const answer =
     typeof answerValue === "string"
      ? answerValue
      : stringValue(asRecord(answerValue), "answer") || stringValue(asRecord(answerValue), "text");
    const questionId = stringValue(questionRecord, "id") || `${item.id}-writing-${index}`;
    const content = (
     <ExerciseQuestionCard
      index={index + 1}
      title={title}
      answer={answer}
      showAnswer={displayMode.showAnswers}
      displayMode={displayMode}
     />
    );

    return <Fragment key={questionId}>{content}</Fragment>;
   })}
  </div>
 );
}
