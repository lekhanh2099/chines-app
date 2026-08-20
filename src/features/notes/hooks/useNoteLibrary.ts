"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import {
 createNoteFolder,
 deleteNoteFolder,
 getNoteFolders,
 updateNoteFolder,
 updateNoteLibraryMetadata,
 type NoteFolder,
} from "@/services/notes.service";

type CreateNoteFolderMutationInput = Parameters<typeof createNoteFolder>[2];
type UpdateNoteFolderMutationInput = {
 folderId: NoteFolder["id"];
 changes: Parameters<typeof updateNoteFolder>[2];
};
type UpdateNoteLibraryMutationInput = Parameters<typeof updateNoteLibraryMetadata>[2] & {
 noteId: Parameters<typeof updateNoteLibraryMetadata>[1];
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

 return { createMutation, updateMutation, deleteMutation };
}

export function useUpdateNoteLibraryMetadata() {
 const { supabase, userId } = useClientSession();
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (input: UpdateNoteLibraryMutationInput) => {
   if (!userId) throw new Error("Not authenticated");
   return updateNoteLibraryMetadata(supabase, input.noteId, input);
  },
  onSuccess: async (_, input) => {
   await Promise.all([
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) }),
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.detail(userId, input.noteId) }),
   ]);
  },
 });
}
