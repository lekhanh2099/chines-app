"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { aiRuntimeQueryKey } from "@/features/ai-runtime/ai-runtime.client";

import {
 addManagedApiKey,
 deleteManagedApiKey,
 fetchManagedApiKeys,
 moveManagedApiKey,
 toggleManagedApiKey,
 updateManagedApiKeyModel,
} from "./api-key-manager.client";
import type { ApiKeysResponse } from "./api-key-manager.schema";

const apiKeyManagerQueryKey = ["settings", "api-keys"];

export function useManagedApiKeys() {
 const queryClient = useQueryClient();
 const query = useQuery({
  queryKey: apiKeyManagerQueryKey,
  queryFn: fetchManagedApiKeys,
 });

 const refreshRuntime = () => queryClient.invalidateQueries({ queryKey: aiRuntimeQueryKey });
 const refresh = async () => {
  await Promise.all([
   queryClient.invalidateQueries({ queryKey: apiKeyManagerQueryKey }),
   refreshRuntime(),
  ]);
 };
 const addMutation = useMutation({
  mutationFn: (input: {
   apiKey: string;
   label?: string;
   provider: Parameters<typeof addManagedApiKey>[0]["provider"];
   model?: string;
  }) => addManagedApiKey(input),
  onSuccess: refresh,
 });
 const modelMutation = useMutation({
  mutationFn: updateManagedApiKeyModel,
  onSuccess: ({ key }) => {
   queryClient.setQueryData<ApiKeysResponse>(apiKeyManagerQueryKey, (current) =>
    current
     ? { ...current, keys: current.keys.map((item) => (item.id === key.id ? key : item)) }
     : current,
   );
   return refreshRuntime();
  },
 });
 const toggleMutation = useMutation({
  mutationFn: toggleManagedApiKey,
  onSuccess: ({ key }) => {
   queryClient.setQueryData<ApiKeysResponse>(apiKeyManagerQueryKey, (current) => {
    if (!current) return current;
    return {
     ...current,
     keys: current.keys.map((item) => (item.id === key.id ? key : item)),
     summary: {
      ...current.summary,
      active: current.summary.active + (key.isActive ? 1 : -1),
     },
    };
   });
   return refreshRuntime();
  },
 });
 const moveMutation = useMutation({
  mutationFn: moveManagedApiKey,
  onSuccess: ({ keys }) => {
   queryClient.setQueryData<ApiKeysResponse>(apiKeyManagerQueryKey, (current) =>
    current ? { ...current, keys } : current,
   );
   return refreshRuntime();
  },
 });
 const deleteMutation = useMutation({
  mutationFn: deleteManagedApiKey,
  onSuccess: refresh,
 });

 const busyKeyId =
  (toggleMutation.isPending ? toggleMutation.variables?.keyId : null) ??
  (moveMutation.isPending ? moveMutation.variables?.keyId : null) ??
  (modelMutation.isPending ? modelMutation.variables?.keyId : null) ??
  (deleteMutation.isPending ? deleteMutation.variables : null) ??
  null;

 return {
  query,
  addMutation,
  toggleMutation,
  moveMutation,
  modelMutation,
  deleteMutation,
  busyKeyId,
 };
}
