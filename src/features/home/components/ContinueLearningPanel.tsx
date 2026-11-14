import { BookOpenCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { ActionCard } from "@/components/ui/actions/action-card";
import { Button } from "@/components/ui/actions/button";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import {
 HomeArrowIcon,
 HomeSectionHeader,
 useHomeLessonTitle,
 useHomeModuleLabel,
} from "@/features/home/components/HomePrimitives";
import { TodayFocusWidget } from "@/features/home/components/TodayFocusWidget";
import type { HomeResumeBook } from "@/features/home/types";
import { Link } from "@/i18n/navigation";

/**
 * "Học tiếp": the most recent book leads as the focus card, followed by every
 * other book being studied (catalog and static textbooks), most recent first.
 */
export function ContinueLearningPanel({
 books,
 unavailable,
}: {
 books: readonly HomeResumeBook[];
 unavailable: boolean;
}) {
 const t = useTranslations("Home");
 const moduleLabel = useHomeModuleLabel();
 const lessonTitle = useHomeLessonTitle();
 const [primaryBook, ...otherBooks] = books;
 const isStudying = books.some((book) => book.lesson?.isRecent);

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
   {!isStudying && !unavailable ? (
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("continueLearning.empty")}
    </Typography>
   ) : null}
   {primaryBook ? <TodayFocusWidget book={primaryBook} /> : null}
   {otherBooks.length ? (
    <div className="grid min-w-0 gap-2">
     <Typography as="h3" variant="caption" tone="muted" weight="bold">
      {t("continueLearning.otherBooks")}
     </Typography>
     <div className="grid min-w-0 gap-3" data-home-other-books>
      {otherBooks.map((book) => {
       const lesson = book.lesson;
       if (!lesson) return null;
       return (
        <ActionCard key={book.id} padding="md" asChild>
         <Link
          href={lesson.href}
          data-home-resume-row={book.id}
          className="flex min-w-0 items-center gap-3"
         >
          <IconTile size="md">
           <BookOpenCheck />
          </IconTile>
          <span className="grid min-w-0 flex-1 gap-1">
           <Typography as="span" variant="caption" tone="muted">
            {lesson.courseTitle === book.title
             ? book.title
             : `${lesson.courseTitle} · ${book.title}`}{" "}
            · {moduleLabel(lesson.module)}
           </Typography>
           <Typography as="span" variant="bodySmall" weight="bold" wrapping="breakWords">
            {lessonTitle(lesson)}
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
    </div>
   ) : null}
  </section>
 );
}
