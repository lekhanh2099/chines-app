"use client";

import { JsonValueSchema, type JsonFieldValue } from "@/types/json";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { lessonAnnotationQueryKeys } from "./query-keys";
import type { AnnotationAnchor, LessonTextAnnotation } from "./types";

const AnnotationRowSchema = z.object({
 id: z.string(),
 lesson_id: z.string(),
 node_type: z.string(),
 node_id: z.string(),
 start_offset: z.number(),
 end_offset: z.number(),
 selected_text: z.string(),
 prefix_text: z.string(),
 suffix_text: z.string(),
 tone: z.string(),
 note_id: z.string().nullable(),
 created_at: z.string(),
 updated_at: z.string(),
 notes: z.object({ content: JsonValueSchema }).nullable(),
});
type AnnotationRow = z.infer<typeof AnnotationRowSchema>;

const LexicalNoteContentSchema = z.object({
 content: z
  .array(
   z.object({
    content: z.array(z.object({ text: JsonValueSchema.optional() })).optional(),
   }),
  )
  .optional(),
});

function extractNoteText(content: JsonFieldValue): string {
 const parsed = LexicalNoteContentSchema.safeParse(content);
 if (!parsed.success) return "";
 const text = parsed.data.content?.[0]?.content?.find(
  (item) => typeof item.text === "string",
 )?.text;
 return typeof text === "string" ? text : "";
}

function mapAnnotation(row: AnnotationRow): LessonTextAnnotation {
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
  tone: "focus",
  noteId: row.note_id,
  noteText: extractNoteText(row.notes?.content),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
 };
}

async function getSupabaseClient() {
 const { createClient } = await import("@/lib/supabase/client");
 return createClient();
}

export function useLessonAnnotations(lessonId: string) {
 const queryClient = useQueryClient();
 const queryKey = lessonAnnotationQueryKeys.byLesson(lessonId);

 const query = useQuery({
  queryKey,
  enabled: !!lessonId,
  queryFn: async () => {
   const supabase = await getSupabaseClient();
   const { data, error } = await supabase
    .from("lesson_text_annotations")
    .select(
     "id, lesson_id, node_type, node_id, start_offset, end_offset, selected_text, prefix_text, suffix_text, tone, note_id, created_at, updated_at, notes(content)",
    )
    .eq("lesson_id", lessonId)
    .order("start_offset", { ascending: true });

   if (error) throw error;
   return AnnotationRowSchema.array()
    .parse(data || [])
    .map(mapAnnotation);
  },
 });

 const createMutation = useMutation({
  mutationFn: async ({ anchor, noteText }: { anchor: AnnotationAnchor; noteText?: string }) => {
   const supabase = await getSupabaseClient();
   const { data, error } = await supabase.rpc("create_lesson_text_annotation", {
    p_lesson_id: anchor.lessonId,
    p_node_type: anchor.nodeType,
    p_node_id: anchor.nodeId,
    p_start_offset: anchor.startOffset,
    p_end_offset: anchor.endOffset,
    p_selected_text: anchor.selectedText,
    p_prefix_text: anchor.prefixText,
    p_suffix_text: anchor.suffixText,
    p_note_text: noteText || undefined,
   });
   if (error) throw error;
   return data;
  },
  onMutate: async ({ anchor, noteText }) => {
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey) || [];
   const now = new Date().toISOString();
   queryClient.setQueryData<LessonTextAnnotation[]>(queryKey, [
    ...previous,
    {
     id: `optimistic-${crypto.randomUUID()}`,
     lessonId: anchor.lessonId,
     nodeType: anchor.nodeType,
     nodeId: anchor.nodeId,
     startOffset: anchor.startOffset,
     endOffset: anchor.endOffset,
     selectedText: anchor.selectedText,
     prefixText: anchor.prefixText,
     suffixText: anchor.suffixText,
     tone: "focus",
     noteId: null,
     noteText: noteText || "",
     createdAt: now,
     updatedAt: now,
    },
   ]);
   return { previous };
  },
  onError: (_error, _variables, context) => {
   queryClient.setQueryData(queryKey, context?.previous || []);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey }),
 });
 const noteMutation = useMutation({
  mutationFn: async ({ annotationId, noteText }: { annotationId: string; noteText: string }) => {
   const supabase = await getSupabaseClient();
   const { data, error } = await supabase.rpc("update_lesson_text_annotation_note", {
    p_annotation_id: annotationId,
    p_note_text: noteText,
   });
   if (error) throw error;
   return data;
  },
  onMutate: async ({ annotationId, noteText }) => {
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey) || [];
   queryClient.setQueryData<LessonTextAnnotation[]>(
    queryKey,
    previous.map((annotation) =>
     annotation.id === annotationId
      ? { ...annotation, noteText, updatedAt: new Date().toISOString() }
      : annotation,
    ),
   );
   return { previous };
  },
  onError: (_error, _variables, context) => {
   queryClient.setQueryData(queryKey, context?.previous || []);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey }),
 });
 const deleteMutation = useMutation({
  mutationFn: async (annotationId: string) => {
   const supabase = await getSupabaseClient();
   const { data, error } = await supabase.rpc("delete_lesson_text_annotation", {
    p_annotation_id: annotationId,
   });
   if (error) throw error;
   return data;
  },
  onMutate: async (annotationId) => {
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<LessonTextAnnotation[]>(queryKey) || [];
   queryClient.setQueryData<LessonTextAnnotation[]>(
    queryKey,
    previous.filter((annotation) => annotation.id !== annotationId),
   );
   return { previous };
  },
  onError: (_error, _variables, context) => {
   queryClient.setQueryData(queryKey, context?.previous || []);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey }),
 });

 return {
  annotations: query.data || [],
  isLoading: query.isLoading,
  createAnnotation: createMutation.mutateAsync,
  updateAnnotationNote: noteMutation.mutateAsync,
  deleteAnnotation: deleteMutation.mutateAsync,
  isMutating: createMutation.isPending || noteMutation.isPending || deleteMutation.isPending,
 };
}
