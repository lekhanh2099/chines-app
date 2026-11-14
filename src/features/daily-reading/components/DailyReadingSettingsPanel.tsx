"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";
import { Typography } from "@/components/ui/display/typography";
import { useDailyReadingSettings } from "@/features/daily-reading/services/daily-reading.client";
import type { DailyReadingSettings } from "@/features/daily-reading/model/daily-reading.schemas";

import { DailyReadingAdvancedSettingsSection } from "./DailyReadingAdvancedSettingsSection";
import { DailyReadingAiSettingsSection } from "./DailyReadingAiSettingsSection";
import { DailyReadingCaptureSettingsSection } from "./DailyReadingCaptureSettingsSection";

export function DailyReadingSettingsPanel() {
 const t = useTranslations("DailyReading");
 const { settings, update } = useDailyReadingSettings();

 function saveSettings(patch: Partial<DailyReadingSettings>) {
  try {
   update(patch);
  } catch {
   toast.error(t("settings.toast.settingFailed"));
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

   <DailyReadingCaptureSettingsSection settings={settings} saveSettings={saveSettings} />

   <Separator />

   <DailyReadingAiSettingsSection settings={settings} saveSettings={saveSettings} />

   <Separator />

   <DailyReadingAdvancedSettingsSection settings={settings} saveSettings={saveSettings} />
  </Card>
 );
}
