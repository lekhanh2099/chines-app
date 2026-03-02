"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { removeVocabFromSrs } from "@/services/vocab.service";

/**
 * Hook: Delete a vocabulary from the user's SRS.
 */
export function useDeleteVocab() {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (vocabId: string) => {
   const {
    data: { user },
   } = await supabase.auth.getUser();
   if (!user) throw new Error("Not authenticated");

   const success = await removeVocabFromSrs(supabase, user.id, vocabId);
   if (!success) throw new Error("Delete failed");
   return vocabId;
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["vocab-list"] });
  },
 });
}
