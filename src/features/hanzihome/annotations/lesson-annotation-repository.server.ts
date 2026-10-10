import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { DbNoteSchema } from "@/types/database";
import type { Database } from "@/types/supabase.generated";

import {
 type AnnotationAnchor,
 type LessonTextAnnotation,
 type LessonAnnotationNoteUpdate,
 type LessonAnnotationNoteResult,
} from "./types";
import { extractAnnotationNoteText } from "./annotation-note-utils";

const annotationRowSchema = z.object({
 id: z.string(),
 lesson_id: z.string(),
 node_type: z.string(),
 node_id: z.string(),
 start_offset: z.number(),
 end_offset: z.number(),
 selected_text: z.string(),
 prefix_text: z.string(),
 suffix_text: z.string(),
 tone: z.literal("focus"),
 note_id: z.string().nullable(),
 created_at: z.string(),
 updated_at: z.string(),
 notes: DbNoteSchema.nullable(),
});

type Authority = SupabaseClient<Database>;

function mapAnnotation(
 row: z.output<typeof annotationRowSchema>,
 userId: string,
): LessonTextAnnotation {
 if (
  row.note_id !== null &&
  (!row.notes || row.notes.id !== row.note_id || row.notes.user_id !== userId)
 ) {
  throw new Error("Lesson annotation note owner mismatch");
 }
 return {
  id: row.id,
  lessonId: row.lesson_id,
  nodeType: row.node_type,
  nodeId: row.node_id,
  startOffset: row.start_offset,
  endOffset: row.end_offset,
  selectedText: row.selected_text,
  prefixText: row.prefix_text,
  suffixText: row.suffix_text,
  tone: row.tone,
  noteId: row.note_id,
  note: row.notes,
  noteText: row.notes ? extractAnnotationNoteText(row.notes.content) : "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
 };
}

async function getOwnedAnnotation(authority: Authority, userId: string, annotationId: string) {
 const { data, error } = await authority
  .from("lesson_text_annotations")
  .select(
   "id, lesson_id, node_type, node_id, start_offset, end_offset, selected_text, prefix_text, suffix_text, tone, note_id, created_at, updated_at, notes(*)",
  )
  .eq("user_id", userId)
  .eq("id", annotationId)
  .maybeSingle();
 if (error) throw new Error(error.message);
 if (data === null) throw new Error("Lesson annotation not found");
 return mapAnnotation(annotationRowSchema.parse(data), userId);
}

export async function listLessonAnnotations(
 authority: Authority,
 userId: string,
 lessonId: string,
): Promise<LessonTextAnnotation[]> {
 const { data, error } = await authority
  .from("lesson_text_annotations")
  .select(
   "id, lesson_id, node_type, node_id, start_offset, end_offset, selected_text, prefix_text, suffix_text, tone, note_id, created_at, updated_at, notes(*)",
  )
  .eq("user_id", userId)
  .eq("lesson_id", lessonId)
  .order("start_offset", { ascending: true });
 if (error) throw new Error(error.message);
 return annotationRowSchema
  .array()
  .parse(data)
  .map((row) => mapAnnotation(row, userId));
}

export async function createLessonAnnotation(
 authority: Authority,
 userId: string,
 input: { anchor: AnnotationAnchor; noteText?: string },
): Promise<LessonTextAnnotation> {
 const { data, error } = await authority.rpc("hanzihome_create_lesson_text_annotation_as_server", {
  p_user_id: userId,
  p_lesson_id: input.anchor.lessonId,
  p_node_type: input.anchor.nodeType,
  p_node_id: input.anchor.nodeId,
  p_start_offset: input.anchor.startOffset,
  p_end_offset: input.anchor.endOffset,
  p_selected_text: input.anchor.selectedText,
  p_prefix_text: input.anchor.prefixText,
  p_suffix_text: input.anchor.suffixText,
  p_note_text: input.noteText,
 });
 if (error) throw new Error(error.message);
 return getOwnedAnnotation(authority, userId, data);
}

export async function updateLessonAnnotationNote(
 authority: Authority,
 userId: string,
 input: LessonAnnotationNoteUpdate,
): Promise<LessonAnnotationNoteResult> {
 const { data, error } = await authority.rpc(
  "hanzihome_update_lesson_text_annotation_note_cas_as_server",
  {
   p_user_id: userId,
   p_annotation_id: input.annotationId,
   p_note_text: input.noteText,
   ...(input.expectedRevision === null ? {} : { p_expected_revision: input.expectedRevision }),
  },
 );
 if (error) throw new Error(error.message);
 const result = z.strictObject({ saved: z.boolean(), annotation: annotationRowSchema }).parse(data);
 return { saved: result.saved, annotation: mapAnnotation(result.annotation, userId) };
}

export async function deleteLessonAnnotation(
 authority: Authority,
 userId: string,
 annotationId: string,
): Promise<boolean> {
 const { data, error } = await authority.rpc("hanzihome_delete_lesson_text_annotation_as_server", {
  p_user_id: userId,
  p_annotation_id: annotationId,
 });
 if (error) throw new Error(error.message);
 return data;
}
