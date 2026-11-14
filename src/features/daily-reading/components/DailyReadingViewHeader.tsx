"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { formatContextualReadingPinyin } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import type { DailyReading } from "@/features/daily-reading/model/daily-reading.schemas";
import { getDailyReadingLearningSummary } from "@/features/daily-reading/model/daily-reading-view-model";
import {
 type analyzeDailyReadingText,
 getTopicTranslationKey,
} from "@/features/daily-reading/components/daily-reading-library-utils";

type DailyReadingViewHeaderProps = {
 reading: DailyReading;
 showTitle: boolean;
 displayMode: LessonDisplayMode;
 titlePronunciation: ReturnType<typeof analyzeDailyReadingText>;
 dateFormatter: Intl.DateTimeFormat;
};

export function DailyReadingViewHeader({
 reading,
 showTitle,
 displayMode,
 titlePronunciation,
 dateFormatter,
}: DailyReadingViewHeaderProps) {
 const t = useTranslations("DailyReading");
 const translation =
  reading.enrichment.translation.status === "ready" ? reading.enrichment.translation.data : null;
 const learning = getDailyReadingLearningSummary(reading);
 return (
  <header className="grid min-w-0 gap-3 border-b border-border-default pb-4 sm:pb-5">
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    {reading.classification.targetLevel !== null ? (
     <Badge variant="warning" size="sm" casing="natural">
      {reading.classification.targetLevel}
     </Badge>
    ) : null}
    <Badge size="sm" casing="natural">
     {t(getTopicTranslationKey(reading.classification.topic))}
    </Badge>
   </div>
   <div className="grid min-w-0 gap-1.5">
    {showTitle ? (
     <>
      <HanziText as="h1" size="card" weight="black">
       {reading.article.titleZh}
      </HanziText>
      {displayMode.showPinyin && titlePronunciation !== null ? (
       <PinyinText as="p" variant="bodySmall" tone="accent">
        {formatContextualReadingPinyin(titlePronunciation)}
       </PinyinText>
      ) : null}
      {translation !== null ? (
       <Typography variant="bodySmall" tone="secondary">
        {translation.titleVi}
       </Typography>
      ) : null}
     </>
    ) : null}
    <Typography variant="caption" tone="muted">
     {t("detail.capturedMeta", {
      time: dateFormatter.format(new Date(reading.capturedAt)),
      publisher: reading.source.publisher,
      minutes: reading.estimatedMinutes,
     })}
    </Typography>
    <Typography variant="caption" tone="muted">
     {t("library.learningReady", { ready: learning.ready, total: learning.total })}
    </Typography>
   </div>
  </header>
 );
}
