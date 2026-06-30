import { PenLine } from "lucide-react";

import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import { asRecord, stringValue } from "../utils";

export function ExerciseReferenceBody({ item }: { item: Exercise }) {
 const reference = stringValue(asRecord(item), "character_writing_ref");

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
