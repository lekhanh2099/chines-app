import type { ReactNode } from "react";
import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

export const EditableEntityTypeSchema = z.enum([
 "lesson",
 "section",
 "vocab_item",
 "vocab_example",
 "vocab_detail_section",
 "proper_noun",
 "character_writing_item",
 "grammar_point",
 "grammar_detail_section",
 "grammar_block",
 "grammar_formula",
 "grammar_example",
 "grammar_block_item",
 "exercise",
 "exercise_question",
 "exercise_matching_item",
 "exercise_answer_key",
 "exercise_word_bank",
 "exercise_dialogue_line",
 "exercise_cloze_segment",
 "exercise_cloze_answer",
 "listening_item",
 "reading_item",
 "reading_question",
 "text_block",
 "text_line",
 "text_paragraph",
]);
export const editableEntityTypes = EditableEntityTypeSchema.options;

export const EditableNodePathSchema = z.array(z.union([z.string(), z.number()]));
export const NullableEditableNodePathSchema = EditableNodePathSchema.nullable();
export type EditableEntityType = z.infer<typeof EditableEntityTypeSchema>;
export type EditableNodePath = z.infer<typeof EditableNodePathSchema>;
export type NullableEditableNodePath = z.infer<typeof NullableEditableNodePathSchema>;

export type EditableNodeRequest = {
 lessonId: string;
 entityType: EditableEntityType;
 entityId: string;
 parentEntityType?: EditableEntityType;
 parentEntityId?: string;
 path: EditableNodePath;
 value: JsonFieldValue;
 label?: string;
 description?: ReactNode;
};
