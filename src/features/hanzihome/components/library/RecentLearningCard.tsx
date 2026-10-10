"use client";

import { ArrowRight, BookOpenCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { usePrefetchHanziHomeLesson } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import { resolveRecentLearning } from "./recent-learning";
import { Link, useRouter } from "@/i18n/navigation";

export function RecentLearningCard({
 courses,
 books,
 lessons,
}: {
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
}) {
 const t = useTranslations("Common.library");
 const modules = useTranslations("Home.modules");
 const router = useRouter();
 const prefetchLesson = usePrefetchHanziHomeLesson(router.prefetch);
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

 const prefetchRecentLesson = () => {
  if (!lesson.id) return;
  prefetchLesson(lesson.id, href);
 };

 return (
  <section aria-labelledby="recent-learning-heading">
   <Card variant="section" padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <IconTile size="lg" tone="inverse">
     <BookOpenCheck />
    </IconTile>

    <div className="grid min-w-0 flex-1 gap-1">
     <div className="flex flex-wrap items-center gap-2">
      <Typography as="h2" variant="sectionTitle" id="recent-learning-heading" weight="black">
       {t("recentTitle")}
      </Typography>
      <Badge variant="purple">{modules(lastModule)}</Badge>
     </div>
     <Typography variant="sectionTitle" weight="black" clamp="one">
      {t("lessonLabel", { number: lesson.lessonNumber, title: lesson.titleZh || lesson.title })}
     </Typography>
     <Typography variant="bodySmall" tone="muted" clamp="one">
      {course.title}
      {book ? ` · ${book.shortTitle || book.title}` : ""}
     </Typography>
    </div>

    <Button asChild variant="outline" size="toolbar" className="w-full sm:w-auto">
     <Link
      href={href}
      onMouseEnter={prefetchRecentLesson}
      onFocus={prefetchRecentLesson}
      onTouchStart={prefetchRecentLesson}
     >
      {t("resume")}
      <ArrowRight data-icon="inline-end" />
     </Link>
    </Button>
   </Card>
  </section>
 );
}

function RecentLearningSkeleton() {
 const t = useTranslations("Common.library");
 return (
  <Card
   variant="section"
   padding="md"
   className="flex animate-pulse items-center gap-3"
   aria-label={t("loadingRecent")}
  >
   <span className="size-11 shrink-0 rounded-lg bg-bg-subtle" />
   <span className="grid flex-1 gap-2">
    <span className="h-4 w-20 rounded-md bg-bg-subtle" />
    <span className="h-5 w-full max-w-64 rounded-md bg-bg-subtle" />
   </span>
   <span className="hidden h-9 w-24 rounded-lg bg-bg-subtle sm:block" />
  </Card>
 );
}
