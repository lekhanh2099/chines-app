"use client";

import {
 BookOpen,
 CircleHelp,
 KeyRound,
 Languages,
 LibraryBig,
 RefreshCcw,
 Settings,
 Sparkles,
 type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ComponentProps, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { useAiRuntimeReadiness } from "@/features/ai-runtime/useAiRuntimeReadiness";
import { AddApiKeyDialog } from "@/features/settings/AddApiKeyDialog";
import { Link } from "@/i18n/navigation";
import type { AiTaskId, AiTaskRuntimePreview } from "@/lib/ai-task-contract";

import { useDailyReadingLibrary } from "@/features/daily-reading/daily-reading.client";
import {
 enrichDailyReadingLearningSupport,
 enrichDailyReadingModule,
} from "@/features/daily-reading/daily-reading-enrichment.client";
import type {
 DailyReading,
 DailyReadingEnrichmentModule,
} from "@/features/daily-reading/daily-reading.schemas";

type EnrichmentState = DailyReading["enrichment"][DailyReadingEnrichmentModule];
type PendingAction = DailyReadingEnrichmentModule | "all" | null;
type EnrichmentStatusKey =
 | "enrichment.status.idle"
 | "enrichment.status.running"
 | "enrichment.status.ready"
 | "enrichment.status.failed"
 | "enrichment.status.missingKey"
 | "enrichment.status.invalidKey"
 | "enrichment.status.quota"
 | "enrichment.status.taskDisabled"
 | "enrichment.status.providerUnavailable";

type ModuleConfig = {
 module: DailyReadingEnrichmentModule;
 icon: LucideIcon;
 titleKey:
  | "enrichment.modules.translation.title"
  | "enrichment.modules.vocabulary.title"
  | "enrichment.modules.grammar.title"
  | "enrichment.modules.questions.title";
};

const moduleConfigs: readonly ModuleConfig[] = [
 { module: "translation", icon: Languages, titleKey: "enrichment.modules.translation.title" },
 { module: "vocabulary", icon: LibraryBig, titleKey: "enrichment.modules.vocabulary.title" },
 { module: "grammar", icon: BookOpen, titleKey: "enrichment.modules.grammar.title" },
 { module: "questions", icon: CircleHelp, titleKey: "enrichment.modules.questions.title" },
];

function configForModule(module: DailyReadingEnrichmentModule) {
 return moduleConfigs.find((config) => config.module === module);
}

function taskIdForModule(module: DailyReadingEnrichmentModule): AiTaskId {
 if (module === "translation") return "daily-reading.translation";
 if (module === "vocabulary") return "daily-reading.vocabulary";
 if (module === "grammar") return "daily-reading.grammar";
 return "daily-reading.questions";
}

function statusBadgeVariant(state: EnrichmentState): ComponentProps<typeof Badge>["variant"] {
 switch (state.status) {
  case "ready":
   return "success";
  case "running":
   return "info";
  case "blocked":
   return "warning";
  case "failed":
   return "danger";
  case "idle":
   return "default";
 }
}

function statusKey(state: EnrichmentState): EnrichmentStatusKey {
 switch (state.status) {
  case "idle":
   return "enrichment.status.idle";
  case "running":
   return "enrichment.status.running";
  case "ready":
   return "enrichment.status.ready";
  case "failed":
   return "enrichment.status.failed";
  case "blocked":
   switch (state.reason) {
    case "missing-ai-key":
     return "enrichment.status.missingKey";
    case "invalid-ai-key":
     return "enrichment.status.invalidKey";
    case "quota-exhausted":
     return "enrichment.status.quota";
    case "provider-unavailable":
     return "enrichment.status.providerUnavailable";
    case "task-disabled":
     return "enrichment.status.taskDisabled";
   }
 }
}

function needsKeyManagement(state: EnrichmentState) {
 return (
  state.status === "blocked" &&
  (state.reason === "invalid-ai-key" || state.reason === "quota-exhausted")
 );
}

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
     const latestRun = library.enrichmentRuns.find(
      (run) =>
       run.articleId === reading.id &&
       run.articleFingerprint === reading.article.fingerprint &&
       run.module === config.module,
     );
     const isQueued =
      state.status === "running" &&
      latestRun?.status === "pending" &&
      latestRun.startedAt.length === 0;
     const Icon = config.icon;
     return (
      <div
       key={config.module}
       className="flex min-w-0 flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between"
      >
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
       <div className="flex shrink-0 flex-wrap items-center gap-2">
        {moduleAction(config.module, state, taskRuntime)}
       </div>
      </div>
     );
    })}
   </div>
  </Card>
 );
}
