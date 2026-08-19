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
import { useTranslations } from "next-intl";
import { type ComponentProps, useState } from "react";
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

import {
 enrichDailyReadingV2LearningSupport,
 enrichDailyReadingV2Module,
} from "./daily-reading-v2-enrichment.client";
import type { DailyReadingV2, DailyReadingV2EnrichmentModule } from "./daily-reading-v2.schemas";

type EnrichmentState = DailyReadingV2["enrichment"][DailyReadingV2EnrichmentModule];
type PendingAction = DailyReadingV2EnrichmentModule | "all" | null;
type EnrichmentStatusKey =
 | "v2.enrichment.status.idle"
 | "v2.enrichment.status.running"
 | "v2.enrichment.status.ready"
 | "v2.enrichment.status.failed"
 | "v2.enrichment.status.missingKey"
 | "v2.enrichment.status.invalidKey"
 | "v2.enrichment.status.quota"
 | "v2.enrichment.status.providerUnavailable";

type ModuleConfig = {
 module: DailyReadingV2EnrichmentModule;
 icon: LucideIcon;
 titleKey:
  | "v2.enrichment.modules.translation.title"
  | "v2.enrichment.modules.vocabulary.title"
  | "v2.enrichment.modules.grammar.title"
  | "v2.enrichment.modules.questions.title";
};

const moduleConfigs: readonly ModuleConfig[] = [
 { module: "translation", icon: Languages, titleKey: "v2.enrichment.modules.translation.title" },
 { module: "vocabulary", icon: LibraryBig, titleKey: "v2.enrichment.modules.vocabulary.title" },
 { module: "grammar", icon: BookOpen, titleKey: "v2.enrichment.modules.grammar.title" },
 { module: "questions", icon: CircleHelp, titleKey: "v2.enrichment.modules.questions.title" },
];

function configForModule(module: DailyReadingV2EnrichmentModule) {
 return moduleConfigs.find((config) => config.module === module);
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
   return "v2.enrichment.status.idle";
  case "running":
   return "v2.enrichment.status.running";
  case "ready":
   return "v2.enrichment.status.ready";
  case "failed":
   return "v2.enrichment.status.failed";
  case "blocked":
   switch (state.reason) {
    case "missing-ai-key":
     return "v2.enrichment.status.missingKey";
    case "invalid-ai-key":
     return "v2.enrichment.status.invalidKey";
    case "quota-exhausted":
     return "v2.enrichment.status.quota";
    case "provider-unavailable":
     return "v2.enrichment.status.providerUnavailable";
   }
 }
}

function needsKeyManagement(state: EnrichmentState) {
 return (
  state.status === "blocked" &&
  (state.reason === "invalid-ai-key" || state.reason === "quota-exhausted")
 );
}

