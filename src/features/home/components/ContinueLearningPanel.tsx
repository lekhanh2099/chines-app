import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import type { HomeLessonTarget } from "@/features/home/types";

const moduleLabels = {
 overview: "Tổng quan",
 lessonText: "Bài khóa",
 notes: "Ghi chú",
 vocab: "Từ vựng",
 grammar: "Ngữ pháp",
 radicals: "Bộ thủ",
 review: "Ôn tập",
} as const;

export function ContinueLearningPanel({ lesson }: { lesson: HomeLessonTarget | null }) {
 return (
  <section className="nova-gradient-hero relative overflow-hidden rounded-2xl border border-white/45 px-5 py-6   shadow-theme-lg sm:px-7 sm:py-8">
   <div className="relative z-10 max-w-3xl">
    <h1 className="max-w-2xl text-2xl font-black leading-tight sm:text-3xl text-text-primary">
     Học tiếp từ nơi bạn dừng lại
    </h1>
    <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-text-muted ">
     Bài học, sổ tay và ghi chú gần nhất được gom về đây. Thư viện HanziHome vẫn là nơi chọn course
     và bài mới.
    </p>

    {lesson ? (
     <Link
      href={lesson.href}
      prefetch={false}
      className="mt-6 flex max-w-2xl items-center gap-4 rounded-2xl border   p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl transition  sm:p-5"
     >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ">
       <BookOpenCheck className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
       <span className="block text-xs font-black uppercase tracking-[0.14em] text-text-muted ">
        {lesson.isRecent ? "Bài vừa học" : "Bắt đầu HanziHome"}
       </span>
       <span className="mt-1 block truncate text-lg font-black">
        Bài {lesson.lessonNumber}: {lesson.titleZh || lesson.title}
       </span>
       <span className="mt-0.5 block truncate text-sm font-semibold text-text-muted ">
        {lesson.courseTitle} · {moduleLabels[lesson.module]}
       </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0" />
     </Link>
    ) : (
     <p className="mt-6 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-bold">
      Chưa có bài học khả dụng.
     </p>
    )}
   </div>
  </section>
 );
}
