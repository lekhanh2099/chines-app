import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import type { LessonDisplayMode } from "../types";
import { asRecord } from "../utils";
import { MatchingAnswerDetails } from "./MatchingAnswerDetails";
import { MatchingColumn } from "./MatchingColumn";
import { QuestionExerciseBody } from "./QuestionExerciseBody";
import { firstArraySource } from "./exercise-utils";

export function MatchingExerciseBody({
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

 const leftSource = firstArraySource(record, [
  "left",
  "left_items",
  "column_a",
  "a_items",
  "prompts",
 ]);
 const leftItems = leftSource?.values ?? [];

 const rightSource = firstArraySource(record, [
  "right",
  "right_items",
  "column_b",
  "b_items",
  "responses",
 ]);
 const rightItems = rightSource?.values ?? [];

 const answerSource = firstArraySource(record, ["answer_key", "answers", "matches", "solutions"]);
 const answers = answerSource?.values ?? [];

 if (leftItems.length === 0 && rightItems.length === 0) {
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
  <div className="grid gap-3">
   <div className="grid gap-3 md:grid-cols-2">
    <MatchingColumn
     lessonId={lessonId}
     itemPath={itemPath}
     itemId={item.id}
     title="Cột A"
     values={leftItems}
     sourceKey={leftSource?.key ?? "left"}
     labelMode="number"
     displayMode={displayMode}
    />

    <MatchingColumn
     lessonId={lessonId}
     itemPath={itemPath}
     itemId={item.id}
     title="Cột B"
     values={rightItems}
     sourceKey={rightSource?.key ?? "right"}
     labelMode="letter"
     displayMode={displayMode}
    />
   </div>

   <MatchingAnswerDetails
    lessonId={lessonId}
    itemPath={itemPath}
    itemId={item.id}
    answers={answers}
   sourceKey={answerSource?.key ?? "answer_key"}
   leftItems={leftItems}
   rightItems={rightItems}
   showAnswers={displayMode.showAnswers}
  />
  </div>
 );
}
