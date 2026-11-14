"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Typography } from "@/components/ui/display/typography";
import { aiTaskGroupSchema, type AiTaskAssignment, type AiTaskId } from "@/lib/ai/ai-task-contract";

import { AiTaskSettingsTaskCard } from "./AiTaskSettingsTaskCard";

const taskGroups = [aiTaskGroupSchema.enum.main, aiTaskGroupSchema.enum.advanced];
const taskSettingsQueryKey = ["settings", "ai-tasks"];

import {
 aiTaskSettingsResponseSchema,
 aiTaskRuntimeCheckResponseSchema,
 aiTaskUpdateResponseSchema,
 type AiTaskRuntimeCheckResponse,
 type AiTaskSettingsResponse,
} from "../model/ai-task-settings.schema";

export { getAiTaskCopyKey } from "../model/ai-task-copy-key";

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
      .map((task) => (
       <AiTaskSettingsTaskCard
        key={task.id}
        task={task}
        keys={data.keys}
        runtimeChecks={runtimeChecks}
        isSaving={savingTaskId === task.id}
        isChecking={checkingTaskId === task.id}
        checkRequestFailed={checkMutation.isError && checkMutation.variables === task.id}
        onCheck={(taskId) => checkMutation.mutate(taskId)}
        onSave={save}
        onCustomizeLookup={onCustomizeLookup}
       />
      ))}
    </section>
   ))}
  </div>
 );
}
