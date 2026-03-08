"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { removeVocabFromSrs } from "@/services/vocab.service";
import type { VocabWithProgress } from "@/types/database";

type DeleteVocabInput = {
 vocabId: string;
 hanzi: string;
};

/**
 * Hook: Delete a vocabulary from the user's SRS.
 */
export function useDeleteVocab() {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async ({ vocabId }: DeleteVocabInput) => {
   const {
    data: { session },
   } = await supabase.auth.getSession();
   const user = session?.user;
   if (!user) throw new Error("Not authenticated");

   const success = await removeVocabFromSrs(supabase, user.id, vocabId);
   if (!success) throw new Error("Delete failed");
   return vocabId;
  },
  onMutate: async ({ vocabId, hanzi }) => {
   await queryClient.cancelQueries({ queryKey: ["vocab-list"] });

   const previousList =
    queryClient.getQueryData<VocabWithProgress[]>(["vocab-list"]) || [];
   const previousDetail = queryClient.getQueryData(["vocab-detail", hanzi]);

   queryClient.setQueryData<VocabWithProgress[]>(["vocab-list"], (current) =>
    (current || []).filter((item) => item.id !== vocabId),
   );

   queryClient.setQueryData(
    ["vocab-detail", hanzi],
    (
     current:
      | {
         vocab: unknown;
         srsLevel: number | null;
         isSaved: boolean;
        }
      | undefined,
    ) =>
     current
      ? {
         ...current,
         srsLevel: null,
         isSaved: false,
        }
      : current,
   );

   return { previousList, previousDetail, hanzi };
  },
  onError: (_error, _variables, context) => {
   if (context?.previousList) {
    queryClient.setQueryData(["vocab-list"], context.previousList);
   }

   if (context?.previousDetail !== undefined) {
    queryClient.setQueryData(
     ["vocab-detail", context.hanzi],
     context.previousDetail,
    );
   }
  },
 });
}
