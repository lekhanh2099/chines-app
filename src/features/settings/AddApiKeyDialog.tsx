"use client";

import {
 ClipboardPaste,
 ExternalLink,
 Eye,
 EyeOff,
 Plus,
 RefreshCcw,
 ShieldCheck,
} from "lucide-react";
import { useMemo, useId, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
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
 DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { useAiRuntimeReadiness } from "@/features/ai-runtime/useAiRuntimeReadiness";
import { discoverManagedApiKey } from "@/features/settings/api-key-manager.client";
import type { DiscoverApiKeyResponse } from "@/features/settings/api-key-manager.schema";
import {
 getApiKeyModelDescriptionKey,
 getApiKeyProviderDescriptionKey,
} from "@/features/settings/model-description-keys";
import { useManagedApiKeys } from "@/features/settings/useManagedApiKeys";
import { getApiKeyModelOptions } from "@/lib/api-key-models";
import {
 AUTO_API_KEY_PROVIDER,
 API_KEY_PROVIDER_OPTIONS,
 ApiKeyProviderSchema,
 getApiKeyProviderDocsUrl,
 getApiKeyProviderLimitsUrl,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";

type ProviderSelection = typeof AUTO_API_KEY_PROVIDER | ApiKeyProvider;

type AddApiKeyDialogProps = {
 trigger?: ReactElement;
 onSaved?(): void;
};

export function AddApiKeyDialog({ trigger, onSaved }: AddApiKeyDialogProps) {
 const t = useTranslations("Settings");
 const setupT = useTranslations("ApiKeySetup");
 const common = useTranslations("Common");
 const generatedId = useId().replaceAll(":", "");
 const valueId = `api-key-value-${generatedId}`;
 const providerId = `api-key-provider-${generatedId}`;
 const modelId = `api-key-model-${generatedId}`;
 const labelId = `api-key-label-${generatedId}`;
 const [isOpen, setIsOpen] = useState(false);
 const [providerSelection, setProviderSelection] =
  useState<ProviderSelection>(AUTO_API_KEY_PROVIDER);
 const [discovery, setDiscovery] = useState<DiscoverApiKeyResponse | null>(null);
 const [discoveryError, setDiscoveryError] = useState<string | null>(null);
 const [isDiscovering, setIsDiscovering] = useState(false);
 const [model, setModel] = useState("");
 const [label, setLabel] = useState("");
 const [apiKey, setApiKey] = useState("");
 const [showKey, setShowKey] = useState(false);
 const { query, addMutation } = useManagedApiKeys();
 const runtimeReadiness = useAiRuntimeReadiness();
 const schemaReady = query.data?.schemaReady ?? true;
 const runtimeStorageReason =
  runtimeReadiness.data?.status === "storage-unavailable" ? runtimeReadiness.data.reason : null;
 const hardStorageBlocked =
  !schemaReady ||
  runtimeStorageReason === "schema-unavailable" ||
  runtimeStorageReason === "vault-unavailable";
 const hasStorageWarning = !schemaReady || runtimeStorageReason !== null;
 const isLoading = query.isPending;
 const isSubmitting = addMutation.isPending;
 const formDisabled = hardStorageBlocked || isSubmitting;

 const effectiveProvider =
  discovery?.provider ?? (providerSelection === AUTO_API_KEY_PROVIDER ? null : providerSelection);
 const selectedProviderOption = useMemo(
  () => API_KEY_PROVIDER_OPTIONS.find((option) => option.value === effectiveProvider) ?? null,
  [effectiveProvider],
 );
 const discoveredModelOptions = useMemo(() => {
  if (!discovery) return [];
  const available = new Set(discovery.models);
  return getApiKeyModelOptions(discovery.provider).filter((option) => available.has(option.value));
 }, [discovery]);
 const selectedModelOption =
  discoveredModelOptions.find((option) => option.value === model) ?? null;

 function resetForm() {
  setProviderSelection(AUTO_API_KEY_PROVIDER);
  setDiscovery(null);
  setDiscoveryError(null);
  setIsDiscovering(false);
  setModel("");
  setLabel("");
  setApiKey("");
  setShowKey(false);
 }

 async function runDiscovery(
  rawKey: string,
  selectedProvider: ProviderSelection = providerSelection,
 ) {
  if (hardStorageBlocked) return;
  const normalizedKey = rawKey.trim();
  if (!normalizedKey) {
   setDiscovery(null);
   setDiscoveryError(null);
   setModel("");
   return;
  }

  setIsDiscovering(true);
  setDiscovery(null);
  setDiscoveryError(null);
  setModel("");
  try {
   const result = await discoverManagedApiKey({
    apiKey: normalizedKey,
    provider: selectedProvider,
   });
   setDiscovery(result);
   setModel(result.recommendedModel);
   if (!label.trim()) setLabel(result.providerLabel);
  } catch (caught) {
   setDiscoveryError(caught instanceof Error ? caught.message : setupT("checkError"));
  } finally {
   setIsDiscovering(false);
  }
 }

 async function handlePaste() {
  if (formDisabled) return;
  try {
   const text = await navigator.clipboard.readText();
   const normalized = text.trim();
   if (!normalized) return;
   setApiKey(normalized);
   toast.info(t("apiKeys.pasted"));
   await runDiscovery(normalized);
  } catch {
   toast.error(t("apiKeys.clipboardError"));
  }
 }

 function handleProviderChange(value: string) {
  const parsedProvider = ApiKeyProviderSchema.safeParse(value);
  const nextProvider: ProviderSelection =
   value === AUTO_API_KEY_PROVIDER
    ? AUTO_API_KEY_PROVIDER
    : parsedProvider.success
      ? parsedProvider.data
      : AUTO_API_KEY_PROVIDER;
  setProviderSelection(nextProvider);
  setDiscovery(null);
  setDiscoveryError(null);
  setModel("");
  if (apiKey.trim() && !hardStorageBlocked) void runDiscovery(apiKey, nextProvider);
 }

 async function handleAddKey() {
  if (hardStorageBlocked) return;
  if (!apiKey.trim()) {
   toast.error(t("apiKeys.keyRequired"));
   return;
  }
  if (!discovery || !model) {
   await runDiscovery(apiKey);
   return;
  }

  try {
   const result = await addMutation.mutateAsync({
    apiKey: apiKey.trim(),
    label: label.trim() || undefined,
    provider: discovery.provider,
    model,
   });
   toast.success(result.message || t("apiKeys.added"));
   resetForm();
   setIsOpen(false);
   onSaved?.();
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : setupT("saveError"));
  }
 }

 return (
  <Dialog
   open={isOpen}
   onOpenChange={(open) => {
    setIsOpen(open);
    if (!open) resetForm();
   }}
  >
   <DialogTrigger asChild>
    {trigger ?? (
     <Button type="button" disabled={isLoading}>
      <Plus data-icon="inline-start" />
      {t("apiKeys.add")}
     </Button>
    )}
   </DialogTrigger>
   <DialogContent size="lg">
    <DialogHeader>
     <DialogTitle>{t("apiKeys.dialogTitle")}</DialogTitle>
     <DialogDescription>{t("apiKeys.dialogDescription")}</DialogDescription>
    </DialogHeader>

    <DialogBody>
     {hasStorageWarning ? (
      <Card variant="subtle" padding="md" className="grid gap-1">
       <Typography weight="bold" tone="warning">
        {setupT("storageUnavailableTitle")}
       </Typography>
       <Typography variant="bodySmall" tone="muted">
        {!schemaReady ? t("apiKeys.schemaNotReady") : setupT("storageUnavailableDescription")}
       </Typography>
      </Card>
     ) : null}

     <Card variant="subtle" padding="md" className="grid gap-3">
      <Typography weight="bold">{t("apiKeys.guideTitle")}</Typography>
      <ol className="grid gap-2 pl-5 text-sm text-text-secondary [list-style:decimal]">
       <li>{t("apiKeys.guideStep1")}</li>
       <li>{t("apiKeys.guideStep2")}</li>
       <li>{setupT("pasteAndCheck")}</li>
      </ol>
     </Card>

     <div className="grid gap-2">
      <Label htmlFor={valueId} variant="label" tone="default" weight="semibold">
       {t("apiKeys.apiKey")}
      </Label>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
       <Input
        id={valueId}
        type={showKey ? "text" : "password"}
        value={apiKey}
        onChange={(event) => {
         setApiKey(event.target.value);
         setDiscovery(null);
         setDiscoveryError(null);
         setModel("");
        }}
        onPaste={(event) => {
         const pasted = event.clipboardData.getData("text").trim();
         if (!pasted || formDisabled) return;
         event.preventDefault();
         setApiKey(pasted);
         setDiscovery(null);
         setDiscoveryError(null);
         setModel("");
         void runDiscovery(pasted);
        }}
        onBlur={() => {
         if (apiKey.trim() && !discovery && !isDiscovering && !formDisabled) {
          void runDiscovery(apiKey);
         }
        }}
        placeholder={selectedProviderOption?.placeholder || t("apiKeys.apiKeyPlaceholder")}
        autoComplete="off"
        spellCheck={false}
        disabled={formDisabled}
       />
       <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setShowKey((current) => !current)}
        aria-label={showKey ? t("apiKeys.hideKey") : t("apiKeys.showKey")}
        title={showKey ? t("apiKeys.hideKey") : t("apiKeys.showKey")}
        disabled={formDisabled}
       >
        {showKey ? <EyeOff /> : <Eye />}
       </Button>
       <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => void handlePaste()}
        aria-label={t("apiKeys.pasteKey")}
        title={t("apiKeys.pasteKey")}
        disabled={formDisabled}
       >
        <ClipboardPaste />
       </Button>
      </div>
      <Typography as="p" variant="caption" tone="muted">
       {setupT("autoProviderHint")}
      </Typography>
     </div>

     <div className="grid gap-2">
      <Label htmlFor={providerId} variant="label" tone="default" weight="semibold">
       {t("apiKeys.provider")}
      </Label>
      <Select
       value={providerSelection}
       onValueChange={handleProviderChange}
       disabled={formDisabled}
      >
       <SelectTrigger id={providerId} width="full">
        <SelectValue />
       </SelectTrigger>
       <SelectContent align="start">
        <SelectItem value={AUTO_API_KEY_PROVIDER}>{setupT("autoProvider")}</SelectItem>
        {API_KEY_PROVIDER_OPTIONS.map((option) => (
         <SelectItem key={option.value} value={option.value}>
          {option.label}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>

     {isDiscovering ? (
      <Card variant="subtle" padding="sm">
       <div className="flex items-center gap-2">
        <Spinner />
        <Typography variant="bodySmall" tone="secondary">
         {setupT("checking")}
        </Typography>
       </div>
      </Card>
     ) : discovery ? (
      <Card variant="subtle" padding="sm" className="grid gap-2">
       <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success" casing="natural">
         <ShieldCheck />
         {setupT("ready", {
          provider: discovery.providerLabel,
          count: discovery.models.length,
         })}
        </Badge>
        <Button
         type="button"
         variant="ghost"
         size="sm"
         onClick={() => void runDiscovery(apiKey)}
         disabled={formDisabled}
        >
         <RefreshCcw data-icon="inline-start" />
         {setupT("recheck")}
        </Button>
       </div>
      </Card>
     ) : discoveryError ? (
      <Card variant="subtle" padding="sm" className="grid gap-2">
       <Typography variant="bodySmall" tone="danger">
        {discoveryError}
       </Typography>
       <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void runDiscovery(apiKey)}
        disabled={formDisabled}
       >
        <RefreshCcw data-icon="inline-start" />
        {setupT("recheck")}
       </Button>
      </Card>
     ) : null}

     {selectedProviderOption ? (
      <div className="grid gap-3 border-y border-border-default py-3">
       <div className="flex flex-wrap items-center gap-2">
        <Typography weight="semibold">{selectedProviderOption.label}</Typography>
        {discovery ? (
         <Badge variant="info" casing="natural">
          {setupT("providerDetected", { provider: selectedProviderOption.label })}
         </Badge>
        ) : null}
        <Badge
         variant={selectedProviderOption.accessTier === "free-tier" ? "success" : "default"}
         casing="natural"
        >
         {selectedProviderOption.accessTier === "free-tier"
          ? t("apiKeys.freeTierAvailable")
          : t("apiKeys.paidUsage")}
        </Badge>
       </div>
       <Typography as="p" variant="bodySmall" tone="secondary">
        {t(getApiKeyProviderDescriptionKey(selectedProviderOption.value))}
       </Typography>
       <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
         <a
          href={getApiKeyProviderDocsUrl(selectedProviderOption.value)}
          target="_blank"
          rel="noreferrer"
         >
          {t("apiKeys.openDocs")}
          <ExternalLink data-icon="inline-end" />
         </a>
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
         <a
          href={getApiKeyProviderLimitsUrl(selectedProviderOption.value)}
          target="_blank"
          rel="noreferrer"
         >
          {t("apiKeys.openLimits")}
          <ExternalLink data-icon="inline-end" />
         </a>
        </Button>
       </div>
      </div>
     ) : null}

     <div className="grid gap-2">
      <Label htmlFor={modelId} variant="label" tone="default" weight="semibold">
       {t("apiKeys.model")}
      </Label>
      <Select
       value={model}
       onValueChange={setModel}
       disabled={formDisabled || !discovery || discoveredModelOptions.length === 0 || isDiscovering}
      >
       <SelectTrigger id={modelId} width="full">
        <SelectValue placeholder={discovery ? setupT("modelEmpty") : setupT("modelWaiting")} />
       </SelectTrigger>
       <SelectContent align="start">
        {discoveredModelOptions.map((option) => (
         <SelectItem key={option.value} value={option.value}>
          {option.label}
          {option.value === discovery?.recommendedModel ? ` · ${setupT("recommended")}` : ""}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
      <Typography as="p" variant="bodySmall" tone="muted">
       {selectedModelOption
        ? t(getApiKeyModelDescriptionKey(discovery?.provider || "groq", selectedModelOption.value))
        : discovery
          ? setupT("modelHint")
          : setupT("modelWaiting")}
      </Typography>
     </div>

     <div className="grid gap-2">
      <Label htmlFor={labelId} variant="label" tone="default" weight="semibold">
       {t("apiKeys.displayName")}
      </Label>
      <Input
       id={labelId}
       value={label}
       onChange={(event) => setLabel(event.target.value)}
       placeholder={t("apiKeys.displayNamePlaceholder")}
       maxLength={80}
       disabled={formDisabled}
      />
     </div>

     <Typography as="p" variant="caption" tone="muted">
      {t("apiKeys.quotaDisclaimer")}
     </Typography>
    </DialogBody>

    <DialogFooter>
     <Button
      type="button"
      variant="outline"
      onClick={() => setIsOpen(false)}
      disabled={isSubmitting}
     >
      {common("actions.cancel")}
     </Button>
     <Button
      type="button"
      onClick={() => void handleAddKey()}
      disabled={
       hardStorageBlocked || !apiKey.trim() || !discovery || !model || isDiscovering || isSubmitting
      }
     >
      {isSubmitting ? (
       <Spinner data-icon="inline-start" />
      ) : (
       <ShieldCheck data-icon="inline-start" />
      )}
      {t("apiKeys.verifySave")}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
