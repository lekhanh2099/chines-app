"use client";

import type { JsonFieldValue, JsonObject } from "@/types/json";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useClientSession } from "@/components/providers/QueryProvider";
import {
 getNoteById,
 updateNoteContent,
 updateNoteTitle,
 updateNoteCategory,
 deleteNote,
 updateReadingContent,
 updateSplitViewEnabled,
} from "@/services/notes.service";
import type { NoteCategory } from "@/types/database";
import { noteQueryKeys } from "@/features/notes/query-keys";
import { clearNoteDraft, getNoteDraft } from "@/features/notes/local/note-draft-store";

type ReadingContent = Parameters<typeof updateReadingContent>[2];

/**
 * Hook: Fetch and manage a single note (editor page).
 */
export function useNoteDetail(noteId: string) {
 const { supabase, userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const detailKey = noteQueryKeys.detail(userId, noteId);

 const requireUser = () => {
  if (!userId) throw new Error("Not authenticated");
  return userId;
 };

 // ── Main query ──
 const query = useQuery({
  queryKey: detailKey,
  queryFn: async () => {
   if (!userId) return null;
   const serverNote = await getNoteById(supabase, noteId, userId);
   if (!serverNote) return null;

   try {
    const localDraft = await getNoteDraft(userId, noteId);
    if (localDraft) {
     const serverTime = new Date(serverNote.updated_at).getTime();
     if (localDraft.updatedAt > serverTime) {
      return {
       ...serverNote,
       content: localDraft.content,
       reading_content: localDraft.readingContent ?? serverNote.reading_content,
      };
     }
    }
   } catch {
    // Local draft reading is an enhancement; fall back to server note on storage error
   }

   return serverNote;
  },
  enabled: isResolved && Boolean(userId) && !!noteId && noteId !== "new",
 });

 // ── Mutation: save content (auto-save) ──
 const saveContentMutation = useMutation({
  mutationFn: async (content: JsonObject) => {
   requireUser();
   const mutationStartedAt = Date.now();
   const success = await updateNoteContent(supabase, noteId, content);
   if (!success) throw new Error("Failed to save content");
   return { content, mutationStartedAt };
  },
  onMutate: async (content: JsonObject) => {
   await queryClient.cancelQueries({ queryKey: detailKey });
   const previousNote = queryClient.getQueryData(detailKey);
   queryClient.setQueryData(detailKey, (old: JsonFieldValue) => {
    if (!old || typeof old !== "object") return old;
    return {
     ...old,
     content,
    };
   });
   return { previousNote };
  },
  onError: (_err, _content, context) => {
   if (context?.previousNote) {
    queryClient.setQueryData(detailKey, context.previousNote);
   }
  },
  onSuccess: async (data) => {
   if (userId && noteId) {
    await clearNoteDraft(userId, noteId, data.mutationStartedAt);
   }
  },
 });

 // ── Mutation: update title ──
 const updateTitleMutation = useMutation({
  mutationFn: async (title: string) => {
   requireUser();
   const success = await updateNoteTitle(supabase, noteId, title);
   if (!success) throw new Error("Failed to update title");
   return title;
  },
  onSuccess: (title) => {
   queryClient.setQueryData(detailKey, (old: JsonFieldValue) => {
    if (!old || typeof old !== "object") return old;
    return { ...old, title };
   });
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
  },
 });

 // ── Mutation: update category ──
 const updateCategoryMutation = useMutation({
  mutationFn: async (category: NoteCategory) => {
   requireUser();
   const success = await updateNoteCategory(supabase, noteId, category);
   if (!success) throw new Error("Failed to update category");
   return category;
  },
  onSuccess: (category) => {
   queryClient.setQueryData(detailKey, (old: JsonFieldValue) => {
    if (!old || typeof old !== "object") return old;
    return { ...old, category };
   });
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
  },
 });

 // ── Mutation: delete note ──
 const deleteMutation = useMutation({
  mutationFn: async () => {
   requireUser();
   const success = await deleteNote(supabase, noteId);
   if (!success) throw new Error("Failed to delete note");
  },
  onSuccess: () => {
   queryClient.removeQueries({ queryKey: detailKey });
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
  },
 });

 // ── Mutation: save reading content (split view left pane) ──
 const saveReadingContentMutation = useMutation({
  mutationFn: async (readingContent: ReadingContent) => {
   requireUser();
   const success = await updateReadingContent(supabase, noteId, readingContent);
   if (!success) throw new Error("Failed to save reading content");
   return readingContent;
  },
  onSuccess: (readingContent) => {
   queryClient.setQueryData(detailKey, (old: JsonFieldValue) => {
    if (!old || typeof old !== "object") return old;

    return {
     ...old,
     reading_content: readingContent,
    };
   });
  },
 });

 // ── Mutation: toggle split view ──
 const updateSplitViewMutation = useMutation({
  mutationFn: async (enabled: boolean) => {
   requireUser();
   const success = await updateSplitViewEnabled(supabase, noteId, enabled);
   if (!success) throw new Error("Failed to update split view state");
   return enabled;
  },
  onMutate: (enabled) => {
   queryClient.setQueryData(detailKey, (old: JsonFieldValue) => {
    if (!old || typeof old !== "object") return old;

    return {
     ...old,
     split_view_enabled: enabled,
    };
   });
  },
 });

 const saveContent = useCallback(
  (content: JsonObject) => {
   saveContentMutation.mutate(content);
  },
  [saveContentMutation],
 );

 const saveReadingContent = useCallback(
  (readingContent: ReadingContent) => {
   saveReadingContentMutation.mutate(readingContent);
  },
  [saveReadingContentMutation],
 );

 return {
  note: query.data ?? null,
  isLoading: query.isLoading,

  saveContent,
  isSaving: saveContentMutation.isPending,
  saveStatus: saveContentMutation.status,

  saveReadingContent,
  isReadingSaving: saveReadingContentMutation.isPending,

  updateSplitView: (enabled: boolean) => updateSplitViewMutation.mutate(enabled),

  updateTitle: (title: string) => updateTitleMutation.mutate(title),
  updateCategory: (cat: NoteCategory) => updateCategoryMutation.mutate(cat),

  deleteNote: () => deleteMutation.mutateAsync(),
  isDeleting: deleteMutation.isPending,
 };
}
