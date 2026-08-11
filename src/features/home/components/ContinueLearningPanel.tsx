import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { HomeArrowIcon, HomeSectionHeader } from "@/features/home/components/HomePrimitives";
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
  <section aria-labelledby="continue-learning-title">
   <HomeSectionHeader
    id="continue-learning-title"
    title="Học tiếp"
    description="Quay lại đúng bài và nội dung bạn đang theo dõi."
    className="mb-3"
   />
   <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
    <div className="min-w-0">
     {lesson ? (
      <Button
       variant="surfaceCard"
       size="card"
       align="start"
       asChild
       className="w-full xl:max-w-2xl"
      >
       <Link href={lesson.href} prefetch={false}>
        <IconTile size="lg">
         <BookOpenCheck />
        </IconTile>

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

        <HomeArrowIcon />
       </Link>
      </Button>
     ) : (
      <Card variant="section" padding="lg" className="flex items-center xl:max-w-2xl">
       <Typography as="p" variant="label" tone="default" weight="bold">
        Chưa có bài học khả dụng.
       </Typography>
      </Card>
     )}
    </div>

    <GlobalMemoryTipCard contentOnly showEmptyState className="w-full" />
   </div>
  </section>
 );
}
