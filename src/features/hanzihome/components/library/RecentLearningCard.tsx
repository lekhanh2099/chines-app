"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHanziHomeCourseLessons } from "@/features/hanzihome/hooks/useHanziHomeCourseLessons";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeModule,
} from "@/features/hanzihome/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";

const moduleLabels: Record<HanziHomeModule, string> = {
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
};

export function RecentLearningCard({
 courses,
 books,
}: {
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
}) {
 const learning = useLearningState();
 const lastCourseId = learning.state.settings.lastCourseId ?? "";
 const lastLessonId = learning.state.settings.lastLessonId;
 const lastModule = learning.state.settings.lastModule ?? "overview";
 const courseLessons = useHanziHomeCourseLessons(lastCourseId, {
  enabled: !learning.isLoading && Boolean(lastCourseId && lastLessonId),
 });

 if (learning.isLoading || courseLessons.isLoading) {
  return <RecentLearningSkeleton />;
 }

 const lesson = courseLessons.lessons.find((item) => item.id === lastLessonId);
 const course = courses.find((item) => item.id === lastCourseId);

 if (!lesson || !course) return null;

 const book = books.find((item) => item.id === lesson.bookId);
 const href = buildHanziHomeLessonHref({
  courseId: course.id,
  bookId: lesson.bookId,
  lessonNumber: lesson.lessonNumber,
  module: lastModule,
 });

 return (
  <section aria-labelledby="recent-learning-heading">
   <Card
    variant="glass"
    padding="md"
    className="flex flex-col gap-3 rounded-xl sm:flex-row sm:items-center"
   >
    <span className="app-brand-gradient flex size-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-theme-sm">
     <BookOpenCheck className="size-5" />
    </span>

    <div className="min-w-0 flex-1">
     <div className="flex flex-wrap items-center gap-2">
      <h2 id="recent-learning-heading" className="text-base font-black text-text-primary">
       Vừa học
      </h2>
      <Badge variant="purple">{moduleLabels[lastModule]}</Badge>
     </div>
     <p className="mt-1 truncate text-lg font-black text-text-primary">
      Bài {lesson.lessonNumber}: {lesson.titleZh || lesson.title}
     </p>
     <p className="mt-0.5 truncate text-sm font-medium text-text-muted">
      {course.title}
      {book ? ` · ${book.shortTitle || book.title}` : ""}
     </p>
    </div>

    <Button asChild className="w-full sm:w-auto">
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
   variant="glass"
   padding="md"
   className="flex animate-pulse items-center gap-3 rounded-xl"
   aria-label="Đang tải bài vừa học"
  >
   <span className="size-11 shrink-0 rounded-xl bg-bg-subtle" />
   <span className="grid flex-1 gap-2">
    <span className="h-4 w-20 rounded-md bg-bg-subtle" />
    <span className="h-5 w-64 max-w-full rounded-md bg-bg-subtle" />
   </span>
   <span className="hidden h-10 w-24 rounded-xl bg-bg-subtle sm:block" />
  </Card>
 );
}
