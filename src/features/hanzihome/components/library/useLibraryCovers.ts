"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isHanziHomeMutationConflict } from "@/features/hanzihome/editing/mutation-error";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { getLibraryCovers, resetLibraryCover, saveLibraryCover } from "./library-cover-api";

export function useLibraryCovers() {
 return useQuery({
  queryKey: hanzihomeQueryKeys.libraryCovers,
  queryFn: getLibraryCovers,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: false,
 });
}

export function useSaveLibraryCoverMutation() {
 const queryClient = useQueryClient();
 return useMutation({
  mutationFn: saveLibraryCover,
  onSuccess: async () => {
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.libraryCovers });
  },
  onError: async (error) => {
   if (isHanziHomeMutationConflict(error))
    await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.libraryCovers });
  },
 });
}

export function useResetLibraryCoverMutation() {
 const queryClient = useQueryClient();
 return useMutation({
  mutationFn: resetLibraryCover,
  onSuccess: async () => {
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.libraryCovers });
  },
  onError: async (error) => {
   if (isHanziHomeMutationConflict(error))
    await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.libraryCovers });
  },
 });
}
