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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: memoryTipsQueryKey });
    },
  });
}

export function useUpdateMemoryTipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tipId,
      input,
    }: {
      tipId: string;
      input: UpdateMemoryTipPayload;
    }) => updateMemoryTip({ tipId, input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: memoryTipsQueryKey });
    },
  });
}

export function useArchiveMemoryTipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tipId: string) => archiveMemoryTip(tipId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: memoryTipsQueryKey });
    },
  });
}
