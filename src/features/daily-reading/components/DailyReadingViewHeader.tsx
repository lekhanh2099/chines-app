"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
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
 onBack: () => void;
};

export function DailyReadingViewHeader({
 reading,
 showTitle,
 displayMode,
 titlePronunciation,
 dateFormatter,
 onBack,
}: DailyReadingViewHeaderProps) {
 const t = useTranslations("DailyReading");
 const translation =
  reading.enrichment.translation.status === "ready" ? reading.enrichment.translation.data : null;
 const learning = getDailyReadingLearningSummary(reading);
 return (
  <header className="grid min-w-0 gap-1.5">
   <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
    <Button type="button" variant="ghost" size="toolbar" className="sm:hidden" onClick={onBack}>
     <ArrowLeft />
     {t("document.back")}
    </Button>
    {reading.classification.targetLevel !== null ? (
     <Badge variant="warning" size="sm" casing="natural">
      {reading.classification.targetLevel}
     </Badge>
    ) : null}
    <Badge size="sm" casing="natural">
     {t(getTopicTranslationKey(reading.classification.topic))}
    </Badge>
    <Typography variant="caption" tone="muted">
     {t("detail.capturedMeta", {
      time: dateFormatter.format(new Date(reading.capturedAt)),
      publisher: reading.source.publisher,
      minutes: reading.estimatedMinutes,
     })}
     {" · "}
     {t("library.learningReady", { ready: learning.ready, total: learning.total })}
    </Typography>
   </div>
   {showTitle ? (
    <div className="grid min-w-0 gap-1">
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
    </div>
   ) : null}
  </header>
 );
}