export function DailyReadingLearningSupportPanel({ reading }: { reading: DailyReadingV2 }) {
 const t = useTranslations("DailyReading");
 const runtime = useAiRuntimeReadiness();
 const [pendingAction, setPendingAction] = useState<PendingAction>(null);
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

 async function runModule(module: DailyReadingV2EnrichmentModule) {
  setPendingAction(module);
  try {
   const updated = await enrichDailyReadingV2Module(reading.id, module);
   if (updated.enrichment[module].status === "ready") {
    const config = configForModule(module);
    toast.success(
     config === undefined
      ? t("v2.enrichment.toast.moduleReadyFallback")
      : t("v2.enrichment.toast.moduleReady", { module: t(config.titleKey) }),
    );
   }
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("v2.enrichment.toast.failed"));
  } finally {
   setPendingAction(null);
  }
 }

 async function runAll() {
  setPendingAction("all");
  try {
   const updated = await enrichDailyReadingV2LearningSupport(reading.id);
   const completed = moduleConfigs.filter(
    ({ module }) => updated.enrichment[module].status === "ready",
   ).length;
   if (completed === moduleConfigs.length) toast.success(t("v2.enrichment.toast.allReady"));
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("v2.enrichment.toast.failed"));
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

 function retryModuleButton(module: DailyReadingV2EnrichmentModule, state: EnrichmentState) {
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
    {state.status === "idle" ? t("v2.enrichment.actions.create") : t("v2.enrichment.actions.retry")}
   </Button>
  );
 }

 function manageKeysButton() {
  return (
   <Button type="button" variant="outline" size="compact" asChild>
    <Link href="/settings?section=ai&panel=providers" prefetch={false}>
     <Settings data-icon="inline-start" />
     {t("v2.enrichment.actions.manageKeys")}
    </Link>
   </Button>
  );
 }

 function moduleAction(module: DailyReadingV2EnrichmentModule, state: EnrichmentState) {
  if (state.status === "ready" || state.status === "running") return null;
  if (runtime.isPending || runtime.isError) return null;

  if (runtimeMissingKey) {
   return addKeyAction(t("v2.enrichment.actions.addKey"), () => void runModule(module));
  }
  if (runtimeCanRecoverByAddingKey) {
   return addKeyAction(t("v2.enrichment.actions.addReplacementKey"), () => void runModule(module));
  }
  if (runtimeStorageUnavailable) return manageKeysButton();

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
     {t("v2.enrichment.actions.checkingRuntime")}
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
     {t("v2.enrichment.actions.checkRuntimeAgain")}
    </Button>
   );
  }
  if (runtimeMissingKey) {
   return addKeyAction(t("v2.enrichment.actions.addKeyAndCreate"), () => void runAll());
  }
  if (runtimeCanRecoverByAddingKey) {
   return addKeyAction(t("v2.enrichment.actions.addReplacementKey"), () => void runAll());
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
    {readyCount === 0
     ? t("v2.enrichment.actions.createAll")
     : t("v2.enrichment.actions.completeMissing")}
   </Button>
  );
 }

 return (
  <Card variant="subtle" padding="md" className="grid min-w-0 gap-3">
   <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="grid min-w-0 gap-1" aria-live="polite">
     <div className="flex flex-wrap items-center gap-2">
      <Typography as="h2" variant="cardTitle" weight="bold">
       {t("v2.enrichment.title")}
      </Typography>
      <Badge variant={allReady ? "success" : hasRunningModule ? "info" : "default"} size="sm">
       {t("v2.enrichment.summary", { ready: readyCount, total: moduleConfigs.length })}
      </Badge>
     </div>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("v2.enrichment.description")}
     </Typography>
     {runtime.data?.status === "ready" ? (
      <Typography as="p" variant="caption" tone="muted" wrapping="breakWords">
       {t("v2.enrichment.runtimeReady", {
        provider: runtime.data.selectedKey.providerLabel,
        model: runtime.data.selectedKey.model,
       })}
      </Typography>
     ) : runtimeMissingKey ? (
      <Typography as="p" variant="caption" tone="warning">
       {t("v2.enrichment.runtimeMissing")}
      </Typography>
     ) : runtimeStorageUnavailable ? (
      <Typography as="p" variant="caption" tone="warning">
       {t("v2.enrichment.runtimeStorageUnavailable")}
      </Typography>
     ) : null}
    </div>
    <div className="flex flex-wrap items-center gap-2">{primaryAction()}</div>
   </div>

   <Separator />

   <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
    {moduleConfigs.map((config) => {
     const state = reading.enrichment[config.module];
     const Icon = config.icon;
     return (
      <div
       key={config.module}
       className="flex min-w-0 flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between"
      >
       <div className="flex min-w-0 items-center gap-2">
        <Icon aria-hidden />
        <Typography weight="bold">{t(config.titleKey)}</Typography>
        <Badge variant={statusBadgeVariant(state)} size="sm">
         {t(statusKey(state))}
        </Badge>
       </div>
       <div className="flex shrink-0 flex-wrap items-center gap-2">
        {moduleAction(config.module, state)}
       </div>
      </div>
     );
    })}
   </div>
  </Card>
 );
}
