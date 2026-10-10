"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import {
 createNote,
 createNoteFolder,
 type CreateNoteInput,
 type NoteFolder,
} from "@/services/notes/notes.service";
import {
 createNoteImportInput,
 createQuickNoteInput,
 findNoteImportFolder,
} from "@/features/notes/note-editor-utils";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { normalizeImportedNotePayload } from "@/features/notes/note-export.schema";
import { useNoteFolders } from "./useNoteLibrary";

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

export function useImportNote() {
 const { supabase, userId } = useClientSession();
 const queryClient = useQueryClient();
 const foldersQuery = useNoteFolders();

 return useMutation({
  mutationFn: async (file: File) => {
   if (!userId) throw new Error("Not authenticated");
   const imported = normalizeImportedNotePayload(JSON.parse(await file.text()));
   const folders = foldersQuery.data ?? [];
   let folderId: NoteFolder["parentId"] = null;
   if (imported.note.folder) {
    const spec = imported.note.folder;
    let parentId: NoteFolder["parentId"] = null;
    if (spec.parentName) {
     const parent = findNoteImportFolder(folders, null, spec.parentName);
     if (parent) parentId = parent.id;
     else {
      parentId = (
       await createNoteFolder(supabase, userId, { name: spec.parentName, color: spec.color })
      ).id;
      await queryClient.invalidateQueries({ queryKey: noteQueryKeys.folders(userId) });
     }
    }
    const folder = findNoteImportFolder(folders, parentId, spec.name);
    if (folder) folderId = folder.id;
    else {
     folderId = (
      await createNoteFolder(supabase, userId, { name: spec.name, parentId, color: spec.color })
     ).id;
     await queryClient.invalidateQueries({ queryKey: noteQueryKeys.folders(userId) });
    }
   }
   const note = await createNote(supabase, userId, createNoteImportInput(imported.note, folderId));
   if (!note) throw new Error("Failed to create note");
   return note;
  },
  onSuccess: (note) => {
   queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(note.user_id) });
  },
 });
}

export function useCreateQuickNote() {
 const { supabase } = useClientSession();
 const queryClient = useQueryClient();
 return useMutation({
  networkMode: "always",
  mutationFn: async (createTitle: () => CreateNoteInput["title"]) => {
   const user = await getClientSessionUser(supabase);
   if (!user) return null;
   const note = await createNote(supabase, user.id, createQuickNoteInput(createTitle()));
   if (!note) throw new Error("Failed to create note");
   return note;
  },
  onSuccess: (note) => {
   if (note) queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(note.user_id) });
  },
 });
}
