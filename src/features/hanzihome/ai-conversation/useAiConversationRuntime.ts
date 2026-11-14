"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchManagedApiKeys } from "@/features/settings/services/api-key-manager.client";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { getApiKeyModelOptions } from "@/lib/ai/api-key-models";

import { fetchAiConversationRuntimeHealth } from "./services/ai-conversation-api";
import { AUTO_RUNTIME_KEY_ID } from "./components/AiConversationRuntimeMenu";
import {
 readRuntimeOverride,
 runtimeOverrideStorageKey,
 type RuntimeSelection,
} from "./ai-conversation-workspace-utils";

export function useAiConversationRuntime(activeConversationId: string | null) {
 const [runtimeSelection, setRuntimeSelection] = useState<RuntimeSelection>({
  conversationId: null,
  keyId: AUTO_RUNTIME_KEY_ID,
  model: null,
 });

 const runtimeKeysQuery = useQuery({
  queryKey: ["settings", "api-keys"],
  queryFn: fetchManagedApiKeys,
  retry: false,
 });
 const runtimeKeys = runtimeKeysQuery.data?.keys.filter((key) => key.isActive) ?? [];
 const storedRuntimeOverride =
  activeConversationId && typeof window !== "undefined"
   ? readRuntimeOverride(
      window.sessionStorage.getItem(runtimeOverrideStorageKey(activeConversationId)),
     )
   : null;
 const requestedRuntimeOverride =
  runtimeSelection.conversationId === activeConversationId
   ? { keyId: runtimeSelection.keyId, model: runtimeSelection.model }
   : storedRuntimeOverride;
 const requestedRuntimeKey = runtimeKeys.find((key) => key.id === requestedRuntimeOverride?.keyId);
 const requestedRuntimeModelSupported = Boolean(
  requestedRuntimeKey &&
  requestedRuntimeOverride?.model &&
  (requestedRuntimeKey.defaultModel === requestedRuntimeOverride.model ||
   getApiKeyModelOptions(requestedRuntimeKey.provider).some(
    (option) => option.value === requestedRuntimeOverride.model,
   )),
 );
 const runtimeKeyId =
  requestedRuntimeKey && requestedRuntimeModelSupported
   ? requestedRuntimeKey.id
   : AUTO_RUNTIME_KEY_ID;
 const runtimeModel =
  requestedRuntimeKey && requestedRuntimeModelSupported
   ? (requestedRuntimeOverride?.model ?? null)
   : null;
 const isRuntimeLoading = runtimeKeysQuery.isPending;
 const runtimeLoadError = runtimeKeysQuery.isError;

 const runtimeHealthQuery = useQuery({
  queryKey: hanzihomeQueryKeys.aiConversationRuntimeHealth(runtimeKeyId),
  queryFn: ({ signal }) =>
   fetchAiConversationRuntimeHealth({
    ...(runtimeKeyId !== AUTO_RUNTIME_KEY_ID ? { apiKeyId: runtimeKeyId } : {}),
    signal,
   }),
  enabled: !isRuntimeLoading,
  retry: false,
 });

 const selectRuntimeKey = (value: string, resetSend: () => void) => {
  const nextValue =
   value === AUTO_RUNTIME_KEY_ID || runtimeKeys.some((key) => key.id === value)
    ? value
    : AUTO_RUNTIME_KEY_ID;
  const selectedKey = runtimeKeys.find((key) => key.id === nextValue);
  const nextModel = selectedKey?.defaultModel ?? null;
  const conversationId = activeConversationId;
  setRuntimeSelection({ conversationId, keyId: nextValue, model: nextModel });
  resetSend();
  if (!conversationId) return;
  const storageKey = runtimeOverrideStorageKey(conversationId);
  if (nextValue === AUTO_RUNTIME_KEY_ID || !nextModel) {
   window.sessionStorage.removeItem(storageKey);
   return;
  }
  window.sessionStorage.setItem(storageKey, JSON.stringify({ keyId: nextValue, model: nextModel }));
 };

 const selectRuntimeModel = (model: string) => {
  const selectedKey = runtimeKeys.find((key) => key.id === runtimeKeyId);
  if (!selectedKey) return;
  const supported =
   selectedKey.defaultModel === model ||
   getApiKeyModelOptions(selectedKey.provider).some((option) => option.value === model);
  if (!supported) return;
  const conversationId = activeConversationId;
  setRuntimeSelection({ conversationId, keyId: selectedKey.id, model });
  if (!conversationId) return;
  window.sessionStorage.setItem(
   runtimeOverrideStorageKey(conversationId),
   JSON.stringify({ keyId: selectedKey.id, model }),
  );
 };

 return {
  runtimeKeys,
  runtimeKeyId,
  runtimeModel,
  isRuntimeLoading,
  runtimeLoadError,
  runtimeHealthQuery,
  selectRuntimeKey,
  selectRuntimeModel,
 };
}
