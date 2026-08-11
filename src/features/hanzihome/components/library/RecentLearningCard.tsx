"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
 HanziHomeModule,
} from "@/features/hanzihome/types";
import { resolveRecentLearning } from "./recent-learning";

const moduleLabels: Record<HanziHomeModule, string> = {
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

export function RecentLearningCard({
 courses,
 books,
 lessons,
}: {
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
}) {
 const learning = useLearningState();
 const lastCourseId = learning.state.settings.lastCourseId ?? "";
 const lastLessonId = learning.state.settings.lastLessonId;
 const lastModule = learning.state.settings.lastModule ?? "overview";

 if (learning.isLoading) return <RecentLearningSkeleton />;

 const recentLearning = resolveRecentLearning({
  courses,
  books,
  lessons,
  courseId: lastCourseId,
  lessonId: lastLessonId,
  module: lastModule,
 });

 if (!recentLearning) return null;

 const { lesson, course, book, href } = recentLearning;

 return (
  <section aria-labelledby="recent-learning-heading">
   <Card variant="section" padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <IconTile size="lg" tone="inverse">
     <BookOpenCheck />
    </IconTile>

    <div className="grid min-w-0 flex-1 gap-1">
     <div className="flex flex-wrap items-center gap-2">
      <Typography as="h2" variant="sectionTitle" id="recent-learning-heading" weight="black">
       Vừa học
      </Typography>
      <Badge variant="purple">{moduleLabels[lastModule]}</Badge>
     </div>
     <Typography variant="sectionTitle" weight="black" clamp="one">
      Bài {lesson.lessonNumber}: {lesson.titleZh || lesson.title}
     </Typography>
     <Typography variant="bodySmall" tone="muted" clamp="one">
      {course.title}
      {book ? ` · ${book.shortTitle || book.title}` : ""}
     </Typography>
    </div>

    <Button asChild variant="outline" size="toolbar" className="w-full sm:w-auto">
     <Link href={href} prefetch={false}>
      Học tiếp
      <ArrowRight data-icon="inline-end" />
     </Link>
    </Button>
   </Card>
  </section>
 );
}

function RecentLearningSkeleton() {
 return (
  <Card
   variant="section"
   padding="md"
   className="flex animate-pulse items-center gap-3"
   aria-label="Đang tải bài vừa học"
  >
   <span className="size-11 shrink-0 rounded-lg bg-bg-subtle" />
   <span className="grid flex-1 gap-2">
    <span className="h-4 w-20 rounded-md bg-bg-subtle" />
    <span className="h-5 w-64 max-w-full rounded-md bg-bg-subtle" />
   </span>
   <span className="hidden h-9 w-24 rounded-lg bg-bg-subtle sm:block" />
  </Card>
 );
}
