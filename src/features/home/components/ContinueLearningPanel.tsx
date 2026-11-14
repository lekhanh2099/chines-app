import { BookOpenCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { ActionCard } from "@/components/ui/actions/action-card";
import { Button } from "@/components/ui/actions/button";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { HomeArrowIcon, HomeSectionHeader } from "@/features/home/components/HomePrimitives";
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
 const recentBooks = courses
  .flatMap((course) => course.books)
  .filter((book) => book.lesson?.isRecent);
 const textbookModules = [
  { id: "all", label: t("textbookModules.all") },
  { id: "text", label: t("modules.lessonText") },
  { id: "core", label: t("textbookModules.core") },
  { id: "translation", label: t("textbookModules.translation") },
 ];
 return (
  <section aria-labelledby="continue-learning-title" className="grid min-w-0 gap-3">
   <HomeSectionHeader
    id="continue-learning-title"
    title={t("continueLearning.title")}
    description={t("continueLearning.description")}
    action={
     <Button asChild variant="outline" size="sm">
      <Link href="/hanzihome">{t("continueLearning.browseLibrary")}</Link>
     </Button>
    }
   />
   {unavailable ? (
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("continueLearning.catalogUnavailable")}
    </Typography>
   ) : null}
   {!recentBooks.length && !unavailable ? (
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("continueLearning.empty")}
    </Typography>
   ) : null}
   <div className="grid min-w-0 gap-3">
    {recentBooks.map((book) => {
     const lesson = book.lesson;
     if (!lesson?.isRecent) return null;
     const activeModule = parseHanziHomeModule(lesson.module);
     const moduleLabel = activeModule
      ? t(`modules.${activeModule}`)
      : textbookModules.find((item) => item.id === lesson.module)?.label;
     return (
      <ActionCard key={book.id} padding="md" asChild>
       <Link href={lesson.href} className="flex min-w-0 items-center gap-3">
        <IconTile size="md">
         <BookOpenCheck />
        </IconTile>
        <span className="grid min-w-0 flex-1 gap-1">
         <Typography as="span" variant="caption" tone="muted">
          {lesson.courseTitle === book.title ? book.title : `${lesson.courseTitle} · ${book.title}`}{" "}
          · {moduleLabel ?? t("modules.overview")}
         </Typography>
         <Typography as="span" variant="bodySmall" weight="bold" wrapping="breakWords">
          {lesson.title.startsWith("ÔN TẬP ")
           ? lesson.title
           : t("continueLearning.lesson", {
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
  </section>
 );
}
