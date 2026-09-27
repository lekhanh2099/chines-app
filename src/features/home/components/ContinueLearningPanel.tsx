import { BookOpenCheck, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { ActionCard } from "@/components/ui/action-card";
import { Card } from "@/components/ui/card";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import { HomeArrowIcon } from "@/features/home/components/HomePrimitives";
import type { HomeDashboardModel } from "@/features/home/types";
import { parseHanziHomeModule } from "@/features/hanzihome/workspace-modules";
import { Link } from "@/i18n/navigation";

export function ContinueLearningPanel({
 courses,
 unavailable,
}: {
 courses: HomeDashboardModel["courses"];
 unavailable: boolean;
}) {
 const t = useTranslations("Home");
 const textbookModules = [
  { id: "all", label: t("textbookModules.all") },
  { id: "text", label: t("modules.lessonText") },
  { id: "core", label: t("textbookModules.core") },
  { id: "translation", label: t("textbookModules.translation") },
 ];
 return (
  <section aria-labelledby="continue-learning-title" className="grid min-w-0 gap-3">
   <div className="grid gap-1">
    <Typography id="continue-learning-title" as="h2" variant="sectionTitle" weight="black">
     {t("continueLearning.title")}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("continueLearning.description")}
    </Typography>
   </div>
   {unavailable ? (
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("continueLearning.catalogUnavailable")}
    </Typography>
   ) : null}
   {!courses.length && !unavailable ? (
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("continueLearning.unavailable")}
    </Typography>
   ) : null}
   {courses.map((course) => (
    <Card key={course.id} variant="section" padding="md" className="min-w-0">
     <details className="peer group grid min-w-0 gap-3">
      <summary
       className={`flex cursor-pointer list-none items-center gap-3 rounded-lg marker:hidden ${focusRingClassName}`}
      >
       <IconTile size="md">
        <BookOpenCheck />
       </IconTile>
       <span className="grid min-w-0 flex-1 gap-1">
        <Typography as="span" variant="body" weight="bold" wrapping="breakWords">
         {course.title}
        </Typography>
        <Typography as="span" variant="caption" tone="muted">
         {t("continueLearning.books", { count: course.books.length })}
        </Typography>
       </span>
       <ChevronDown className="size-4 shrink-0 group-open:rotate-180" />
      </summary>
      <div className="grid min-w-0 gap-3 pt-3">
       {course.books.map((book) => {
        const lesson = book.lesson;
        const activeModule = parseHanziHomeModule(lesson?.module);
        const moduleLabel = activeModule
         ? t(`modules.${activeModule}`)
         : textbookModules.find((item) => item.id === lesson?.module)?.label;
        return lesson ? (
         <ActionCard key={book.id} padding="md" asChild>
          <Link href={lesson.href} className="flex min-w-0 items-center gap-3">
           <span className="grid min-w-0 flex-1 gap-1">
            <Typography as="span" variant="bodySmall" weight="bold" wrapping="breakWords">
             {book.title}
            </Typography>
            <Typography as="span" variant="bodySmall" wrapping="breakWords">
             {t("continueLearning.lesson", {
              number: lesson.lessonNumber,
              title: lesson.titleZh || lesson.title,
             })}
            </Typography>
            <Typography as="span" variant="caption" tone="muted">
             {lesson.isRecent ? t("continueLearning.resume") : t("continueLearning.start")} ·{" "}
             {moduleLabel ?? t("modules.overview")}
            </Typography>
           </span>
           <HomeArrowIcon />
          </Link>
         </ActionCard>
        ) : (
         <Typography key={book.id} as="p" variant="bodySmall" tone="muted">
          {book.title} · {t("continueLearning.unavailable")}
         </Typography>
        );
       })}
      </div>
     </details>
     {course.books.some((book) => book.lesson?.isRecent) ? (
      <div className="grid min-w-0 gap-3 pt-3 peer-open:hidden">
       {course.books.map((book) => {
        const lesson = book.lesson;
        if (!lesson?.isRecent) return null;
        const activeModule = parseHanziHomeModule(lesson.module);
        const moduleLabel = activeModule
         ? t(`modules.${activeModule}`)
         : textbookModules.find((item) => item.id === lesson.module)?.label;
        return (
         <ActionCard key={book.id} padding="md" asChild>
          <Link href={lesson.href} className="flex min-w-0 items-center gap-3">
           <span className="grid min-w-0 flex-1 gap-1">
            <Typography as="span" variant="caption" tone="muted">
             {book.title} · {moduleLabel ?? t("modules.overview")}
            </Typography>
            <Typography as="span" variant="bodySmall" weight="bold" wrapping="breakWords">
             {t("continueLearning.lesson", {
              number: lesson.lessonNumber,
              title: lesson.titleZh || lesson.title,
             })}
            </Typography>
            <Typography as="span" variant="caption" tone="muted">
             {t("continueLearning.resume")}
            </Typography>
           </span>
           <HomeArrowIcon />
          </Link>
         </ActionCard>
        );
       })}
      </div>
     ) : null}
    </Card>
   ))}
  </section>
 );
}
