"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, RefreshCcw, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
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
import {
 AI_SEMANTIC_MEMORY_MODEL,
 aiTaskGroupSchema,
 type AiTaskAssignment,
 type AiTaskId,
} from "@/lib/ai-task-contract";

const taskGroups = [aiTaskGroupSchema.enum.main, aiTaskGroupSchema.enum.advanced];
const taskSettingsQueryKey = ["settings", "ai-tasks"];

import {
 aiTaskSettingsResponseSchema,
 aiTaskRuntimeCheckResponseSchema,
 aiTaskUpdateResponseSchema,
 type AiTaskRuntimeCheckResponse,
 type AiTaskSettingsResponse,
} from "./ai-task-settings.schema";

export function getAiTaskCopyKey(taskId: AiTaskId) {
 if (taskId === "conversation.reply") return "conversationReply";
 if (taskId === "lookup.quick") return "lookupQuick";
 if (taskId === "lookup.deep") return "lookupDeep";
 if (taskId === "daily-reading.translation") return "dailyReadingTranslation";
 if (taskId === "daily-reading.vocabulary") return "dailyReadingVocabulary";
 if (taskId === "daily-reading.grammar") return "dailyReadingGrammar";
 if (taskId === "daily-reading.questions") return "dailyReadingQuestions";
 if (taskId === "conversation.summary") return "conversationSummary";
 if (taskId === "conversation.memory-extraction") return "conversationMemoryExtraction";
 if (taskId === "conversation.semantic-memory") return "conversationSemanticMemory";
 throw new Error(`Missing AI task copy for ${taskId}`);
}

