import { PenLine } from "lucide-react";

import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import { asRecord, stringValue } from "../utils";

export function ExerciseReferenceBody({ item }: { item: Exercise }) {
 const reference = stringValue(asRecord(item), "character_writing_ref");

 return (
  <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-accent-subtle/70 p-4">
   <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-accent-text">
    <PenLine className="h-4 w-4" />
   </span>
   <div>
    <p className="font-black text-text-primary">Luyện trong mục Viết chữ Hán</p>
    <p className="mt-1 text-sm font-semibold leading-5 text-text-secondary">
     Bài này dùng ô luyện nét và chữ ở đề mục Viết chữ Hán của cùng bài học.
    </p>
    {reference ? (
     <p className="mt-2 text-xs font-bold text-text-muted">Tham chiếu: {reference}</p>
    ) : null}
   </div>
  </div>
 );
}
