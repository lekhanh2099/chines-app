"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import type { AiTaskRuntimePreview } from "@/lib/ai/ai-task-contract";
import type { useDailyReadingLibrary } from "@/features/daily-reading/services/daily-reading.client";
import type { DailyReading } from "@/features/daily-reading/model/daily-reading.schemas";

import {
 statusBadgeVariant,
 statusKey,
 type ModuleConfig,
} from "./daily-reading-learning-support-model";

type DailyReadingEnrichmentModuleRowProps = {
 config: ModuleConfig;
 reading: DailyReading;
 enrichmentRuns: ReturnType<typeof useDailyReadingLibrary>["enrichmentRuns"];
 taskRuntime?: AiTaskRuntimePreview;
 dateFormatter: Intl.DateTimeFormat;
 action: ReactNode;
};

export function DailyReadingEnrichmentModuleRow({
 config,
 reading,
 enrichmentRuns,
 taskRuntime,
 dateFormatter,
 action,
}: DailyReadingEnrichmentModuleRowProps) {
 const t = useTranslations("DailyReading");
 const state = reading.enrichment[config.module];
 const latestRun = enrichmentRuns.find(
  (run) =>
   run.articleId === reading.id &&
   run.articleFingerprint === reading.article.fingerprint &&
   run.module === config.module,
 );
 const isQueued =
  state.status === "running" && latestRun?.status === "pending" && latestRun.startedAt.length === 0;
 const Icon = config.icon;
 return (
  <div className="flex min-w-0 flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
   <div className="grid min-w-0 gap-1">
    <div className="flex min-w-0 items-center gap-2">
     <Icon aria-hidden />
     <Typography weight="bold">{t(config.titleKey)}</Typography>
     <Badge variant={statusBadgeVariant(state)} size="sm">
      {isQueued ? t("enrichment.status.queued") : t(statusKey(state))}
     </Badge>
    </div>
    {latestRun?.reused && latestRun.receipt ? (
     <Typography variant="caption" tone="muted" wrapping="breakWords">
      {t("enrichment.runtimeReused", {
       provider: latestRun.receipt.provider,
       key: latestRun.receipt.keyLabel,
       model: latestRun.receipt.model,
      })}
     </Typography>
    ) : state.status === "ready" && state.generatedBy?.receipt ? (
     <Typography variant="caption" tone="muted" wrapping="breakWords">
      {state.generatedBy.receipt.provider} · {state.generatedBy.receipt.model} ·{" "}
      {state.generatedBy.receipt.keyLabel}
     </Typography>
    ) : isQueued && latestRun?.receipt ? (
     <Typography variant="caption" tone="muted" wrapping="breakWords">
      {t("enrichment.runtimeQueued", {
       provider: latestRun.receipt.provider,
       key: latestRun.receipt.keyLabel,
       model: latestRun.receipt.model,
       time: dateFormatter.format(new Date(latestRun.attemptedAt)),
      })}
     </Typography>
    ) : state.status === "running" && latestRun?.receipt ? (
     <Typography variant="caption" tone="muted" wrapping="breakWords">
      {t("enrichment.runtimeRunning", {
       provider: latestRun.receipt.provider,
       key: latestRun.receipt.keyLabel,
       model: latestRun.receipt.model,
       completed: latestRun.progressCompleted,
       total: latestRun.progressTotal,
      })}
     </Typography>
    ) : state.status === "failed" && latestRun?.receipt ? (
     <Typography variant="caption" tone="warning" wrapping="breakWords">
      {t("enrichment.runtimeFailed", {
       provider: latestRun.receipt.provider,
       key: latestRun.receipt.keyLabel,
       model: latestRun.receipt.model,
       code: latestRun.errorCode || "provider-unavailable",
      })}
     </Typography>
    ) : taskRuntime?.status === "ready" ? (
     <Typography variant="caption" tone="muted" wrapping="breakWords">
      {t("enrichment.runtimePlanned", {
       provider: taskRuntime.receipt.provider,
       key: taskRuntime.receipt.keyLabel,
       model: taskRuntime.receipt.model,
      })}
     </Typography>
    ) : taskRuntime?.status === "task-disabled" ? (
     <Typography variant="caption" tone="warning">
      {t("enrichment.status.taskDisabled")}
     </Typography>
    ) : taskRuntime ? (
     <Typography variant="caption" tone="warning" wrapping="breakWords">
      {t("enrichment.runtimeUnavailable", { reason: taskRuntime.reason })}
     </Typography>
    ) : null}
    {!isQueued && latestRun?.completedAt ? (
     <Typography variant="caption" tone="muted">
      {t("enrichment.runtimeTimeRange", {
       start: dateFormatter.format(new Date(latestRun.startedAt || latestRun.attemptedAt)),
       end: dateFormatter.format(new Date(latestRun.completedAt)),
      })}
     </Typography>
    ) : !isQueued && state.status === "running" && latestRun ? (
     <Typography variant="caption" tone="muted">
      {t("enrichment.runtimeStarted", {
       time: dateFormatter.format(new Date(latestRun.startedAt || latestRun.attemptedAt)),
      })}
     </Typography>
    ) : null}
   </div>
   <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
  </div>
 );
}
