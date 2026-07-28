import type { Exercise, ReadingItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import { ExerciseBody } from "./exercise-section/ExerciseBody";
import { RawExerciseDataDetails } from "./exercise-section/RawExerciseDataDetails";
import type { LessonDisplayMode } from "./types";
import { asRecord, stringValue } from "./utils";
import { getHanziTypographyStyle } from "./hanzi-typography";

const EXERCISE_PAGE_METADATA_PATTERN = /^Trang bài tập\s+\d+$/i;

function meaningfulVietnameseTitle(value: Exercise["title_vi"]) {
 const title = value?.trim();
 return title && !EXERCISE_PAGE_METADATA_PATTERN.test(title) ? title : "";
}

export function ExerciseCard({
 lessonId,
 parentSectionId,
 path,
 item,
 displayMode,
 debugMode = false,
 readingItems,
}: {
 lessonId?: string;
 parentSectionId?: string;
 path?: EditableNodePath;
 item: Exercise;
 displayMode: LessonDisplayMode;
 debugMode?: boolean;
 readingItems?: readonly ReadingItem[];
}) {
 const record = asRecord(item);
 const instruction = asRecord(record.instruction);
 const title = item.title || meaningfulVietnameseTitle(item.title_vi) || `Bài tập ${item.order}`;
 const titleVi = meaningfulVietnameseTitle(item.title_vi);
 const rawInstruction =
  meaningfulVietnameseTitle(stringValue(instruction, "vi")) || stringValue(instruction, "zh");
 const instructionText = rawInstruction !== title ? rawInstruction : "";

 const content = (
  <article className="exercise-card-surface grid gap-4 rounded-xl border p-4 shadow-theme-sm sm:p-5">
   <div className="flex items-start justify-between gap-3">
    <span className="study-chip-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black">
     {item.order}
    </span>
    <div className="grid gap-1 min-w-0 flex-1">
     <h4
      lang="zh-CN"
      className="font-black leading-tight text-text-primary"
      style={getHanziTypographyStyle(displayMode, { size: "md" })}
     >
      {title}
     </h4>
     {displayMode.showMeaning && titleVi && titleVi !== title ? (
      <p className="text-sm font-semibold leading-6 text-text-muted">{titleVi}</p>
     ) : null}
     {instructionText && (
      <p className="text-sm font-semibold leading-6 text-text-secondary">{instructionText}</p>
     )}
    </div>
   </div>

   <ExerciseBody
    lessonId={lessonId}
    itemPath={path}
    item={item}
    displayMode={displayMode}
    readingItems={readingItems}
   />

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
   label={title}
   editLabel="Sửa nội dung"
  >
   {content}
  </EditableNodeWrapper>
 );
}
