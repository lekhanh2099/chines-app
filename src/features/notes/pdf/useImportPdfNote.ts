"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import {
 writeCachedNotePdf,
 writeCachedNotePdfCover,
} from "@/features/notes/local/note-pdf-file-cache";
import { attachNotePdf } from "@/services/notes/note-pdf.service";
import { createNote, deleteNote } from "@/services/notes/notes.service";
import { notePdfTitle, readNotePdfFile } from "./note-pdf-file";

/**
 * Library "Import" of a PDF: a new note named after the file, holding that PDF.
 * When the upload fails the just-created empty note is removed again.
 */
export function useImportPdfNote() {
 const { supabase, userId } = useClientSession();
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (file: File) => {
   if (!userId) throw new Error("Not authenticated");
   const { pageCount, cover } = await readNotePdfFile(file);
   const note = await createNote(supabase, userId, {
    title: notePdfTitle(file),
    tags: [],
    category: "general",
   });
   if (!note) throw new Error("Failed to create note");
   try {
    const attachment = await attachNotePdf(supabase, {
     noteId: note.id,
     ownerUserId: userId,
     file,
     pageCount,
    });
    await Promise.all([
     writeCachedNotePdf(userId, attachment.id, file),
     writeCachedNotePdfCover(userId, attachment.id, cover),
    ]);
    queryClient.setQueryData(noteQueryKeys.pdf(userId, note.id), attachment);
    return note;
   } catch (error) {
    await deleteNote(supabase, note.id);
    throw error;
   }
  },
  onSettled: () => {
   void queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
   void queryClient.invalidateQueries({ queryKey: noteQueryKeys.pdfAttachments(userId) });
  },
 });
}
