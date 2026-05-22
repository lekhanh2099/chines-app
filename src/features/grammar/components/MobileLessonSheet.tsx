"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrammarLessonWithStats } from "@/types/database";

export function MobileLessonSheet({
 open,
 lessons,
 activeLessonId,
 onClose,
 onSelect,
}: {
 open: boolean;
 lessons: GrammarLessonWithStats[];
 activeLessonId?: string;
 onClose: () => void;
 onSelect: (lesson: GrammarLessonWithStats) => void;
}) {
 if (!open) return null;
 return (
  <div className="fixed inset-0 z-50 overflow-x-hidden lg:hidden">
   <div className="absolute inset-0 bg-stone-900/30" onClick={onClose} />
   <div className="absolute inset-x-0 bottom-0 max-h-[80vh] w-full overflow-y-auto overflow-x-hidden rounded-t-[28px] bg-white p-4 shadow-2xl">
    <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
     <p className="min-w-0 text-lg font-black text-stone-900">Chọn bài</p>
     <button type="button" onClick={onClose}>
      <X className="h-5 w-5" />
     </button>
    </div>
    <div className="grid gap-3">
     {lessons.map((lesson) => (
      <button
       key={lesson.id}
       type="button"
       onClick={() => onSelect(lesson)}
       className={cn(
        "min-w-0 rounded-2xl border-2 p-4 text-left font-black",
        lesson.id === activeLessonId
         ? "border-red-500 bg-red-50 text-red-600"
         : "border-stone-200 bg-white text-stone-700",
       )}
      >
       <span className="break-words">{lesson.title}</span>
       <span className="ml-2 inline-block text-sm text-stone-500">
        {lesson.points.length} điểm
       </span>
      </button>
     ))}
    </div>
   </div>
  </div>
 );
}
