"use client";

import type { JsonObject } from "@/types/json";
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
} from "@/services/notes/notes.service";
import type { NoteCategory } from "@/types/database";
import { noteQueryKeys } from "@/features/notes/query-keys";
import { restoreNoteDraft } from "@/features/notes/note-editor-utils";
import {
 clearNoteContentDraft,
 clearNoteReadingContentDraft,
 getNoteDraft,
} from "@/features/notes/local/note-draft-store";

type ReadingContent = Parameters<typeof updateReadingContent>[2];
type NoteQueryData = Awaited<ReturnType<typeof getNoteById>>;

/**
 * Hook: Fetch and manage a single note (editor page).
 */
export function useNoteDetail(noteId: string) {
 const { supabase, userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const detailKey = noteQueryKeys.detail(userId, noteId);
 const scope = { id: `notes:${userId}:${noteId}` };

 const requireUser = () => {
  if (!userId) throw new Error("Not authenticated");
  return userId;
 };

 const stageContent = useCallback(
  (content: JsonObject) => {
   void queryClient.cancelQueries({ queryKey: noteQueryKeys.detail(userId, noteId) });
   queryClient.setQueryData<NoteQueryData>(noteQueryKeys.detail(userId, noteId), (old) =>
    !old || old.content === content ? old : { ...old, content },
   );
  },
  [noteId, queryClient, userId],
 );

 const stageReadingContent = useCallback(
  (readingContent: ReadingContent) => {
   void queryClient.cancelQueries({ queryKey: noteQueryKeys.detail(userId, noteId) });
   queryClient.setQueryData<NoteQueryData>(noteQueryKeys.detail(userId, noteId), (old) =>
    !old || old.reading_content === readingContent
     ? old
     : { ...old, reading_content: readingContent },
   );
  },
  [noteId, queryClient, userId],
 );

 // ── Main query ──
 const query = useQuery({
  queryKey: detailKey,
  queryFn: async () => {
   if (!userId) return null;
   const serverNote = await getNoteById(supabase, noteId, userId);
   if (!serverNote) return null;

   try {
    const localDraft = await getNoteDraft(userId, noteId);
    if (localDraft) return restoreNoteDraft(serverNote, localDraft);
   } catch {
    // Local draft reading is an enhancement; fall back to server note on storage error
   }

   return serverNote;
  },
  enabled: isResolved && Boolean(userId) && !!noteId && noteId !== "new",
 });

 // ── Mutation: save content (auto-save) ──
 const saveContentMutation = useMutation({
  scope,
  mutationFn: async (input: { content: JsonObject; mutationStartedAt: number }) => {
   requireUser();
   const success = await updateNoteContent(supabase, noteId, input.content);
   if (!success) throw new Error("Failed to save content");
   return input;
  },
  onSuccess: async (data) => {
   if (userId && noteId) {
    await clearNoteContentDraft(userId, noteId, data.mutationStartedAt, data.content);
   }
  },
 });

 // ── Mutation: update title ──
 const updateTitleMutation = useMutation({
  scope,
  mutationFn: async (title: string) => {
   requireUser();
   const success = await updateNoteTitle(supabase, noteId, title);
   if (!success) throw new Error("Failed to update title");
   return title;
  },
  onSuccess: (title) => {
   queryClient.setQueryData<NoteQueryData>(detailKey, (old) => {
    if (!old) return old;
    return { ...old, title };
   });
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
  },
 });

 // ── Mutation: update category ──
 const updateCategoryMutation = useMutation({
  scope,
  mutationFn: async (category: NoteCategory) => {
   requireUser();
   const success = await updateNoteCategory(supabase, noteId, category);
   if (!success) throw new Error("Failed to update category");
   return category;
  },
  onSuccess: (category) => {
   queryClient.setQueryData<NoteQueryData>(detailKey, (old) => {
    if (!old) return old;
    return { ...old, category };
   });
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
  },
 });

 // ── Mutation: delete note ──
 const deleteMutation = useMutation({
  scope,
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
  scope,
  mutationFn: async (input: { readingContent: ReadingContent; mutationStartedAt: number }) => {
   requireUser();
   const success = await updateReadingContent(supabase, noteId, input.readingContent);
   if (!success) throw new Error("Failed to save reading content");
   return input;
  },
  onSuccess: async (data) => {
   if (userId && noteId) {
    await clearNoteReadingContentDraft(userId, noteId, data.mutationStartedAt, data.readingContent);
   }
  },
 });

 // ── Mutation: toggle split view ──
 const updateSplitViewMutation = useMutation({
  scope,
  mutationFn: async (enabled: boolean) => {
   requireUser();
   const success = await updateSplitViewEnabled(supabase, noteId, enabled);
   if (!success) throw new Error("Failed to update split view state");
   return enabled;
  },
  onMutate: (enabled) => {
   queryClient.setQueryData<NoteQueryData>(detailKey, (old) => {
    if (!old) return old;

    return {
     ...old,
     split_view_enabled: enabled,
    };
   });
  },
 });

 const { mutateAsync: mutateContent } = saveContentMutation;
 const { mutateAsync: mutateReadingContent } = saveReadingContentMutation;

 const saveContent = useCallback(
  (content: JsonObject) => {
   stageContent(content);
   return mutateContent({ content, mutationStartedAt: Date.now() });
  },
  [mutateContent, stageContent],
 );

 const saveReadingContent = useCallback(
  (readingContent: ReadingContent) => {
   stageReadingContent(readingContent);
   return mutateReadingContent({ readingContent, mutationStartedAt: Date.now() });
  },
  [mutateReadingContent, stageReadingContent],
 );

 return {
  note: query.data ?? null,
  isLoading: query.isLoading,
  error: query.error,
  refetch: query.refetch,
  stageContent,
  stageReadingContent,

  saveContent,
  isSaving: saveContentMutation.isPending,
  saveStatus: saveContentMutation.status,

  saveReadingContent,
  isReadingSaving: saveReadingContentMutation.isPending,
  readingSaveStatus: saveReadingContentMutation.status,

  updateSplitView: updateSplitViewMutation.mutateAsync,

  updateTitle: updateTitleMutation.mutateAsync,
  updateCategory: updateCategoryMutation.mutateAsync,

  deleteNote: () => deleteMutation.mutateAsync(),
  isDeleting: deleteMutation.isPending,
 };
}
