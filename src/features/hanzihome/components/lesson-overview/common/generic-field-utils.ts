import type { JsonFieldValue } from "@/types/json";
import type { JsonObject } from "@/types/json";
import {
 answerToString,
 asRecord,
 stringValue,
} from "@/features/hanzihome/components/lesson-overview/utils";

export type RenderableField = {
 key: string;
 label: string;
 value: JsonFieldValue;
};

const FIELD_LABELS: Record<string, string> = {
 answer: "Đáp án",
 answer_key: "Đáp án",
 answers: "Đáp án",
 ba_sentences: "Câu chữ 把",
 blanks: "Chỗ trống",
 choices: "Lựa chọn",
 cloze_answers: "Đáp án điền khuyết",
 completed_paragraphs: "Bản hoàn chỉnh",
 completed_passage: "Bản hoàn chỉnh",
 completed_text: "Bản hoàn chỉnh",
 completed_text_zh: "Bản hoàn chỉnh",
 content: "Nội dung",
 content_vi: "Nội dung",
 correct: "Đúng",
 correct_examples: "Câu đúng",
 correct_sentence: "Câu đúng",
 culture_note: "Văn hóa / ghi chú",
 culture_note_vi: "Văn hóa / ghi chú",
 data: "Dữ liệu",
 dialogue: "Hội thoại",
 dialogues: "Hội thoại",
 explanation_vi: "Giải thích",
 full_text_answer_reference: "Đáp án toàn bài",
 generated_comprehension_questions: "Câu hỏi đọc hiểu",
 grammar_highlights: "Điểm ngữ pháp trong bài",
 instruction: "Yêu cầu",
 instruction_vi: "Yêu cầu",
 items: "Mục",
 left_items: "Cột A",
 model: "Mẫu",
 model_a: "Mẫu A",
 model_b: "Mẫu B",
 models: "Mẫu",
 notes: "Ghi chú",
 notes_vi: "Ghi chú",
 note_vi: "Ghi chú",
 parts: "Phần",
 passage: "Đoạn văn",
 passage_text: "Đoạn văn",
 passage_with_blanks: "Đoạn văn điền khuyết",
 pattern: "Cấu trúc",
 patterns: "Mẫu luyện",
 prompt: "Câu hỏi",
 questions: "Câu hỏi",
 retell_key_points: "Ý chính kể lại",
 retell_outline: "Dàn ý kể lại",
 retell_prompts: "Gợi ý kể lại",
 right_items: "Cột B",
 sample_answer: "Đáp án mẫu",
 sample_retell: "Bài kể mẫu",
 sample_retell_generated: "Bài kể mẫu",
 sample_retelling: "Bài kể mẫu",
 situations: "Tình huống",
 structure: "Cấu trúc",
 suggested_answers: "Đáp án gợi ý",
 supplement_vocab: "Từ bổ sung",
 supplemental_vocab: "Từ bổ sung",
 supplementary_vocab: "Từ bổ sung",
 supplementary_vocabulary: "Từ bổ sung",
 supplementary_words: "Từ bổ sung",
 text: "Nội dung",
 text_with_blanks: "Nội dung điền khuyết",
 translation_vi: "Dịch nghĩa",
 word_bank: "Từ cho sẵn",
 wrong: "Sai",
 wrong_examples: "Câu sai",
 wrong_sentence: "Câu sai",
};

const GENERIC_FIELD_ORDER = [
 "structure",
 "pattern",
 "content_vi",
 "content",
 "instruction",
 "instruction_vi",
 "prompt",
 "text",
 "questions",
 "word_bank",
 "choices",
 "answer",
 "answers",
 "answer_key",
 "full_text_answer_reference",
 "sample_answer",
 "suggested_answers",
 "completed_text",
 "completed_text_zh",
 "completed_passage",
 "wrong",
 "wrong_sentence",
 "correct",
 "correct_sentence",
 "explanation_vi",
 "note_vi",
 "notes_vi",
 "notes",
 "translation_vi",
 "supplementary_words",
 "supplementary_vocab",
 "supplementary_vocabulary",
 "supplement_vocab",
 "parts",
 "items",
];

const BASE_HIDDEN_GENERIC_FIELDS = new Set([
 "id",
 "type",
 "variant",
 "order",
 "title",
 "title_vi",
 "hanzi",
 "pinyin",
 "meaning_vi",
 "meaning_en",
 "vi",
 "zh",
 "function_vi",
 "lines",
 "dialogue",
 "examples",
 "practice_tasks",
 "grammar_refs",
 "vocab_refs",
 "source_refs",
 "source_origin",
 "audio_key",
 "check_needed",
 "answer_verified",
 "answer_origin",
 "answer_mapping",
 "grading",
 "mapping_confidence",
 "official_answer_group",
 "official_answer_source",
 "external_solution_source",
 "required_grammar_ref",
 "requires_source_visual",
 "source_assets",
 "source_page",
 "source_pages",
 "source_ref",
 "source_role",
 "transcription_status",
 "verification_status",
]);

const PASSAGE_HANDLED_FIELDS = new Set([
 "passage",
 "passage_text",
 "passage_with_blanks",
 "passage_blanked",
 "passage_complete",
 "text_with_blanks",
 "cloze_text",
 "paragraphs",
 "segments",
 "blanks",
 "answers",
 "answer_key",
 "cloze_answers",
 "completed_paragraphs",
 "completed_passage",
 "completed_text",
 "completed_text_zh",
 "supplementary_words",
 "supplementary_vocab",
 "supplementary_vocabulary",
 "supplement_vocab",
 "supplemental_vocab",
 "word_bank",
 "rendering",
]);

export function getFieldLabel(key: string) {
 return FIELD_LABELS[key] || key.replaceAll("_", " ");
}

export function getRenderableFields(
 item: JsonObject,
 options: { hasPassage?: boolean } = {},
): RenderableField[] {
 const hiddenFields = new Set(BASE_HIDDEN_GENERIC_FIELDS);

 if (options.hasPassage) {
  PASSAGE_HANDLED_FIELDS.forEach((key) => hiddenFields.add(key));
 }

 const orderedKeys = [
  ...GENERIC_FIELD_ORDER,
  ...Object.keys(item).filter((key) => !GENERIC_FIELD_ORDER.includes(key)),
 ];

 return orderedKeys
  .filter((key, index) => orderedKeys.indexOf(key) === index)
  .filter((key) => !key.startsWith("source_"))
  .filter((key) => !hiddenFields.has(key))
  .map((key) => ({ key, label: getFieldLabel(key), value: item[key] }))
  .filter((field) => hasRenderableValue(field.value));
}

export function hasRenderableValue(value: JsonFieldValue): boolean {
 if (typeof value === "string") return Boolean(value.trim());
 if (typeof value === "number" || typeof value === "boolean") return true;
 if (Array.isArray(value)) return value.some(hasRenderableValue);

 const record = asRecord(value);

 return Object.keys(record).length > 0 && Object.values(record).some(hasRenderableValue);
}

export function primaryTextFromRecord(record: JsonObject) {
 return (
  stringValue(record, "title_vi") ||
  stringValue(record, "title") ||
  stringValue(record, "hanzi") ||
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  stringValue(record, "prompt") ||
  stringValue(record, "question") ||
  stringValue(record, "statement") ||
  stringValue(record, "answer") ||
  stringValue(record, "sample_answer")
 );
}

export function fieldFallbackText(value: JsonFieldValue) {
 return answerToString(value);
}
