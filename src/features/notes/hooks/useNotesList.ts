"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import {
 deleteNote as deleteNoteRecord,
 getUserNotes,
 getNotesByCategory,
 getNoteById,
} from "@/services/notes/notes.service";
import { noteQueryKeys } from "@/features/notes/query-keys";
import type { NoteCategory } from "@/types/database";
import { getNoteDraft } from "@/features/notes/local/note-draft-store";
import { restoreNoteDraft } from "@/features/notes/note-editor-utils";

export function usePrefetchNote() {
 const { supabase, userId } = useClientSession();
 const queryClient = useQueryClient();
 return (noteId: Parameters<typeof getNoteById>[1]) => {
  if (!userId) return;
  void queryClient.prefetchQuery({
   queryKey: noteQueryKeys.detail(userId, noteId),
   queryFn: async () => {
    const serverNote = await getNoteById(supabase, noteId, userId);
    if (!serverNote) return null;
    try {
     const localDraft = await getNoteDraft(userId, noteId);
     if (localDraft) return restoreNoteDraft(serverNote, localDraft);
    } catch {
     // Fall back to server note
    }
    return serverNote;
   },
   staleTime: 60 * 1000,
  });
 };
}

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
