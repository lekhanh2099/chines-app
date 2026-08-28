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
import { previewDailyReadingSource, useDailyReadingSettings } from "./daily-reading.client";
import {
 dailyReadingFreshnessDaysSchema,
 dailyReadingLengthPreferenceSchema,
 dailyReadingNoMatchBehaviorSchema,
 dailyReadingSettingsSchema,
 type DailyReadingCaptureResponse,
 type DailyReadingSettings,
} from "./daily-reading.schemas";

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

function formatCaptureTime(settings: DailyReadingSettings) {
 return `${String(settings.captureTime.hour).padStart(2, "0")}:${String(settings.captureTime.minute).padStart(2, "0")}`;
}

export function DailyReadingSettingsPanel() {
 const t = useTranslations("DailyReading");
 const runtime = useAiRuntimeReadiness();
 const { settings, update } = useDailyReadingSettings();
 const [advancedOpen, setAdvancedOpen] = useState(false);
 const [testingSource, setTestingSource] = useState(false);
 const [sourcePreview, setSourcePreview] = useState<DailyReadingCaptureResponse | null>(null);

 function saveSettings(patch: Partial<DailyReadingSettings>) {
  try {
   update(patch);
  } catch {
   toast.error(t("settings.toast.settingFailed"));
  }
 }

 function updateCaptureTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/u.exec(value);
  if (match === null) return;
  const parsed = dailyReadingSettingsSchema.shape.captureTime.safeParse({
   hour: Number(match[1]),
   minute: Number(match[2]),
  });
  if (parsed.success) saveSettings({ captureTime: parsed.data });
 }

 function toggleTopic(topic: DailyReadingTopic) {
  const selected = settings.selectedTopics.includes(topic);
  if (selected && settings.selectedTopics.length === 1) {
   toast.info(t("settings.advanced.atLeastOneTopic"));
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
   toast.info(t("settings.advanced.atLeastOneSource"));
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
   const result = await previewDailyReadingSource();
   setSourcePreview(result);
   toast.success(
    t("settings.toast.sourceReady", {
     publisher: result.reading.source.publisher,
     title: result.reading.article.titleZh,
    }),
   );
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("settings.toast.sourceFailed"));
  } finally {
   setTestingSource(false);
  }
 }

 return (
  <Card variant="section" padding="lg" className="grid min-w-0 gap-5">
   <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="grid min-w-0 gap-1">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      {t("settings.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted" className="max-w-3xl">
      {t("settings.description")}
     </Typography>
    </div>
    <Badge variant={settings.autoCaptureEnabled ? "success" : "default"} size="md">
     {settings.autoCaptureEnabled ? t("library.autoOn") : t("library.autoOff")}
    </Badge>
   </div>

   <Separator />

   <section className="grid gap-4" aria-labelledby="daily-reading-source-settings">
    <div className="grid gap-1">
     <Typography as="h3" id="daily-reading-source-settings" variant="cardTitle" weight="bold">
      {t("settings.capture.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("settings.capture.description")}
     </Typography>
    </div>

    <SettingsToggleRow
     id="daily-reading-auto-capture"
     label={t("settings.capture.autoTitle")}
     description={t("settings.capture.autoDescription")}
     checked={settings.autoCaptureEnabled}
     onCheckedChange={(checked) => saveSettings({ autoCaptureEnabled: checked })}
    />

    <div className="grid gap-3 md:grid-cols-2">
     <SettingsToggleRow
      id="daily-reading-translation-enabled"
      label={t("settings.ai.translationTitle")}
      description={t("settings.ai.translationDescription")}
      checked={settings.translationEnabled}
      onCheckedChange={(checked) => saveSettings({ translationEnabled: checked })}
     />
     <SettingsToggleRow
      id="daily-reading-vocabulary-enabled"
      label={t("settings.ai.vocabularyTitle")}
      description={t("settings.ai.vocabularyDescription")}
      checked={settings.vocabularyEnabled}
      onCheckedChange={(checked) => saveSettings({ vocabularyEnabled: checked })}
     />
     <SettingsToggleRow
      id="daily-reading-grammar-enabled"
      label={t("settings.ai.grammarTitle")}
      description={t("settings.ai.grammarDescription")}
      checked={settings.grammarEnabled}
      onCheckedChange={(checked) => saveSettings({ grammarEnabled: checked })}
     />
     <SettingsToggleRow
      id="daily-reading-questions-enabled"
      label={t("settings.ai.questionsTitle")}
      description={t("settings.ai.questionsDescription")}
      checked={settings.questionsEnabled}
      onCheckedChange={(checked) => saveSettings({ questionsEnabled: checked })}
     />
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
     {(
      [
       { key: "vocabularyCount", value: settings.vocabularyCount, min: 1, max: 24 },
       { key: "grammarCount", value: settings.grammarCount, min: 1, max: 10 },
       { key: "questionsCount", value: settings.questionsCount, min: 5, max: 12 },
      ] satisfies Array<{
       key: "vocabularyCount" | "grammarCount" | "questionsCount";
       value: number;
       min: number;
       max: number;
      }>
     ).map((field) => (
      <div key={field.key} className="grid gap-1.5">
       <Label htmlFor={`daily-reading-${field.key}`}>{t(`settings.ai.${field.key}`)}</Label>
       <Input
        id={`daily-reading-${field.key}`}
        type="number"
        min={field.min}
        max={field.max}
        value={field.value}
        onChange={(event) => {
         const value = event.currentTarget.valueAsNumber;
         if (!Number.isInteger(value) || value < field.min || value > field.max) return;
         saveSettings({ [field.key]: value });
        }}
       />
      </div>
     ))}
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
     <div className="grid gap-2">
      <Label htmlFor="daily-reading-time" variant="label" weight="semibold">
       {t("settings.capture.timeLabel")}
      </Label>
      <Input
       id="daily-reading-time"
       type="time"
       value={formatCaptureTime(settings)}
       onChange={(event) => updateCaptureTime(event.target.value)}
      />
      <Typography as="p" variant="caption" tone="muted">
       {t("settings.capture.timeDescription")}
      </Typography>
     </div>

     <div className="grid gap-2">
      <Label htmlFor="daily-reading-level" variant="label" weight="semibold">
       {t("settings.capture.levelLabel")}
      </Label>
      <Select
       value={settings.targetLevel}
       onValueChange={(value) =>
        saveSettings({ targetLevel: dailyReadingSettingsSchema.shape.targetLevel.parse(value) })
       }
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
      <Typography as="p" variant="caption" tone="muted">
       {t("settings.capture.levelDescription")}
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
      {testingSource ? t("settings.capture.testingSource") : t("settings.capture.testSource")}
     </Button>
     <Typography as="p" variant="caption" tone="muted">
      {t("settings.capture.sourceIndependent")}
     </Typography>
    </div>

    {sourcePreview !== null ? (
     <Card variant="subtle" padding="md" className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <Typography weight="bold">{t("settings.sourcePreview.title")}</Typography>
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
       {t("settings.sourcePreview.report", {
        publisher: sourcePreview.reading.source.publisher,
        paragraphs: sourcePreview.reading.article.paragraphs.length,
        minutes: sourcePreview.reading.estimatedMinutes,
       })}
      </Typography>
      <div className="flex flex-wrap gap-3">
       {sourcePreview.report.usedFreshnessDays !== null ? (
        <Typography variant="caption" tone="muted">
         {t("settings.sourcePreview.window", { days: sourcePreview.report.usedFreshnessDays })}
        </Typography>
       ) : null}
       <Typography variant="caption" tone="muted">
        {t("settings.sourcePreview.candidates", {
         count: sourcePreview.report.policyCandidates,
        })}
       </Typography>
       <Typography variant="caption" tone="muted">
        {t("settings.sourcePreview.extractions", {
         count: sourcePreview.report.attemptedExtractions,
        })}
       </Typography>
      </div>
      <Typography variant="caption" tone="muted">
       {t("settings.sourcePreview.notPersisted")}
      </Typography>
     </Card>
    ) : null}
   </section>

   <Separator />

   <section className="grid gap-4" aria-labelledby="daily-reading-ai-settings">
    <div className="grid gap-1">
     <Typography as="h3" id="daily-reading-ai-settings" variant="cardTitle" weight="bold">
      {t("settings.ai.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("settings.ai.description")}
     </Typography>
    </div>

    <SettingsToggleRow
     id="daily-reading-auto-enrichment"
     label={t("settings.ai.autoTitle")}
     description={t("settings.ai.autoDescription")}
     checked={settings.autoEnrichmentEnabled}
     onCheckedChange={(checked) => saveSettings({ autoEnrichmentEnabled: checked })}
    />

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
     <div className="grid min-w-0 gap-1">
      {runtime.isPending ? (
       <Typography variant="bodySmall" tone="muted">
        {t("enrichment.actions.checkingRuntime")}
       </Typography>
      ) : runtime.isError ? (
       <Typography variant="bodySmall" tone="warning">
        {t("enrichment.runtimeStorageUnavailable")}
       </Typography>
      ) : runtime.data?.status === "ready" ? (
       <>
        <Badge variant="success" size="sm" className="justify-self-start">
         {t("settings.ai.ready", {
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
        {t("settings.ai.missing")}
       </Typography>
      ) : runtime.data?.reason === "credential-unreadable" ? (
       <Typography variant="bodySmall" tone="warning">
        {t("settings.ai.credentialUnreadable")}
       </Typography>
      ) : (
       <Typography variant="bodySmall" tone="warning">
        {t("settings.ai.storageUnavailable")}
       </Typography>
      )}
      <Typography variant="caption" tone="muted">
       {t("settings.ai.articleIndependent")}
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
        {t("enrichment.actions.checkRuntimeAgain")}
       </Button>
      ) : runtime.data?.status === "missing-key" ? (
       <AddApiKeyDialog
        onSaved={() => void runtime.refetch()}
        trigger={
         <Button type="button" size="compact">
          <KeyRound data-icon="inline-start" />
          {t("settings.ai.addKey")}
         </Button>
        }
       />
      ) : runtime.data?.reason === "credential-unreadable" ? (
       <AddApiKeyDialog
        onSaved={() => void runtime.refetch()}
        trigger={
         <Button type="button" size="compact">
          <KeyRound data-icon="inline-start" />
          {t("settings.ai.addReplacementKey")}
         </Button>
        }
       />
      ) : runtime.data?.status === "storage-unavailable" ? (
       <Button type="button" variant="outline" size="compact" asChild>
        <Link href="/settings?section=ai&panel=providers" prefetch={false}>
         <Settings data-icon="inline-start" />
         {t("settings.ai.manageKeys")}
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
       {t("settings.advanced.title")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("settings.advanced.description")}
      </Typography>
     </div>
     <Button
      type="button"
      variant="outline"
      size="compact"
      aria-expanded={advancedOpen}
      aria-controls="daily-reading-advanced-content"
      onClick={() => setAdvancedOpen((value) => !value)}
     >
      {advancedOpen ? (
       <ChevronUp data-icon="inline-start" />
      ) : (
       <ChevronDown data-icon="inline-start" />
      )}
      {advancedOpen ? t("settings.advanced.hide") : t("settings.advanced.show")}
     </Button>
    </div>

    {advancedOpen ? (
     <div id="daily-reading-advanced-content" className="grid gap-5">
      <div className="grid gap-4 xl:grid-cols-3">
       <div className="grid gap-2">
        <Label htmlFor="daily-reading-freshness" variant="label" weight="semibold">
         {t("settings.advanced.freshnessLabel")}
        </Label>
        <Select
         value={String(settings.freshnessDays)}
         onValueChange={(value) =>
          saveSettings({ freshnessDays: dailyReadingFreshnessDaysSchema.parse(Number(value)) })
         }
        >
         <SelectTrigger id="daily-reading-freshness" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          <SelectItem value="1">{t("settings.advanced.freshness1")}</SelectItem>
          <SelectItem value="3">{t("settings.advanced.freshness3")}</SelectItem>
          <SelectItem value="7">{t("settings.advanced.freshness7")}</SelectItem>
          <SelectItem value="14">{t("settings.advanced.freshness14")}</SelectItem>
         </SelectContent>
        </Select>
        <Typography variant="caption" tone="muted">
         {t("settings.advanced.freshnessDescription")}
        </Typography>
       </div>

       <div className="grid gap-2">
        <Label htmlFor="daily-reading-length" variant="label" weight="semibold">
         {t("settings.advanced.lengthLabel")}
        </Label>
        <Select
         value={settings.preferredLength}
         onValueChange={(value) =>
          saveSettings({ preferredLength: dailyReadingLengthPreferenceSchema.parse(value) })
         }
        >
         <SelectTrigger id="daily-reading-length" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          <SelectItem value="any">{t("settings.advanced.lengthAny")}</SelectItem>
          <SelectItem value="short">{t("settings.advanced.lengthShort")}</SelectItem>
          <SelectItem value="medium">{t("settings.advanced.lengthMedium")}</SelectItem>
          <SelectItem value="long">{t("settings.advanced.lengthLong")}</SelectItem>
         </SelectContent>
        </Select>
       </div>

       <div className="grid gap-2">
        <Label htmlFor="daily-reading-no-match" variant="label" weight="semibold">
         {t("settings.advanced.noMatchLabel")}
        </Label>
        <Select
         value={settings.noMatchBehavior}
         onValueChange={(value) =>
          saveSettings({ noMatchBehavior: dailyReadingNoMatchBehaviorSchema.parse(value) })
         }
        >
         <SelectTrigger id="daily-reading-no-match" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          <SelectItem value="skip-day">{t("settings.advanced.skipDay")}</SelectItem>
          <SelectItem value="expand-window">{t("settings.advanced.expandWindow")}</SelectItem>
         </SelectContent>
        </Select>
       </div>
      </div>

      <div className="grid gap-1">
       <SettingsToggleRow
        id="daily-reading-topic-diversity"
        label={t("settings.advanced.diversityTitle")}
        description={t("settings.advanced.diversityDescription")}
        checked={settings.preferTopicDiversity}
        onCheckedChange={(checked) => saveSettings({ preferTopicDiversity: checked })}
       />
       <Separator />
       <SettingsToggleRow
        id="daily-reading-avoid-recent"
        label={t("settings.advanced.avoidRecentTitle")}
        description={t("settings.advanced.avoidRecentDescription")}
        checked={settings.avoidRecentlyRead}
        onCheckedChange={(checked) => saveSettings({ avoidRecentlyRead: checked })}
       />
      </div>

      <div className="grid gap-2">
       <div className="grid gap-1">
        <Typography weight="bold">{t("settings.advanced.topicsTitle")}</Typography>
        <Typography variant="bodySmall" tone="muted">
         {t("settings.advanced.topicsDescription")}
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
        <Typography weight="bold">{t("settings.advanced.sourcesTitle")}</Typography>
        <Typography variant="bodySmall" tone="muted">
         {t("settings.advanced.sourcesDescription")}
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
