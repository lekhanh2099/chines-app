"use client";

import { ExternalLink, RefreshCcw, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Typography } from "@/components/ui/display/typography";
import type { DiscoverApiKeyResponse } from "@/features/settings/model/api-key-manager.schema";
import { getApiKeyProviderDescriptionKey } from "@/features/settings/model/model-description-keys";
import {
 API_KEY_PROVIDER_OPTIONS,
 getApiKeyProviderDocsUrl,
 getApiKeyProviderLimitsUrl,
} from "@/lib/ai/api-key-providers";

export function ApiKeyStorageWarning({ schemaReady }: { schemaReady: boolean }) {
 const t = useTranslations("Settings");
 const setupT = useTranslations("ApiKeySetup");
 return (
  <Card variant="subtle" padding="md" className="grid gap-1">
   <Typography weight="bold" tone="warning">
    {setupT("storageUnavailableTitle")}
   </Typography>
   <Typography variant="bodySmall" tone="muted">
    {!schemaReady ? t("apiKeys.schemaNotReady") : setupT("storageUnavailableDescription")}
   </Typography>
  </Card>
 );
}

export function ApiKeySetupGuide() {
 const t = useTranslations("Settings");
 const setupT = useTranslations("ApiKeySetup");
 return (
  <Card variant="subtle" padding="md" className="grid gap-3">
   <Typography weight="bold">{t("apiKeys.guideTitle")}</Typography>
   <ol className="grid gap-2 pl-5 text-sm text-text-secondary [list-style:decimal]">
    <li>{t("apiKeys.guideStep1")}</li>
    <li>{t("apiKeys.guideStep2")}</li>
    <li>{setupT("pasteAndCheck")}</li>
   </ol>
  </Card>
 );
}

export function ApiKeyDiscoveryChecking() {
 const setupT = useTranslations("ApiKeySetup");
 return (
  <Card variant="subtle" padding="sm">
   <div className="flex items-center gap-2">
    <Spinner />
    <Typography variant="bodySmall" tone="secondary">
     {setupT("checking")}
    </Typography>
   </div>
  </Card>
 );
}

type ApiKeyDiscoveryRecheckProps = {
 disabled: boolean;
 onRecheck(): void;
};

export function ApiKeyDiscoveryReady({
 discovery,
 disabled,
 onRecheck,
}: ApiKeyDiscoveryRecheckProps & { discovery: DiscoverApiKeyResponse }) {
 const setupT = useTranslations("ApiKeySetup");
 return (
  <Card variant="subtle" padding="sm" className="grid">
   <div className="flex flex-wrap items-center gap-2">
    <Badge variant="success" casing="natural">
     <ShieldCheck />
     {setupT("ready", {
      provider: discovery.providerLabel,
      count: discovery.models.length,
     })}
    </Badge>
    <Button type="button" variant="ghost" size="sm" onClick={onRecheck} disabled={disabled}>
     <RefreshCcw data-icon="inline-start" />
     {setupT("recheck")}
    </Button>
   </div>
  </Card>
 );
}

export function ApiKeyDiscoveryError({
 message,
 disabled,
 onRecheck,
}: ApiKeyDiscoveryRecheckProps & { message: string }) {
 const setupT = useTranslations("ApiKeySetup");
 return (
  <Card variant="subtle" padding="sm" className="grid gap-2">
   <Typography variant="bodySmall" tone="danger">
    {message}
   </Typography>
   <Button type="button" variant="outline" size="sm" onClick={onRecheck} disabled={disabled}>
    <RefreshCcw data-icon="inline-start" />
    {setupT("recheck")}
   </Button>
  </Card>
 );
}

type ApiKeyProviderDetailsProps = {
 option: (typeof API_KEY_PROVIDER_OPTIONS)[number];
 detected: boolean;
};

export function ApiKeyProviderDetails({ option, detected }: ApiKeyProviderDetailsProps) {
 const t = useTranslations("Settings");
 const setupT = useTranslations("ApiKeySetup");
 return (
  <div className="grid gap-3 border-y border-border-default py-3">
   <div className="flex flex-wrap items-center gap-2">
    <Typography weight="semibold">{option.label}</Typography>
    {detected ? (
     <Badge variant="info" casing="natural">
      {setupT("providerDetected", { provider: option.label })}
     </Badge>
    ) : null}
    <Badge variant={option.accessTier === "free-tier" ? "success" : "default"} casing="natural">
     {option.accessTier === "free-tier" ? t("apiKeys.freeTierAvailable") : t("apiKeys.paidUsage")}
    </Badge>
   </div>
   <Typography as="p" variant="bodySmall" tone="secondary">
    {t(getApiKeyProviderDescriptionKey(option.value))}
   </Typography>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="outline" size="sm" asChild>
     <a href={getApiKeyProviderDocsUrl(option.value)} target="_blank" rel="noreferrer">
      {t("apiKeys.openDocs")}
      <ExternalLink data-icon="inline-end" />
     </a>
    </Button>
    <Button type="button" variant="ghost" size="sm" asChild>
     <a href={getApiKeyProviderLimitsUrl(option.value)} target="_blank" rel="noreferrer">
      {t("apiKeys.openLimits")}
      <ExternalLink data-icon="inline-end" />
     </a>
    </Button>
   </div>
  </div>
 );
}
