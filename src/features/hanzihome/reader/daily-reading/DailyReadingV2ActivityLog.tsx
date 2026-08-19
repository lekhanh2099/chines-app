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

import type { DailyReadingActivityEntry } from "./daily-reading-v2-view-model";

type ActivityStatus = DailyReadingActivityEntry["status"];

type StatusTranslationKey =
 | "v2.activity.status.pending"
 | "v2.activity.status.succeeded"
 | "v2.activity.status.failed"
 | "v2.activity.status.blocked";

type CaptureStageTranslationKey =
 | "v2.activity.stage.discovering"
 | "v2.activity.stage.extracting"
 | "v2.activity.stage.ranking"
 | "v2.activity.stage.saving"
 | "v2.activity.stage.completed";

type ModuleTranslationKey =
 | "v2.enrichment.modules.translation.title"
 | "v2.enrichment.modules.vocabulary.title"
 | "v2.enrichment.modules.grammar.title"
 | "v2.enrichment.modules.questions.title";

function statusKey(status: ActivityStatus): StatusTranslationKey {
 switch (status) {
  case "pending":
   return "v2.activity.status.pending";
  case "succeeded":
   return "v2.activity.status.succeeded";
  case "failed":
   return "v2.activity.status.failed";
  case "blocked":
   return "v2.activity.status.blocked";
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
   return "v2.activity.stage.discovering";
  case "extracting":
   return "v2.activity.stage.extracting";
  case "ranking":
   return "v2.activity.stage.ranking";
  case "saving":
   return "v2.activity.stage.saving";
  case "completed":
   return "v2.activity.stage.completed";
 }
}

function moduleKey(
 module: Extract<DailyReadingActivityEntry, { kind: "enrichment" }>["module"],
): ModuleTranslationKey {
 switch (module) {
  case "translation":
   return "v2.enrichment.modules.translation.title";
  case "vocabulary":
   return "v2.enrichment.modules.vocabulary.title";
  case "grammar":
   return "v2.enrichment.modules.grammar.title";
  case "questions":
   return "v2.enrichment.modules.questions.title";
 }
}

export function DailyReadingV2ActivityLog({
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
    <Typography weight="bold">{t("v2.activity.emptyTitle")}</Typography>
    <Typography variant="bodySmall" tone="muted">
     {t("v2.activity.emptyDescription")}
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
       ? t("v2.activity.captureDetail", {
          stage: t(captureStageKey(entry.stage)),
          mode:
           entry.releaseKind === "scheduled"
            ? t("generated.kind.scheduled")
            : t("generated.kind.manual"),
         })
       : t("v2.activity.enrichmentDetail", { module: t(moduleKey(entry.module)) });
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
           {dateFormatter.format(new Date(entry.attemptedAt))}
          </Typography>
         </div>
         <Typography variant="bodySmall" weight="semibold">
          {entry.kind === "capture"
           ? t("v2.activity.captureTitle")
           : t("v2.activity.enrichmentTitle")}
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
            {t("v2.activity.openArticle")}
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
           {t("v2.activity.retryCapture")}
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
