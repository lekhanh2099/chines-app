"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import { createNote, type CreateNoteInput } from "@/services/notes.service";

/**
 * Hook: Create a new note.
 */
export function useCreateNote() {
 const { supabase, userId } = useClientSession();
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (input: CreateNoteInput) => {
   if (!userId) throw new Error("Not authenticated");

   const note = await createNote(supabase, userId, input);
   if (!note) throw new Error("Failed to create note");
   return note;
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
  },
 });
}
