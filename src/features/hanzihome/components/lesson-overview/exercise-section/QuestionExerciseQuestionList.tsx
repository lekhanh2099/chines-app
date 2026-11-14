import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { ReadingQuestionCard } from "../reading-section/ReadingQuestionCard";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { QuestionCard } from "./QuestionCard";
import type { buildQuestionExerciseModel } from "./question-exercise-model";

type QuestionExerciseModel = ReturnType<typeof buildQuestionExerciseModel>;

/** Question cards (reading or generic), each editable in Edit Mode. */
export function QuestionExerciseQuestionList({
 lessonId,
 itemPath,
 item,
 displayMode,
 questions,
 answerKey,
 isReadingExercise,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
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

    return lessonId && itemPath ? (
     <EditableNodeWrapper
      key={questionId}
      lessonId={lessonId}
      entityType="exercise_question"
      entityId={questionId}
      parentEntityType="exercise"
      parentEntityId={item.id}
      path={[...itemPath, "questions", index]}
      value={questionValue}
      label={`Câu ${index + 1}`}
     >
      {questionCard}
     </EditableNodeWrapper>
    ) : (
     <div key={questionId}>{questionCard}</div>
    );
   })}
  </div>
 );
}
