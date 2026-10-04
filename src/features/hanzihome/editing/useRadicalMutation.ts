"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { updateRadical } from "./radical-edit-api";
import { isHanziHomeMutationConflict } from "./mutation-error";

export function useRadicalMutation() {
 const queryClient = useQueryClient();
 return useMutation({
  mutationFn: updateRadical,
  onSuccess: async () => {
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.searchIndexRoot });
  },
  onError: async (error) => {
   if (isHanziHomeMutationConflict(error)) {
    await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
   }
  },
 });
}
