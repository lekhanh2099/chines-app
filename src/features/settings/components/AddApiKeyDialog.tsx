"use client";

import { ClipboardPaste, Eye, EyeOff, Plus, ShieldCheck } from "lucide-react";
import { useId, type ReactElement } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/overlays/dialog";
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
import { getApiKeyModelDescriptionKey } from "@/features/settings/model/model-description-keys";
import { useAddApiKeyForm } from "@/features/settings/hooks/useAddApiKeyForm";
import { AUTO_API_KEY_PROVIDER, API_KEY_PROVIDER_OPTIONS } from "@/lib/ai/api-key-providers";

import {
 ApiKeyDiscoveryChecking,
 ApiKeyDiscoveryError,
 ApiKeyDiscoveryReady,
 ApiKeyProviderDetails,
 ApiKeySetupGuide,
 ApiKeyStorageWarning,
} from "./AddApiKeyDialogSections";

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
 const {
  isOpen,
  setIsOpen,
  providerSelection,
  discovery,
  discoveryError,
  isDiscovering,
  model,
  setModel,
  label,
  setLabel,
  apiKey,
  showKey,
  setShowKey,
  schemaReady,
  hardStorageBlocked,
  hasStorageWarning,
  isLoading,
  isSubmitting,
  formDisabled,
  selectedProviderOption,
  discoveredModelOptions,
  selectedModelOption,
  resetForm,
  changeApiKey,
  runDiscovery,
  handlePaste,
  handleProviderChange,
  handleAddKey,
 } = useAddApiKeyForm({ onSaved });

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
     {hasStorageWarning ? <ApiKeyStorageWarning schemaReady={schemaReady} /> : null}

     <ApiKeySetupGuide />

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
         changeApiKey(event.target.value);
        }}
        onPaste={(event) => {
         const pasted = event.clipboardData.getData("text").trim();
         if (!pasted || formDisabled) return;
         event.preventDefault();
         changeApiKey(pasted);
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
      <ApiKeyDiscoveryChecking />
     ) : discovery ? (
      <ApiKeyDiscoveryReady
       discovery={discovery}
       disabled={formDisabled}
       onRecheck={() => void runDiscovery(apiKey)}
      />
     ) : discoveryError ? (
      <ApiKeyDiscoveryError
       message={discoveryError}
       disabled={formDisabled}
       onRecheck={() => void runDiscovery(apiKey)}
      />
     ) : null}

     {selectedProviderOption ? (
      <ApiKeyProviderDetails option={selectedProviderOption} detected={Boolean(discovery)} />
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
