"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/actions/button";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { Chip } from "@/components/ui/actions/chip";
import { Label } from "@/components/ui/forms/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Separator } from "@/components/ui/layout/separator";
import { Typography } from "@/components/ui/display/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 dailyReadingSourceCatalog,
 type DailyReadingSourceId,
} from "@/features/daily-reading/source/daily-reading-source-catalog";
import {
 dailyReadingFreshnessDaysSchema,
 dailyReadingLengthPreferenceSchema,
 dailyReadingNoMatchBehaviorSchema,
 dailyReadingTopicSchema,
 type DailyReadingSettings,
 type DailyReadingTopic,
} from "@/features/daily-reading/model/daily-reading.schemas";

import { getTopicTranslationKey } from "./daily-reading-settings-utils";
import { SettingsToggleRow } from "./DailyReadingSettingsToggleRow";

type DailyReadingAdvancedSettingsSectionProps = {
 settings: DailyReadingSettings;
 saveSettings(patch: Partial<DailyReadingSettings>): void;
};

export function DailyReadingAdvancedSettingsSection({
 settings,
 saveSettings,
}: DailyReadingAdvancedSettingsSectionProps) {
 const t = useTranslations("DailyReading");
 const [advancedOpen, setAdvancedOpen] = useState(false);

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

 return (
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
 );
}
