"use client";

import type { JsonObject } from "@/types/json";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { useClientSession } from "@/components/providers/QueryProvider";
import {
 NoteConflictError,
 getNoteById,
 updateNoteContent,
 updateNoteTitle,
 updateNoteCategory,
 deleteNote,
 updateReadingContent,
 updateSplitViewEnabled,
} from "@/services/notes/notes.service";
import type { DbNote, NoteCategory } from "@/types/database";
import { noteQueryKeys } from "@/features/notes/query-keys";
import { lessonAnnotationQueryKeys } from "@/features/hanzihome/annotations/query-keys";
import { restoreNoteDraft } from "@/features/notes/note-editor-utils";
import {
 advanceNoteDraftRevision,
 clearNoteDraft,
 clearNoteContentDraft,
 clearNoteReadingContentDraft,
 getNoteDraft,
 getOtherNoteDrafts,
 recoverNoteDraft,
 type NoteDraftRecord,
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
 const [conflict, setConflict] = useState<NoteQueryData>(null);
 const conflictRef = useRef<NoteQueryData>(null);
 const [recoverableDrafts, setRecoverableDrafts] = useState<NoteDraftRecord[]>([]);
 const [draftResolved, setDraftResolved] = useState(false);

 const requireUser = () => {
  if (!userId) throw new Error("Not authenticated");
  return userId;
 };

 const write = async (
  operation: (revision: DbNote["revision"], ownerUserId: string) => Promise<DbNote>,
 ) => {
  const owner = requireUser();
  if (conflictRef.current) throw new NoteConflictError(conflictRef.current);
  const current = queryClient.getQueryData<NoteQueryData>(detailKey);
  if (!current) throw new Error("Note is not loaded");
  try {
   const draft = await getNoteDraft(owner, noteId);
   if (draft && draft.baseRevision !== current.revision) {
    const serverNote = await getNoteById(supabase, noteId, owner);
    if (!serverNote) throw new Error("Note is not found");
    throw new NoteConflictError(serverNote);
   }
   const saved = await operation(current.revision, owner);
   await advanceNoteDraftRevision(owner, noteId, current.revision, saved.revision);
   queryClient.setQueryData<NoteQueryData>(detailKey, (old) =>
    old ? { ...old, revision: saved.revision, updated_at: saved.updated_at } : old,
   );
   for (const link of current.links) {
    if (link.relationType === "annotation") {
     void queryClient.invalidateQueries({
      queryKey: lessonAnnotationQueryKeys.byLesson(owner, link.targetKey),
     });
    }
   }
   return saved;
  } catch (error) {
   if (error instanceof NoteConflictError) {
    conflictRef.current = error.serverNote;
    setConflict(error.serverNote);
   }
   throw error;
  }
 };

 const resolveConflict = async (useServer: boolean) => {
  const owner = requireUser();
  const serverNote = conflictRef.current;
  if (!serverNote) return;
  const draft = await getNoteDraft(owner, noteId);
  if (useServer) {
   if (draft) {
    const cleared = await clearNoteDraft(owner, noteId, draft.updatedAt);
    if (!cleared) throw new Error("Local draft changed while resolving conflict");
   }
   queryClient.setQueryData<NoteQueryData>(detailKey, serverNote);
  } else {
   if (draft) {
    const advanced = await advanceNoteDraftRevision(
     owner,
     noteId,
     draft.baseRevision,
     serverNote.revision,
    );
    if (!advanced) throw new Error("Local draft changed while resolving conflict");
   }
   queryClient.setQueryData<NoteQueryData>(detailKey, (old) =>
    draft
     ? restoreNoteDraft(serverNote, { ...draft, baseRevision: serverNote.revision })
     : old
       ? { ...old, revision: serverNote.revision, updated_at: serverNote.updated_at }
       : old,
   );
  }
  conflictRef.current = null;
  setConflict(null);
  setRecoverableDrafts([]);
  saveContentMutation.reset();
  saveReadingContentMutation.reset();
  updateTitleMutation.reset();
  updateCategoryMutation.reset();
  updateSplitViewMutation.reset();
 };

 const recoverDraft = async (source: NoteDraftRecord) => {
  const owner = requireUser();
  const serverNote = conflictRef.current;
  if (!serverNote) throw new Error("No recovery is pending");
  if (!(await recoverNoteDraft(owner, noteId, source)))
   throw new Error("Draft changed while recovering");
  const draft = await getNoteDraft(owner, noteId);
  if (!draft) throw new Error("Recovered draft is unavailable");
  queryClient.setQueryData<NoteQueryData>(detailKey, restoreNoteDraft(serverNote, draft));
  setRecoverableDrafts([]);
  return draft;
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
  staleTime: 0,
  queryFn: async () => {
   if (!userId) return null;
   const serverNote = await getNoteById(supabase, noteId, userId);
   if (!serverNote) return null;

   try {
    const localDraft = await getNoteDraft(userId, noteId);
    if (localDraft) {
     if (localDraft.baseRevision !== serverNote.revision) {
      conflictRef.current = serverNote;
      setConflict(serverNote);
     }
     return restoreNoteDraft(serverNote, localDraft);
    }
    const otherDrafts = await getOtherNoteDrafts(userId, noteId);
    if (otherDrafts.length > 0) {
     conflictRef.current = serverNote;
     setConflict(serverNote);
     setRecoverableDrafts(otherDrafts);
    }
   } catch {
    // Local draft reading is an enhancement; fall back to server note on storage error
   } finally {
    setDraftResolved(true);
   }

   return serverNote;
  },
  enabled: isResolved && Boolean(userId) && !!noteId && noteId !== "new",
 });

 // ── Mutation: save content (auto-save) ──
 const saveContentMutation = useMutation({
  scope,
  mutationFn: async (input: { content: JsonObject; mutationStartedAt: number }) => {
   await write((revision, owner) =>
    updateNoteContent(supabase, noteId, input.content, revision, owner),
   );
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
   await write((revision, owner) => updateNoteTitle(supabase, noteId, title, revision, owner));
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
   await write((revision, owner) =>
    updateNoteCategory(supabase, noteId, category, revision, owner),
   );
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
   const current = queryClient.getQueryData<NoteQueryData>(detailKey);
   for (const link of current?.links ?? []) {
    if (link.relationType === "annotation") {
     void queryClient.invalidateQueries({
      queryKey: lessonAnnotationQueryKeys.byLesson(userId, link.targetKey),
     });
    }
   }
   queryClient.removeQueries({ queryKey: detailKey });
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
  },
 });

 // ── Mutation: save reading content (split view left pane) ──
 const saveReadingContentMutation = useMutation({
  scope,
  mutationFn: async (input: { readingContent: ReadingContent; mutationStartedAt: number }) => {
   await write((revision, owner) =>
    updateReadingContent(supabase, noteId, input.readingContent, revision, owner),
   );
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
   await write((revision, owner) =>
    updateSplitViewEnabled(supabase, noteId, enabled, revision, owner),
   );
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
  isLoading: query.isLoading || (!draftResolved && query.fetchStatus === "fetching"),
  error: query.error,
  refetch: query.refetch,
  stageContent,
  stageReadingContent,
  conflict,
  resolveConflict,
  recoverableDrafts,
  recoverDraft,

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
