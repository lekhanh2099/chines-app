"use client";

import { useMemo, useState } from "react";
import {
 ArrowUp,
 Check,
 ClipboardPaste,
 Cpu,
 ExternalLink,
 Eye,
 EyeOff,
 KeyRound,
 MoreHorizontal,
 Pause,
 Play,
 Plus,
 RefreshCcw,
 ShieldCheck,
 Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconTile } from "@/components/ui/icon-tile";
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
import { discoverManagedApiKey } from "@/features/settings/api-key-manager.client";
import type { DiscoverApiKeyResponse } from "@/features/settings/api-key-manager.schema";
import {
 getApiKeyModelDescriptionKey,
 getApiKeyProviderDescriptionKey,
} from "@/features/settings/model-description-keys";
import { useManagedApiKeys } from "@/features/settings/useManagedApiKeys";
import { getApiKeyModelOptions, getDefaultApiKeyModel } from "@/lib/api-key-models";
import {
 AUTO_API_KEY_PROVIDER,
 API_KEY_PROVIDER_OPTIONS,
 ApiKeyProviderSchema,
 getApiKeyProviderDocsUrl,
 getApiKeyProviderLimitsUrl,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";

type ProviderSelection = typeof AUTO_API_KEY_PROVIDER | ApiKeyProvider;
type MoveDirection = "up" | "down";

export default function ApiKeyManagerSection() {
 const t = useTranslations("Settings");
 const lookupT = useTranslations("AiLookupSettings");
 const setupT = useTranslations("ApiKeySetup");
 const common = useTranslations("Common");
 const locale = useLocale();
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
 const [providerSelection, setProviderSelection] =
  useState<ProviderSelection>(AUTO_API_KEY_PROVIDER);
 const [discovery, setDiscovery] = useState<DiscoverApiKeyResponse | null>(null);
 const [discoveryError, setDiscoveryError] = useState<string | null>(null);
 const [isDiscovering, setIsDiscovering] = useState(false);
 const [model, setModel] = useState("");
 const [label, setLabel] = useState("");
 const [apiKey, setApiKey] = useState("");
 const [showKey, setShowKey] = useState(false);
 const {
  query,
  addMutation,
  toggleMutation,
  moveMutation,
  modelMutation,
  deleteMutation,
  busyKeyId,
 } = useManagedApiKeys();
 const keys = query.data?.keys ?? [];
 const selectedKeyId = keys.find((key) => key.isActive)?.id ?? null;
 const schemaReady = query.data?.schemaReady ?? true;
 const isLoading = query.isPending;
 const isSubmitting = addMutation.isPending;

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
 const formatDate = (value: string | null | undefined) =>
  value
   ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
     )
   : t("apiKeys.never");

 function resetAddForm() {
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
   const message = caught instanceof Error ? caught.message : setupT("checkError");
   setDiscoveryError(message);
  } finally {
   setIsDiscovering(false);
  }
 }

 async function handlePaste() {
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
  if (apiKey.trim()) void runDiscovery(apiKey, nextProvider);
 }

 async function handleAddKey() {
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
   resetAddForm();
   setIsDialogOpen(false);
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : setupT("saveError"));
  }
 }

 async function handleModelChange(keyId: string, nextModel: string) {
  try {
   await modelMutation.mutateAsync({ keyId, model: nextModel });
   toast.success(t("apiKeys.modelChanged"));
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : t("apiKeys.modelChangeError"));
  }
 }

 async function handleToggleKey(key: (typeof keys)[number]) {
  try {
   await toggleMutation.mutateAsync({ keyId: key.id, isActive: !key.isActive });
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : t("apiKeys.toggleError"));
  }
 }

 async function handleMoveKey(keyId: string, direction: MoveDirection) {
  try {
   await moveMutation.mutateAsync({ keyId, direction });
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : t("apiKeys.moveError"));
  }
 }

 async function handleDeleteKey() {
  if (!deleteKeyId) return;
  try {
   await deleteMutation.mutateAsync(deleteKeyId);
   setDeleteKeyId(null);
   toast.success(t("apiKeys.deleted"));
  } catch (caught) {
   toast.error(caught instanceof Error ? caught.message : t("apiKeys.deleteError"));
  }
 }

 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex max-w-3xl items-start gap-3">
     <IconTile tone="accent" size="sm">
      <Cpu aria-hidden="true" />
     </IconTile>
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" tone="default" weight="bold">
       {t("apiKeys.title")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary" leading="standard">
       {t("apiKeys.description")}
      </Typography>
     </div>
    </div>

    <Dialog
     open={isDialogOpen}
     onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) resetAddForm();
     }}
    >
     <DialogTrigger asChild>
      <Button disabled={isLoading || !schemaReady}>
       <Plus data-icon="inline-start" />
       {t("apiKeys.add")}
      </Button>
     </DialogTrigger>
     <DialogContent size="lg">
      <DialogHeader>
       <DialogTitle>{t("apiKeys.dialogTitle")}</DialogTitle>
       <DialogDescription>{t("apiKeys.dialogDescription")}</DialogDescription>
      </DialogHeader>

      <DialogBody>
       <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-4">
        <Typography weight="bold">{t("apiKeys.guideTitle")}</Typography>
        <ol className="grid gap-2 pl-5 text-sm text-text-secondary [list-style:decimal]">
         <li>{t("apiKeys.guideStep1")}</li>
         <li>{t("apiKeys.guideStep2")}</li>
         <li>{setupT("pasteAndCheck")}</li>
        </ol>
       </div>

       <div className="grid gap-2">
        <Label htmlFor="api-key-value" variant="label" tone="default" weight="semibold">
         {t("apiKeys.apiKey")}
        </Label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
         <Input
          id="api-key-value"
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
           if (!pasted) return;
           event.preventDefault();
           setApiKey(pasted);
           setDiscovery(null);
           setDiscoveryError(null);
           setModel("");
           void runDiscovery(pasted);
          }}
          onBlur={() => {
           if (apiKey.trim() && !discovery && !isDiscovering) void runDiscovery(apiKey);
          }}
          placeholder={selectedProviderOption?.placeholder || t("apiKeys.apiKeyPlaceholder")}
          autoComplete="off"
          spellCheck={false}
         />
         <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowKey((current) => !current)}
          aria-label={showKey ? t("apiKeys.hideKey") : t("apiKeys.showKey")}
          title={showKey ? t("apiKeys.hideKey") : t("apiKeys.showKey")}
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
         >
          <ClipboardPaste />
         </Button>
        </div>
        <Typography as="p" variant="caption" tone="muted">
         {setupT("autoProviderHint")}
        </Typography>
       </div>

       <div className="grid gap-2">
        <Label htmlFor="api-key-provider" variant="label" tone="default" weight="semibold">
         {t("apiKeys.provider")}
        </Label>
        <Select value={providerSelection} onValueChange={handleProviderChange}>
         <SelectTrigger id="api-key-provider" width="full">
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
          <Button type="button" variant="ghost" size="sm" onClick={() => void runDiscovery(apiKey)}>
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
        <Label htmlFor="api-key-model" variant="label" tone="default" weight="semibold">
         {t("apiKeys.model")}
        </Label>
        <Select
         value={model}
         onValueChange={setModel}
         disabled={!discovery || discoveredModelOptions.length === 0 || isDiscovering}
        >
         <SelectTrigger id="api-key-model" width="full">
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
          ? t(
             getApiKeyModelDescriptionKey(discovery?.provider || "groq", selectedModelOption.value),
            )
          : discovery
            ? setupT("modelHint")
            : setupT("modelWaiting")}
        </Typography>
       </div>

       <div className="grid gap-2">
        <Label htmlFor="api-key-label" variant="label" tone="default" weight="semibold">
         {t("apiKeys.displayName")}
        </Label>
        <Input
         id="api-key-label"
         value={label}
         onChange={(event) => setLabel(event.target.value)}
         placeholder={t("apiKeys.displayNamePlaceholder")}
         maxLength={80}
        />
       </div>

       <Typography as="p" variant="caption" tone="muted">
        {t("apiKeys.quotaDisclaimer")}
       </Typography>
      </DialogBody>

      <DialogFooter>
       <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
        {common("actions.cancel")}
       </Button>
       <Button
        onClick={() => void handleAddKey()}
        disabled={
         !apiKey.trim() || !discovery || !model || isDiscovering || isSubmitting || !schemaReady
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
   </div>

   {!schemaReady ? (
    <Card variant="subtle" padding="sm">
     <Typography as="p" variant="bodySmall" tone="warning">
      {t("apiKeys.schemaNotReady")}
     </Typography>
    </Card>
   ) : null}

   {query.isError ? (
    <div className="grid justify-items-start gap-2">
     <Typography as="p" weight="semibold" tone="danger">
      {t("apiKeys.loadError")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="secondary">
      {t("apiKeys.loadErrorDescription")}
     </Typography>
     <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
      {common("actions.retry")}
     </Button>
    </div>
   ) : isLoading ? (
    <div className="flex items-center gap-3 py-4 text-text-secondary">
     <Spinner />
     <Typography variant="bodySmall">{t("apiKeys.loading")}</Typography>
    </div>
   ) : keys.length === 0 ? (
    <div className="flex items-start gap-3 py-3">
     <IconTile tone="accent" size="sm">
      <KeyRound aria-hidden="true" />
     </IconTile>
     <div className="grid gap-1">
      <Typography as="p" tone="default" weight="semibold">
       {t("apiKeys.empty")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary" leading="compact">
       {schemaReady ? t("apiKeys.emptyReady") : t("apiKeys.emptyNotReady")}
      </Typography>
     </div>
    </div>
   ) : (
    <div className="divide-y divide-border-default border-y border-border-default">
     {keys.map((key, index) => {
      const isBusy = busyKeyId === key.id;
      const providerOption = API_KEY_PROVIDER_OPTIONS.find(
       (option) => option.value === key.provider,
      );
      const storedModelOptions = getApiKeyModelOptions(key.provider);

      return (
       <article
        key={key.id}
        className="grid min-w-0 gap-3 py-3 md:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)_auto] md:items-center"
       >
        <div className="grid min-w-0 gap-1.5">
         <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Typography as="h3" variant="cardTitle" tone="default" weight="bold" clamp="one">
           {key.label}
          </Typography>
          <Badge variant="default" size="sm" casing="natural">
           {key.providerLabel}
          </Badge>
          <Badge
           variant={key.id === selectedKeyId ? "info" : key.isActive ? "success" : "default"}
           size="sm"
           casing="natural"
          >
           {key.isActive ? <Check aria-hidden="true" /> : <Pause aria-hidden="true" />}
           {key.id === selectedKeyId
            ? t("apiKeys.statusSelected")
            : key.isActive
              ? t("apiKeys.statusActive")
              : t("apiKeys.statusPaused")}
          </Badge>
          {providerOption?.accessTier === "free-tier" ? (
           <Badge variant="success" size="sm" casing="natural">
            {t("apiKeys.freeTierAvailable")}
           </Badge>
          ) : null}
         </div>
         <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Typography as="span" variant="code" tone="secondary" clamp="one">
           {key.maskedKey}
          </Typography>
          <Typography variant="caption" tone="muted">
           {t("apiKeys.verifiedAt", { date: formatDate(key.lastValidatedAt) })}
          </Typography>
         </div>
        </div>

        <div className="grid min-w-0 gap-1">
         <Select
          value={key.defaultModel || getDefaultApiKeyModel(key.provider)}
          onValueChange={(value) => void handleModelChange(key.id, value)}
          disabled={isBusy || !schemaReady}
         >
          <SelectTrigger width="full" aria-label={t("apiKeys.modelAria", { label: key.label })}>
           <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
           {key.defaultModel &&
           !storedModelOptions.some((option) => option.value === key.defaultModel) ? (
            <SelectItem value={key.defaultModel}>
             {key.defaultModel} ({t("ai.savedSuffix")})
            </SelectItem>
           ) : null}
           {storedModelOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
             {option.label}
            </SelectItem>
           ))}
          </SelectContent>
         </Select>
         <Typography as="span" variant="caption" tone="muted" leading="compact" clamp="one">
          {t(getApiKeyModelDescriptionKey(key.provider, key.defaultModel))}
         </Typography>
        </div>

        <DropdownMenu>
         <DropdownMenuTrigger asChild>
          <Button
           variant="ghost"
           size="icon-toolbar"
           aria-label={lookupT("modelProvider.keyActions", { label: key.label })}
           disabled={isBusy || !schemaReady}
          >
           {isBusy ? <Spinner /> : <MoreHorizontal />}
          </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" width="sm">
          {index > 0 ? (
           <DropdownMenuItem onSelect={() => void handleMoveKey(key.id, "up")}>
            <ArrowUp />
            {t("apiKeys.moveUp")}
           </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => void handleToggleKey(key)}>
           {key.isActive ? <Pause /> : <Play />}
           {key.isActive ? t("apiKeys.pause") : t("apiKeys.resume")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="destructive" onSelect={() => setDeleteKeyId(key.id)}>
           <Trash2 />
           {t("apiKeys.delete")}
          </DropdownMenuItem>
         </DropdownMenuContent>
        </DropdownMenu>
       </article>
      );
     })}
    </div>
   )}

   <Dialog open={deleteKeyId !== null} onOpenChange={(open) => !open && setDeleteKeyId(null)}>
    <DialogContent size="sm">
     <DialogHeader>
      <DialogTitle>{t("apiKeys.deleteTitle")}</DialogTitle>
      <DialogDescription>{t("apiKeys.deleteDescription")}</DialogDescription>
     </DialogHeader>
     <DialogFooter>
      <Button
       variant="outline"
       onClick={() => setDeleteKeyId(null)}
       disabled={deleteMutation.isPending}
      >
       {common("actions.cancel")}
      </Button>
      <Button
       variant="destructive"
       onClick={() => void handleDeleteKey()}
       disabled={deleteMutation.isPending}
      >
       {deleteMutation.isPending ? (
        <Spinner data-icon="inline-start" />
       ) : (
        <Trash2 data-icon="inline-start" />
       )}
       {t("apiKeys.deleteConfirm")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </Card>
 );
}
