"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import {
 deleteCachedNotePdf,
 readCachedNotePdf,
 readCachedNotePdfCover,
 writeCachedNotePdfCover,
} from "@/features/notes/local/note-pdf-file-cache";
import { notePdfAssetId } from "@/features/reading/pdf/note-pdf-asset-id";
import { discardPendingPdfAnnotationsForAsset } from "@/features/reading/pdf/pdf-annotation-outbox";
import { listNotePdfAttachments, type NotePdfAttachment } from "@/services/notes/note-pdf.service";
import { renderPdfCover } from "./note-pdf-file";
import { openPdfDocument } from "./pdfjs-loader";

/** The owner's note PDFs keyed by note id, for library covers and badges. */
export function useNotePdfLibrary() {
 const { supabase, userId, isResolved } = useClientSession();
 const query = useQuery({
  queryKey: noteQueryKeys.pdfAttachments(userId),
  queryFn: () => listNotePdfAttachments(supabase),
  enabled: isResolved && Boolean(userId),
  staleTime: 5 * 60_000,
 });
 const byNoteId = useMemo(
  () => new Map((query.data ?? []).map((attachment) => [attachment.note_id, attachment])),
  [query.data],
 );

 /** After a library delete: drop this device's copy, cover and queued ink of the note's PDF. */
 const forgetDeletedNote = useCallback(
  (noteId: string) => {
   const attachment = byNoteId.get(noteId);
   if (!userId || !attachment) return;
   void deleteCachedNotePdf(userId, attachment.id);
   void discardPendingPdfAnnotationsForAsset(notePdfAssetId(attachment.id), userId).catch(() => {});
  },
  [byNoteId, userId],
 );

 return { byNoteId, forgetDeletedNote };
}

/**
 * Object URL of a PDF's library cover. Uses the cached cover, or draws one when
 * this device already holds the PDF; never downloads a PDF just for a cover.
 */
export function useNotePdfCoverUrl(attachment: NotePdfAttachment) {
 const { userId } = useClientSession();
 const { data: cover } = useQuery({
  queryKey: [...noteQueryKeys.pdfAttachments(userId), "cover", attachment.id],
  queryFn: async () => {
   if (!userId) return new Blob();
   const cached = await readCachedNotePdfCover(userId, attachment.id);
   if (cached) return cached;
   const file = await readCachedNotePdf(userId, attachment.id);
   if (!file) return new Blob();
   const opened = await openPdfDocument(file);
   try {
    const drawn = await renderPdfCover(opened.document);
    await writeCachedNotePdfCover(userId, attachment.id, drawn);
    return drawn;
   } finally {
    void opened.close();
   }
  },
  enabled: Boolean(userId),
  staleTime: Number.POSITIVE_INFINITY,
  retry: false,
 });
 const url = useMemo(() => (cover && cover.size > 0 ? URL.createObjectURL(cover) : ""), [cover]);
 useEffect(
  () => () => {
   if (url) URL.revokeObjectURL(url);
  },
  [url],
 );
 return url;
}
