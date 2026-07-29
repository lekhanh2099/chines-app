import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { HomeIconTile } from "@/features/home/components/HomePrimitives";
import { GlobalMemoryTipCard } from "@/features/hanzihome/memory-tips/GlobalMemoryTipCard";
import type { HomeDashboardModel } from "@/features/home/types";

const moduleLabels = {
 overview: "Tổng quan",
 lessonText: "Bài khóa",
 practice: "Bài tập",
 listening: "Luyện nghe",
 dictation: "Nghe chép",
 script: "Script",
 notes: "Ghi chú",
 vocab: "Từ vựng",
 grammar: "Ngữ pháp",
 radicals: "Bộ thủ",
 review: "Ôn tập",
};

export function ContinueLearningPanel({ lesson }: { lesson: HomeDashboardModel["lesson"] }) {
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
        <Typography
         variant="overline"
         tone="muted"
         weight="black"
         tracking="overline"
         transform="uppercase"
         className="block"
        >
         {lesson.isRecent ? "Bài vừa học" : "Bắt đầu HanziHome"}
        </Typography>
        <Typography
         variant="sectionTitle"
         tone="default"
         weight="black"
         clamp="one"
         className="mt-1 block"
        >
         Bài {lesson.lessonNumber}: {lesson.titleZh || lesson.title}
        </Typography>
        <Typography
         variant="bodySmall"
         tone="muted"
         weight="semibold"
         clamp="one"
         className="mt-0.5 block"
        >
         {lesson.courseTitle} · {moduleLabels[lesson.module]}
        </Typography>
       </span>

       <ArrowRight className="h-5 w-5 shrink-0 text-text-primary" />
      </Link>
     ) : (
      <Typography
       as="p"
       variant="label"
       tone="default"
       weight="bold"
       className="mt-6 rounded-xl border border-border-default bg-bg-primary px-4 py-3"
      >
       Chưa có bài học khả dụng.
      </Typography>
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
