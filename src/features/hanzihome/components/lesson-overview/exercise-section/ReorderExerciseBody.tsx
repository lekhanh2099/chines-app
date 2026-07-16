import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { EditableNodeWrapper } from "@/features/hanzihome/editing";
import type { LessonDisplayMode } from "../types";
import { answerToString, arrayValue, asRecord, stringValue } from "../utils";
import { AnswerReveal } from "../common/AnswerReveal";
import { EmptySectionState } from "../common/EmptySectionState";
import { MatchingOptionCard } from "./MatchingOptionCard";
import { QuestionExerciseBody } from "./QuestionExerciseBody";

export function ReorderExerciseBody({
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

 if (questions.length === 0) {
  return <EmptySectionState reason="Bài sắp xếp chưa có nhóm câu." />;
 }

 const hasStructuredOptions = questions.some((questionValue) => {
  const question = asRecord(questionValue);
  return ["items", "sentences", "choices", "segments"].some(
   (key) => arrayValue(question, key).length > 0,
  );
 });

 if (!hasStructuredOptions) {
  return (
   <QuestionExerciseBody
    lessonId={lessonId}
    itemPath={itemPath}
    item={item}
    displayMode={displayMode}
   />
  );
 }

 return (
  <div className="grid gap-4">
   {questions.map((questionValue, questionIndex) => {
    const question = asRecord(questionValue);
    const options = [
     ...arrayValue(question, "items"),
     ...arrayValue(question, "sentences"),
     ...arrayValue(question, "choices"),
     ...arrayValue(question, "segments"),
    ];
    const answer =
     arrayValue(question, "answer_order").map(answerToString).filter(Boolean).join(" → ") ||
     arrayValue(question, "answer").map(answerToString).filter(Boolean).join(" → ") ||
     stringValue(question, "answer") ||
     stringValue(question, "answer_text") ||
     stringValue(question, "completed_paragraph");
    const questionId = stringValue(question, "id") || `${item.id}-reorder-${questionIndex}`;
    const content = (
     <section className="exercise-question-surface grid gap-3 rounded-xl border p-3 sm:p-4">
      <h5 className="font-black text-text-primary">Nhóm {questionIndex + 1}</h5>
      <div className="grid gap-2 sm:grid-cols-2">
       {options.map((option, optionIndex) => (
        <MatchingOptionCard
         key={`${questionId}-option-${optionIndex}`}
         label={stringValue(asRecord(option), "label") || String.fromCharCode(65 + optionIndex)}
         value={option}
         displayMode={displayMode}
        />
       ))}
      </div>
      {answer ? (
       <AnswerReveal defaultOpen={displayMode.showAnswers} label="Xem thứ tự đúng">
        <p className="font-black text-accent-text">{answer}</p>
       </AnswerReveal>
      ) : null}
     </section>
    );

    return lessonId && itemPath ? (
     <EditableNodeWrapper
      key={questionId}
      lessonId={lessonId}
      entityType="exercise_question"
      entityId={questionId}
      parentEntityType="exercise"
      parentEntityId={item.id}
      path={[...itemPath, "questions", questionIndex]}
      value={questionValue}
      label={`Nhóm sắp xếp ${questionIndex + 1}`}
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
