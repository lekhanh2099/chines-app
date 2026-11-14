"use client";

import { KeyRound, RefreshCcw, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Typography } from "@/components/ui/display/typography";
import { useAiRuntimeReadiness } from "@/features/ai-runtime/useAiRuntimeReadiness";
import { AddApiKeyDialog } from "@/features/settings/components/AddApiKeyDialog";
import { Link } from "@/i18n/navigation";
import type { DailyReadingSettings } from "@/features/daily-reading/model/daily-reading.schemas";

import { SettingsToggleRow } from "./DailyReadingSettingsToggleRow";

type DailyReadingAiSettingsSectionProps = {
 settings: DailyReadingSettings;
 saveSettings(patch: Partial<DailyReadingSettings>): void;
};

export function DailyReadingAiSettingsSection({
 settings,
 saveSettings,
}: DailyReadingAiSettingsSectionProps) {
 const t = useTranslations("DailyReading");
 const runtime = useAiRuntimeReadiness();

 return (
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
 );
}
