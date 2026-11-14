import "server-only";

import type { JsonObject } from "@/types/json";
import { z } from "zod";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import {
 getTextbookCatalog,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

import {
 readerAnnotationRowSchema,
 type ReaderAnnotationRow,
} from "@/features/reading/model/reading-annotation.schemas";
import {
 getReaderAsset,
 getReaderDocument,
} from "@/features/reading/repositories/reading-content.repository";
import { buildBusinessChineseReaderDocument } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import { readerResourceToDocument } from "@/features/reading/adapters/reading-resource.adapter";

async function requireStaticReaderDocument(documentId: string) {
 const resource = await getReaderDocument(documentId);
 if (resource !== null) return readerResourceToDocument(resource);

 const textbookSummary = getTextbookCatalog()
  .flatMap((book) => book.lessons)
  .find((lesson) => `${lesson.id}:text` === documentId);
 const textbook = textbookSummary
  ? getTextbookLesson(textbookSummary.bookKey, textbookSummary.number)
  : null;
 if (textbook === null) throw new Error("Reader document is not in the static package");
 return buildBusinessChineseReaderDocument(textbook, "text");
}

async function validateReaderAnnotationTarget(
 documentId: string,
 paragraphId: string | null,
 assetId: string | null,
 startOffset: number | null,
 endOffset: number | null,
 selectedText: string,
) {
 const resource = await requireStaticReaderDocument(documentId);
 if ((paragraphId === null) === (assetId === null)) {
  throw new Error("Reader annotation target is invalid");
 }
 if (paragraphId !== null) {
  const paragraph = resource.segments.find((candidate) => candidate.id === paragraphId);
  if (paragraph === undefined) throw new Error("Reader paragraph is not in the document");
  if (resource.source.kind === "lesson") {
   const boundaries = new Set<number>([paragraph.zh.length]);
   for (const grapheme of new Intl.Segmenter("zh-CN", { granularity: "grapheme" }).segment(
    paragraph.zh,
   )) {
    boundaries.add(grapheme.index);
   }
   if (
    startOffset === null ||
    endOffset === null ||
    endOffset <= startOffset ||
    !boundaries.has(startOffset) ||
    !boundaries.has(endOffset) ||
    paragraph.zh.slice(startOffset, endOffset) !== selectedText
   ) {
    throw new Error("Reader annotation range is invalid");
   }
   return;
  }
  const length = Array.from(paragraph.zh).length;
  if (
   (startOffset !== null && startOffset < 0) ||
   (endOffset !== null && endOffset < 0) ||
   (startOffset !== null && startOffset > length) ||
   (endOffset !== null && endOffset > length) ||
   (startOffset !== null && endOffset !== null && endOffset <= startOffset)
  ) {
   throw new Error("Reader annotation range is invalid");
  }
 }
 if (assetId !== null) {
  if (resource.source.kind === "lesson") {
   throw new Error("Reader asset is not in the document");
  }
  const asset = await getReaderAsset(assetId);
  if (asset === null || (asset.document_id !== null && asset.document_id !== documentId)) {
   throw new Error("Reader asset is not in the static package");
  }
 }
}

export async function listReaderAnnotations(
 documentId: string,
 context: AuthenticatedRouteContext,
): Promise<ReaderAnnotationRow[]> {
 await requireStaticReaderDocument(documentId);
 const { data, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_reader_annotations")
  .select("*")
  .eq("user_id", context.user.id)
  .eq("document_id", documentId)
  .is("deleted_at", null)
  .order("updated_at", { ascending: false });
 if (error) throw new Error(error.message);
 return readerAnnotationRowSchema.array().parse(data);
}

export async function createReaderAnnotation(
 input: {
  documentId: string;
  paragraphId: string | null;
  assetId: string | null;
  annotationType: "highlight" | "underline" | "note" | "ink";
  pageNumber: number | null;
  startOffset: number | null;
  endOffset: number | null;
  selectedText: string;
  noteText: string;
  color: "yellow" | "green" | "blue" | "pink";
  payload: JsonObject;
 },
 context: AuthenticatedRouteContext,
): Promise<ReaderAnnotationRow> {
 await validateReaderAnnotationTarget(
  input.documentId,
  input.paragraphId,
  input.assetId,
  input.startOffset,
  input.endOffset,
  input.selectedText,
 );
 const { data, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_reader_annotations")
  .insert({
   user_id: context.user.id,
   document_id: input.documentId,
   paragraph_id: input.paragraphId,
   asset_id: input.assetId,
   annotation_type: input.annotationType,
   page_number: input.pageNumber,
   start_offset: input.startOffset,
   end_offset: input.endOffset,
   selected_text: input.selectedText,
   note_text: input.noteText,
   color: input.color,
   payload: input.payload,
  })
  .select("*")
  .single();
 if (error) throw new Error(error.message);
 return readerAnnotationRowSchema.parse(data);
}

export async function updateReaderAnnotation(
 input: {
  annotationId: string;
  assetId: string | null;
  color: "yellow" | "green" | "blue" | "pink";
  endOffset: number | null;
  expectedRevision: number;
  noteText: string;
  pageNumber: number | null;
  payload: JsonObject;
  paragraphId: string | null;
  selectedText: string;
  startOffset: number | null;
 },
 context: AuthenticatedRouteContext,
): Promise<ReaderAnnotationRow> {
 const authority = createServiceRoleSupabaseClient();
 const { data: current, error: currentError } = await authority
  .from("hanzihome_reader_annotations")
  .select("*")
  .eq("id", input.annotationId)
  .eq("user_id", context.user.id)
  .is("deleted_at", null)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);
 if (current === null) throw new Error("Reader annotation not found");
 await validateReaderAnnotationTarget(
  current.document_id,
  input.paragraphId,
  input.assetId,
  input.startOffset,
  input.endOffset,
  input.selectedText,
 );
 if (current.revision !== input.expectedRevision) {
  throw new Error("Reader annotation changed since it was loaded");
 }
 const { data, error } = await authority
  .from("hanzihome_reader_annotations")
  .update({
   asset_id: input.assetId,
   color: input.color,
   end_offset: input.endOffset,
   note_text: input.noteText,
   page_number: input.pageNumber,
   payload: input.payload,
   paragraph_id: input.paragraphId,
   selected_text: input.selectedText,
   start_offset: input.startOffset,
   revision: current.revision + 1,
  })
  .eq("user_id", context.user.id)
  .eq("id", input.annotationId)
  .eq("revision", input.expectedRevision)
  .is("deleted_at", null)
  .select("*")
  .maybeSingle();
 if (error) throw new Error(error.message);
 if (data === null) throw new Error("Reader annotation changed since it was loaded");
 return readerAnnotationRowSchema.parse(data);
}

export async function deleteReaderAnnotation(
 input: { annotationId: string; expectedRevision: number },
 context: AuthenticatedRouteContext,
): Promise<boolean> {
 const authority = createServiceRoleSupabaseClient();
 const { data: current, error: currentError } = await authority
  .from("hanzihome_reader_annotations")
  .select("*")
  .eq("id", input.annotationId)
  .eq("user_id", context.user.id)
  .is("deleted_at", null)
  .maybeSingle();
 if (currentError) throw new Error(currentError.message);
 if (current === null) throw new Error("Reader annotation not found");
 await validateReaderAnnotationTarget(
  current.document_id,
  current.paragraph_id,
  current.asset_id,
  current.start_offset,
  current.end_offset,
  current.selected_text,
 );
 const { data, error } = await authority.rpc("hanzihome_delete_reader_annotation_as_server", {
  p_user_id: context.user.id,
  p_annotation_id: input.annotationId,
  p_expected_revision: input.expectedRevision,
 });
 if (error) throw new Error(error.message);
 return z.boolean().parse(data);
}
