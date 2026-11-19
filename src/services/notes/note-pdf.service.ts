/**
 * Note PDF Service — the one PDF a note can hold.
 *
 * The file lives in the private `note-pdfs` bucket at
 * `<owner>/<note>/<attachment>.pdf`; `note_pdf_attachments` records it and its
 * page count. Page ink is stored separately by the Reader PDF ink owner.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import type { Database, Tables } from "@/types/supabase.generated";

type AppSupabaseClient = SupabaseClient<Database>;
export type NotePdfAttachment = Tables<"note_pdf_attachments">;

const NOTE_PDF_BUCKET = "note-pdfs";
/** Matches the bucket and table limit (50 MiB). */
export const NOTE_PDF_MAX_BYTES = 52_428_800;

export async function getNotePdfAttachment(supabase: AppSupabaseClient, noteId: string) {
 const { data, error } = await supabase
  .from("note_pdf_attachments")
  .select("*")
  .eq("note_id", noteId)
  .maybeSingle();
 if (error) throw new Error(error.message);
 return data;
}

export async function attachNotePdf(
 supabase: AppSupabaseClient,
 input: { noteId: string; ownerUserId: string; file: File; pageCount: number },
): Promise<NotePdfAttachment> {
 const id = crypto.randomUUID();
 const storagePath = `${input.ownerUserId}/${input.noteId}/${id}.pdf`;
 const upload = await supabase.storage.from(NOTE_PDF_BUCKET).upload(storagePath, input.file, {
  contentType: "application/pdf",
  upsert: false,
 });
 if (upload.error) throw new Error(upload.error.message);

 const { data, error } = await supabase
  .from("note_pdf_attachments")
  .insert({
   id,
   note_id: input.noteId,
   user_id: input.ownerUserId,
   storage_path: storagePath,
   file_name: input.file.name.trim().slice(0, 255) || "document.pdf",
   byte_size: input.file.size,
   page_count: input.pageCount,
  })
  .select("*")
  .single();
 if (error) {
  await supabase.storage.from(NOTE_PDF_BUCKET).remove([storagePath]);
  throw new Error(error.message);
 }
 return data;
}

export async function downloadNotePdf(
 supabase: AppSupabaseClient,
 attachment: Pick<NotePdfAttachment, "storage_path">,
): Promise<Blob> {
 const { data, error } = await supabase.storage
  .from(NOTE_PDF_BUCKET)
  .download(attachment.storage_path);
 if (error) throw new Error(error.message);
 return data;
}

/** Removes the record (its ink goes with it in the database) and then the file. */
export async function removeNotePdf(
 supabase: AppSupabaseClient,
 attachment: Pick<NotePdfAttachment, "id" | "storage_path">,
): Promise<void> {
 const { error } = await supabase.from("note_pdf_attachments").delete().eq("id", attachment.id);
 if (error) throw new Error(error.message);
 const removal = await supabase.storage.from(NOTE_PDF_BUCKET).remove([attachment.storage_path]);
 if (removal.error) logger.error("[NotePdfService] file removal error:", removal.error);
}

/**
 * Deleting a note cascades its attachment row, but not the stored file, so the
 * note owner removes the file first. A failure here never blocks the delete.
 */
export async function removeNotePdfFileForNote(
 supabase: AppSupabaseClient,
 noteId: string,
): Promise<void> {
 try {
  const attachment = await getNotePdfAttachment(supabase, noteId);
  if (!attachment) return;
  const removal = await supabase.storage.from(NOTE_PDF_BUCKET).remove([attachment.storage_path]);
  if (removal.error) logger.error("[NotePdfService] file removal error:", removal.error);
 } catch (error) {
  logger.error("[NotePdfService] attachment lookup error:", error);
 }
}
