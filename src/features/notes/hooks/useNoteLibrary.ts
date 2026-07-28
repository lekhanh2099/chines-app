"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { noteQueryKeys } from "@/features/notes/query-keys";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
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
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 return useQuery({
  queryKey: noteQueryKeys.folders,
  queryFn: async () => {
   const user = await getClientSessionUser(supabase);
   if (!user) return [];
   return getNoteFolders(supabase, user.id);
  },
 });
}

export function useNoteFolderMutations() {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;
 const queryClient = useQueryClient();
 const refresh = () => queryClient.invalidateQueries({ queryKey: noteQueryKeys.folders });

 const createMutation = useMutation({
  mutationFn: async (input: CreateNoteFolderMutationInput) => {
   const user = await getClientSessionUser(supabase);
   if (!user) throw new Error("Not authenticated");
   return createNoteFolder(supabase, user.id, input);
  },
  onSuccess: refresh,
 });

 const updateMutation = useMutation({
  mutationFn: (input: UpdateNoteFolderMutationInput) =>
   updateNoteFolder(supabase, input.folderId, input.changes),
  onSuccess: refresh,
 });

 const deleteMutation = useMutation({
  mutationFn: (folderId: string) => deleteNoteFolder(supabase, folderId),
  onSuccess: async () => {
   await Promise.all([
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.folders }),
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot }),
   ]);
  },
 });

 return { createMutation, updateMutation, deleteMutation };
}

export function useUpdateNoteLibraryMetadata() {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (input: UpdateNoteLibraryMutationInput) =>
   updateNoteLibraryMetadata(supabase, input.noteId, input),
  onSuccess: async (_, input) => {
   await Promise.all([
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot }),
    queryClient.invalidateQueries({ queryKey: noteQueryKeys.detail(input.noteId) }),
   ]);
  },
 });
}
