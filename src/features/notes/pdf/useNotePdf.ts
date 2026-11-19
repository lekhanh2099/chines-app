"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import {
 deleteCachedNotePdf,
 writeCachedNotePdf,
} from "@/features/notes/local/note-pdf-file-cache";
import { notePdfAssetId } from "@/features/reading/pdf/note-pdf-asset-id";
import { discardPendingPdfAnnotationsForAsset } from "@/features/reading/pdf/pdf-annotation-outbox";
import {
 attachNotePdf,
 getNotePdfAttachment,
 NOTE_PDF_MAX_BYTES,
 removeNotePdf,
 type NotePdfAttachment,
} from "@/services/notes/note-pdf.service";
import { countPdfPages } from "./pdfjs-loader";

/** The picked file is not a PDF. */
export class NotePdfTypeError extends Error {}
/** The PDF is larger than the bucket limit. */
export class NotePdfSizeError extends Error {}
/** pdf.js could not open the file (damaged or password protected). */
export class NotePdfUnreadableError extends Error {}

function isPdfFile(file: File) {
 return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

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
   if (!isPdfFile(file)) throw new NotePdfTypeError(file.name);
   if (file.size > NOTE_PDF_MAX_BYTES) throw new NotePdfSizeError(file.name);
   const pageCount = await countPdfPages(file).catch(() => {
    throw new NotePdfUnreadableError(file.name);
   });
   const previous = query.data;
   if (previous) await removeAttachment(previous, userId);
   const attachment = await attachNotePdf(supabase, {
    noteId,
    ownerUserId: userId,
    file,
    pageCount,
   });
   await writeCachedNotePdf(userId, attachment.id, file);
   return attachment;
  },
  onSuccess: (attachment) => queryClient.setQueryData(queryKey, attachment),
  onError: () => queryClient.invalidateQueries({ queryKey }),
 });

 const removeMutation = useMutation({
  mutationFn: async () => {
   if (!userId) throw new Error("Not authenticated");
   if (query.data) await removeAttachment(query.data, userId);
  },
  onSuccess: () => queryClient.setQueryData(queryKey, null),
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
