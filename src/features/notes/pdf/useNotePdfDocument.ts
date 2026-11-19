"use client";

import { useEffect, useState } from "react";

import { useClientSession } from "@/components/providers/QueryProvider";
import { readCachedNotePdf, writeCachedNotePdf } from "@/features/notes/local/note-pdf-file-cache";
import { downloadNotePdf, type NotePdfAttachment } from "@/services/notes/note-pdf.service";
import { openPdfDocument, type PdfDocument } from "./pdfjs-loader";

/**
 * Opens a note PDF from the device copy, downloading it once when missing.
 * The document lives as long as the component; mount it with
 * `key={attachment.id}` so a new attachment starts from a clean state.
 */
export function useNotePdfDocument(attachment: NotePdfAttachment) {
 const { supabase, userId } = useClientSession();
 const [document, setDocument] = useState<PdfDocument>();
 const [failed, setFailed] = useState(false);
 const [attempt, setAttempt] = useState(0);
 // A refetched row is a new object for the same immutable file.
 const { id: attachmentId, storage_path: storagePath } = attachment;

 useEffect(() => {
  if (!userId) return;
  let active = true;
  const closers: Array<() => Promise<void>> = [];
  void (async () => {
   let file = await readCachedNotePdf(userId, attachmentId);
   if (!file) {
    file = await downloadNotePdf(supabase, { storage_path: storagePath });
    await writeCachedNotePdf(userId, attachmentId, file);
   }
   const opened = await openPdfDocument(file);
   if (!active) {
    void opened.close();
    return;
   }
   closers.push(opened.close);
   setDocument(opened.document);
  })().catch(() => {
   if (active) setFailed(true);
  });
  return () => {
   active = false;
   for (const close of closers) void close();
  };
 }, [attachmentId, attempt, storagePath, supabase, userId]);

 return {
  document,
  failed,
  retry: () => {
   setFailed(false);
   setAttempt((current) => current + 1);
  },
 };
}
