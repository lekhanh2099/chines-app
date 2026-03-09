"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { getUserNotes, getNotesByCategory } from "@/services/notes.service";
import type { NoteCategory } from "@/types/database";

/**
 * Hook: Fetch user's notes list.
 * Optional `category` filter for grammar/vocab-specific pages.
 */
export function useNotesList(category?: NoteCategory) {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 return useQuery({
  queryKey: ["notes-list", category ?? "all"],
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
