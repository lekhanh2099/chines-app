import { z } from "zod";

import { mutationError } from "@/features/hanzihome/server/canonical-content-mutation";
import { editableEntityTypes } from "@/features/hanzihome/editing/store/types";
import type { EditableEntityType } from "@/features/hanzihome/editing/store/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const deletedRowSchema = z.object({
 id: z.string(),
 updated_at: z.string(),
 deleted_at: z.string(),
});

type DeletedEntityType =
 | "course"
 | "book"
 | "lesson"
 | "section"
 | "lesson_text"
 | "vocab_item"
 | "vocab_example"
 | "vocab_detail_section"
 | "grammar_point"
 | "grammar_example"
 | "grammar_detail_section";

type DeletedContentBase = {
 entityId: string;
 label: string;
 parentEntityId?: string;
 deletedAt: string;
 updatedAt: string;
};

type DeletedContentItem =
 | (DeletedContentBase & {
    kind: "canonical";
    entityType: DeletedEntityType;
   })
 | (DeletedContentBase & {
    kind: "nested";
    entityType: EditableEntityType;
    sectionId: string;
   });

function deletedItem(
 entityType: DeletedEntityType,
 row: z.infer<typeof deletedRowSchema>,
 label: string,
 parentEntityId?: string,
): DeletedContentItem {
 return {
  kind: "canonical",
  entityType,
  entityId: row.id,
  label: label || row.id,
  parentEntityId,
  deletedAt: row.deleted_at,
  updatedAt: row.updated_at,
 };
}

const nestedEntityTypeSchema = z.enum(editableEntityTypes);

function nestedNodeLabel(record: Record<string, unknown>, entityId: string) {
 for (const key of ["title_vi", "title", "hanzi", "zh", "question", "prompt", "text"]) {
  const value = record[key];
  if (typeof value === "string" && value.trim()) return value.trim();
 }
 return entityId;
}

function collectDeletedNestedNodes({
 value,
 sectionId,
 sectionUpdatedAt,
 lessonId,
}: {
 value: unknown;
 sectionId: string;
 sectionUpdatedAt: string;
 lessonId: string;
}): DeletedContentItem[] {
 if (Array.isArray(value)) {
  return value.flatMap((item) =>
   collectDeletedNestedNodes({ value: item, sectionId, sectionUpdatedAt, lessonId }),
  );
 }
 if (!value || typeof value !== "object") return [];

 const record = value as Record<string, unknown>;
 const children = Object.values(record).flatMap((item) =>
  collectDeletedNestedNodes({ value: item, sectionId, sectionUpdatedAt, lessonId }),
 );
 const entityId = typeof record.id === "string" ? record.id : "";
 const deletedAt = typeof record.deleted_at === "string" ? record.deleted_at : "";
 const entityType = nestedEntityTypeSchema.safeParse(record.deleted_entity_type);

 if (!entityId || !deletedAt || !entityType.success) return children;
 return [
  {
   kind: "nested",
   entityType: entityType.data,
   entityId,
   label: nestedNodeLabel(record, entityId),
   parentEntityId: lessonId,
   sectionId,
   deletedAt,
   updatedAt: sectionUpdatedAt,
  },
  ...children,
 ];
}

export async function GET() {
 const sessionClient = await createClient();
 const {
  data: { user },
 } = await sessionClient.auth.getUser();
 if (!user) return mutationError("Unauthorized", 401);

 const [
  courses,
  books,
  lessons,
  sections,
  lessonTexts,
  vocabItems,
  vocabExamples,
  vocabDetails,
  grammarPoints,
  grammarExamples,
  grammarDetails,
  activeSections,
 ] = await Promise.all([
  sessionClient
   .from("hanzihome_courses")
   .select("id,title,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_course_books")
   .select("id,course_id,title,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_lessons")
   .select("id,book_id,title_zh,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_lesson_sections")
   .select("id,lesson_id,title,title_vi,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_lesson_texts")
   .select("id,lesson_id,title,text_key,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_vocab_items")
   .select("id,lesson_id,word,pinyin,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_vocab_examples")
   .select("id,vocab_item_id,zh,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_vocab_detail_sections")
   .select("id,vocab_item_id,title,section_key,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_grammar_points")
   .select("id,lesson_id,title,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_grammar_examples")
   .select("id,grammar_point_id,zh,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_grammar_detail_sections")
   .select("id,grammar_point_id,title,section_key,updated_at,deleted_at")
   .not("deleted_at", "is", null),
  sessionClient
   .from("hanzihome_lesson_sections")
   .select("id,lesson_id,payload,updated_at")
   .is("deleted_at", null),
 ]);

 const results = [
  courses,
  books,
  lessons,
  sections,
  lessonTexts,
  vocabItems,
  vocabExamples,
  vocabDetails,
  grammarPoints,
  grammarExamples,
  grammarDetails,
  activeSections,
 ];
 const failed = results.find((result) => result.error);
 if (failed?.error) return mutationError(failed.error.message, 500, failed.error.code);

 const items: DeletedContentItem[] = [
  ...(courses.data ?? []).map((row) =>
   deletedItem("course", deletedRowSchema.parse(row), row.title),
  ),
  ...(books.data ?? []).map((row) =>
   deletedItem("book", deletedRowSchema.parse(row), row.title, row.course_id),
  ),
  ...(lessons.data ?? []).map((row) =>
   deletedItem("lesson", deletedRowSchema.parse(row), row.title_zh, row.book_id),
  ),
  ...(sections.data ?? []).map((row) =>
   deletedItem("section", deletedRowSchema.parse(row), row.title_vi || row.title, row.lesson_id),
  ),
  ...(lessonTexts.data ?? []).map((row) =>
   deletedItem(
    "lesson_text",
    deletedRowSchema.parse(row),
    row.title || row.text_key,
    row.lesson_id,
   ),
  ),
  ...(vocabItems.data ?? []).map((row) =>
   deletedItem(
    "vocab_item",
    deletedRowSchema.parse(row),
    `${row.word} ${row.pinyin}`.trim(),
    row.lesson_id,
   ),
  ),
  ...(vocabExamples.data ?? []).map((row) =>
   deletedItem("vocab_example", deletedRowSchema.parse(row), row.zh, row.vocab_item_id),
  ),
  ...(vocabDetails.data ?? []).map((row) =>
   deletedItem(
    "vocab_detail_section",
    deletedRowSchema.parse(row),
    row.title || row.section_key,
    row.vocab_item_id,
   ),
  ),
  ...(grammarPoints.data ?? []).map((row) =>
   deletedItem("grammar_point", deletedRowSchema.parse(row), row.title, row.lesson_id),
  ),
  ...(grammarExamples.data ?? []).map((row) =>
   deletedItem("grammar_example", deletedRowSchema.parse(row), row.zh, row.grammar_point_id),
  ),
  ...(grammarDetails.data ?? []).map((row) =>
   deletedItem(
    "grammar_detail_section",
    deletedRowSchema.parse(row),
    row.title || row.section_key,
    row.grammar_point_id,
   ),
  ),
  ...(activeSections.data ?? []).flatMap((section) =>
   collectDeletedNestedNodes({
    value: section.payload,
    sectionId: section.id,
    sectionUpdatedAt: section.updated_at,
    lessonId: section.lesson_id,
   }),
  ),
 ].sort((left, right) => right.deletedAt.localeCompare(left.deletedAt));

 return Response.json({ items });
}
