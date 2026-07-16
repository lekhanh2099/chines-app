"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
 addManagedApiKey,
 deleteManagedApiKey,
 fetchManagedApiKeys,
 moveManagedApiKey,
 toggleManagedApiKey,
} from "./api-key-manager.client";
import type { ApiKeysResponse } from "./api-key-manager.schema";
import type { ApiKeyProvider } from "@/lib/api-key-providers";

const apiKeyManagerQueryKey = ["settings", "api-keys"] as const;

export function useManagedApiKeys() {
 const queryClient = useQueryClient();
 const query = useQuery({
  queryKey: apiKeyManagerQueryKey,
  queryFn: fetchManagedApiKeys,
 });

 const refresh = () => queryClient.invalidateQueries({ queryKey: apiKeyManagerQueryKey });
 const addMutation = useMutation({
  mutationFn: (input: { apiKey: string; label?: string; provider: ApiKeyProvider | "auto" }) =>
   addManagedApiKey(input),
  onSuccess: refresh,
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
  },
 });
 const moveMutation = useMutation({
  mutationFn: moveManagedApiKey,
  onSuccess: ({ keys }) => {
   queryClient.setQueryData<ApiKeysResponse>(apiKeyManagerQueryKey, (current) =>
    current ? { ...current, keys } : current,
   );
  },
 });
 const deleteMutation = useMutation({
  mutationFn: deleteManagedApiKey,
  onSuccess: refresh,
 });

 const busyKeyId =
  (toggleMutation.isPending ? toggleMutation.variables?.keyId : null) ??
  (moveMutation.isPending ? moveMutation.variables?.keyId : null) ??
  (deleteMutation.isPending ? deleteMutation.variables : null) ??
  null;

 return {
  query,
  addMutation,
  toggleMutation,
  moveMutation,
  deleteMutation,
  busyKeyId,
 };
}
