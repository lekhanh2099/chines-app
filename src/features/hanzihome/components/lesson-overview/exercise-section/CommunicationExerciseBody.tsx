import { EditableNodeWrapper, type DraftPatchPath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { ExerciseQuestionCard } from "../CommonCards";
import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, nonEmptyStrings, stringValue } from "../utils";
import { QuestionExerciseBody } from "./QuestionExerciseBody";

export function CommunicationExerciseBody({
 lessonId,
 itemPath,
 item,
 displayMode,
}: {
 lessonId?: string;
 itemPath?: DraftPatchPath;
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const dialogueValue = record.dialogue;
 const dialogue = Array.isArray(dialogueValue)
  ? dialogueValue
  : arrayValue(asRecord(dialogueValue), "lines");
 const questions = arrayValue(record, "questions");
 const tasks = arrayValue(record, "practice_tasks");

 return (
  <div className="grid gap-3">
   {dialogue.length > 0 && (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
     {dialogue.map((lineValue, index) => {
      const line = asRecord(lineValue);

      const lineCard = (
       <TextLineCard
        speaker={stringValue(line, "speaker")}
        zh={stringValue(line, "zh") || stringValue(line, "text")}
        pinyin={stringValue(line, "pinyin")}
        vi={stringValue(line, "vi")}
        displayMode={displayMode}
       />
      );
      const lineId = stringValue(line, "id") || `${stringValue(line, "speaker")}-${index}`;
      const linePath = Array.isArray(dialogueValue)
       ? [...(itemPath ?? []), "dialogue", index]
       : [...(itemPath ?? []), "dialogue", "lines", index];

      return lessonId && itemPath ? (
       <EditableNodeWrapper
        key={lineId}
        lessonId={lessonId}
        entityType="exercise_dialogue_line"
        entityId={lineId}
        parentEntityType="exercise"
        parentEntityId={item.id}
        path={linePath}
        value={lineValue}
        label={`Dòng hội thoại ${index + 1}`}
       >
        {lineCard}
       </EditableNodeWrapper>
      ) : (
       <div key={lineId}>{lineCard}</div>
      );
     })}
    </div>
   )}

   {tasks.map((taskValue, index) => {
    const task = asRecord(taskValue);
    const sample =
     nonEmptyStrings(arrayValue(task, "sample_answer")).join(" / ") ||
     stringValue(task, "sample_answer_zh") ||
     stringValue(task, "sample_answer_vi") ||
     stringValue(task, "sample_answer");

    const taskId = stringValue(task, "id") || `${item.id}-task-${index}`;
    const content = (
     <ExerciseQuestionCard
      index={index + 1}
      title={
       stringValue(task, "instruction_vi") ||
       stringValue(task, "prompt_vi") ||
       stringValue(task, "prompt") ||
       "Luyện tập"
      }
      answer={sample}
      note={stringValue(task, "explanation_vi")}
     />
    );

    return lessonId && itemPath ? (
     <EditableNodeWrapper
      key={taskId}
      lessonId={lessonId}
      entityType="exercise_question"
      entityId={taskId}
      parentEntityType="exercise"
      parentEntityId={item.id}
      path={[...itemPath, "practice_tasks", index]}
      value={taskValue}
      label={`Practice task ${index + 1}`}
     >
      {content}
     </EditableNodeWrapper>
    ) : (
     <div key={taskId}>{content}</div>
    );
   })}

   {dialogue.length === 0 && questions.length > 0 && (
    <QuestionExerciseBody
     lessonId={lessonId}
     itemPath={itemPath}
     item={item}
     displayMode={displayMode}
    />
   )}
  </div>
 );
}
