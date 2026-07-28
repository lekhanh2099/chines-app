import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
 listeningAnswerSchema,
 listeningExerciseTypeSchema,
 listeningItemMetadataSchema,
 listeningLessonBundleSchema,
 listeningOptionSchema,
 listeningTranscriptSchema,
} from "./listening.schemas.ts";
import type { ListeningExerciseType, ListeningLessonBundle } from "./listening.types.ts";

const LESSON_SELECT = "id,title_zh,title_vi";
const SECTION_SELECT = "id,source_section_id,section_order,title,title_vi,payload";
const ITEM_SELECT = [
 "id",
 "section_id",
 "item_order",
 "category",
 "item_type",
 "transcript",
 "prompt_zh",
 "options",
 "answer",
 "explanation_vi",
 "metadata",
 "updated_at",
].join(",");

const lessonRowSchema = z.object({
 id: z.string().min(1),
 title_zh: z.string().min(1),
 title_vi: z.string().nullable(),
});

const sectionPayloadSchema = z.object({
 category: z.enum(["listening_comprehension", "pronunciation", "extra_practice"]),
 instructionZh: z.string().optional(),
 instructionVi: z.string().optional(),
 exerciseType: listeningExerciseTypeSchema.optional(),
 transcript: listeningTranscriptSchema.optional(),
 suggestionsZh: z.array(z.string()).optional(),
});

const sectionRowSchema = z.object({
 id: z.uuid(),
 source_section_id: z.string().min(1),
 section_order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string(),
 payload: sectionPayloadSchema,
});

const runtimeOptionSchema = listeningOptionSchema.extend({
 stress: z.array(z.string().min(1)).optional(),
});

const itemRowSchema = z.object({
 id: z.string().min(1),
 section_id: z.uuid(),
 item_order: z.number().int().positive(),
 category: z.enum(["listening_comprehension", "pronunciation", "extra_practice"]),
 item_type: z.enum([
  "sentence_mcq",
  "dialogue_mcq",
  "passage_mcq",
  "stress_choice",
  "true_false",
  "matching",
  "fill_blank",
  "open_answer",
  "oral_response",
  "shadowing",
  "dictation",
 ]),
 transcript: listeningTranscriptSchema.nullable(),
 prompt_zh: z.string().nullable(),
 options: z.array(runtimeOptionSchema),
 answer: listeningAnswerSchema.nullable(),
 explanation_vi: z.string().nullable(),
 metadata: listeningItemMetadataSchema,
 updated_at: z.iso.datetime({ offset: true }),
});

type SectionRow = z.infer<typeof sectionRowSchema>;
type ItemRow = z.infer<typeof itemRowSchema>;

const exerciseTypeTitleZh: Record<ListeningExerciseType, string> = {
 single_choice: "选择正确答案",
 short_answer: "回答问题",
 oral_response: "口语练习",
 true_false: "判断正误",
 matching: "连线",
 same_different: "判断异同",
 shadowing: "跟读",
 stress_choice: "选择重音",
 fill_blank: "听写填空",
};

function exerciseTypeFromItem(item: ItemRow): ListeningExerciseType {
 if (item.options.length >= 2) {
  return item.item_type === "stress_choice" ? "stress_choice" : "single_choice";
 }
 if (item.answer?.type === "boolean") {
  return item.metadata.printedPinyin && item.metadata.heardZh ? "same_different" : "true_false";
 }
 if (
  item.answer?.type === "matching" &&
  (item.metadata.left?.length ?? 0) > 0 &&
  (item.metadata.right?.length ?? 0) > 0
 ) {
  return "matching";
 }
 if ((item.metadata.acceptedAnswers?.length ?? 0) > 0) return "fill_blank";
 if (item.item_type === "shadowing" && item.prompt_zh) return "shadowing";
 if (item.item_type === "oral_response" || item.metadata.variant === "oral_response") {
  return "oral_response";
 }
 return "short_answer";
}

