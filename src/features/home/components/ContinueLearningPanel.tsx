import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { HomeIconTile } from "@/features/home/components/HomePrimitives";
import { GlobalMemoryTipCard } from "@/features/hanzihome/memory-tips/GlobalMemoryTipCard";
import type { HomeLessonTarget } from "@/features/home/types";

const moduleLabels = {
 overview: "Tổng quan",
 lessonText: "Bài khóa",
 listening: "Luyện nghe",
 dictation: "Nghe chép",
 script: "Script",
 notes: "Ghi chú",
 vocab: "Từ vựng",
 grammar: "Ngữ pháp",
 radicals: "Bộ thủ",
 review: "Ôn tập",
} as const;

export function ContinueLearningPanel({ lesson }: { lesson: HomeLessonTarget | null }) {
 return (
  <section className="app-gradient-hero relative overflow-hidden rounded-2xl border p-5 shadow-theme-lg sm:p-7">
   <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] xl:items-stretch">
    <div className="min-w-0">
     {lesson ? (
      <Link
       href={lesson.href}
       prefetch={false}
       className="app-glass-surface flex max-w-2xl items-center gap-4 rounded-2xl border p-4 shadow-theme-sm transition hover:-translate-y-0.5 hover:border-primary/25 sm:p-5"
      >
       <HomeIconTile>
        <BookOpenCheck className="h-5 w-5" />
       </HomeIconTile>

       <span className="min-w-0 flex-1">
        <span className="block text-xs font-black uppercase tracking-[0.14em] text-text-muted">
         {lesson.isRecent ? "Bài vừa học" : "Bắt đầu HanziHome"}
        </span>
        <span className="mt-1 block truncate text-lg font-black text-text-primary">
         Bài {lesson.lessonNumber}: {lesson.titleZh || lesson.title}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-text-muted">
         {lesson.courseTitle} · {moduleLabels[lesson.module]}
        </span>
       </span>

       <ArrowRight className="h-5 w-5 shrink-0 text-text-primary" />
      </Link>
     ) : (
      <p className="mt-6 rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-sm font-bold text-text-primary">
       Chưa có bài học khả dụng.
      </p>
     )}
    </div>

    <GlobalMemoryTipCard
     contentOnly
     showEmptyState
     className="app-glass-surface w-full self-center shadow-theme-sm xl:ml-auto xl:max-w-2xl"
    />
   </div>
  </section>
 );
}
