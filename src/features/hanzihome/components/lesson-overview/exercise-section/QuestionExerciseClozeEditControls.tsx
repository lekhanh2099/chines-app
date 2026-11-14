import { NestedEditControls, type EditableNodePath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { asRecord, stringValue } from "../utils";
import type { buildQuestionExerciseModel } from "./question-exercise-model";

type QuestionExerciseModel = ReturnType<typeof buildQuestionExerciseModel>;

/** Edit-mode controls for cloze passage segments and cloze answers. */
export function QuestionExerciseClozeEditControls({
 lessonId,
 itemPath,
 item,
 passageSegments,
 clozeAnswerSource,
}: {
 lessonId: string;
 itemPath: EditableNodePath;
 item: Exercise;
 passageSegments: QuestionExerciseModel["passageSegments"];
 clozeAnswerSource: QuestionExerciseModel["clozeAnswerSource"];
}) {
 return (
  <>
   {passageSegments ? (
    <NestedEditControls
     lessonId={lessonId}
     parentEntityType="exercise"
     parentEntityId={item.id}
     title="Cloze segments"
     nodes={passageSegments.values.map((segment, index) => {
      const segmentRecord = asRecord(segment);
      return {
       entityType: "exercise_cloze_segment",
       entityId: stringValue(segmentRecord, "id") || `${item.id}-segment-${index}`,
       path: [...itemPath, ...passageSegments.path, index],
       value: segment,
       label: `Segment ${index + 1}`,
      };
     })}
    />
   ) : null}

   {clozeAnswerSource ? (
    <NestedEditControls
     lessonId={lessonId}
     parentEntityType="exercise"
     parentEntityId={item.id}
     title="Đáp án cloze"
     nodes={clozeAnswerSource.values.map((answer, index) => {
      const answerRecord = asRecord(answer);
      return {
       entityType: "exercise_cloze_answer",
       entityId:
        stringValue(answerRecord, "id") ||
        stringValue(answerRecord, "blank_id") ||
        `${item.id}-cloze-answer-${index}`,
       path: [...itemPath, clozeAnswerSource.key, index],
       value: answer,
       label: `Đáp án ${index + 1}`,
      };
     })}
    />
   ) : null}
  </>
 );
}