export function AiTaskSettingsSection({ onCustomizeLookup }: { onCustomizeLookup?: () => void }) {
 const t = useTranslations("AiSettings.taskRouting");
 const queryClient = useQueryClient();
 const [runtimeChecks, setRuntimeChecks] = useState<AiTaskRuntimeCheckResponse[]>([]);
 const taskSettingsQuery = useQuery({
  queryKey: taskSettingsQueryKey,
  retry: false,
  queryFn: async () => {
   const response = await fetch("/api/settings/ai-tasks", { cache: "no-store" });
   if (!response.ok) throw new Error("load_failed");
   return aiTaskSettingsResponseSchema.parse(await response.json());
  },
 });
 const saveMutation = useMutation({
  retry: false,
  mutationFn: async (assignment: AiTaskAssignment) => {
   const response = await fetch("/api/settings/ai-tasks", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assignment),
   });
   if (!response.ok) throw new Error("save_failed");
   return aiTaskUpdateResponseSchema.parse(await response.json());
  },
  onSuccess: (saved) => {
   queryClient.setQueryData<AiTaskSettingsResponse>(taskSettingsQueryKey, (current) =>
    current
     ? {
        ...current,
        tasks: current.tasks.map((task) =>
         task.id === saved.assignment.taskId
          ? {
             ...task,
             assignment: saved.assignment,
             runtimePreview: saved.runtimePreview,
            }
          : task,
        ),
       }
     : current,
   );
  },
 });
 const data = taskSettingsQuery.data;
 const checkMutation = useMutation({
  retry: false,
  mutationFn: async (taskId: AiTaskId) => {
   const response = await fetch("/api/settings/ai-tasks/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId }),
   });
   if (!response.ok) throw new Error("check_failed");
   return aiTaskRuntimeCheckResponseSchema.parse(await response.json());
  },
  onSuccess: (result) =>
   setRuntimeChecks((current) => [
    result,
    ...current.filter((candidate) => candidate.taskId !== result.taskId),
   ]),
 });
 const savingTaskId = saveMutation.isPending ? saveMutation.variables.taskId : null;
 const checkingTaskId = checkMutation.isPending ? checkMutation.variables : null;
 const save = (assignment: AiTaskAssignment) => saveMutation.mutate(assignment);

 if (!data) {
  return (
   <Card variant="section" padding="lg">
    <div className="flex items-center gap-2">
     {taskSettingsQuery.isError ? (
      <>
       <Typography tone="danger">{t("loadError")}</Typography>
       <Button
        type="button"
        variant="outline"
        size="compact"
        onClick={() => void taskSettingsQuery.refetch()}
       >
        <RefreshCcw data-icon="inline-start" />
        {t("retry")}
       </Button>
      </>
     ) : (
      <>
       <Spinner />
       <Typography tone="muted">{t("loading")}</Typography>
      </>
     )}
    </div>
   </Card>
  );
 }

 return (
  <div className="grid gap-5">
   <Card variant="section" padding="lg" className="grid gap-2">
    <div className="flex items-center gap-2">
     <BrainCircuit className="size-5" aria-hidden="true" />
     <Typography as="h2" variant="sectionTitle" weight="bold">
      {t("title")}
     </Typography>
    </div>
    <Typography tone="muted">{t("description")}</Typography>
    {saveMutation.isError ? (
     <Typography role="alert" tone="danger">
      {t("saveError")}
     </Typography>
    ) : null}
   </Card>
   {taskGroups.map((group) => (
    <section key={group} className="grid gap-3" aria-labelledby={`ai-task-group-${group}`}>
     <Typography as="h2" id={`ai-task-group-${group}`} variant="cardTitle" weight="bold">
      {t(`groups.${group}`)}
     </Typography>
     {data.tasks
      .filter((task) => task.group === group)
      .map((task) => {
       const copyKey = getAiTaskCopyKey(task.id);
       const compatibleKeys = data.keys.filter((key) => key.capabilities.includes(task.capability));
       const assigned = task.assignment.mode === "assigned" ? task.assignment : null;
       const selectedKey = assigned
        ? compatibleKeys.find((key) => key.keyId === assigned.keyId)
        : null;
       const selectedKeyModels =
        task.id === "conversation.semantic-memory"
         ? [{ value: AI_SEMANTIC_MEMORY_MODEL, label: "Gemini Embedding 001" }]
         : (selectedKey?.models ?? []);
       const sourceValue = assigned?.keyId ?? task.assignment.mode;
       const previewReceipt = task.runtimePreview.receipt;
       const runtimeCheck = runtimeChecks.find((candidate) => candidate.taskId === task.id);
       return (
        <Card
         key={task.id}
         id={task.id === "lookup.deep" ? "lookup-deep" : task.id}
         variant="section"
         padding="lg"
         className="grid gap-4"
        >
         <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid gap-1">
           <Typography as="h3" variant="cardTitle" weight="bold">
            {t(`tasks.${copyKey}.title`)}
           </Typography>
           <Typography variant="bodySmall" tone="muted">
            {t(`tasks.${copyKey}.when`)}
           </Typography>
          </div>
          <div className="flex flex-wrap items-center gap-2">
           {task.id === "lookup.deep" && onCustomizeLookup ? (
            <Button type="button" variant="outline" size="compact" onClick={onCustomizeLookup}>
             <SlidersHorizontal data-icon="inline-start" />
             {t("customizeLookup")}
            </Button>
           ) : null}
           <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={() => checkMutation.mutate(task.id)}
            disabled={checkingTaskId === task.id}
           >
            {checkingTaskId === task.id ? (
             <Spinner data-icon="inline-start" />
            ) : (
             <RefreshCcw data-icon="inline-start" />
            )}
            {t("checkRuntime")}
           </Button>
           {savingTaskId === task.id ? <Spinner /> : null}
          </div>
         </div>
         <div className="grid gap-2 text-sm md:grid-cols-3">
          <div>
           <Typography variant="caption" tone="muted">
            {t("dataSent")}
           </Typography>
           <Typography variant="bodySmall">{t(`tasks.${copyKey}.data`)}</Typography>
          </div>
          <div>
           <Typography variant="caption" tone="muted">
            {t("expectedOutput")}
           </Typography>
           <Typography variant="bodySmall">{t(`tasks.${copyKey}.output`)}</Typography>
          </div>
          <div>
           <Typography variant="caption" tone="muted">
            {t("storage")}
           </Typography>
           <Typography variant="bodySmall">{t(`tasks.${copyKey}.storage`)}</Typography>
          </div>
         </div>
         <div className="grid gap-3 md:grid-cols-2">
          <Select
           value={sourceValue}
           onValueChange={(value) => {
            if (value === "auto" || value === "disabled") {
             save({ taskId: task.id, mode: value, keyId: null, model: null });
             return;
            }
            const key = compatibleKeys.find((candidate) => candidate.keyId === value);
            const model =
             task.id === "conversation.semantic-memory"
              ? AI_SEMANTIC_MEMORY_MODEL
              : (key?.defaultModel ?? key?.models[0]?.value);
            if (key?.availability === "ready" && model) {
             save({ taskId: task.id, mode: "assigned", keyId: key.keyId, model });
            }
           }}
          >
           <SelectTrigger aria-label={t("source")}>
            <SelectValue />
           </SelectTrigger>
           <SelectContent>
            <SelectItem value="auto">
             {previewReceipt && task.assignment.mode === "auto"
              ? t("sources.autoWithRuntime", {
                 provider: previewReceipt.provider,
                 key: previewReceipt.keyLabel,
                 model: previewReceipt.model,
                })
              : t("sources.auto")}
            </SelectItem>
            {compatibleKeys.map((key) => (
             <SelectItem key={key.keyId} value={key.keyId} disabled={key.availability !== "ready"}>
              {key.providerLabel} · {key.label}
              {key.availability === "paused"
               ? ` — ${t("keyPaused")}`
               : key.availability === "credential-unreadable"
                 ? ` — ${t("keyUnreadable")}`
                 : ""}
             </SelectItem>
            ))}
            <SelectItem value="disabled">{t("sources.disabled")}</SelectItem>
           </SelectContent>
          </Select>
          {assigned ? (
           <div className="grid gap-2">
            <Select
             value={assigned.model}
             disabled={selectedKey?.availability !== "ready"}
             onValueChange={(model) =>
              save({
               taskId: task.id,
               mode: "assigned",
               keyId: assigned.keyId,
               model,
              })
             }
            >
             <SelectTrigger aria-label={t("model")}>
              <SelectValue />
             </SelectTrigger>
             <SelectContent>
              {selectedKeyModels.map((model) => (
               <SelectItem key={model.value} value={model.value}>
                {model.label}
               </SelectItem>
              ))}
             </SelectContent>
            </Select>
            {selectedKey?.availability === "credential-unreadable" ? (
             <Typography variant="caption" tone="warning">
              {t("keyUnreadableHelp")}
             </Typography>
            ) : null}
           </div>
          ) : (
           <div className="flex flex-wrap items-center gap-2">
            <Badge
             variant={task.assignment.mode === "disabled" ? "warning" : "default"}
             casing="natural"
            >
             {task.assignment.mode === "disabled" ? t("disabledStatus") : t("autoStatus")}
            </Badge>
            {previewReceipt ? (
             <Typography variant="caption" tone="muted" wrapping="breakWords">
              {previewReceipt.provider} · {previewReceipt.keyLabel} · {previewReceipt.model}
             </Typography>
            ) : (
             <Typography variant="caption" tone="warning">
              {t(`runtimeReasons.${task.runtimePreview.reason}`)}
             </Typography>
            )}
           </div>
          )}
         </div>
         {runtimeCheck ? (
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
           <Badge variant={runtimeCheck.ok ? "success" : "warning"} casing="natural">
            {runtimeCheck.ok ? t("checkSucceeded") : t("checkFailed")}
           </Badge>
           <Typography variant="caption" tone={runtimeCheck.ok ? "muted" : "warning"}>
            {runtimeCheck.receipt
             ? `${runtimeCheck.receipt.provider} · ${runtimeCheck.receipt.keyLabel} · ${runtimeCheck.receipt.model} · ${runtimeCheck.latencyMs} ms`
             : `${runtimeCheck.errorCode ?? "provider-unavailable"} · ${runtimeCheck.latencyMs} ms`}
           </Typography>
          </div>
         ) : null}
         {checkMutation.isError && checkMutation.variables === task.id ? (
          <Typography role="alert" variant="caption" tone="danger">
           {t("checkRequestFailed")}
          </Typography>
         ) : null}
        </Card>
       );
      })}
    </section>
   ))}
  </div>
 );
}
