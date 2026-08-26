"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";

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
 aiTaskRoutingModeSchema,
 aiTaskGroupSchema,
 type AiTaskAssignment,
 type AiTaskId,
} from "@/lib/ai-task-contract";

const taskGroups = [aiTaskGroupSchema.enum.main, aiTaskGroupSchema.enum.advanced];
const taskSettingsQueryKey = ["settings", "ai-tasks"];

import {
 aiTaskSettingsResponseSchema,
 aiTaskUpdateResponseSchema,
 type AiTaskSettingsResponse,
} from "./ai-task-settings.schema";

function taskCopyKey(taskId: AiTaskId) {
 if (taskId === "conversation.reply") return "conversationReply";
 if (taskId === "lookup.quick") return "lookupQuick";
 if (taskId === "lookup.deep") return "lookupDeep";
 if (taskId === "daily-reading.translation") return "dailyReadingTranslation";
 if (taskId === "daily-reading.vocabulary") return "dailyReadingVocabulary";
 if (taskId === "daily-reading.grammar") return "dailyReadingGrammar";
 if (taskId === "daily-reading.questions") return "dailyReadingQuestions";
 if (taskId === "conversation.summary") return "conversationSummary";
 if (taskId === "conversation.memory-extraction") return "conversationMemoryExtraction";
 return "conversationSemanticMemory";
}

export function AiTaskSettingsSection() {
 const t = useTranslations("AiSettings.taskRouting");
 const queryClient = useQueryClient();
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
   return aiTaskUpdateResponseSchema.parse(await response.json()).assignment;
  },
  onSuccess: (saved) => {
   queryClient.setQueryData<AiTaskSettingsResponse>(taskSettingsQueryKey, (current) =>
    current
     ? {
        ...current,
        tasks: current.tasks.map((task) =>
         task.id === saved.taskId ? { ...task, assignment: saved } : task,
        ),
       }
     : current,
   );
  },
 });
 const data = taskSettingsQuery.data;
 const savingTaskId = saveMutation.isPending ? saveMutation.variables.taskId : null;
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
       const copyKey = taskCopyKey(task.id);
       const compatibleKeys = data.keys.filter(
        (key) => key.isActive && key.capabilities.includes(task.capability),
       );
       const assigned = task.assignment.mode === "assigned" ? task.assignment : null;
       const autoKey = task.assignment.mode === "auto" ? compatibleKeys[0] : null;
       const selectedKey = assigned
        ? compatibleKeys.find((key) => key.keyId === assigned.keyId)
        : null;
       return (
        <Card key={task.id} variant="section" padding="lg" className="grid gap-4">
         <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid gap-1">
           <Typography as="h3" variant="cardTitle" weight="bold">
            {t(`tasks.${copyKey}.title`)}
           </Typography>
           <Typography variant="bodySmall" tone="muted">
            {t(`tasks.${copyKey}.when`)}
           </Typography>
          </div>
          {savingTaskId === task.id ? <Spinner /> : null}
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
         <div className="grid gap-3 md:grid-cols-3">
          <Select
           value={task.assignment.mode}
           onValueChange={(value) => {
            const mode = aiTaskRoutingModeSchema.parse(value);
            if (mode === "assigned") {
             const key = compatibleKeys[0];
             const model = key?.defaultModel ?? key?.models[0]?.value;
             if (key && model) save({ taskId: task.id, mode, keyId: key.keyId, model });
             return;
            }
            save({ taskId: task.id, mode, keyId: null, model: null });
           }}
          >
           <SelectTrigger aria-label={t("mode")}>
            <SelectValue />
           </SelectTrigger>
           <SelectContent>
            <SelectItem value="auto">{t("modes.auto")}</SelectItem>
            <SelectItem value="assigned" disabled={compatibleKeys.length === 0}>
             {t("modes.assigned")}
            </SelectItem>
            <SelectItem value="disabled">{t("modes.disabled")}</SelectItem>
           </SelectContent>
          </Select>
          {assigned ? (
           <>
            <Select
             value={assigned.keyId}
             onValueChange={(keyId) => {
              const key = compatibleKeys.find((candidate) => candidate.keyId === keyId);
              const model = key?.defaultModel ?? key?.models[0]?.value;
              if (key && model) save({ taskId: task.id, mode: "assigned", keyId, model });
             }}
            >
             <SelectTrigger aria-label={t("key")}>
              <SelectValue />
             </SelectTrigger>
             <SelectContent>
              {compatibleKeys.map((key) => (
               <SelectItem key={key.keyId} value={key.keyId}>
                {key.providerLabel} · {key.label}
               </SelectItem>
              ))}
             </SelectContent>
            </Select>
            <Select
             value={assigned.model}
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
              {selectedKey?.models.map((model) => (
               <SelectItem key={model.value} value={model.value}>
                {model.label}
               </SelectItem>
              ))}
             </SelectContent>
            </Select>
           </>
          ) : (
           <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <Badge
             variant={task.assignment.mode === "disabled" ? "warning" : "default"}
             casing="natural"
            >
             {task.assignment.mode === "disabled" ? t("disabledStatus") : t("autoStatus")}
            </Badge>
            {autoKey ? (
             <Typography variant="caption" tone="muted" wrapping="breakWords">
              {autoKey.providerLabel} · {autoKey.label} ·{" "}
              {autoKey.defaultModel ?? autoKey.models[0]?.label}
             </Typography>
            ) : null}
           </div>
          )}
         </div>
        </Card>
       );
      })}
    </section>
   ))}
  </div>
 );
}
