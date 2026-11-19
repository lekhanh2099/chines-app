/**
 * Ink for a PDF imported into a note is stored with the Reader PDF ink rows,
 * keyed by this asset id. The attachment row (public.note_pdf_attachments)
 * owns the page count and the cleanup of these rows.
 */
export const NOTE_PDF_ASSET_ID_PATTERN =
 /^note-pdf:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/u;

export function notePdfAssetId(attachmentId: string) {
 return `note-pdf:${attachmentId}`;
}
