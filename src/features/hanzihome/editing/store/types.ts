import type { ReactNode } from "react";

export const editableEntityTypes = [
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
 "reading_item",
 "reading_question",
 "text_block",
 "text_line",
 "text_paragraph",
] as const;

export type EditableEntityType = (typeof editableEntityTypes)[number];
export type EditableNodePath = Array<string | number>;

export type EditableNodeRequest = {
 lessonId: string;
 entityType: EditableEntityType;
 entityId: string;
 parentEntityType?: EditableEntityType;
 parentEntityId?: string;
 path: EditableNodePath;
 value: unknown;
 label?: string;
 description?: ReactNode;
};
