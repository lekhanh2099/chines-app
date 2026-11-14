"use client";

import { RefreshCcw, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Typography } from "@/components/ui/display/typography";
import {
 AI_SEMANTIC_MEMORY_MODEL,
 type AiTaskAssignment,
 type AiTaskId,
} from "@/lib/ai/ai-task-contract";

import { getAiTaskCopyKey } from "../model/ai-task-copy-key";
import type {
 AiTaskRuntimeCheckResponse,
 AiTaskSettingsResponse,
} from "../model/ai-task-settings.schema";

type AiTaskSettingsTaskCardProps = {
 task: AiTaskSettingsResponse["tasks"][number];
 keys: AiTaskSettingsResponse["keys"];
 runtimeChecks: AiTaskRuntimeCheckResponse[];
 isSaving: boolean;
 isChecking: boolean;
 checkRequestFailed: boolean;
 onCheck: (taskId: AiTaskId) => void;
 onSave: (assignment: AiTaskAssignment) => void;
 onCustomizeLookup?: () => void;
};

export function AiTaskSettingsTaskCard({
 task,
 keys,
 runtimeChecks,
 isSaving,
 isChecking,
 checkRequestFailed,
 onCheck,
 onSave: save,
 onCustomizeLookup,
}: AiTaskSettingsTaskCardProps) {
 const t = useTranslations("AiSettings.taskRouting");
 const copyKey = getAiTaskCopyKey(task.id);
 const compatibleKeys = keys.filter((key) => key.capabilities.includes(task.capability));
 const assigned = task.assignment.mode === "assigned" ? task.assignment : null;
 const selectedKey = assigned ? compatibleKeys.find((key) => key.keyId === assigned.keyId) : null;
 const selectedKeyModels =
  task.id === "conversation.semantic-memory"
   ? [{ value: AI_SEMANTIC_MEMORY_MODEL, label: "Gemini Embedding 001" }]
   : (selectedKey?.models ?? []);
 const sourceValue = assigned?.keyId ?? task.assignment.mode;
 const previewReceipt = task.runtimePreview.receipt;
 const runtimeCheck = runtimeChecks.find((candidate) => candidate.taskId === task.id);
 return (
  <Card
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
      onClick={() => onCheck(task.id)}
      disabled={isChecking}
     >
      {isChecking ? <Spinner data-icon="inline-start" /> : <RefreshCcw data-icon="inline-start" />}
      {t("checkRuntime")}
     </Button>
     {isSaving ? <Spinner /> : null}
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
      <Badge variant={task.assignment.mode === "disabled" ? "warning" : "default"} casing="natural">
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
   {checkRequestFailed ? (
    <Typography role="alert" variant="caption" tone="danger">
     {t("checkRequestFailed")}
    </Typography>
   ) : null}
  </Card>
 );
}
