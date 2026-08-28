"use client";

import { ArrowRight, RefreshCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ComponentProps, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Link } from "@/i18n/navigation";

import type { DailyReadingActivityEntry } from "./daily-reading-view-model";

type ActivityStatus = DailyReadingActivityEntry["status"];

type StatusTranslationKey =
 | "activity.status.pending"
 | "activity.status.succeeded"
 | "activity.status.failed"
 | "activity.status.blocked";

type CaptureStageTranslationKey =
 | "activity.stage.discovering"
 | "activity.stage.extracting"
 | "activity.stage.ranking"
 | "activity.stage.saving"
 | "activity.stage.completed";

type ModuleTranslationKey =
 | "enrichment.modules.translation.title"
 | "enrichment.modules.vocabulary.title"
 | "enrichment.modules.grammar.title"
 | "enrichment.modules.questions.title";

function statusKey(status: ActivityStatus): StatusTranslationKey {
 switch (status) {
  case "pending":
   return "activity.status.pending";
  case "succeeded":
   return "activity.status.succeeded";
  case "failed":
   return "activity.status.failed";
  case "blocked":
   return "activity.status.blocked";
 }
}

function statusVariant(status: ActivityStatus): ComponentProps<typeof Badge>["variant"] {
 switch (status) {
  case "succeeded":
   return "success";
  case "pending":
   return "info";
  case "failed":
   return "danger";
  case "blocked":
   return "warning";
 }
}

function captureStageKey(
 stage: Extract<DailyReadingActivityEntry, { kind: "capture" }>["stage"],
): CaptureStageTranslationKey {
 switch (stage) {
  case "discovering":
   return "activity.stage.discovering";
  case "extracting":
   return "activity.stage.extracting";
  case "ranking":
   return "activity.stage.ranking";
  case "saving":
   return "activity.stage.saving";
  case "completed":
   return "activity.stage.completed";
 }
}

function moduleKey(
 module: Extract<DailyReadingActivityEntry, { kind: "enrichment" }>["module"],
): ModuleTranslationKey {
 switch (module) {
  case "translation":
   return "enrichment.modules.translation.title";
  case "vocabulary":
   return "enrichment.modules.vocabulary.title";
  case "grammar":
   return "enrichment.modules.grammar.title";
  case "questions":
   return "enrichment.modules.questions.title";
 }
}

export function DailyReadingActivityLog({
 entries,
 articleHref,
 retrying,
 onRetryCapture,
}: {
 entries: readonly DailyReadingActivityEntry[];
 articleHref(articleId: string): string;
 retrying: boolean;
 onRetryCapture(): void;
}) {
 const t = useTranslations("DailyReading");
 const locale = useLocale();
 const dateFormatter = useMemo(
  () =>
   new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
   }),
  [locale],
 );

 if (entries.length === 0) {
  return (
   <Card variant="subtle" padding="lg" className="grid gap-2">
    <Typography weight="bold">{t("activity.emptyTitle")}</Typography>
    <Typography variant="bodySmall" tone="muted">
     {t("activity.emptyDescription")}
    </Typography>
   </Card>
  );
 }

 return (
  <Card variant="section" padding="none" className="min-w-0 overflow-hidden">
   <div className="grid min-w-0">
    {entries.slice(0, 40).map((entry, index) => {
     const hasArticle = entry.articleId.length > 0 && entry.articleTitleZh.length > 0;
     const detail =
      entry.kind === "capture"
       ? t("activity.captureDetail", {
          stage: t(captureStageKey(entry.stage)),
          mode:
           entry.releaseKind === "scheduled"
            ? t("generated.kind.scheduled")
            : t("generated.kind.manual"),
         })
       : t("activity.enrichmentDetail", { module: t(moduleKey(entry.module)) });
     return (
      <div key={entry.id} className="grid min-w-0">
       {index > 0 ? <Separator /> : null}
       <div className="flex min-w-0 flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-4 sm:py-4">
        <div className="grid min-w-0 gap-1.5">
         <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant={statusVariant(entry.status)} size="sm" casing="natural">
           {t(statusKey(entry.status))}
          </Badge>
          <Typography variant="caption" tone="muted">
           {entry.completedAt
            ? t("activity.timeRange", {
               start: dateFormatter.format(new Date(entry.attemptedAt)),
               end: dateFormatter.format(new Date(entry.completedAt)),
              })
            : t("activity.startedAt", {
               time: dateFormatter.format(new Date(entry.attemptedAt)),
              })}
          </Typography>
         </div>
         <Typography variant="bodySmall" weight="semibold">
          {entry.kind === "capture" ? t("activity.captureTitle") : t("activity.enrichmentTitle")}
         </Typography>
         {hasArticle ? (
          <HanziText as="p" size="medium" weight="bold" clamp="two">
           {entry.articleTitleZh}
          </HanziText>
         ) : null}
         <Typography variant="caption" tone="muted">
          {detail}
         </Typography>
         {entry.errorDetail ? (
          <Typography variant="caption" tone="danger" wrapping="breakWords">
           {entry.errorDetail}
          </Typography>
         ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
         {hasArticle ? (
          <Button type="button" variant="outline" size="toolbar" asChild>
           <Link href={articleHref(entry.articleId)} prefetch={false}>
            {t("activity.openArticle")}
            <ArrowRight data-icon="inline-end" />
           </Link>
          </Button>
         ) : entry.kind === "capture" && entry.status === "failed" ? (
          <Button
           type="button"
           variant="outline"
           size="toolbar"
           disabled={retrying}
           onClick={onRetryCapture}
          >
           <RefreshCcw data-icon="inline-start" />
           {t("activity.retryCapture")}
          </Button>
         ) : null}
        </div>
       </div>
      </div>
     );
    })}
   </div>
  </Card>
 );
}
