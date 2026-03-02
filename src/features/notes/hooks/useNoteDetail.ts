"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
 getNoteById,
 updateNoteContent,
 updateNoteTitle,
 updateNoteCategory,
 deleteNote,
} from "@/services/notes.service";
import type { NoteCategory } from "@/types/database";

/**
 * Hook: Fetch and manage a single note (editor page).
 */
export function useNoteDetail(noteId: string) {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;
 const queryClient = useQueryClient();

 // ── Main query ──
 const query = useQuery({
  queryKey: ["note-detail", noteId],
  queryFn: async () => {
   const {
    data: { user },
   } = await supabase.auth.getUser();
   if (!user) return null;
   return getNoteById(supabase, noteId, user.id);
  },
  enabled: !!noteId && noteId !== "new",
 });

 // ── Mutation: save content (auto-save) ──
 const saveContentMutation = useMutation({
  mutationFn: async (content: Record<string, unknown>) => {
   const success = await updateNoteContent(supabase, noteId, content);
   if (!success) throw new Error("Failed to save content");
   return content;
  },
  onSuccess: () => {
   queryClient.invalidateQueries({
    queryKey: ["note-detail", noteId],
    exact: true,
   });
  },
 });

 // ── Mutation: update title ──
 const updateTitleMutation = useMutation({
  mutationFn: async (title: string) => {
   const success = await updateNoteTitle(supabase, noteId, title);
   if (!success) throw new Error("Failed to update title");
  },
 });

 // ── Mutation: update category ──
 const updateCategoryMutation = useMutation({
  mutationFn: async (category: NoteCategory) => {
   const success = await updateNoteCategory(supabase, noteId, category);
   if (!success) throw new Error("Failed to update category");
  },
 });

 // ── Mutation: delete note ──
 const deleteMutation = useMutation({
  mutationFn: async () => {
   const success = await deleteNote(supabase, noteId);
   if (!success) throw new Error("Failed to delete note");
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ["notes-list"] });
  },
 });

 // Helper for debounced save
 const saveContent = useCallback(
  (content: Record<string, unknown>) => {
   saveContentMutation.mutate(content);
  },
  [saveContentMutation],
 );

 return {
  note: query.data ?? null,
  isLoading: query.isLoading,

  saveContent,
  isSaving: saveContentMutation.isPending,
  saveStatus: saveContentMutation.status,

  updateTitle: (title: string) => updateTitleMutation.mutate(title),
  updateCategory: (cat: NoteCategory) => updateCategoryMutation.mutate(cat),

  deleteNote: () => deleteMutation.mutate(),
  isDeleting: deleteMutation.isPending,
 };
}
