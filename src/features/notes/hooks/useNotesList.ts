"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
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
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 return useQuery({
  queryKey: noteQueryKeys.list(category),
  queryFn: async () => {
   const user = await getClientSessionUser(supabase);
   if (!user) return [];

   if (category) {
    return getNotesByCategory(supabase, user.id, category);
   }
   return getUserNotes(supabase, user.id);
  },
 });
}

export function useDeleteNoteFromList() {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (noteId: string) => {
   const success = await deleteNoteRecord(supabase, noteId);
   if (!success) throw new Error("Không thể xóa ghi chú.");
   return noteId;
  },
  onSuccess: (noteId) => {
   queryClient.removeQueries({ queryKey: noteQueryKeys.detail(noteId) });
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot });
  },
 });
}
