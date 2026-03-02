"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserVocabList } from "@/services/vocab.service";

/**
 * Hook: Fetch the current user's vocabulary list with SRS progress.
 * Uses TanStack Query for caching, refetch, and loading states.
 */
export function useVocabList() {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 return useQuery({
  queryKey: ["vocab-list"],
  queryFn: async () => {
   const {
    data: { user },
   } = await supabase.auth.getUser();
   if (!user) return [];
   return getUserVocabList(supabase, user.id);
  },
 });
}
