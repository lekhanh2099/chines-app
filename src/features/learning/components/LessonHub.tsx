"use client";

import Link from "next/link";
import { BookOpen, Brain, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearningSource } from "@/features/learning/lesson-workspace";

export type LessonHubItem = {
 id: string;
 title: string;
 subtitle?: string;
 href: string;
 lessonNumber?: number | null;
 vocabularyCount?: number;
 grammarCount?: number;
 learnedCount?: number;
 weakCount?: number;
 progress?: number;
};

export function LessonHub({
 title,
 description,
 source,
 onSourceChange,
 lessons,
 className,
}: {
 title: string;
 description: string;
 source: LearningSource;
 onSourceChange: (source: LearningSource) => void;
 lessons: LessonHubItem[];
 className?: string;
}) {
 return (
  <section
   className={cn(
    "flex w-full max-w-full min-w-0 flex-col gap-5 overflow-x-hidden scrollbar-soft  rounded-2xl -[28px] border-2 border-stone-200 bg-white p-4 shadow sm:p-6",
    className,
   )}
  >
   <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="flex min-w-0 flex-col gap-2">
     <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">
      Nguồn học
     </p>
     <h1 className="break-words text-3xl font-black leading-tight text-stone-950 sm:text-4xl">
      {title}
     </h1>
     <p className="max-w-3xl break-words text-sm font-bold leading-6 text-stone-500 sm:text-base">
      {description}
     </p>
    </div>
    <div className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-2xlbg-stone-100 p-1 sm:w-[260px]">
     {[
      { key: "hanyu" as const, label: "Hán ngữ" },
      { key: "hsk" as const, label: "HSK" },
     ].map((item) => (
      <button
       key={item.key}
       type="button"
       onClick={() => onSourceChange(item.key)}
       className={cn(
        "h-11 min-w-0 truncate rounded-2xl -xl px-3 text-sm font-black transition",
        source === item.key
         ? "    shadow-theme-sm"
         : "text-stone-600 hover:bg-white",
       )}
      >
       {item.label}
      </button>
     ))}
    </div>
   </div>

   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {lessons.map((lesson) => (
     <Link
      key={lesson.id}
      href={lesson.href}
      className="group flex min-h-44 min-w-0 flex-col justify-between overflow-hidden rounded-2xl -[22px] border-2 border-stone-200 bg-stone-50 p-4 transition hover:border-red-200 hover:bg-white hover:shadow-theme-sm"
     >
      <div className="flex items-start justify-between gap-3">
       <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
         {lesson.lessonNumber ? `Bài ${lesson.lessonNumber}` : "Bài học"}
        </p>
        <h2 className="mt-2 line-clamp-2 break-words text-xl font-black leading-tight text-stone-950">
         {lesson.title}
        </h2>
        {lesson.subtitle ? (
         <p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-stone-500">
          {lesson.subtitle}
         </p>
        ) : null}
       </div>
       <span className="shrink-0 rounded-2xl -full bg-white px-3 py-1 text-xs font-black text-stone-600 shadow-theme-sm">
        {lesson.progress ?? 0}%
       </span>
      </div>
      <div className="mt-5 grid min-w-0 grid-cols-3 gap-2 text-xs font-black">
       <Metric icon={BookOpen} label="Từ" value={lesson.vocabularyCount || 0} />
       <Metric
        icon={Layers3}
        label="Ngữ pháp"
        value={lesson.grammarCount || 0}
       />
       <Metric icon={Brain} label="Yếu" value={lesson.weakCount || 0} />
      </div>
     </Link>
    ))}
   </div>
  </section>
 );
}

function Metric({
 icon: Icon,
 label,
 value,
}: {
 icon: typeof BookOpen;
 label: string;
 value: number;
}) {
 return (
  <div className="min-w-0 overflow-hidden rounded-2xlbg-white p-3 shadow-theme-sm">
   <Icon className="h-4 w-4 text-stone-500" />
   <p className="mt-2 text-[11px] uppercase tracking-wide text-stone-400">
    {label}
   </p>
   <p className="break-words text-lg text-stone-900">{value}</p>
  </div>
 );
}
