"use client";

import { RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Typography } from "@/components/ui/display/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { previewDailyReadingSource } from "@/features/daily-reading/services/daily-reading.client";
import {
 dailyReadingSettingsSchema,
 type DailyReadingCaptureResponse,
 type DailyReadingSettings,
} from "@/features/daily-reading/model/daily-reading.schemas";

import { formatCaptureTime } from "./daily-reading-settings-utils";
import { SettingsToggleRow } from "./DailyReadingSettingsToggleRow";

type DailyReadingCaptureSettingsSectionProps = {
 settings: DailyReadingSettings;
 saveSettings(patch: Partial<DailyReadingSettings>): void;
};

export function DailyReadingCaptureSettingsSection({
 settings,
 saveSettings,
}: DailyReadingCaptureSettingsSectionProps) {
 const t = useTranslations("DailyReading");
 const [testingSource, setTestingSource] = useState(false);
 const [sourcePreview, setSourcePreview] = useState<DailyReadingCaptureResponse | null>(null);

 function updateCaptureTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/u.exec(value);
  if (match === null) return;
  const parsed = dailyReadingSettingsSchema.shape.captureTime.safeParse({
   hour: Number(match[1]),
   minute: Number(match[2]),
  });
  if (parsed.success) saveSettings({ captureTime: parsed.data });
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
 );
}
