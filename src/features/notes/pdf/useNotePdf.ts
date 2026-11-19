"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import {
 deleteCachedNotePdf,
 writeCachedNotePdf,
 writeCachedNotePdfCover,
} from "@/features/notes/local/note-pdf-file-cache";
import { notePdfAssetId } from "@/features/reading/pdf/note-pdf-asset-id";
import { discardPendingPdfAnnotationsForAsset } from "@/features/reading/pdf/pdf-annotation-outbox";
import {
 attachNotePdf,
 getNotePdfAttachment,
 removeNotePdf,
 type NotePdfAttachment,
} from "@/services/notes/note-pdf.service";
import { readNotePdfFile } from "./note-pdf-file";

/** The one PDF a note holds: read, import (upload) and removal. */
export function useNotePdf(noteId: string) {
 const { supabase, userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const queryKey = noteQueryKeys.pdf(userId, noteId);

 const query = useQuery({
  queryKey,
  queryFn: () => getNotePdfAttachment(supabase, noteId),
  enabled: isResolved && Boolean(userId),
  staleTime: 5 * 60_000,
 });

 const importMutation = useMutation({
  mutationFn: async (file: File) => {
   if (!userId) throw new Error("Not authenticated");
   const { pageCount, cover } = await readNotePdfFile(file);
   const previous = query.data;
   if (previous) await removeAttachment(previous, userId);
   const attachment = await attachNotePdf(supabase, {
    noteId,
    ownerUserId: userId,
    file,
    pageCount,
   });
   await Promise.all([
    writeCachedNotePdf(userId, attachment.id, file),
    writeCachedNotePdfCover(userId, attachment.id, cover),
   ]);
   return attachment;
  },
  onSuccess: (attachment) => {
   queryClient.setQueryData(queryKey, attachment);
   void queryClient.invalidateQueries({ queryKey: noteQueryKeys.pdfAttachments(userId) });
  },
  onError: () => queryClient.invalidateQueries({ queryKey }),
 });

 const removeMutation = useMutation({
  mutationFn: async () => {
   if (!userId) throw new Error("Not authenticated");
   if (query.data) await removeAttachment(query.data, userId);
  },
  onSuccess: () => {
   queryClient.setQueryData(queryKey, null);
   void queryClient.invalidateQueries({ queryKey: noteQueryKeys.pdfAttachments(userId) });
  },
 });

 async function removeAttachment(attachment: NotePdfAttachment, ownerUserId: string) {
  await removeNotePdf(supabase, attachment);
  await Promise.all([
   deleteCachedNotePdf(ownerUserId, attachment.id),
   discardPendingPdfAnnotationsForAsset(notePdfAssetId(attachment.id), ownerUserId).catch(() => {}),
  ]);
 }

 /** After the note itself was deleted: drop this device's copy and queued ink. */
 const forgetDeletedNotePdf = async () => {
  const attachment = query.data;
  if (!userId || !attachment) return;
  await Promise.all([
   deleteCachedNotePdf(userId, attachment.id),
   discardPendingPdfAnnotationsForAsset(notePdfAssetId(attachment.id), userId).catch(() => {}),
  ]);
 };

 return {
  attachment: query.data ?? null,
  forgetDeletedNotePdf,
  isLoading: query.isLoading,
  loadFailed: query.isError,
  retryLoad: query.refetch,
  importPdf: importMutation.mutateAsync,
  isImporting: importMutation.isPending,
  removePdf: removeMutation.mutateAsync,
  isRemoving: removeMutation.isPending,
 };
}
