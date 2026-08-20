"use client";

import { useQuery } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { getRecentUserNotes } from "@/services/notes.service";
import { noteQueryKeys } from "@/features/notes/query-keys";

export function useRecentNotes(limit = 3) {
 const { supabase, userId, isResolved } = useClientSession();

 return useQuery({
  queryKey: noteQueryKeys.recent(userId, limit),
  enabled: isResolved && Boolean(userId),
  queryFn: async () => {
   if (!userId) return [];
   return getRecentUserNotes(supabase, userId, limit);
  },
 });
}
