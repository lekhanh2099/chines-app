"use client";

import { AlertTriangle, ClipboardPaste, RefreshCw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/actions/button";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";

export const noScriptPanelVariantSchema = z.enum(["no-captions", "fetch-error"]);
type NoScriptPanelVariant = z.infer<typeof noScriptPanelVariantSchema>;

export function ShadowingNoScriptPanel({
 variant,
 errorCode = "",
 availableLanguages,
 onOpenManualDialog,
 onFocusLinkInput,
 onRetry,
}: {
 variant: NoScriptPanelVariant;
 errorCode?: string;
 availableLanguages: string[];
 onOpenManualDialog: () => void;
 onFocusLinkInput: () => void;
 onRetry?: () => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const isFetchError = variant === noScriptPanelVariantSchema.enum["fetch-error"];

 const description = isFetchError
  ? errorCode === "YOUTUBE_BLOCKED"
   ? t("noScript.blockedDescription")
   : t("noScript.fetchFailedDescription")
  : t("noScript.noCaptionsDescription");

 return (
  <Card variant="section" padding="lg" className="grid min-w-0 gap-4">
   <div className="flex min-w-0 items-start gap-3">
    <IconTile tone="warning" size="md">
     <AlertTriangle aria-hidden="true" />
    </IconTile>
    <div className="grid min-w-0 gap-1">
     <Typography as="h2" variant="sectionTitle">
      {isFetchError ? t("noScript.fetchErrorTitle") : t("noScript.title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="secondary">
      {description}
     </Typography>
     {!isFetchError && availableLanguages.length > 0 ? (
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("noScript.availableLanguages", { languages: availableLanguages.join(", ") })}
      </Typography>
     ) : null}
    </div>
   </div>

   <div className="flex flex-wrap items-center gap-2">
    <Button type="button" variant="default" onClick={onOpenManualDialog}>
     <ClipboardPaste data-icon="inline-start" aria-hidden="true" />
     {t("noScript.pasteScript")}
    </Button>
    {isFetchError && onRetry ? (
     <Button type="button" variant="secondary" onClick={onRetry}>
      <RefreshCw data-icon="inline-start" aria-hidden="true" />
      {t("noScript.retry")}
     </Button>
    ) : null}
    <Button type="button" variant="outline" onClick={onFocusLinkInput}>
     <Search data-icon="inline-start" aria-hidden="true" />
     {t("noScript.tryAnotherVideo")}
    </Button>
   </div>

   <Card variant="subtle" padding="md" className="grid gap-2">
    <Typography as="h3" variant="label" tone="default">
     {t("noScript.guideTitle")}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="secondary">
     {t("noScript.guideSteps")}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="warning">
     {t("noScript.chatbotWarning")}
    </Typography>
   </Card>
  </Card>
 );
}
