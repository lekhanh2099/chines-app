"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import { getNoteFolderMoveTarget } from "@/features/notes/note-library-utils";
import { lessonAnnotationQueryKeys } from "@/features/hanzihome/annotations/query-keys";
import type { LessonTextAnnotation } from "@/features/hanzihome/annotations/types";
import { advanceNoteDraftRevision } from "@/features/notes/local/note-draft-store";
import {
 createNoteFolder,
 deleteNoteFolder,
 getNoteFolders,
 updateNoteFolder,
 updateNoteLibraryMetadata,
 type NoteFolder,
 type NoteDetail,
} from "@/services/notes/notes.service";

type CreateNoteFolderMutationInput = Parameters<typeof createNoteFolder>[2];
type UpdateNoteFolderMutationInput = {
 folderId: NoteFolder["id"];
 changes: Parameters<typeof updateNoteFolder>[2];
};
type UpdateNoteLibraryMutationInput = Parameters<typeof updateNoteLibraryMetadata>[2] & {
 noteId: Parameters<typeof updateNoteLibraryMetadata>[1];
 expectedRevision: Parameters<typeof updateNoteLibraryMetadata>[3];
};

export function useNoteFolders() {
 const { supabase, userId, isResolved } = useClientSession();

 return useQuery({
  queryKey: noteQueryKeys.folders(userId),
  enabled: isResolved && Boolean(userId),
  queryFn: async () => {
   if (!userId) return [];
   return getNoteFolders(supabase, userId);
  },
 });
}

export function useNoteFolderMutations() {
 const { supabase, userId } = useClientSession();
 const queryClient = useQueryClient();
 const refresh = () => queryClient.invalidateQueries({ queryKey: noteQueryKeys.folders(userId) });

 const createMutation = useMutation({
  mutationFn: async (input: CreateNoteFolderMutationInput) => {
   if (!userId) throw new Error("Not authenticated");
   return createNoteFolder(supabase, userId, input);
  },
  onSuccess: refresh,
 });

 const updateMutation = useMutation({
  mutationFn: async (input: UpdateNoteFolderMutationInput) => {
   if (!userId) throw new Error("Not authenticated");
   return updateNoteFolder(supabase, input.folderId, input.changes);
  },
  onSuccess: refresh,
 });

 const deleteMutation = useMutation({
  mutationFn: async (folderId: string) => {
   if (!userId) throw new Error("Not authenticated");
   return deleteNoteFolder(supabase, folderId);
  },
  onSuccess: async () => {
   await Promise.all([
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.folders(userId) }),
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) }),
   ]);
  },
 });

 const moveFolder = async (folder: NoteFolder, folders: NoteFolder[], moveUp: boolean) => {
  const swap = getNoteFolderMoveTarget(folder, folders, moveUp);
  if (!swap) return;
  await Promise.all([
   updateMutation.mutateAsync({ folderId: folder.id, changes: { position: swap.position } }),
   updateMutation.mutateAsync({ folderId: swap.id, changes: { position: folder.position } }),
  ]);
 };

 return { createMutation, updateMutation, deleteMutation, moveFolder };
}

export function useUpdateNoteLibraryMetadata(noteId: string) {
 const { supabase, userId } = useClientSession();
 const queryClient = useQueryClient();

 return useMutation({
  scope: { id: `notes:${userId}:${noteId}` },
  mutationFn: async (input: UpdateNoteLibraryMutationInput) => {
   if (!userId) throw new Error("Not authenticated");
   const saved = await updateNoteLibraryMetadata(
    supabase,
    input.noteId,
    input,
    input.expectedRevision,
    userId,
   );
   await advanceNoteDraftRevision(userId, input.noteId, input.expectedRevision, saved.revision);
   queryClient.setQueryData<NoteDetail>(noteQueryKeys.detail(userId, input.noteId), (old) =>
    old ? { ...old, revision: saved.revision, updated_at: saved.updated_at } : old,
   );
   return saved;
  },
  onSuccess: async (_, input) => {
   const annotationQueries = queryClient.getQueriesData<LessonTextAnnotation[]>({
    queryKey: lessonAnnotationQueryKeys.byOwner(userId),
   });
   for (const [queryKey, annotations] of annotationQueries) {
    if (annotations?.some((annotation) => annotation.noteId === input.noteId)) {
     void queryClient.invalidateQueries({
      queryKey,
      exact: true,
     });
    }
   }
   await Promise.all([
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) }),
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.detail(userId, input.noteId) }),
   ]);
  },
 });
}
