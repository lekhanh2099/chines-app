"use client";

import { useCallback } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { noteQueryKeys } from "../query-keys";
import type { NoteDetail } from "@/services/notes/notes.service";
import type { useClientSession } from "@/components/providers/QueryProvider";
import {
 useNoteFolderMutations,
 useNoteFolders,
 useUpdateNoteLibraryMetadata,
} from "./useNoteLibrary";
import type { NoteExportPayload } from "../note-export.schema";

/**
 * Note library folders plus the import step that applies an exported note's
 * folder, reading status and source metadata (creating missing folders).
 */
export function useNoteEditorLibraryImport({
 noteId,
 userId,
 queryClient,
}: {
 noteId: string;
 userId: ReturnType<typeof useClientSession>["userId"];
 queryClient: QueryClient;
}) {
 const foldersQuery = useNoteFolders();
 const { createMutation: createFolderMutation } = useNoteFolderMutations();
 const metadataMutation = useUpdateNoteLibraryMetadata(noteId);

 const applyImportedLibraryMetadata = useCallback(
  async (payload: NoteExportPayload) => {
   let folderId: Parameters<typeof metadataMutation.mutateAsync>[0]["folderId"];
   const folderSpec = payload.note.folder;
   if (folderSpec) {
    let parentId: Parameters<typeof createFolderMutation.mutateAsync>[0]["parentId"] = null;
    if (folderSpec.parentName) {
     parentId =
      foldersQuery.data?.find(
       (folder) => folder.parentId === null && folder.name === folderSpec.parentName,
      )?.id ??
      (
       await createFolderMutation.mutateAsync({
        name: folderSpec.parentName,
        color: folderSpec.color,
       })
      ).id;
    }
    folderId =
     foldersQuery.data?.find(
      (folder) => folder.parentId === parentId && folder.name === folderSpec.name,
     )?.id ??
     (
      await createFolderMutation.mutateAsync({
       name: folderSpec.name,
       parentId,
       color: folderSpec.color,
      })
     ).id;
   } else if (folderSpec === null) folderId = null;
   const current = queryClient.getQueryData<NoteDetail>(noteQueryKeys.detail(userId, noteId));
   if (!current) throw new Error("Note is not loaded");
   await metadataMutation.mutateAsync({
    expectedRevision: current.revision,
    noteId,
    folderId,
    readingStatus: payload.note.readingStatus ?? null,
    source: payload.note.source ?? null,
   });
  },
  [createFolderMutation, foldersQuery.data, metadataMutation, noteId, queryClient, userId],
 );

 return { folders: foldersQuery.data, applyImportedLibraryMetadata };
}
