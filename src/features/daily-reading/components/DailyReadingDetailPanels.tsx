"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { DailyReadingTranslationProgressEvent } from "@/features/daily-reading/enrichment/daily-reading-enrichment.schemas";
import type { DailyReading } from "@/features/daily-reading/model/daily-reading.schemas";

export function DailyReadingTranslationProgressNotice({
 failed,
 progress,
}: {
 failed: boolean;
 progress: DailyReadingTranslationProgressEvent;
}) {
 const t = useTranslations("DailyReading");
 return (
  <Card variant="subtle" padding="sm" className="flex flex-wrap items-center gap-2">
   <Badge variant={failed ? "warning" : "info"} size="sm" casing="natural">
    {failed ? t("detail.temporaryTranslation") : t("detail.translationRunning")}
   </Badge>
   <Typography variant="bodySmall" tone="muted">
    {t("detail.translationProgress", {
     completed: progress.progressCompleted,
     total: progress.progressTotal,
    })}
   </Typography>
  </Card>
 );
}

export function DailyReadingGrammarList({ reading }: { reading: DailyReading }) {
 if (reading.enrichment.grammar.status !== "ready") return null;
 return (
  <div className="grid gap-3">
   {reading.enrichment.grammar.data.items.map((grammar, index) => (
    <Card key={grammar.id} variant="section" padding="md" className="grid gap-2">
     <div className="flex items-center gap-2">
      <Badge variant="warning">{index + 1}</Badge>
      <HanziText as="h3" size="medium" weight="black">
       {grammar.patternZh}
      </HanziText>
     </div>
     <Typography variant="bodySmall" tone="secondary">
      {grammar.explanationVi}
     </Typography>
     <HanziText as="p" size="medium" leading="relaxed">
      {grammar.evidenceSentenceZh}
     </HanziText>
    </Card>
   ))}
  </div>
 );
}

export function DailyReadingSourcePanel({
 reading,
 dateFormatter,
}: {
 reading: DailyReading;
 dateFormatter: Intl.DateTimeFormat;
}) {
 const t = useTranslations("DailyReading");
 const translation =
  reading.enrichment.translation.status === "ready" ? reading.enrichment.translation.data : null;
 return (
  <Card variant="subtle" padding="md" className="grid gap-3">
   <div className="grid min-w-0 gap-1">
    <HanziText as="h3" size="medium" weight="black">
     {reading.source.titleZh}
    </HanziText>
    <Typography variant="bodySmall" tone="muted">
     {reading.source.publisher} · {dateFormatter.format(new Date(reading.source.publishedAt))}
    </Typography>
   </div>
   {reading.provenance === "legacy-adapted" && translation?.adaptationNoticeVi ? (
    <Typography variant="bodySmall" tone="secondary">
     {translation.adaptationNoticeVi}
    </Typography>
   ) : (
    <Typography variant="bodySmall" tone="muted">
     {t("source.fallbackNotice")}
    </Typography>
   )}
   <Button type="button" variant="outline" size="toolbar" asChild className="justify-self-start">
    <a href={reading.source.url} target="_blank" rel="noreferrer">
     {t("generated.source.open")}
    </a>
   </Button>
  </Card>
 );
}
