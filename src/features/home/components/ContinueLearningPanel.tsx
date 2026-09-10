import { BookOpenCheck } from "lucide-react";

import { ActionCard } from "@/components/ui/action-card";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import { HomeArrowIcon } from "@/features/home/components/HomePrimitives";
import type { HomeDashboardModel } from "@/features/home/types";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ContinueLearningPanel({ lesson }: { lesson: HomeDashboardModel["lesson"] }) {
 const t = useTranslations("Home");

 return (
  <section aria-labelledby="continue-learning-title">
   {lesson ? (
    <ActionCard padding="lg" asChild className="grid w-full gap-4">
     <Link href={lesson.href}>
      <span className="flex min-w-0 items-start justify-between gap-3">
       <span className="grid min-w-0 gap-1">
        <Typography
         id="continue-learning-title"
         as="h2"
         variant="sectionTitle"
         tone="default"
         weight="black"
         tracking="tight"
         className="block"
        >
         {t("continueLearning.title")}
        </Typography>
        <Typography
         as="span"
         variant="bodySmall"
         tone="muted"
         weight="semibold"
         leading="compact"
         className="block"
        >
         {t("continueLearning.description")}
        </Typography>
       </span>
       <HomeArrowIcon />
      </span>

      <span className="flex min-w-0 items-center gap-3 sm:gap-4">
       <IconTile size="md">
        <BookOpenCheck />
       </IconTile>

       <span className="grid min-w-0 flex-1 gap-0.5">
        <Typography
         variant="overline"
         tone="muted"
         weight="black"
         tracking="overline"
         transform="uppercase"
         className="block"
        >
         {lesson.isRecent
          ? t("continueLearning.recentLesson")
          : t("continueLearning.startHanziHome")}
        </Typography>
        <Typography
         variant="sectionTitle"
         tone="default"
         weight="black"
         clamp="one"
         className="block"
        >
         {t("continueLearning.lesson", {
          number: lesson.lessonNumber,
          title: lesson.titleZh || lesson.title,
         })}
        </Typography>
        <Typography
         variant="bodySmall"
         tone="muted"
         weight="semibold"
         clamp="one"
         className="block"
        >
         {lesson.courseTitle} · {t(`modules.${lesson.module}`)}
        </Typography>
       </span>
      </span>
     </Link>
    </ActionCard>
   ) : (
    <Card variant="section" padding="lg" className="grid gap-1">
     <Typography
      id="continue-learning-title"
      as="h2"
      variant="sectionTitle"
      tone="default"
      weight="black"
     >
      {t("continueLearning.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("continueLearning.unavailable")}
     </Typography>
    </Card>
   )}
  </section>
 );
}
