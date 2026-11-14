"use client";

import { KeyRound, RefreshCcw, Settings, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Typography } from "@/components/ui/display/typography";
import { useAiRuntimeReadiness } from "@/features/ai-runtime/useAiRuntimeReadiness";
import { AddApiKeyDialog } from "@/features/settings/components/AddApiKeyDialog";
import { Link } from "@/i18n/navigation";
import type { AiTaskRuntimePreview } from "@/lib/ai/ai-task-contract";

import { useDailyReadingLibrary } from "@/features/daily-reading/services/daily-reading.client";
import {
 enrichDailyReadingLearningSupport,
 enrichDailyReadingModule,
} from "@/features/daily-reading/enrichment/daily-reading-enrichment.client";
import type {
 DailyReading,
 DailyReadingEnrichmentModule,
} from "@/features/daily-reading/model/daily-reading.schemas";

import {
 configForModule,
 moduleConfigs,
 needsKeyManagement,
 taskIdForModule,
 type EnrichmentState,
} from "./daily-reading-learning-support-model";
import { DailyReadingEnrichmentModuleRow } from "./DailyReadingEnrichmentModuleRow";

type PendingAction = DailyReadingEnrichmentModule | "all" | null;

export function DailyReadingLearningSupportPanel({ reading }: { reading: DailyReading }) {
 const t = useTranslations("DailyReading");
 const locale = useLocale();
 const runtime = useAiRuntimeReadiness();
 const library = useDailyReadingLibrary();
 const [pendingAction, setPendingAction] = useState<PendingAction>(null);
 const dateFormatter = useMemo(
  () =>
   new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
   }),
  [locale],
 );
 const readyCount = moduleConfigs.filter(
  ({ module }) => reading.enrichment[module].status === "ready",
 ).length;
 const hasRunningModule = moduleConfigs.some(
  ({ module }) => reading.enrichment[module].status === "running",
 );
 const allReady = readyCount === moduleConfigs.length;
 const runtimeMissingKey = runtime.data?.status === "missing-key";
 const runtimeStorageUnavailable = runtime.data?.status === "storage-unavailable";
 const runtimeCanRecoverByAddingKey =
  runtime.data?.status === "storage-unavailable" && runtime.data.reason === "credential-unreadable";
 const runtimeReady = runtime.data?.status === "ready";

 async function runModule(module: DailyReadingEnrichmentModule) {
  setPendingAction(module);
  try {
   const updated = await enrichDailyReadingModule(reading.id, module);
   if (updated.enrichment[module].status === "ready") {
    const config = configForModule(module);
    toast.success(
     config === undefined
      ? t("enrichment.toast.moduleReadyFallback")
      : t("enrichment.toast.moduleReady", { module: t(config.titleKey) }),
    );
   } else if (updated.enrichment[module].status === "running") {
    toast.success(t("enrichment.toast.queued"));
   }
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("enrichment.toast.failed"));
  } finally {
   setPendingAction(null);
  }
 }

 async function runAll() {
  setPendingAction("all");
  try {
   const updated = await enrichDailyReadingLearningSupport(reading.id);
   const completed = moduleConfigs.filter(
    ({ module }) => updated.enrichment[module].status === "ready",
   ).length;
   if (completed === moduleConfigs.length) toast.success(t("enrichment.toast.allReady"));
   else toast.success(t("enrichment.toast.queued"));
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("enrichment.toast.failed"));
  } finally {
   setPendingAction(null);
  }
 }

 function addKeyAction(label: string, onSaved?: () => void) {
  return (
   <AddApiKeyDialog
    onSaved={onSaved}
    trigger={
     <Button type="button" size="compact">
      <KeyRound data-icon="inline-start" />
      {label}
     </Button>
    }
   />
  );
 }

 function retryModuleButton(module: DailyReadingEnrichmentModule, state: EnrichmentState) {
  const isPending = pendingAction === module || pendingAction === "all";
  return (
   <Button
    type="button"
    variant={state.status === "idle" ? "outline" : "secondary"}
    size="compact"
    onClick={() => void runModule(module)}
    disabled={isPending || hasRunningModule}
   >
    {isPending ? (
     <Spinner data-icon="inline-start" />
    ) : state.status === "idle" ? (
     <Sparkles data-icon="inline-start" />
    ) : (
     <RefreshCcw data-icon="inline-start" />
    )}
    {state.status === "idle" ? t("enrichment.actions.create") : t("enrichment.actions.retry")}
   </Button>
  );
 }

 function manageKeysButton() {
  return (
   <Button type="button" variant="outline" size="compact" asChild>
    <Link href="/settings?section=ai&panel=providers" prefetch={false}>
     <Settings data-icon="inline-start" />
     {t("enrichment.actions.manageKeys")}
    </Link>
   </Button>
  );
 }

 function configureTaskButton(module: DailyReadingEnrichmentModule) {
  return (
   <Button type="button" variant="outline" size="compact" asChild>
    <Link href={`/settings?section=ai&panel=tasks#${taskIdForModule(module)}`} prefetch={false}>
     <Settings data-icon="inline-start" />
     {t("enrichment.actions.configureTask")}
    </Link>
   </Button>
  );
 }

 function moduleAction(
  module: DailyReadingEnrichmentModule,
  state: EnrichmentState,
  taskRuntime: AiTaskRuntimePreview | undefined,
 ) {
  if (state.status === "running") return null;
  if (runtime.isPending || runtime.isError) return null;
  if (taskRuntime?.status === "task-disabled") return configureTaskButton(module);

  if (runtimeMissingKey) {
   return addKeyAction(t("enrichment.actions.addKey"), () => void runModule(module));
  }
  if (runtimeCanRecoverByAddingKey) {
   return addKeyAction(t("enrichment.actions.addReplacementKey"), () => void runModule(module));
  }
  if (runtimeStorageUnavailable) return manageKeysButton();
  if (taskRuntime && taskRuntime.status !== "ready") return manageKeysButton();

  if (runtimeReady && needsKeyManagement(state)) {
   return (
    <>
     {retryModuleButton(module, state)}
     {manageKeysButton()}
    </>
   );
  }
  return retryModuleButton(module, state);
 }

 function primaryAction() {
  if (allReady) return null;
  if (runtime.isPending) {
   return (
    <Button type="button" variant="outline" size="compact" disabled>
     <Spinner data-icon="inline-start" />
     {t("enrichment.actions.checkingRuntime")}
    </Button>
   );
  }
  if (runtime.isError) {
   return (
    <Button
     type="button"
     variant="outline"
     size="compact"
     onClick={() => void runtime.refetch()}
     disabled={runtime.isFetching}
    >
     {runtime.isFetching ? (
      <Spinner data-icon="inline-start" />
     ) : (
      <RefreshCcw data-icon="inline-start" />
     )}
     {t("enrichment.actions.checkRuntimeAgain")}
    </Button>
   );
  }
  if (runtimeMissingKey) {
   return addKeyAction(t("enrichment.actions.addKeyAndCreate"), () => void runAll());
  }
  if (runtimeCanRecoverByAddingKey) {
   return addKeyAction(t("enrichment.actions.addReplacementKey"), () => void runAll());
  }
  if (runtimeStorageUnavailable) return manageKeysButton();

  return (
   <Button
    type="button"
    size="compact"
    onClick={() => void runAll()}
    disabled={pendingAction !== null || hasRunningModule}
   >
    {pendingAction === "all" || hasRunningModule ? (
     <Spinner data-icon="inline-start" />
    ) : (
     <Sparkles data-icon="inline-start" />
    )}
    {readyCount === 0 ? t("enrichment.actions.createAll") : t("enrichment.actions.completeMissing")}
   </Button>
  );
 }

 return (
  <Card variant="subtle" padding="md" className="grid min-w-0 gap-3">
   <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="grid min-w-0 gap-1" aria-live="polite">
     <div className="flex flex-wrap items-center gap-2">
      <Typography as="h2" variant="cardTitle" weight="bold">
       {t("enrichment.title")}
      </Typography>
      <Badge variant={allReady ? "success" : hasRunningModule ? "info" : "default"} size="sm">
       {t("enrichment.summary", { ready: readyCount, total: moduleConfigs.length })}
      </Badge>
     </div>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("enrichment.description")}
     </Typography>
     {runtimeMissingKey ? (
      <Typography as="p" variant="caption" tone="warning">
       {t("enrichment.runtimeMissing")}
      </Typography>
     ) : runtimeStorageUnavailable ? (
      <Typography as="p" variant="caption" tone="warning">
       {t("enrichment.runtimeStorageUnavailable")}
      </Typography>
     ) : null}
    </div>
    <div className="flex flex-wrap items-center gap-2">{primaryAction()}</div>
   </div>

   <Separator />

   <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
    {moduleConfigs.map((config) => {
     const state = reading.enrichment[config.module];
     const taskRuntime = runtime.data?.taskRuntimes.find(
      (preview) => preview.taskId === taskIdForModule(config.module),
     );
     return (
      <DailyReadingEnrichmentModuleRow
       key={config.module}
       config={config}
       reading={reading}
       enrichmentRuns={library.enrichmentRuns}
       taskRuntime={taskRuntime}
       dateFormatter={dateFormatter}
       action={moduleAction(config.module, state, taskRuntime)}
      />
     );
    })}
   </div>
  </Card>
 );
}
