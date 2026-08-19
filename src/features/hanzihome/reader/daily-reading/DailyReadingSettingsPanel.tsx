"use client";

import { ChevronDown, ChevronUp, KeyRound, RefreshCcw, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
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
import { useAiRuntimeReadiness } from "@/features/ai-runtime/useAiRuntimeReadiness";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { AddApiKeyDialog } from "@/features/settings/AddApiKeyDialog";
import { Link } from "@/i18n/navigation";

import {
 dailyReadingSourceCatalog,
 type DailyReadingSourceId,
} from "./daily-reading-source-catalog";
import { dailyReadingTopicSchema, type DailyReadingTopic } from "./daily-reading.schemas";
import {
 previewDailyReadingV2Source,
 useDailyReadingV2Settings,
} from "./daily-reading-v2-client";
import {
 dailyReadingV2FreshnessDaysSchema,
 dailyReadingV2LengthPreferenceSchema,
 dailyReadingV2NoMatchBehaviorSchema,
 dailyReadingV2SettingsSchema,
 type DailyReadingV2CaptureResponse,
 type DailyReadingV2Settings,
} from "./daily-reading-v2.schemas";

type TopicTranslationKey =
 | "generated.topic.culture"
 | "generated.topic.education"
 | "generated.topic.history"
 | "generated.topic.language"
 | "generated.topic.science"
 | "generated.topic.society"
 | "generated.topic.travel"
 | "generated.topic.environment"
 | "generated.topic.health";

function getTopicTranslationKey(topic: DailyReadingTopic): TopicTranslationKey {
 switch (topic) {
  case "culture":
   return "generated.topic.culture";
  case "education":
   return "generated.topic.education";
  case "history":
   return "generated.topic.history";
  case "language":
   return "generated.topic.language";
  case "science":
   return "generated.topic.science";
  case "society":
   return "generated.topic.society";
  case "travel":
   return "generated.topic.travel";
  case "environment":
   return "generated.topic.environment";
  case "health":
   return "generated.topic.health";
 }
}

function formatCaptureTime(settings: DailyReadingV2Settings) {
 return `${String(settings.captureTime.hour).padStart(2, "0")}:${String(settings.captureTime.minute).padStart(2, "0")}`;
}

export function DailyReadingSettingsPanel() {
 const t = useTranslations("DailyReading");
 const runtime = useAiRuntimeReadiness();
 const { settings, update } = useDailyReadingV2Settings();
 const [advancedOpen, setAdvancedOpen] = useState(false);
 const [testingSource, setTestingSource] = useState(false);
 const [sourcePreview, setSourcePreview] = useState<DailyReadingV2CaptureResponse | null>(null);

 function saveSettings(patch: Partial<DailyReadingV2Settings>) {
  try {
   update(patch);
  } catch {
   toast.error(t("v2.settings.toast.settingFailed"));
  }
 }

 function updateCaptureTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/u.exec(value);
  if (match === null) return;
  const parsed = dailyReadingV2SettingsSchema.shape.captureTime.safeParse({
   hour: Number(match[1]),
   minute: Number(match[2]),
  });
  if (parsed.success) saveSettings({ captureTime: parsed.data });
 }

 function toggleTopic(topic: DailyReadingTopic) {
  const selected = settings.selectedTopics.includes(topic);
  if (selected && settings.selectedTopics.length === 1) {
   toast.info(t("v2.settings.advanced.atLeastOneTopic"));
   return;
  }
  saveSettings({
   selectedTopics: selected
    ? settings.selectedTopics.filter((item) => item !== topic)
    : [...settings.selectedTopics, topic],
  });
 }

 function toggleSource(sourceId: DailyReadingSourceId, checked: boolean) {
  const selected = settings.selectedSources.includes(sourceId);
  if (!checked && selected && settings.selectedSources.length === 1) {
   toast.info(t("v2.settings.advanced.atLeastOneSource"));
   return;
  }
  saveSettings({
   selectedSources: checked
    ? selected
      ? settings.selectedSources
      : [...settings.selectedSources, sourceId]
    : settings.selectedSources.filter((item) => item !== sourceId),
  });
 }

 async function handleTestSource() {
  setTestingSource(true);
  try {
   const result = await previewDailyReadingV2Source();
   setSourcePreview(result);
   toast.success(
    t("v2.settings.toast.sourceReady", {
     publisher: result.reading.source.publisher,
     title: result.reading.article.titleZh,
    }),
   );
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("v2.settings.toast.sourceFailed"));
  } finally {
   setTestingSource(false);
  }
 }

 return (
  <Card variant="section" padding="lg" className="grid min-w-0 gap-5">
   <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="grid min-w-0 gap-1">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      {t("v2.settings.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" className="max-w-3xl">
      {t("v2.settings.description")}
     </Typography>
    </div>
    <Badge variant={settings.autoCaptureEnabled ? "success" : "default"} size="md">
     {settings.autoCaptureEnabled ? t("v2.library.autoOn") : t("v2.library.autoOff")}
    </Badge>
   </div>

   <Separator />

   <section className="grid gap-4" aria-labelledby="daily-reading-source-settings">
    <div className="grid gap-1">
     <Typography as="h3" id="daily-reading-source-settings" variant="cardTitle" weight="bold">
      {t("v2.settings.capture.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("v2.settings.capture.description")}
     </Typography>
    </div>

    <SettingsToggleRow
     id="daily-reading-v2-auto-capture"
     label={t("v2.settings.capture.autoTitle")}
     description={t("v2.settings.capture.autoDescription")}
     checked={settings.autoCaptureEnabled}
     onCheckedChange={(checked) => saveSettings({ autoCaptureEnabled: checked })}
    />

    <div className="grid gap-4 sm:grid-cols-2">
     <div className="grid gap-2">
      <Label htmlFor="daily-reading-v2-time" variant="label" weight="semibold">
       {t("v2.settings.capture.timeLabel")}
      </Label>
      <Input
       id="daily-reading-v2-time"
       type="time"
       value={formatCaptureTime(settings)}
       onChange={(event) => updateCaptureTime(event.target.value)}
      />
      <Typography as="p" variant="caption" tone="muted">
       {t("v2.settings.capture.timeDescription")}
      </Typography>
     </div>

     <div className="grid gap-2">
      <Label htmlFor="daily-reading-v2-level" variant="label" weight="semibold">
       {t("v2.settings.capture.levelLabel")}
      </Label>
      <Select
       value={settings.targetLevel}
       onValueChange={(value) =>
        saveSettings({ targetLevel: dailyReadingV2SettingsSchema.shape.targetLevel.parse(value) })
       }
      >
       <SelectTrigger id="daily-reading-v2-level" width="full">
        <SelectValue />
       </SelectTrigger>
       <SelectContent align="start">
        <SelectItem value="HSK4">HSK 4</SelectItem>
        <SelectItem value="HSK5">HSK 5</SelectItem>
        <SelectItem value="HSK6">HSK 6</SelectItem>
       </SelectContent>
      </Select>
      <Typography as="p" variant="caption" tone="muted">
       {t("v2.settings.capture.levelDescription")}
      </Typography>
     </div>
    </div>

    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
     <Button
      type="button"
      variant="outline"
      size="toolbar"
      onClick={() => void handleTestSource()}
      disabled={testingSource}
     >
      {testingSource ? (
       <Spinner data-icon="inline-start" />
      ) : (
       <RefreshCcw data-icon="inline-start" />
      )}
      {testingSource
       ? t("v2.settings.capture.testingSource")
       : t("v2.settings.capture.testSource")}
     </Button>
     <Typography as="p" variant="caption" tone="muted">
      {t("v2.settings.capture.sourceIndependent")}
     </Typography>
    </div>

    {sourcePreview !== null ? (
     <Card variant="subtle" padding="md" className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <Typography weight="bold">{t("v2.settings.sourcePreview.title")}</Typography>
       <Badge variant="success" size="sm">
        <HanziText as="span" size="inherit">
         {sourcePreview.reading.source.publisher}
        </HanziText>
       </Badge>
      </div>
      <HanziText as="p" size="medium" weight="bold">
       {sourcePreview.reading.article.titleZh}
      </HanziText>
      <Typography variant="bodySmall" tone="secondary">
       {t("v2.settings.sourcePreview.report", {
        publisher: sourcePreview.reading.source.publisher,
        paragraphs: sourcePreview.reading.article.paragraphs.length,
        minutes: sourcePreview.reading.estimatedMinutes,
       })}
      </Typography>
      <div className="flex flex-wrap gap-3">
       {sourcePreview.report.usedFreshnessDays !== null ? (
        <Typography variant="caption" tone="muted">
         {t("v2.settings.sourcePreview.window", { days: sourcePreview.report.usedFreshnessDays })}
        </Typography>
       ) : null}
       <Typography variant="caption" tone="muted">
        {t("v2.settings.sourcePreview.candidates", {
         count: sourcePreview.report.policyCandidates,
        })}
       </Typography>
       <Typography variant="caption" tone="muted">
        {t("v2.settings.sourcePreview.extractions", {
         count: sourcePreview.report.attemptedExtractions,
        })}
       </Typography>
      </div>
      <Typography variant="caption" tone="muted">
       {t("v2.settings.sourcePreview.notPersisted")}
      </Typography>
     </Card>
    ) : null}
   </section>

   <Separator />

   <section className="grid gap-4" aria-labelledby="daily-reading-ai-settings">
    <div className="grid gap-1">
     <Typography as="h3" id="daily-reading-ai-settings" variant="cardTitle" weight="bold">
      {t("v2.settings.ai.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("v2.settings.ai.description")}
     </Typography>
    </div>

    <SettingsToggleRow
     id="daily-reading-v2-auto-enrichment"
     label={t("v2.settings.ai.autoTitle")}
     description={t("v2.settings.ai.autoDescription")}
     checked={settings.autoEnrichmentEnabled}
     onCheckedChange={(checked) => saveSettings({ autoEnrichmentEnabled: checked })}
    />

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
     <div className="grid min-w-0 gap-1">
      {runtime.isPending ? (
       <Typography variant="bodySmall" tone="muted">
        {t("v2.enrichment.actions.checkingRuntime")}
       </Typography>
      ) : runtime.isError ? (
       <Typography variant="bodySmall" tone="warning">
        {t("v2.enrichment.runtimeStorageUnavailable")}
       </Typography>
      ) : runtime.data?.status === "ready" ? (
       <>
        <Badge variant="success" size="sm" className="justify-self-start">
         {t("v2.settings.ai.ready", {
          provider: runtime.data.selectedKey.providerLabel,
          model: runtime.data.selectedKey.model,
         })}
        </Badge>
        <Typography variant="caption" tone="muted" wrapping="breakWords">
         {runtime.data.selectedKey.maskedKey}
        </Typography>
       </>
      ) : runtime.data?.status === "missing-key" ? (
       <Typography variant="bodySmall" tone="warning">
        {t("v2.settings.ai.missing")}
       </Typography>
      ) : runtime.data?.reason === "credential-unreadable" ? (
       <Typography variant="bodySmall" tone="warning">
        {t("v2.settings.ai.credentialUnreadable")}
       </Typography>
      ) : (
       <Typography variant="bodySmall" tone="warning">
        {t("v2.settings.ai.storageUnavailable")}
       </Typography>
      )}
      <Typography variant="caption" tone="muted">
       {t("v2.settings.ai.articleIndependent")}
      </Typography>
     </div>

     <div className="flex shrink-0 flex-wrap items-center gap-2">
      {runtime.isError ? (
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
      ) : runtime.data?.status === "missing-key" ? (
       <AddApiKeyDialog
        onSaved={() => void runtime.refetch()}
        trigger={
         <Button type="button" size="compact">
          <KeyRound data-icon="inline-start" />
          {t("v2.settings.ai.addKey")}
         </Button>
        }
       />
      ) : runtime.data?.reason === "credential-unreadable" ? (
       <AddApiKeyDialog
        onSaved={() => void runtime.refetch()}
        trigger={
         <Button type="button" size="compact">
          <KeyRound data-icon="inline-start" />
          {t("v2.settings.ai.addReplacementKey")}
         </Button>
        }
       />
      ) : runtime.data?.status === "storage-unavailable" ? (
       <Button type="button" variant="outline" size="compact" asChild>
        <Link href="/settings?section=ai&panel=providers" prefetch={false}>
         <Settings data-icon="inline-start" />
         {t("v2.settings.ai.manageKeys")}
        </Link>
       </Button>
      ) : null}
     </div>
    </div>
   </section>

   <Separator />

   <section className="grid gap-4" aria-labelledby="daily-reading-advanced-settings">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
     <div className="grid min-w-0 gap-1">
      <Typography as="h3" id="daily-reading-advanced-settings" variant="cardTitle" weight="bold">
       {t("v2.settings.advanced.title")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("v2.settings.advanced.description")}
      </Typography>
     </div>
     <Button
      type="button"
      variant="outline"
      size="compact"
      aria-expanded={advancedOpen}
      aria-controls="daily-reading-v2-advanced-content"
      onClick={() => setAdvancedOpen((value) => !value)}
     >
      {advancedOpen ? (
       <ChevronUp data-icon="inline-start" />
      ) : (
       <ChevronDown data-icon="inline-start" />
      )}
      {advancedOpen ? t("v2.settings.advanced.hide") : t("v2.settings.advanced.show")}
     </Button>
    </div>

    {advancedOpen ? (
     <div id="daily-reading-v2-advanced-content" className="grid gap-5">
      <div className="grid gap-4 xl:grid-cols-3">
       <div className="grid gap-2">
        <Label htmlFor="daily-reading-v2-freshness" variant="label" weight="semibold">
         {t("v2.settings.advanced.freshnessLabel")}
        </Label>
        <Select
         value={String(settings.freshnessDays)}
         onValueChange={(value) =>
          saveSettings({ freshnessDays: dailyReadingV2FreshnessDaysSchema.parse(Number(value)) })
         }
        >
         <SelectTrigger id="daily-reading-v2-freshness" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          <SelectItem value="1">{t("v2.settings.advanced.freshness1")}</SelectItem>
          <SelectItem value="3">{t("v2.settings.advanced.freshness3")}</SelectItem>
          <SelectItem value="7">{t("v2.settings.advanced.freshness7")}</SelectItem>
          <SelectItem value="14">{t("v2.settings.advanced.freshness14")}</SelectItem>
         </SelectContent>
        </Select>
        <Typography variant="caption" tone="muted">
         {t("v2.settings.advanced.freshnessDescription")}
        </Typography>
       </div>

       <div className="grid gap-2">
        <Label htmlFor="daily-reading-v2-length" variant="label" weight="semibold">
         {t("v2.settings.advanced.lengthLabel")}
        </Label>
        <Select
         value={settings.preferredLength}
         onValueChange={(value) =>
          saveSettings({ preferredLength: dailyReadingV2LengthPreferenceSchema.parse(value) })
         }
        >
         <SelectTrigger id="daily-reading-v2-length" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          <SelectItem value="any">{t("v2.settings.advanced.lengthAny")}</SelectItem>
          <SelectItem value="short">{t("v2.settings.advanced.lengthShort")}</SelectItem>
          <SelectItem value="medium">{t("v2.settings.advanced.lengthMedium")}</SelectItem>
          <SelectItem value="long">{t("v2.settings.advanced.lengthLong")}</SelectItem>
         </SelectContent>
        </Select>
       </div>

       <div className="grid gap-2">
        <Label htmlFor="daily-reading-v2-no-match" variant="label" weight="semibold">
         {t("v2.settings.advanced.noMatchLabel")}
        </Label>
        <Select
         value={settings.noMatchBehavior}
         onValueChange={(value) =>
          saveSettings({ noMatchBehavior: dailyReadingV2NoMatchBehaviorSchema.parse(value) })
         }
        >
         <SelectTrigger id="daily-reading-v2-no-match" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          <SelectItem value="skip-day">{t("v2.settings.advanced.skipDay")}</SelectItem>
          <SelectItem value="expand-window">
           {t("v2.settings.advanced.expandWindow")}
          </SelectItem>
         </SelectContent>
        </Select>
       </div>
      </div>

      <div className="grid gap-1">
       <SettingsToggleRow
        id="daily-reading-v2-topic-diversity"
        label={t("v2.settings.advanced.diversityTitle")}
        description={t("v2.settings.advanced.diversityDescription")}
        checked={settings.preferTopicDiversity}
        onCheckedChange={(checked) => saveSettings({ preferTopicDiversity: checked })}
       />
       <Separator />
       <SettingsToggleRow
        id="daily-reading-v2-avoid-recent"
        label={t("v2.settings.advanced.avoidRecentTitle")}
        description={t("v2.settings.advanced.avoidRecentDescription")}
        checked={settings.avoidRecentlyRead}
        onCheckedChange={(checked) => saveSettings({ avoidRecentlyRead: checked })}
       />
      </div>

      <div className="grid gap-2">
       <div className="grid gap-1">
        <Typography weight="bold">{t("v2.settings.advanced.topicsTitle")}</Typography>
        <Typography variant="bodySmall" tone="muted">
         {t("v2.settings.advanced.topicsDescription")}
        </Typography>
       </div>
       <div className="flex flex-wrap gap-2">
        {dailyReadingTopicSchema.options.map((topic) => (
         <Chip
          key={topic}
          size="touch"
          pressed={settings.selectedTopics.includes(topic)}
          onClick={() => toggleTopic(topic)}
         >
          {t(getTopicTranslationKey(topic))}
         </Chip>
        ))}
       </div>
      </div>

      <div className="grid gap-2">
       <div className="grid gap-1">
        <Typography weight="bold">{t("v2.settings.advanced.sourcesTitle")}</Typography>
        <Typography variant="bodySmall" tone="muted">
         {t("v2.settings.advanced.sourcesDescription")}
        </Typography>
       </div>
       <div className="grid gap-2 xl:grid-cols-2">
        {dailyReadingSourceCatalog.map((source) => {
         const id = `daily-reading-source-${source.id}`;
         const selected = settings.selectedSources.includes(source.id);
         return (
          <div key={source.id} className="flex min-h-11 min-w-0 items-center gap-3">
           <Checkbox
            id={id}
            checked={selected}
            onCheckedChange={(checked) => toggleSource(source.id, checked === true)}
           />
           <Label htmlFor={id} variant="label" weight="semibold" className="min-w-0">
            <HanziText as="span" size="inherit">
             {source.publisherLabelZh}
            </HanziText>
           </Label>
          </div>
         );
        })}
       </div>
      </div>
     </div>
    ) : null}
   </section>
  </Card>
 );
}

function SettingsToggleRow({
 id,
 label,
 description,
 checked,
 onCheckedChange,
}: {
 id: string;
 label: string;
 description: string;
 checked: boolean;
 onCheckedChange(checked: boolean): void;
}) {
 return (
  <div className="flex min-w-0 items-center justify-between gap-4 py-3">
   <div className="grid min-w-0 gap-1">
    <Label htmlFor={id} variant="label" weight="bold">
     {label}
    </Label>
    <Typography as="p" variant="bodySmall" tone="muted">
     {description}
    </Typography>
   </div>
   <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
 );
}
