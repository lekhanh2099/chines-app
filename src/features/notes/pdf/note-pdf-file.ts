"use client";

import { NOTE_PDF_MAX_BYTES } from "@/services/notes/note-pdf.service";
import { openPdfDocument, type PdfDocument } from "./pdfjs-loader";

/** The picked file is not a PDF. */
export class NotePdfTypeError extends Error {}
/** The PDF is larger than the bucket limit. */
export class NotePdfSizeError extends Error {}
/** pdf.js could not open the file (damaged or password protected). */
export class NotePdfUnreadableError extends Error {}

export function isPdfFile(file: File) {
 return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/** The note title for an imported PDF: its file name without the extension. */
export function notePdfTitle(file: File) {
 return file.name.replace(/\.pdf$/iu, "").trim() || file.name;
}

// Library covers are drawn at this width (CSS px at 2x density).
const COVER_WIDTH_PX = 360;

/** Draws page 1 as a small WebP cover for the notes library. */
export async function renderPdfCover(document: PdfDocument): Promise<Blob> {
 const page = await document.getPage(1);
 const viewport = page.getViewport({
  scale: COVER_WIDTH_PX / page.getViewport({ scale: 1 }).width,
 });
 const canvas = window.document.createElement("canvas");
 canvas.width = Math.floor(viewport.width);
 canvas.height = Math.floor(viewport.height);
 await page.render({ canvas, viewport }).promise;
 return new Promise((resolve, reject) => {
  canvas.toBlob(
   (blob) => (blob ? resolve(blob) : reject(new Error("PDF cover could not be encoded"))),
   "image/webp",
   0.8,
  );
 });
}

/**
 * Checks a picked file before upload: type, size, and that pdf.js can open it.
 * Returns its page count and a library cover drawn from page 1.
 */
export async function readNotePdfFile(file: File) {
 if (!isPdfFile(file)) throw new NotePdfTypeError(file.name);
 if (file.size > NOTE_PDF_MAX_BYTES) throw new NotePdfSizeError(file.name);
 const opened = await openPdfDocument(file).catch(() => {
  throw new NotePdfUnreadableError(file.name);
 });
 try {
  const cover = await renderPdfCover(opened.document).catch(() => new Blob());
  return { pageCount: opened.document.numPages, cover };
 } finally {
  void opened.close();
 }
}
