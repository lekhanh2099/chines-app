import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import { ExerciseBody } from "./exercise-section/ExerciseBody";
import { RawExerciseDataDetails } from "./exercise-section/RawExerciseDataDetails";
import type { LessonDisplayMode } from "./types";
import { asRecord, stringValue } from "./utils";

export function ExerciseCard({
 lessonId,
 parentSectionId,
 path,
 item,
 displayMode,
 debugMode = false,
}: {
 lessonId?: string;
 parentSectionId?: string;
 path?: EditableNodePath;
 item: Exercise;
 displayMode: LessonDisplayMode;
 debugMode?: boolean;
}) {
 const record = asRecord(item);
 const instruction = asRecord(record.instruction);
 const instructionText = stringValue(instruction, "vi") || stringValue(instruction, "zh");

 const content = (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <h4 className="font-black text-text-primary">{item.title_vi || item.title}</h4>
    {instructionText && <p className=" font-semibold text-text-secondary">{instructionText}</p>}
   </div>

   <ExerciseBody lessonId={lessonId} itemPath={path} item={item} displayMode={displayMode} />

   {debugMode && <RawExerciseDataDetails value={item} />}
  </article>
 );

 if (!lessonId || !path) return content;

 return (
  <EditableNodeWrapper
   lessonId={lessonId}
   entityType="exercise"
   entityId={item.id}
   parentEntityType="section"
   parentEntityId={parentSectionId}
   path={path}
   value={item}
   label={item.title_vi || item.title}
   editLabel="Sửa nội dung"
  >
   {content}
  </EditableNodeWrapper>
 );
}
