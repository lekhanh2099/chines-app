"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import {
 deleteNote as deleteNoteRecord,
 getUserNotes,
 getNotesByCategory,
} from "@/services/notes.service";
import { noteQueryKeys } from "@/features/notes/query-keys";
import type { NoteCategory } from "@/types/database";

/**
 * Hook: Fetch user's notes list.
 * Optional `category` filter for grammar/vocab-specific pages.
 */
export function useNotesList(category?: NoteCategory) {
 const { supabase, userId, isResolved } = useClientSession();

 return useQuery({
  queryKey: noteQueryKeys.list(userId, category),
  enabled: isResolved && Boolean(userId),
  queryFn: async () => {
   if (!userId) return [];

   if (category) {
    return getNotesByCategory(supabase, userId, category);
   }
   return getUserNotes(supabase, userId);
  },
 });
}

export function useDeleteNoteFromList() {
 const { supabase, userId } = useClientSession();
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (noteId: string) => {
   if (!userId) throw new Error("Not authenticated");
   const success = await deleteNoteRecord(supabase, noteId);
   if (!success) throw new Error("Không thể xóa ghi chú.");
   return noteId;
  },
  onSuccess: (noteId) => {
   queryClient.removeQueries({ queryKey: noteQueryKeys.detail(userId, noteId) });
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
  },
 });
}
