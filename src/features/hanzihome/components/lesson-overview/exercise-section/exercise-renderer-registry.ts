export type ExerciseRendererFamily =
 | "phonetics"
 | "substitution"
 | "questions"
 | "dialogue"
 | "communication"
 | "matching"
 | "reading"
 | "reorder"
 | "writing"
 | "reference";

export type ExerciseRendererMeta = {
 family: ExerciseRendererFamily;
 label: string;
};

const exerciseRendererRegistry: Record<string, ExerciseRendererMeta> = {
 phonetics: { family: "phonetics", label: "Ngữ âm" },
 read_aloud: { family: "phonetics", label: "Đọc thành tiếng" },
 substitution: { family: "substitution", label: "Thay thế" },
 substitution_drill: { family: "substitution", label: "Luyện thay thế" },
 choose_words_fill_blank: { family: "questions", label: "Chọn từ điền chỗ trống" },
 fill_blank: { family: "questions", label: "Điền chỗ trống" },
 complete_sentence: { family: "questions", label: "Hoàn thành câu" },
 answer_questions: { family: "questions", label: "Trả lời câu hỏi" },
 correct_sentence: { family: "questions", label: "Sửa câu sai" },
 multiple_choice: { family: "questions", label: "Trắc nghiệm" },
 custom: { family: "questions", label: "Bài tập theo tình huống" },
 open_ended: { family: "questions", label: "Tự luận" },
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
 family: "questions",
 label: "Bài tập",
};

export function getExerciseRendererMeta(type: string): ExerciseRendererMeta {
 return exerciseRendererRegistry[type] ?? fallbackMeta;
}
