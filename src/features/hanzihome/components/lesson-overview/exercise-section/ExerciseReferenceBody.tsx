import { PenLine } from "lucide-react";

import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";
import { QuestionExerciseBody } from "./QuestionExerciseBody";

export function ExerciseReferenceBody({
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
 const reference = stringValue(record, "character_writing_ref");

 if (arrayValue(record, "questions").length > 0) {
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
  <div className="exercise-answer-surface flex items-start gap-3 rounded-xl border p-4">
   <span className="study-chip-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
    <PenLine className="h-4 w-4" />
   </span>
   <div className="grid gap-1">
    <p className="font-black text-text-primary">Luyện trong mục Viết chữ Hán</p>
    <p className="text-sm font-semibold leading-5 text-text-secondary">
     Bài này dùng ô luyện nét và chữ ở đề mục Viết chữ Hán của cùng bài học.
    </p>
    {reference ? (
     <p className="text-xs font-bold text-text-muted">Tham chiếu: {reference}</p>
    ) : null}
   </div>
  </div>
 );
}
