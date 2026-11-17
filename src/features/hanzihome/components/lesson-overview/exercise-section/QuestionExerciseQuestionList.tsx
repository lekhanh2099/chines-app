import { Fragment } from "react";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { ReadingQuestionCard } from "../reading-section/ReadingQuestionCard";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { QuestionCard } from "./QuestionCard";
import type { buildQuestionExerciseModel } from "./question-exercise-model";

type QuestionExerciseModel = ReturnType<typeof buildQuestionExerciseModel>;

/** Question cards (reading or generic), each editable in Edit Mode. */
export function QuestionExerciseQuestionList({
 item,
 displayMode,
 questions,
 answerKey,
 isReadingExercise,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
 questions: QuestionExerciseModel["questions"];
 answerKey: QuestionExerciseModel["answerKey"];
 isReadingExercise: QuestionExerciseModel["isReadingExercise"];
}) {
 return (
  <div className="grid gap-2">
   {questions.map((questionValue, index) => {
    const questionId = stringValue(asRecord(questionValue), "id") || `${item.id}-${index}`;
    const questionCard = isReadingExercise ? (
     <ReadingQuestionCard
      itemId={item.id}
      readingType={item.type}
      questionValue={questionValue}
      index={index}
      showAnswers={displayMode.showAnswers}
      displayMode={displayMode}
      answerOverride={answerKey[index]}
     />
    ) : (
     <QuestionCard
      itemId={item.id}
      exerciseType={item.type}
      questionValue={questionValue}
      index={index}
      displayMode={displayMode}
      answerOverride={answerKey[index]}
     />
    );

    return <Fragment key={questionId}>{questionCard}</Fragment>;
   })}
  </div>
 );
}
