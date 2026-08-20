import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { JsonValueSchema, type JsonFieldValue } from "@/types/json";
import type { Database } from "@/types/supabase.generated";

import { type AnnotationAnchor, type LessonTextAnnotation } from "./types";

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
 notes: z.object({ content: JsonValueSchema }).nullable(),
});

const lexicalNoteContentSchema = z.object({
 content: z
  .array(
   z.object({
    content: z.array(z.object({ text: JsonValueSchema.optional() })).optional(),
   }),
  )
  .optional(),
});

type Authority = SupabaseClient<Database>;

function extractNoteText(content: JsonFieldValue): string {
 const parsed = lexicalNoteContentSchema.safeParse(content);
 if (!parsed.success) return "";
 const text = parsed.data.content?.[0]?.content?.find(
  (item) => typeof item.text === "string",
 )?.text;
 return typeof text === "string" ? text : "";
}

function mapAnnotation(row: z.output<typeof annotationRowSchema>): LessonTextAnnotation {
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
  noteText: extractNoteText(row.notes?.content),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
 };
}

async function getOwnedAnnotation(authority: Authority, userId: string, annotationId: string) {
 const { data, error } = await authority
  .from("lesson_text_annotations")
  .select(
   "id, lesson_id, node_type, node_id, start_offset, end_offset, selected_text, prefix_text, suffix_text, tone, note_id, created_at, updated_at, notes(content)",
  )
  .eq("user_id", userId)
  .eq("id", annotationId)
  .maybeSingle();
 if (error) throw new Error(error.message);
 if (data === null) throw new Error("Lesson annotation not found");
 return mapAnnotation(annotationRowSchema.parse(data));
}

export async function listLessonAnnotations(
 authority: Authority,
 userId: string,
 lessonId: string,
): Promise<LessonTextAnnotation[]> {
 const { data, error } = await authority
  .from("lesson_text_annotations")
  .select(
   "id, lesson_id, node_type, node_id, start_offset, end_offset, selected_text, prefix_text, suffix_text, tone, note_id, created_at, updated_at, notes(content)",
  )
  .eq("user_id", userId)
  .eq("lesson_id", lessonId)
  .order("start_offset", { ascending: true });
 if (error) throw new Error(error.message);
 return annotationRowSchema.array().parse(data).map(mapAnnotation);
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
 input: { annotationId: string; noteText: string },
): Promise<LessonTextAnnotation> {
 const { error } = await authority.rpc("hanzihome_update_lesson_text_annotation_note_as_server", {
  p_user_id: userId,
  p_annotation_id: input.annotationId,
  p_note_text: input.noteText,
 });
 if (error) throw new Error(error.message);
 return getOwnedAnnotation(authority, userId, input.annotationId);
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
