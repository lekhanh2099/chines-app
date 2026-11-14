"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAiRuntimeReadiness } from "@/features/ai-runtime/useAiRuntimeReadiness";
import { discoverManagedApiKey } from "@/features/settings/services/api-key-manager.client";
import type { DiscoverApiKeyResponse } from "@/features/settings/model/api-key-manager.schema";
import { useManagedApiKeys } from "@/features/settings/hooks/useManagedApiKeys";
import { getApiKeyModelOptions } from "@/lib/ai/api-key-models";
import {
 AUTO_API_KEY_PROVIDER,
 API_KEY_PROVIDER_OPTIONS,
 ApiKeyProviderSchema,
 type ApiKeyProvider,
} from "@/lib/ai/api-key-providers";

type ProviderSelection = typeof AUTO_API_KEY_PROVIDER | ApiKeyProvider;

type UseAddApiKeyFormOptions = {
 onSaved?(): void;
};

export function useAddApiKeyForm({ onSaved }: UseAddApiKeyFormOptions) {
 const t = useTranslations("Settings");
 const setupT = useTranslations("ApiKeySetup");
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

 function changeApiKey(value: string) {
  setApiKey(value);
  setDiscovery(null);
  setDiscoveryError(null);
  setModel("");
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

 return {
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
 };
}
