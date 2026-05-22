"use client";

import { PenLine, Plus, Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
 ActionButton,
 StatusPill,
} from "@/features/grammar/components/ui";
import { getPointSubtitle } from "@/features/grammar/utils/point";
import { cn } from "@/lib/utils";
import type {
 GrammarLessonWithStats,
 GrammarPointWithProgress,
} from "@/types/database";

export type GrammarPointFilter =
 | "all"
 | "new"
 | "learning"
 | "mastered"
 | "missing";

export function AllGrammarWorkspace({
 points,
 searchQuery,
 filter,
 onSearchChange,
 onFilterChange,
 onEdit,
 onAddPoint,
}: {
 points: GrammarPointWithProgress[];
 lessons: GrammarLessonWithStats[];
 searchQuery: string;
 filter: GrammarPointFilter;
 onSearchChange: (value: string) => void;
 onFilterChange: (value: GrammarPointFilter) => void;
 onEdit: (point: GrammarPointWithProgress) => void;
 onAddPoint: () => void;
}) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
   <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">
      Kho ngữ pháp
     </p>
     <h2 className="text-3xl font-black text-stone-900">Tất cả ngữ pháp</h2>
    </div>
    <ActionButton onClick={onAddPoint} icon={Plus}>
     Thêm ngữ pháp
    </ActionButton>
   </div>
   <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
    <div className="relative">
     <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
     <Input
      value={searchQuery}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder="Tìm theo tên, pinyin, tag..."
      className="h-12 rounded-2xl border-2 border-stone-200 pl-12 text-base font-bold"
     />
    </div>
    <div className="flex flex-wrap gap-2">
     {[
      ["all", "Tất cả"],
      ["new", "Chưa học"],
      ["learning", "Đang ôn"],
      ["mastered", "Thành thạo"],
      ["missing", "Thiếu dữ liệu"],
     ].map(([key, label]) => (
      <button
       key={key}
       type="button"
       onClick={() => onFilterChange(key as GrammarPointFilter)}
       className={cn(
        "h-10 rounded-2xl border-2 px-3 text-sm font-black shadow-theme-sm",
        filter === key
         ? "border-red-500 bg-red-500 text-white"
         : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
       )}
      >
       {label}
      </button>
     ))}
    </div>
   </div>
   <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {points.map((point) => (
     <PointCard key={point.id} point={point} onEdit={() => onEdit(point)} />
    ))}
   </div>
  </section>
 );
}

function PointCard({
 point,
 onEdit,
}: {
 point: GrammarPointWithProgress;
 onEdit: () => void;
}) {
 return (
  <article className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
     <h3 className="truncate text-3xl font-black text-stone-900">
      {point.title}
     </h3>
     <p className="mt-1 truncate text-sm font-black text-red-500">
      {point.pinyin || point.level || "Ngữ pháp"}
     </p>
    </div>
    <StatusPill status={point.status} />
   </div>
   <p className="mt-3 line-clamp-2 min-h-11 text-sm font-bold leading-6 text-stone-600">
    {getPointSubtitle(point)}
   </p>
   <div className="mt-4 flex items-center justify-between border-t-2 border-stone-100 pt-3">
    <span className="truncate text-xs font-black uppercase tracking-wide text-stone-400">
     {point.category || "Ngữ pháp"} · {point.exercises.length} bài tập
    </span>
    <button
     type="button"
     onClick={onEdit}
     className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-black text-stone-600 hover:bg-stone-100"
    >
     <PenLine className="h-4 w-4" />
     Sửa
    </button>
   </div>
  </article>
 );
}

export function LessonEditWorkspace({
 lessons,
 onEditLesson,
 onEditPoint,
 onAddLesson,
 onAddPoint,
 onImportLesson,
}: {
 lessons: GrammarLessonWithStats[];
 onEditLesson: (lesson: GrammarLessonWithStats) => void;
 onEditPoint: (point: GrammarPointWithProgress) => void;
 onAddLesson: () => void;
 onAddPoint: (lesson: GrammarLessonWithStats) => void;
 onImportLesson: (lesson: GrammarLessonWithStats) => void;
}) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
   <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">
      Quản lý
     </p>
     <h2 className="text-3xl font-black text-stone-900">
      Chỉnh sửa bài ngữ pháp
     </h2>
    </div>
    <ActionButton onClick={onAddLesson} icon={Plus}>
     Thêm bài
    </ActionButton>
   </div>
   <div className="mt-5 grid gap-4">
    {lessons.map((lesson) => (
     <article
      key={lesson.id}
      className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm"
     >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
       <div>
        <h3 className="text-2xl font-black text-stone-900">{lesson.title}</h3>
        <p className="mt-1 text-sm font-bold text-stone-500">
         {lesson.lesson_key} · {lesson.points.length} điểm · order{" "}
         {lesson.lesson_order}
        </p>
       </div>
       <div className="flex flex-wrap gap-2">
        <ActionButton
         onClick={() => onAddPoint(lesson)}
         tone="neutral"
         icon={Plus}
        >
         Thêm điểm
        </ActionButton>
        <ActionButton
         onClick={() => onImportLesson(lesson)}
         tone="neutral"
         icon={Upload}
        >
         Import paste
        </ActionButton>
        <ActionButton
         onClick={() => onEditLesson(lesson)}
         tone="neutral"
         icon={PenLine}
        >
         Sửa bài
        </ActionButton>
       </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
       {lesson.points.slice(0, 12).map((point) => (
        <button
         key={point.id}
         type="button"
         onClick={() => onEditPoint(point)}
         className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-3 text-left hover:bg-white"
        >
         <span className="block text-lg font-black text-stone-900">
          {point.title}
         </span>
         <span className="block truncate text-xs font-bold text-stone-500">
          {getPointSubtitle(point)}
         </span>
        </button>
       ))}
      </div>
     </article>
    ))}
   </div>
  </section>
 );
}
