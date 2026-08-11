import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

import { ActionCard } from "@/components/ui/action-card";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import { HomeArrowIcon } from "@/features/home/components/HomePrimitives";
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
   {lesson ? (
    <ActionCard padding="lg" asChild className="block w-full">
     <Link href={lesson.href} prefetch={false}>
      <span className="flex min-w-0 items-start justify-between gap-3">
       <span className="min-w-0">
        <Typography
         id="continue-learning-title"
         as="h2"
         variant="sectionTitle"
         tone="default"
         weight="black"
         tracking="tight"
         className="block"
        >
         Học tiếp
        </Typography>
        <Typography
         as="span"
         variant="bodySmall"
         tone="muted"
         weight="semibold"
         leading="compact"
         className="mt-1 block"
        >
         Quay lại đúng bài và nội dung bạn đang theo dõi.
        </Typography>
       </span>
       <HomeArrowIcon className="mt-1" />
      </span>

      <span className="mt-4 flex min-w-0 items-center gap-3 sm:gap-4">
       <IconTile size="md">
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
      </span>
     </Link>
    </ActionCard>
   ) : (
    <Card variant="section" padding="lg">
     <Typography
      id="continue-learning-title"
      as="h2"
      variant="sectionTitle"
      tone="default"
      weight="black"
     >
      Học tiếp
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" className="mt-1">
      Chưa có bài học khả dụng.
     </Typography>
    </Card>
   )}
  </section>
 );
}
