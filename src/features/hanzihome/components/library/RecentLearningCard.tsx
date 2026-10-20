"use client";

import { useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, BookOpenCheck, Ellipsis } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { HanziInlineText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { usePrefetchHanziHomeLesson } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import {
 buildTextbookHref,
 lessonDisplayTitle,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import { lessonBookKey } from "@/features/hanzihome/utils/learning-state";
import { parseHanziHomeModule } from "@/features/hanzihome/workspace-modules";
import { resolveLibraryResumes } from "./recent-learning";
import {
 groupLibraryCourses,
 libraryCourseGroupCharacters,
 libraryTextbookCharacters,
} from "./library-course-groups";
import { Link, useRouter } from "@/i18n/navigation";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { cn } from "@/lib/utils";

export function RecentLearningCard({
 courses,
 books,
 lessons,
 textbooks,
}: {
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
 textbooks: TextbookBookSummary[];
}) {
 const t = useTranslations("Common.library");
 const modules = useTranslations("Home.modules");
 const textbookModules = useTranslations("Home.textbookModules");
 const router = useRouter();
 const prefetchLesson = usePrefetchHanziHomeLesson(router.prefetch);
 const learning = useLearningState();
 const isCoarsePointer = useCoarsePointer();
 const [draggedResume, setDraggedResume] = useState("");
 const settings = learning.state.settings;

 if (learning.isLoading) return <RecentLearningSkeleton />;

 const courseGroups = groupLibraryCourses(courses, books);
 const {
  catalog: recentLearning,
  textbooks: recentTextbooks,
  order: resumeOrder,
 } = resolveLibraryResumes({ courses, books, lessons, textbooks, settings });
 const textbookModuleLabels = [
  { value: "all", label: textbookModules("all") },
  { value: "text", label: modules("lessonText") },
  { value: "core", label: textbookModules("core") },
  { value: "translation", label: textbookModules("translation") },
 ];
 const visibleResumeIds = resumeOrder.filter(
  (id) =>
   recentLearning.some((item) => id === lessonBookKey(item.lesson)) ||
   recentTextbooks.some((item) => id === `static:${item.book.id}`),
 );
 const canReorder = !learning.isLoading && !learning.isError;
 const moveResume = (sourceId: string, targetId: string) => {
  if (!canReorder || sourceId === targetId) return;
  const sourceIndex = resumeOrder.indexOf(sourceId);
  const targetIndex = resumeOrder.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const nextOrder = resumeOrder.filter((id) => id !== sourceId);
  nextOrder.splice(targetIndex, 0, sourceId);
  learning.updateSettings({ libraryResumeOrder: nextOrder });
 };

 if (!recentLearning.length && !recentTextbooks.length) return null;

 return (
  <Card variant="section" padding="lg" className="grid min-w-0 gap-3" asChild>
   <section aria-labelledby="recent-learning-heading">
    <Typography as="h2" variant="sectionTitle" id="recent-learning-heading" weight="black">
     {t("recentTitle")}
    </Typography>
    <Typography as="p" variant="bodySmall" className="sr-only" id="recent-order-hint">
     {t(isCoarsePointer ? "resumeReorderHintTouch" : "resumeReorderHint")}
    </Typography>
    <div className="grid min-w-0 divide-y divide-border-default">
     {visibleResumeIds.map((id, index) => {
      const recent = recentLearning.find((item) => id === lessonBookKey(item.lesson));
      const textbook = recentTextbooks.find((item) => id === `static:${item.book.id}`);
      const title = recent
       ? `${recent.course.title}${recent.book ? ` · ${recent.book.shortTitle || recent.book.title}` : ""}`
       : textbook?.book.label;
      if (!title) return null;
      const group = recent
       ? courseGroups.find((item) => item.courses.some((course) => course.id === recent.course.id))
       : undefined;
      const character = group
       ? libraryCourseGroupCharacters[group.key]
       : textbook
         ? libraryTextbookCharacters[textbook.book.key]
         : "";
      const normalizedModule = parseHanziHomeModule(textbook?.module);
      const moduleLabel = normalizedModule
       ? modules(normalizedModule)
       : textbookModuleLabels.find((item) => item.value === textbook?.module)?.label;
      return (
       <div
        key={id}
        data-library-resume={id}
        className={cn(
         "flex min-w-0 flex-wrap items-center gap-3 py-3",
         draggedResume === id && "opacity-40",
        )}
        onDragOver={(event) => {
         if (draggedResume && canReorder) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
         }
        }}
        onDrop={(event) => {
         event.preventDefault();
         if (draggedResume) moveResume(draggedResume, id);
         setDraggedResume("");
        }}
       >
        <div
         draggable={!isCoarsePointer && canReorder && visibleResumeIds.length > 1}
         className={cn(
          "relative flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-auto",
          !isCoarsePointer && canReorder && "cursor-grab active:cursor-grabbing",
         )}
         onDragStart={(event) => {
          setDraggedResume(id);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", id);
         }}
         onDragEnd={() => setDraggedResume("")}
        >
         <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden select-none"
         >
          <span
           lang="zh-CN"
           className="absolute top-1/2 right-3 -translate-y-1/2 font-hanzi text-[5rem] font-normal leading-none text-text-muted/10"
          >
           {character}
          </span>
         </span>
         <IconTile size="md" className="relative">
          <BookOpenCheck />
         </IconTile>
         <div className="relative grid min-w-0 flex-1 gap-1">
          <Typography variant="caption" tone="muted" wrapping="breakWords">
           {recent ? title : <HanziInlineText text={title} />}
          </Typography>
          <Typography variant="body" weight="bold" wrapping="breakWords">
           {recent ? (
            <HanziInlineText
             text={t("lessonLabel", {
              number: recent.lesson.lessonNumber,
              title: recent.lesson.titleZh || recent.lesson.title,
             })}
            />
           ) : textbook ? (
            <HanziInlineText
             text={
              textbook.lesson.title.startsWith("ÔN TẬP ")
               ? textbook.lesson.title
               : t("lessonLabel", {
                  number: textbook.lesson.number,
                  title: lessonDisplayTitle(textbook.lesson.title),
                 })
             }
            />
           ) : null}
          </Typography>
          <Typography variant="caption" tone="muted">
           {recent ? modules(recent.module) : (moduleLabel ?? textbookModules("all"))}
          </Typography>
         </div>
        </div>
        {recent ? (
         <Button asChild size="sm" className="ml-auto sm:ml-0">
          <Link
           href={recent.href}
           onMouseEnter={() => prefetchLesson(recent.lesson.id, recent.href)}
           onFocus={() => prefetchLesson(recent.lesson.id, recent.href)}
           onTouchStart={() => prefetchLesson(recent.lesson.id, recent.href)}
          >
           {t("resume")}
           <ArrowRight data-icon="inline-end" />
          </Link>
         </Button>
        ) : textbook ? (
         <Button asChild size="sm" className="ml-auto sm:ml-0">
          <Link
           href={`${buildTextbookHref(textbook.book.key, textbook.lesson.number)}&tab=${encodeURIComponent(textbook.module)}`}
          >
           {t("resume")}
           <ArrowRight data-icon="inline-end" />
          </Link>
         </Button>
        ) : null}
        <DropdownMenu>
         <DropdownMenuTrigger asChild>
          <Button
           type="button"
           variant="ghost"
           size={isCoarsePointer ? "icon" : "icon-toolbar"}
           disabled={!canReorder || visibleResumeIds.length < 2}
           aria-label={t("reorderResume", { title })}
           aria-describedby="recent-order-hint"
           title={t("reorderResume", { title })}
          >
           <Ellipsis />
          </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
          <DropdownMenuItem
           disabled={index === 0}
           onSelect={() => {
            const previousId = visibleResumeIds[index - 1];
            if (previousId) moveResume(id, previousId);
           }}
          >
           <ArrowUp />
           {t("moveEarlier")}
          </DropdownMenuItem>
          <DropdownMenuItem
           disabled={index === visibleResumeIds.length - 1}
           onSelect={() => {
            const nextId = visibleResumeIds[index + 1];
            if (nextId) moveResume(id, nextId);
           }}
          >
           <ArrowDown />
           {t("moveLater")}
          </DropdownMenuItem>
         </DropdownMenuContent>
        </DropdownMenu>
       </div>
      );
     })}
    </div>
   </section>
  </Card>
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