function buildRuntimeGroups(section: SectionRow, items: ItemRow[]) {
 const grouped = new Map<ListeningExerciseType, ItemRow[]>();
 for (const item of items) {
  const exerciseType = exerciseTypeFromItem(item);
  grouped.set(exerciseType, [...(grouped.get(exerciseType) ?? []), item]);
 }

 const groups = [...grouped.entries()];
 return groups.map(([exerciseType, groupItems], index) => {
  const isSplit = groups.length > 1;
  const id = isSplit ? `${section.id}:${exerciseType}` : section.id;
  return {
   id,
   sourceSectionId: isSplit
    ? `${section.source_section_id}:${exerciseType}`
    : section.source_section_id,
   order: section.section_order * 100 + index,
   category: section.payload.category,
   titleZh: isSplit
    ? `${section.title || section.payload.instructionZh || "听力练习"} · ${exerciseTypeTitleZh[exerciseType]}`
    : section.title || section.payload.instructionZh || "听力练习",
   titleVi: section.title_vi || section.payload.instructionVi || undefined,
   exerciseType,
   transcript: section.payload.transcript,
   suggestionsZh: section.payload.suggestionsZh ?? [],
   items: groupItems.map((item) => ({ ...item, section_id: id })),
  };
 });
}

export async function fetchListeningLessonBundle(
 supabase: SupabaseClient,
 lessonId: string,
): Promise<z.infer<z.ZodNullable<typeof listeningLessonBundleSchema>>> {
 const [lessonResult, sectionResult, itemResult] = await Promise.all([
  supabase
   .from("hanzihome_lessons")
   .select(LESSON_SELECT)
   .eq("id", lessonId)
   .is("deleted_at", null)
   .maybeSingle(),
  supabase
   .from("hanzihome_lesson_sections")
   .select(SECTION_SELECT)
   .eq("lesson_id", lessonId)
   .eq("section_type", "listening")
   .is("deleted_at", null)
   .order("section_order", { ascending: true }),
  supabase
   .from("hanzihome_listening_items")
   .select(ITEM_SELECT)
   .eq("lesson_id", lessonId)
   .eq("publication_status", "published")
   .is("deleted_at", null)
   .order("section_id", { ascending: true })
   .order("item_order", { ascending: true })
   .limit(100),
 ]);

 if (lessonResult.error) throw new Error(`Không tải được bài nghe: ${lessonResult.error.message}`);
 if (sectionResult.error)
  throw new Error(`Không tải được đề mục nghe: ${sectionResult.error.message}`);
 if (itemResult.error) throw new Error(`Không tải được bài tập nghe: ${itemResult.error.message}`);
 if (!lessonResult.data) return null;

 const lesson = lessonRowSchema.parse(lessonResult.data);
 const sectionRows = z.array(sectionRowSchema).parse(sectionResult.data ?? []);
 const itemRows = z.array(itemRowSchema).parse(itemResult.data ?? []);
 const sectionIds = new Set(sectionRows.map((section) => section.id));
 const orphan = itemRows.find((item) => !sectionIds.has(item.section_id));
 if (orphan) throw new Error(`Bài nghe có item mồ côi: ${orphan.id}`);

 const runtimeGroups = sectionRows.flatMap((section) =>
  buildRuntimeGroups(
   section,
   itemRows.filter((item) => item.section_id === section.id),
  ),
 );
 const runtimeItemRows = runtimeGroups.flatMap((group) => group.items);

 return listeningLessonBundleSchema.parse({
  lesson: {
   id: lesson.id,
   titleZh: lesson.title_zh,
   titleVi: lesson.title_vi ?? undefined,
  },
  sections: runtimeGroups.map((group) => ({
   id: group.id,
   sourceSectionId: group.sourceSectionId,
   order: group.order,
   category: group.category,
   titleZh: group.titleZh,
   titleVi: group.titleVi,
   exerciseType: group.exerciseType,
   transcript: group.transcript,
   suggestionsZh: group.suggestionsZh,
  })),
  items: runtimeItemRows.map((item) => ({
   id: item.id,
   sectionId: item.section_id,
   order: item.item_order,
   type: item.item_type,
   transcript: item.transcript ?? undefined,
   promptZh: item.prompt_zh ?? undefined,
   options: item.options,
   answer: item.answer ?? undefined,
   explanationVi: item.explanation_vi ?? undefined,
   metadata: item.metadata,
   editMeta: {
    entityType: "listening_item",
    entityId: item.id,
    dbId: item.id,
    updatedAt: item.updated_at,
    parentEntityType: "lesson",
    parentEntityId: lesson.id,
    order: item.item_order,
    orderField: "item_order",
   },
  })),
 });
}
