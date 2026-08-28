"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/i18n/navigation";
import { API_KEY_PROVIDER_OPTIONS } from "@/lib/api-key-providers";
import {
 AI_TASK_REGISTRY,
 aiActivityStatusSchema,
 aiTaskIdSchema,
 type AiActivityCursor,
} from "@/lib/ai-task-contract";

import { aiActivityResponseSchema } from "./ai-task-settings.schema";
import { getAiTaskCopyKey } from "./AiTaskSettingsSection";

const ALL_FILTER = "all";

export function AiActivitySettings() {
 const t = useTranslations("AiSettings.activity");
 const taskT = useTranslations("AiSettings.taskRouting.tasks");
 const locale = useLocale();
 const [taskId, setTaskId] = useState(ALL_FILTER);
 const [provider, setProvider] = useState(ALL_FILTER);
 const [status, setStatus] = useState(ALL_FILTER);
 const [cursor, setCursor] = useState<AiActivityCursor | null>(null);
 const queryClient = useQueryClient();
 const activityQueryKey = ["settings", "ai-activity", taskId, provider, status, cursor];
 const activityQuery = useQuery({
  queryKey: activityQueryKey,
  retry: false,
  queryFn: async () => {
   const params = new URLSearchParams();
   if (taskId !== ALL_FILTER) params.set("taskId", aiTaskIdSchema.parse(taskId));
   if (provider !== ALL_FILTER) params.set("provider", provider);
   if (status !== ALL_FILTER) params.set("status", aiActivityStatusSchema.parse(status));
   if (cursor !== null) {
    params.set("cursorCreatedAt", cursor.createdAt);
    params.set("cursorId", cursor.id);
   }
   const response = await fetch(`/api/settings/ai-activity?${params.toString()}`, {
    cache: "no-store",
   });
   if (!response.ok) throw new Error("load_failed");
   return aiActivityResponseSchema.parse(await response.json());
  },
 });
 const clearMutation = useMutation({
  retry: false,
  mutationFn: async () => {
   const response = await fetch("/api/settings/ai-activity", { method: "DELETE" });
   if (!response.ok) throw new Error("clear_failed");
  },
  onSuccess: async () => {
   setCursor(null);
   await queryClient.invalidateQueries({ queryKey: ["settings", "ai-activity"] });
  },
 });
 const events = activityQuery.data?.events ?? [];
 const summaryGroups = activityQuery.data?.summaryGroups ?? [];
 const nextCursor = activityQuery.data?.nextCursor ?? null;
 const isLoading = activityQuery.isPending || activityQuery.isFetching;
 const loadError = activityQuery.isError || clearMutation.isError;

 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div className="grid gap-1">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      {t("title")}
     </Typography>
     <Typography tone="muted">{t("description")}</Typography>
    </div>
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     onClick={() => clearMutation.mutate()}
     disabled={events.length === 0 || clearMutation.isPending}
    >
     <Trash2 data-icon="inline-start" />
     {t("clear")}
    </Button>
   </div>
   <div className="grid gap-3 md:grid-cols-3">
    <Select
     value={taskId}
     onValueChange={(value) => {
      setTaskId(value);
      setCursor(null);
     }}
    >
     <SelectTrigger aria-label={t("taskFilter")}>
      <SelectValue />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value={ALL_FILTER}>{t("allTasks")}</SelectItem>
      {AI_TASK_REGISTRY.map((task) => (
       <SelectItem key={task.id} value={task.id}>
        {taskT(`${getAiTaskCopyKey(task.id)}.title`)}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>
    <Select
     value={provider}
     onValueChange={(value) => {
      setProvider(value);
      setCursor(null);
     }}
    >
     <SelectTrigger aria-label={t("providerFilter")}>
      <SelectValue />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value={ALL_FILTER}>{t("allProviders")}</SelectItem>
      {API_KEY_PROVIDER_OPTIONS.map((option) => (
       <SelectItem key={option.value} value={option.value}>
        {option.label}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>
    <Select
     value={status}
     onValueChange={(value) => {
      setStatus(value);
      setCursor(null);
     }}
    >
     <SelectTrigger aria-label={t("statusFilter")}>
      <SelectValue />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value={ALL_FILTER}>{t("allStatuses")}</SelectItem>
      {aiActivityStatusSchema.options.map((value) => (
       <SelectItem key={value} value={value}>
        {t(`statuses.${value}`)}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>
   </div>
   {loadError ? (
    <div className="flex items-center gap-2" role="alert">
     <Typography tone="danger">{t("loadError")}</Typography>
     <Button
      type="button"
      variant="outline"
      size="compact"
      onClick={() => void activityQuery.refetch()}
     >
      <RefreshCcw data-icon="inline-start" />
      {t("retry")}
     </Button>
    </div>
   ) : null}
   {!isLoading && !loadError && events.length === 0 ? (
    <Typography tone="muted">{t("empty")}</Typography>
   ) : null}
   {summaryGroups.length > 0 ? (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
     {summaryGroups.map((group) => (
      <Card
       key={`${group.taskId}:${group.provider}:${group.model}`}
       variant="subtle"
       padding="sm"
       className="grid gap-1"
      >
       <Typography variant="bodySmall" weight="semibold">
        {taskT(`${getAiTaskCopyKey(group.taskId)}.title`)}
       </Typography>
       <Typography variant="caption" tone="muted" wrapping="breakWords">
        {group.provider} · {group.model}
       </Typography>
       <Typography variant="caption" tone="muted">
        {t("summary", {
         attempts: group.attempts,
         successRate: Math.round(group.successRate),
         inputTokens: group.inputTokens,
         outputTokens: group.outputTokens,
        })}
       </Typography>
       {group.averageLatencyMs !== null ? (
        <Typography variant="caption" tone="muted">
         {t("summaryLatency", { latency: group.averageLatencyMs })}
        </Typography>
       ) : null}
      </Card>
     ))}
    </div>
   ) : null}
   <div className="grid gap-2">
    {events.map((event) => (
     <div
      key={event.id}
      className="grid gap-2 rounded-lg border border-border-default px-3 py-2 md:grid-cols-[minmax(0,1fr)_auto]"
     >
      <div className="min-w-0">
       <Typography variant="bodySmall" weight="semibold">
        {taskT(`${getAiTaskCopyKey(event.taskId)}.title`)}
       </Typography>
       <Typography variant="caption" tone="muted" wrapping="breakWords">
        {[event.provider, event.model, event.keyLabel].filter(Boolean).join(" · ") ||
         t("noRuntime")}
       </Typography>
       {event.latencyMs !== null || event.inputTokens !== null || event.outputTokens !== null ? (
        <Typography variant="caption" tone="muted">
         {[
          event.latencyMs === null ? null : t("metricsLatency", { latency: event.latencyMs }),
          event.inputTokens === null && event.outputTokens === null
           ? null
           : t("metricsTokens", {
              inputTokens: event.inputTokens ?? 0,
              outputTokens: event.outputTokens ?? 0,
             }),
         ]
          .filter(Boolean)
          .join(" · ")}
        </Typography>
       ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
       {event.resourceType === "conversation" && event.resourceId ? (
        <Button asChild type="button" variant="ghost" size="compact">
         <Link href={`/conversation?conversation=${event.resourceId}`}>
          {t("openConversation")}
         </Link>
        </Button>
       ) : null}
       <Badge
        variant={
         event.status === "success" ? "success" : event.status === "blocked" ? "warning" : "default"
        }
        casing="natural"
       >
        {t(`statuses.${event.status}`)}
       </Badge>
       <Typography variant="caption" tone="muted">
        {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
         new Date(event.createdAt),
        )}
       </Typography>
      </div>
     </div>
    ))}
   </div>
   {isLoading ? (
    <div className="flex items-center gap-2">
     <Spinner />
     <Typography tone="muted">{t("loading")}</Typography>
    </div>
   ) : null}
   {nextCursor && !isLoading ? (
    <Button type="button" variant="outline" onClick={() => setCursor(nextCursor)}>
     {t("loadMore")}
    </Button>
   ) : null}
  </Card>
 );
}
