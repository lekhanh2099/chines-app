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
  <article className="nova-glass-panel grid gap-4 rounded-2xl p-4 sm:p-5">
   <div className="flex items-start gap-3 border-b border-border-default/70 pb-4">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-subtle text-sm font-black text-accent-text">
     {item.order}
    </span>
    <div className="grid gap-1 min-w-0 flex-1">
     <h4 className="text-lg font-black leading-tight text-text-primary sm:text-xl">
      {item.title_vi || item.title}
     </h4>
     {instructionText && (
      <p className="text-sm font-semibold leading-6 text-text-secondary">{instructionText}</p>
     )}
    </div>
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
