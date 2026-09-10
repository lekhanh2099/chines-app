"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
 archiveMemoryTip,
 createMemoryTip,
 getMemoryTips,
 memoryTipsQueryKey,
 updateMemoryTip,
} from "./memory-tip-api";
import type {
 CreateMemoryTipPayload,
 MemoryTip,
 UpdateMemoryTipPayload,
} from "./memory-tip.schema";

export function useMemoryTipsQuery() {
 return useQuery({
  queryKey: memoryTipsQueryKey,
  queryFn: getMemoryTips,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 1,
 });
}

export function useCreateMemoryTipMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (input: CreateMemoryTipPayload) => createMemoryTip(input),
  onSuccess: (newTip) => {
   queryClient.setQueryData<MemoryTip[]>(memoryTipsQueryKey, (old) => {
    if (!old) return [newTip];
    return [newTip, ...old.filter((item) => item.id !== newTip.id)];
   });
  },
 });
}

export function useUpdateMemoryTipMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: ({ tipId, input }: { tipId: string; input: UpdateMemoryTipPayload }) =>
   updateMemoryTip({ tipId, input }),
  onMutate: async ({ tipId, input }) => {
   await queryClient.cancelQueries({ queryKey: memoryTipsQueryKey });
   const previous = queryClient.getQueryData<MemoryTip[]>(memoryTipsQueryKey) || [];
   const target = previous.find((tip) => tip.id === tipId);
   queryClient.setQueryData<MemoryTip[]>(
    memoryTipsQueryKey,
    previous.map((tip) =>
     tip.id === tipId
      ? {
         ...tip,
         ...(input.title !== undefined ? { title: input.title } : {}),
         ...(input.body !== undefined ? { body: input.body } : {}),
         ...(input.tags !== undefined ? { tags: input.tags } : {}),
         updatedAt: new Date().toISOString(),
        }
      : tip,
    ),
   );
   return { previousTip: target, tipId };
  },
  onSuccess: (savedTip) => {
   queryClient.setQueryData<MemoryTip[]>(memoryTipsQueryKey, (old) => {
    if (!old) return [savedTip];
    return old.map((item) => (item.id === savedTip.id ? savedTip : item));
   });
  },
  onError: (_error, _variables, context) => {
   const prev = context?.previousTip;
   if (prev) {
    queryClient.setQueryData<MemoryTip[]>(memoryTipsQueryKey, (old) => {
     if (!old) return [];
     return old.map((item) => (item.id === context.tipId ? prev : item));
    });
   }
  },
 });
}

export function useArchiveMemoryTipMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (tipId: string) => archiveMemoryTip(tipId),
  onMutate: async (tipId) => {
   await queryClient.cancelQueries({ queryKey: memoryTipsQueryKey });
   const previous = queryClient.getQueryData<MemoryTip[]>(memoryTipsQueryKey) || [];
   const targetIndex = previous.findIndex((tip) => tip.id === tipId);
   const target = previous[targetIndex];
   queryClient.setQueryData<MemoryTip[]>(
    memoryTipsQueryKey,
    previous.filter((tip) => tip.id !== tipId),
   );
   return { archivedTip: target, targetIndex };
  },
  onError: (_error, _variables, context) => {
   const archived = context?.archivedTip;
   if (archived) {
    queryClient.setQueryData<MemoryTip[]>(memoryTipsQueryKey, (old) => {
     if (!old) return [archived];
     if (old.some((item) => item.id === archived.id)) return old;
     const copy = [...old];
     const insertAt =
      typeof context.targetIndex === "number" &&
      context.targetIndex >= 0 &&
      context.targetIndex <= copy.length
       ? context.targetIndex
       : copy.length;
     copy.splice(insertAt, 0, archived);
     return copy;
    });
   }
  },
 });
}
