import { z } from "zod";

export const ExerciseRendererFamilySchema = z.enum([
 "phonetics",
 "substitution",
 "fill_blank",
 "answer_pattern",
 "correct_sentence",
 "multiple_choice",
 "dialogue",
 "communication",
 "matching",
 "reading",
 "reorder",
 "writing",
 "reference",
 "source_question",
 "generic",
]);
export type ExerciseRendererFamily = z.infer<typeof ExerciseRendererFamilySchema>;

export type ExerciseRendererMeta = {
 family: ExerciseRendererFamily;
 label: string;
};

const exerciseRendererRegistry: Record<string, ExerciseRendererMeta> = {
 phonetics: { family: "phonetics", label: "Ngữ âm" },
 read_aloud: { family: "phonetics", label: "Đọc thành tiếng" },
 substitution: { family: "substitution", label: "Thay thế" },
 substitution_drill: { family: "substitution", label: "Luyện thay thế" },
 choose_words_fill_blank: { family: "fill_blank", label: "Chọn từ điền chỗ trống" },
 fill_blank: { family: "fill_blank", label: "Điền chỗ trống" },
 complete_sentence: { family: "fill_blank", label: "Hoàn thành câu" },
 answer_questions: { family: "answer_pattern", label: "Trả lời câu hỏi" },
 answer_with_pattern: { family: "answer_pattern", label: "Trả lời theo mẫu" },
 grammar_practice: { family: "correct_sentence", label: "Luyện ngữ pháp" },
 grammar_practice_set: { family: "correct_sentence", label: "Luyện ngữ pháp" },
 sentence_transformation: { family: "correct_sentence", label: "Biến đổi câu" },
 correct_sentence: { family: "correct_sentence", label: "Sửa câu sai" },
 multiple_choice: { family: "multiple_choice", label: "Trắc nghiệm" },
 true_false: { family: "multiple_choice", label: "Đúng / sai" },
 classification: { family: "multiple_choice", label: "Phân loại" },
 translation: { family: "source_question", label: "Dịch câu" },
 generic: { family: "source_question", label: "Bài tập theo sách" },
 custom: { family: "source_question", label: "Bài tập theo tình huống" },
 open_ended: { family: "source_question", label: "Tự luận" },
 complete_dialogue: { family: "dialogue", label: "Hoàn thành hội thoại" },
 communication_dialogue: { family: "communication", label: "Hội thoại giao tiếp" },
 communication: { family: "communication", label: "Giao tiếp" },
 matching: { family: "matching", label: "Nối cặp" },
 reading_fill_blank: { family: "reading", label: "Đọc và điền khuyết" },
 reading_cloze: { family: "reading", label: "Điền khuyết tổng hợp" },
 reading_comprehension: { family: "reading", label: "Đọc hiểu" },
 reorder_sentence: { family: "reorder", label: "Sắp xếp câu" },
 writing: { family: "writing", label: "Luyện viết" },
 character_writing: { family: "reference", label: "Viết chữ Hán" },
};

const fallbackMeta: ExerciseRendererMeta = {
 family: "generic",
 label: "Bài tập",
};

export function getExerciseRendererMeta(type: string): ExerciseRendererMeta {
 return exerciseRendererRegistry[type] ?? fallbackMeta;
}
