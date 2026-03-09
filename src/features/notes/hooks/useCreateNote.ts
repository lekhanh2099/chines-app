"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { createNote, type CreateNoteInput } from "@/services/notes.service";

/**
 * Hook: Create a new note.
 */
export function useCreateNote() {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (input: CreateNoteInput) => {
   const user = await getClientSessionUser(supabase);
   if (!user) throw new Error("Not authenticated");

   const note = await createNote(supabase, user.id, input);
   if (!note) throw new Error("Failed to create note");
   return note;
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["notes-list"] });
  },
 });
}
