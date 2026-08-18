"use client";

import { BookOpenText, CheckCircle2, RefreshCcw, Search, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";

import {
 generateDailyReadingNow,
 testDailyReadingSource,
 useDailyReadingLibrary,
 useDailyReadingSettings,
} from "./daily-reading-client";
import {
 dailyReadingLevelSchema,
 type DailyReadingGenerationStage,
} from "./daily-reading.schemas";
import { resolveDailyReadingReleaseState } from "./daily-reading.scheduler";
import { removeGeneratedDailyReadings } from "./daily-reading-storage.client";

type PipelineTitleKey =
 | "settings.pipeline.schedule"
 | "settings.pipeline.source"
 | "settings.pipeline.reading"
 | "settings.pipeline.learning"
 | "settings.pipeline.validate"
 | "settings.pipeline.save";
type PipelineDescriptionKey =
 | "settings.pipeline.scheduleDescription"
 | "settings.pipeline.sourceDescription"
 | "settings.pipeline.readingDescription"
 | "settings.pipeline.learningDescription"
 | "settings.pipeline.validateDescription"
 | "settings.pipeline.saveDescription";
type PipelineStep = {
 key: string;
 title: PipelineTitleKey;
 description: PipelineDescriptionKey;
};

const pipelineSteps: readonly PipelineStep[] = [
 { key: "schedule", title: "settings.pipeline.schedule", description: "settings.pipeline.scheduleDescription" },
 { key: "source", title: "settings.pipeline.source", description: "settings.pipeline.sourceDescription" },
 { key: "reading", title: "settings.pipeline.reading", description: "settings.pipeline.readingDescription" },
 { key: "learning", title: "settings.pipeline.learning", description: "settings.pipeline.learningDescription" },
 { key: "validate", title: "settings.pipeline.validate", description: "settings.pipeline.validateDescription" },
 { key: "save", title: "settings.pipeline.save", description: "settings.pipeline.saveDescription" },
];

function pipelineIndex(stage: DailyReadingGenerationStage | null) {
 if (stage === null) return -1;
 if (stage === "discovering" || stage === "extracting") return 1;
 if (stage === "drafting" || stage === "repairing_core") return 2;
 if (stage === "enriching" || stage === "repairing_learning") return 3;
 if (stage === "validating" || stage === "finalizing") return 4;
 return 5;
}

export function DailyReadingSettingsPanel() {
 const t = useTranslations("DailyReading");
 const { settings, update } = useDailyReadingSettings();
 const library = useDailyReadingLibrary();
 const [testingSource, setTestingSource] = useState(false);
 const [generating, setGenerating] = useState(false);
 const [manualStage, setManualStage] = useState<DailyReadingGenerationStage | null>(null);
 const [confirmClearOpen, setConfirmClearOpen] = useState(false);
 const release = resolveDailyReadingReleaseState();
 const latestRuns = library.runs.slice(0, 6);
 const latestRun = library.runs[0];
 const scheduledToday = useMemo(
  () =>
   library.items.some(
    (item) => item.releaseKind === "scheduled" && item.publishedDate === release.dateKey,
   ),
  [library.items, release.dateKey],
 );
 const observedStage =
  manualStage ?? (latestRun?.status === "pending" ? latestRun.stage : scheduledToday ? "completed" : null);
 const activePipelineIndex = observedStage === null && release.isDue ? 0 : pipelineIndex(observedStage);

 async function handleTestSource() {
  setTestingSource(true);
  try {
   const result = await testDailyReadingSource();
   toast.success(
    t("settings.toast.sourceReady", {
     publisher: result.source.publisher,
     title: result.source.titleZh,
    }),
   );
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("settings.toast.sourceFailed"));
  } finally {
   setTestingSource(false);
  }
 }

 async function handleGenerate() {
  setGenerating(true);
  setManualStage("discovering");
  try {
   const reading = await generateDailyReadingNow("manual", settings.preferredLevel, {
    onProgress: setManualStage,
   });
   toast.success(t("settings.toast.created", { title: reading.titleZh }));
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("settings.toast.generationFailed"));
  } finally {
   setGenerating(false);
   setManualStage(null);
  }
 }

 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div className="grid gap-1">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      {t("settings.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" className="max-w-3xl">
      {t("settings.description")}
     </Typography>
    </div>
    <Badge variant={settings.autoGenerateEnabled ? "success" : "default"} size="md">
     {settings.autoGenerateEnabled ? t("settings.auto.on") : t("settings.auto.off")}
    </Badge>
   </div>

   <Separator />

   <div className="grid gap-4 md:grid-cols-2">
    <div className="flex min-w-0 items-start justify-between gap-4">
     <div className="grid min-w-0 gap-1">
      <Typography as="h3" variant="cardTitle" weight="bold">
       {t("settings.auto.title")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("settings.auto.description")}
      </Typography>
     </div>
     <Switch
      checked={settings.autoGenerateEnabled}
      onCheckedChange={(checked) => update({ autoGenerateEnabled: checked })}
      aria-label={t("settings.auto.aria")}
     />
    </div>

    <div className="grid gap-2">
     <Label htmlFor="daily-reading-level" variant="label" weight="semibold">
      {t("settings.level.label")}
     </Label>
     <Select
      value={settings.preferredLevel}
      onValueChange={(value) => update({ preferredLevel: dailyReadingLevelSchema.parse(value) })}
     >
      <SelectTrigger id="daily-reading-level" width="full">
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
       <SelectItem value="HSK4">HSK 4</SelectItem>
       <SelectItem value="HSK5">HSK 5</SelectItem>
       <SelectItem value="HSK6">HSK 6</SelectItem>
      </SelectContent>
     </Select>
    </div>
   </div>

   <Card variant="subtle" padding="md" className="grid gap-3 sm:grid-cols-3">
    <div className="grid gap-1">
     <Typography variant="caption" tone="muted" weight="bold">
      {t("settings.summary.scheduleLabel")}
     </Typography>
     <Typography weight="semibold">{t("settings.summary.scheduleValue")}</Typography>
    </div>
    <div className="grid gap-1">
     <Typography variant="caption" tone="muted" weight="bold">
      {t("settings.summary.libraryLabel")}
     </Typography>
     <Typography weight="semibold">
      {t("settings.summary.libraryValue", { count: library.items.length })}
     </Typography>
    </div>
    <div className="grid gap-1">
     <Typography variant="caption" tone="muted" weight="bold">
      {t("settings.summary.todayLabel")}
     </Typography>
     <Typography weight="semibold">
      {scheduledToday
       ? t("settings.summary.todayReady")
       : release.isDue
         ? t("settings.summary.todayDue")
         : t("settings.summary.todayWaiting")}
     </Typography>
    </div>
   </Card>

   <div className="flex flex-wrap items-center gap-2">
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     onClick={() => void handleTestSource()}
     disabled={testingSource || generating}
    >
     {testingSource ? <Spinner data-icon="inline-start" /> : <Search data-icon="inline-start" />}
     {t("settings.actions.testSource")}
    </Button>
    <Button
     type="button"
     size="toolbar"
     onClick={() => void handleGenerate()}
     disabled={testingSource || generating}
    >
     {generating ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
     {t("settings.actions.generateNow")}
    </Button>
    {library.items.length > 0 ? (
     <Button
      type="button"
      variant="ghost"
      size="toolbar"
      onClick={() => setConfirmClearOpen(true)}
     >
      <Trash2 data-icon="inline-start" />
      {t("settings.actions.clear")}
     </Button>
    ) : null}
   </div>

   <Separator />

   <div className="grid gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="bold">
      {t("settings.pipeline.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("settings.pipeline.description")}
     </Typography>
    </div>
    <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
     {pipelineSteps.map((step, index) => {
      const completed = scheduledToday || activePipelineIndex > index;
      const active = !scheduledToday && activePipelineIndex === index;
      return (
       <li key={step.key} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <Badge variant={completed ? "success" : active ? "info" : "default"} size="sm">
         {completed ? "✓" : index + 1}
        </Badge>
        <div className="grid min-w-0 gap-1">
         <Typography variant="label" weight="bold">
          {t(step.title)}
         </Typography>
         <Typography variant="caption" tone="muted">
          {t(step.description)}
         </Typography>
        </div>
       </li>
      );
     })}
    </ol>
   </div>

   <Separator />

   <div className="grid gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="bold">
      {t("settings.history.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("settings.history.description")}
     </Typography>
    </div>
    {latestRuns.length === 0 ? (
     <Typography variant="bodySmall" tone="muted">
      {t("settings.history.empty")}
     </Typography>
    ) : (
     <div className="grid gap-2">
      {latestRuns.map((run) => (
       <div key={run.id} className="flex min-w-0 flex-wrap items-center gap-2">
        {run.status === "succeeded" ? (
         <CheckCircle2 aria-hidden />
        ) : run.status === "pending" ? (
         <RefreshCcw aria-hidden />
        ) : (
         <BookOpenText aria-hidden />
        )}
        <Typography variant="bodySmall" weight="semibold">
         {run.kind === "scheduled" ? t("generated.kind.scheduled") : t("generated.kind.manual")} ·{" "}
         {run.date}
        </Typography>
        <Badge
         variant={
          run.status === "succeeded" ? "success" : run.status === "pending" ? "info" : "warning"
         }
         size="sm"
        >
         {run.status === "succeeded"
          ? t("settings.history.succeeded")
          : run.status === "pending"
            ? t("settings.history.pending")
            : t("settings.history.failed")}
        </Badge>
        {run.errorDetail ? (
         <Typography variant="caption" tone="muted" className="min-w-0 flex-1">
          {run.errorDetail}
         </Typography>
        ) : null}
       </div>
      ))}
     </div>
    )}
   </div>

   <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
    <DialogContent size="sm">
     <DialogHeader>
      <DialogTitle>{t("settings.clearDialog.title")}</DialogTitle>
      <DialogDescription>{t("settings.clearDialog.description")}</DialogDescription>
     </DialogHeader>
     <DialogBody>
      <Typography variant="bodySmall" tone="muted">
       {t("settings.clearDialog.body", { count: library.items.length })}
      </Typography>
     </DialogBody>
     <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setConfirmClearOpen(false)}>
       {t("settings.clearDialog.cancel")}
      </Button>
      <Button
       type="button"
       variant="destructive"
       onClick={() => {
        removeGeneratedDailyReadings();
        setConfirmClearOpen(false);
        toast.success(t("settings.toast.cleared"));
       }}
      >
       {t("settings.clearDialog.confirm")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </Card>
 );
}
