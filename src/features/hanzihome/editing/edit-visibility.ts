import type { EditableEntityType } from "./store/types";

const primaryEditableEntityTypes = new Set<EditableEntityType>([
 "lesson",
 "vocab_item",
 "proper_noun",
 "character_writing_item",
 "grammar_point",
 "exercise",
 "reading_item",
 "text_block",
]);

export function isPrimaryEditableEntityType(entityType: EditableEntityType) {
 return primaryEditableEntityTypes.has(entityType);
}
