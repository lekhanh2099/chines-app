import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { EditableNodeWrapper } from "@/features/hanzihome/editing";
import { ExerciseQuestionCard } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";

export function WritingExerciseBody({
 lessonId,
 itemPath,
 item,
 displayMode,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
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

    return lessonId && itemPath ? (
     <EditableNodeWrapper
      key={questionId}
      lessonId={lessonId}
      entityType="exercise_question"
      entityId={questionId}
      parentEntityType="exercise"
      parentEntityId={item.id}
      path={[...itemPath, "questions", index]}
      value={question}
      label={`Câu viết ${index + 1}`}
     >
      {content}
     </EditableNodeWrapper>
    ) : (
     <div key={questionId}>{content}</div>
    );
   })}
  </div>
 );
}
