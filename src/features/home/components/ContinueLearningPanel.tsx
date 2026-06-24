import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { HomeIconTile } from "@/features/home/components/HomePrimitives";
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
  <section className="nova-gradient-hero relative overflow-hidden rounded-2xl border border-white/55 p-5 shadow-theme-lg sm:p-7">
   <div className="relative z-10 max-w-3xl">
    <h1 className="max-w-2xl text-2xl font-black leading-tight tracking-tight text-text-primary sm:text-3xl">
     Học tiếp từ nơi bạn dừng lại
    </h1>

    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-text-muted">
     Bài học, sổ tay và ghi chú gần nhất được gom về đây. Thư viện HanziHome vẫn là nơi chọn course
     và bài mới.
    </p>

    {lesson ? (
     <Link
      href={lesson.href}
      prefetch={false}
      className="mt-6 flex max-w-2xl items-center gap-4 rounded-2xl border border-white/60 bg-white/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white/45 sm:p-5"
     >
      <HomeIconTile className="bg-white/55 text-text-primary">
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
     <p className="mt-6 rounded-xl border border-white/40 bg-white/20 px-4 py-3 text-sm font-bold text-text-primary backdrop-blur-xl">
      Chưa có bài học khả dụng.
     </p>
    )}
   </div>
  </section>
 );
}
