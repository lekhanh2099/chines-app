"use client";

import { useMemo, useState } from "react";
import {
 BarChart3,
 Check,
 ClipboardPaste,
 Cpu,
 ExternalLink,
 Eye,
 EyeOff,
 Gift,
 KeyRound,
 Loader2,
 Pause,
 Play,
 Plus,
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
import { getApiKeyModelOptions, getDefaultApiKeyModel } from "@/lib/api-key-models";
import {
 API_KEY_PROVIDER_OPTIONS,
 ApiKeyProviderSchema,
 getApiKeyProviderDocsUrl,
 getApiKeyProviderLimitsUrl,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";
import {
 getApiKeyModelDescriptionKey,
 getApiKeyProviderDescriptionKey,
} from "@/features/settings/model-description-keys";
import { useManagedApiKeys } from "@/features/settings/useManagedApiKeys";

const EMPTY_SUMMARY = {
 total: 0,
 active: 0,
 groq: 0,
 deepseek: 0,
 gemini: 0,
 openai: 0,
};

export default function ApiKeyManagerSection() {
 const t = useTranslations("Settings");
 const common = useTranslations("Common");
 const locale = useLocale();
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
 const [provider, setProvider] = useState<ApiKeyProvider>("groq");
 const [model, setModel] = useState(getDefaultApiKeyModel("groq"));
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
 const summary = query.data?.summary ?? EMPTY_SUMMARY;
 const schemaReady = query.data?.schemaReady ?? true;
 const isLoading = query.isPending;
 const isSubmitting = addMutation.isPending;
 const freeProviders = API_KEY_PROVIDER_OPTIONS.filter((option) => option.accessTier === "free-tier");
 const freeTierKeyCount = keys.filter((key) =>
  freeProviders.some((providerOption) => providerOption.value === key.provider),
 ).length;
 const latestValidatedAt = keys
  .map((key) => key.lastValidatedAt)
  .filter((value): value is string => Boolean(value))
  .toSorted((left, right) => right.localeCompare(left))[0];

 const selectedProviderOption = useMemo(
  () => API_KEY_PROVIDER_OPTIONS.find((option) => option.value === provider) ?? null,
  [provider],
 );
 const modelOptions = useMemo(() => getApiKeyModelOptions(provider), [provider]);
 const formatDate = (value: string | null | undefined) =>
  value
   ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
     )
   : t("apiKeys.never");

 async function handlePaste() {
  try {
   const text = await navigator.clipboard.readText();
   if (text) {
    setApiKey(text.trim());
    toast.info(t("apiKeys.pasted"));
   }
  } catch {
   toast.error(t("apiKeys.clipboardError"));
  }
 }

 async function handleAddKey() {
  if (!apiKey.trim()) {
   toast.error(t("apiKeys.keyRequired"));
   return;
  }

  try {
   await addMutation.mutateAsync({
    apiKey: apiKey.trim(),
    label: label.trim() || undefined,
    provider,
    model,
   });
   toast.success(t("apiKeys.added"));
   setApiKey("");
   setLabel("");
   setProvider("groq");
   setModel(getDefaultApiKeyModel("groq"));
   setShowKey(false);
   setIsDialogOpen(false);
  } catch {
   toast.error(t("apiKeys.addError"));
  }
 }

 async function handleModelChange(keyId: string, nextModel: string) {
  try {
   await modelMutation.mutateAsync({ keyId, model: nextModel });
   toast.success(t("apiKeys.modelChanged"));
  } catch {
   toast.error(t("apiKeys.modelChangeError"));
  }
 }

 async function handleToggleKey(key: (typeof keys)[number]) {
  try {
   await toggleMutation.mutateAsync({ keyId: key.id, isActive: !key.isActive });
  } catch {
   toast.error(t("apiKeys.toggleError"));
  }
 }

 async function handleMoveKey(
  keyId: string,
  direction: Parameters<typeof moveMutation.mutateAsync>[0]["direction"],
 ) {
  try {
   await moveMutation.mutateAsync({ keyId, direction });
  } catch {
   toast.error(t("apiKeys.moveError"));
  }
 }

 async function handleDeleteKey() {
  if (!deleteKeyId) return;
  try {
   await deleteMutation.mutateAsync(deleteKeyId);
   setDeleteKeyId(null);
   toast.success(t("apiKeys.deleted"));
  } catch {
   toast.error(t("apiKeys.deleteError"));
  }
 }

 return (
  <Card variant="section" padding="lg" className="grid gap-5">
   <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="flex max-w-3xl items-start gap-3">
     <IconTile tone="accent" size="sm">
      <Cpu aria-hidden="true" />
     </IconTile>
     <div className="grid gap-1">
      <Typography as="h2" variant="sectionTitle" tone="default" weight="bold">
       {t("apiKeys.title")}
      </Typography>
      <Typography as="p" tone="secondary" leading="standard">
       {t("apiKeys.description")}
      </Typography>
     </div>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
         <li>{t("apiKeys.guideStep3")}</li>
        </ol>
       </div>

       <div className="grid gap-2">
        <Label htmlFor="api-key-provider" variant="label" tone="default" weight="semibold">
         {t("apiKeys.provider")}
        </Label>
        <Select
         value={provider}
         onValueChange={(value) => {
          const parsedProvider = ApiKeyProviderSchema.safeParse(value);
          if (!parsedProvider.success) return;
          setProvider(parsedProvider.data);
          setModel(getDefaultApiKeyModel(parsedProvider.data));
         }}
        >
         <SelectTrigger id="api-key-provider" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          {API_KEY_PROVIDER_OPTIONS.map((option) => (
           <SelectItem key={option.value} value={option.value}>
            {option.label}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
       </div>

       {selectedProviderOption ? (
        <div className="grid gap-3 border-y border-border-default py-3">
         <div className="flex flex-wrap items-center gap-2">
          <Typography weight="semibold">{selectedProviderOption.label}</Typography>
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
        <Select value={model} onValueChange={setModel}>
         <SelectTrigger id="api-key-model" width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          {modelOptions.map((option) => (
           <SelectItem key={option.value} value={option.value}>
            {option.label}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
        <Typography as="p" variant="bodySmall" tone="muted">
         {t(getApiKeyModelDescriptionKey(provider, model))}
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

       <div className="grid gap-2">
        <Label htmlFor="api-key-value" variant="label" tone="default" weight="semibold">
         {t("apiKeys.apiKey")}
        </Label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
         <Input
          id="api-key-value"
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
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
          onClick={handlePaste}
          aria-label={t("apiKeys.pasteKey")}
          title={t("apiKeys.pasteKey")}
         >
          <ClipboardPaste />
         </Button>
        </div>
       </div>

       <Typography as="p" variant="caption" tone="muted">
        {t("apiKeys.quotaDisclaimer")}
       </Typography>
      </DialogBody>

      <DialogFooter>
       <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
        {common("actions.cancel")}
       </Button>
       <Button onClick={handleAddKey} disabled={!apiKey.trim() || isSubmitting || !schemaReady}>
        {isSubmitting ? <Spinner data-icon="inline-start" /> : <ShieldCheck data-icon="inline-start" />}
        {t("apiKeys.verifySave")}
       </Button>
      </DialogFooter>
     </DialogContent>
    </Dialog>
   </div>

   <div className="grid gap-3 border-y border-border-default py-4">
    <div className="flex items-start gap-3">
     <IconTile tone="success" size="sm">
      <Gift aria-hidden="true" />
     </IconTile>
     <div className="grid min-w-0 gap-1">
      <Typography weight="bold">{t("apiKeys.freeGuideTitle")}</Typography>
      <Typography as="p" variant="bodySmall" tone="secondary">
       {t("apiKeys.freeGuideDescription")}
      </Typography>
     </div>
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
     {freeProviders.map((providerOption) => (
      <div
       key={providerOption.value}
       className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border-default bg-bg-primary p-3"
      >
       <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
         <Typography weight="semibold">{providerOption.label}</Typography>
         <Badge variant="success" size="sm" casing="natural">
          {t("apiKeys.freeTierAvailable")}
         </Badge>
        </div>
        <Typography variant="caption" tone="muted" clamp="two">
         {t(getApiKeyProviderDescriptionKey(providerOption.value))}
        </Typography>
       </div>
       <Button type="button" variant="outline" size="sm" asChild>
        <a href={providerOption.docsUrl} target="_blank" rel="noreferrer">
         {t("apiKeys.getKey")}
         <ExternalLink data-icon="inline-end" />
        </a>
       </Button>
      </div>
     ))}
    </div>
   </div>

   <div className="grid gap-3">
    <div className="flex items-center gap-2">
     <BarChart3 className="size-4 text-text-muted" aria-hidden="true" />
     <Typography weight="semibold">{t("apiKeys.statsTitle")}</Typography>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
     <KeyStat label={t("apiKeys.statsConfigured")} value={String(summary.total)} />
     <KeyStat label={t("apiKeys.statsActive")} value={String(summary.active)} />
     <KeyStat label={t("apiKeys.statsFreeTier")} value={String(freeTierKeyCount)} />
     <KeyStat label={t("apiKeys.statsLastVerified")} value={formatDate(latestValidatedAt)} />
    </div>
    <Typography as="p" variant="caption" tone="muted">
     {t("apiKeys.statsScope")}
    </Typography>
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
     <Loader2 className="size-4 animate-spin" aria-hidden="true" />
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
      const providerOption = API_KEY_PROVIDER_OPTIONS.find((option) => option.value === key.provider);

      return (
       <article key={key.id} className="grid gap-4 py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)_auto] lg:items-center">
         <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2">
           <Badge
            variant={providerOption?.accessTier === "free-tier" ? "success" : "default"}
            size="sm"
           >
            {key.providerLabel}
           </Badge>
           <Badge
            variant={key.id === selectedKeyId ? "info" : key.isActive ? "success" : "default"}
            size="sm"
           >
            {key.isActive ? <Check aria-hidden="true" /> : <Pause aria-hidden="true" />}
            {key.id === selectedKeyId
             ? t("apiKeys.statusSelected")
             : key.isActive
               ? t("apiKeys.statusActive")
               : t("apiKeys.statusPaused")}
           </Badge>
          </div>
          <div className="grid min-w-0 gap-1">
           <Typography as="h3" variant="cardTitle" tone="default" weight="bold" clamp="one">
            {key.label}
           </Typography>
           <Typography as="p" variant="code" tone="secondary" clamp="one">
            {key.maskedKey}
           </Typography>
           <Typography variant="caption" tone="muted">
            {t("apiKeys.verifiedAt", { date: formatDate(key.lastValidatedAt) })}
           </Typography>
          </div>
         </div>

         <div className="grid min-w-0 gap-1.5">
          <Typography variant="caption" tone="muted" weight="semibold">
           {t("apiKeys.modelUsed")}
          </Typography>
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
            !getApiKeyModelOptions(key.provider).some((option) => option.value === key.defaultModel) ? (
             <SelectItem value={key.defaultModel}>
              {key.defaultModel} ({t("ai.savedSuffix")})
             </SelectItem>
            ) : null}
            {getApiKeyModelOptions(key.provider).map((option) => (
             <SelectItem key={option.value} value={option.value}>
              {option.label}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
          <Typography as="span" variant="caption" tone="muted" leading="compact">
           {t(getApiKeyModelDescriptionKey(key.provider, key.defaultModel))}
          </Typography>
         </div>

         <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {index > 0 ? (
           <Button
            variant="outline"
            size="sm"
            onClick={() => void handleMoveKey(key.id, "up")}
            disabled={isBusy || !schemaReady}
           >
            {t("apiKeys.moveUp")}
           </Button>
          ) : null}
          <Button
           variant="outline"
           size="sm"
           onClick={() => void handleToggleKey(key)}
           disabled={isBusy || !schemaReady}
          >
           {isBusy ? (
            <Spinner data-icon="inline-start" />
           ) : key.isActive ? (
            <Pause data-icon="inline-start" />
           ) : (
            <Play data-icon="inline-start" />
           )}
           {key.isActive ? t("apiKeys.pause") : t("apiKeys.resume")}
          </Button>
          <Button
           variant="destructive"
           size="sm"
           onClick={() => setDeleteKeyId(key.id)}
           disabled={isBusy || !schemaReady}
          >
           <Trash2 data-icon="inline-start" />
           {t("apiKeys.delete")}
          </Button>
         </div>
        </div>
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

function KeyStat({ label, value }: { label: string; value: string }) {
 return (
  <div className="grid min-w-0 gap-1">
   <Typography variant="caption" tone="muted">
    {label}
   </Typography>
   <Typography weight="bold" clamp="one">
    {value}
   </Typography>
  </div>
 );
}
