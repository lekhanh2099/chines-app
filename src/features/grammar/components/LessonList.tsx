"use client";

import { PenLine, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrammarLessonWithStats } from "@/types/database";

export function LessonList({
 lessons,
 activeLessonId,
 onSelect,
 onEdit,
 onImport,
}: {
 lessons: GrammarLessonWithStats[];
 activeLessonId?: string;
 onSelect: (lesson: GrammarLessonWithStats) => void;
 onEdit: (lesson: GrammarLessonWithStats) => void;
 onImport: (lesson: GrammarLessonWithStats) => void;
}) {
 return (
  <aside className="hidden rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto">
   <div className="mb-4 flex items-center justify-between">
    <p className="text-lg font-black uppercase tracking-wide text-stone-900">
     Danh sách bài
    </p>
    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
     {lessons.length}
    </span>
   </div>
   <div className="flex flex-col gap-3">
    {lessons.map((lesson) => (
     <button
      key={lesson.id}
      type="button"
      onClick={() => onSelect(lesson)}
      className={cn(
       "group flex min-h-24 w-full items-center gap-3 rounded-[24px] border-2 p-4 text-left shadow-theme-sm transition",
       lesson.id === activeLessonId
        ? "border-red-700 bg-red-500 text-white"
        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
      )}
     >
      <span
       className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black",
        lesson.id === activeLessonId
         ? "border-white/60 bg-white/20"
         : "border-stone-200 bg-white",
       )}
      >
       {lesson.progress}%
      </span>
      <span className="min-w-0 flex-1">
       <span className="flex items-center justify-between gap-2">
        <span className="truncate text-xl font-black">{lesson.title}</span>
        <span className="flex opacity-0 transition group-hover:opacity-100">
         <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
           event.stopPropagation();
           onImport(lesson);
          }}
          className="rounded-xl p-2 hover:bg-white/20"
         >
          <Upload className="h-4 w-4" />
         </span>
         <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
           event.stopPropagation();
           onEdit(lesson);
          }}
          className="rounded-xl p-2 hover:bg-white/20"
         >
          <PenLine className="h-4 w-4" />
         </span>
        </span>
       </span>
       <span
        className={cn(
         "mt-1 block text-sm font-bold",
         lesson.id === activeLessonId ? "text-white/90" : "text-stone-500",
        )}
       >
        {lesson.mastered}/{lesson.points.length} điểm
       </span>
       <span className="mt-2 flex flex-wrap gap-1">
        {lesson.categories.slice(0, 3).map((category) => (
         <span
          key={category.name}
          className={cn(
           "rounded-full px-2 py-0.5 text-[10px] font-black",
           lesson.id === activeLessonId
            ? "bg-white/20 text-white"
            : "bg-stone-100 text-stone-500",
          )}
         >
          {category.name} · {category.count}
         </span>
        ))}
       </span>
      </span>
     </button>
    ))}
   </div>
  </aside>
 );
}
