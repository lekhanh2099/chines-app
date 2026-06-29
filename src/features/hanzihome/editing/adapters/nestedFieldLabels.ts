type NestedPath = Array<string | number>;

const fieldLabels: Record<string, string> = {
 answer: "Đáp án",
 answer_key: "Đáp án tổng",
 answer_mode: "Chế độ đáp án",
 audio_key: "Audio key",
 blank_id: "Mã chỗ trống",
 check_needed: "Cần kiểm tra",
 choices: "Lựa chọn",
 comprehension_questions: "Câu hỏi đọc hiểu",
 correct_sentence: "Câu đúng",
 dialogue: "Hội thoại",
 dialogues: "Nhóm hội thoại",
 difficulty: "Độ khó",
 explanation_vi: "Giải thích tiếng Việt",
 function: "Chức năng",
 function_vi: "Chức năng tiếng Việt",
 grammar_refs: "Tham chiếu ngữ pháp",
 instruction_vi: "Hướng dẫn tiếng Việt",
 left: "Vế trái",
 lines: "Dòng",
 model: "Mẫu",
 notes: "Ghi chú",
 pattern: "Công thức",
 pinyin: "Pinyin",
 practice_tasks: "Bài luyện tập",
 prompt: "Đề bài",
 questions: "Câu hỏi",
 response_prompt: "Gợi ý trả lời",
 right: "Vế phải",
 sample_answer: "Đáp án mẫu",
 sample_answers: "Đáp án mẫu",
 scenes: "Cảnh",
 skill_focus: "Kỹ năng",
 speaker: "Người nói",
 summary_vi: "Tóm tắt tiếng Việt",
 text: "Nội dung",
 title: "Tiêu đề tiếng Trung",
 title_vi: "Tiêu đề tiếng Việt",
 variant: "Variant",
 vi: "Nghĩa tiếng Việt",
 vocab_refs: "Tham chiếu từ vựng",
 word_bank: "Từ cho sẵn",
 wrong_sentence: "Câu sai",
 zh: "Tiếng Trung",
};

const collectionLabels: Record<string, string> = {
 answer_key: "Đáp án",
 choices: "Lựa chọn",
 dialogue: "Hội thoại",
 dialogues: "Hội thoại",
 items: "Mục",
 lines: "Dòng",
 paragraphs: "Đoạn",
 parts: "Phần",
 practice_tasks: "Bài luyện",
 questions: "Câu hỏi",
 sample_answers: "Đáp án mẫu",
 scenes: "Cảnh",
};

const defaultHiddenFieldNames = new Set([
 "audio_key",
 "audio_keys",
 "answer_verified",
 "check_needed",
 "en",
 "grammar_refs",
 "meaning_en",
 "source_origin",
 "source_refs",
 "vocab_refs",
]);

function nearestCollection(path: NestedPath) {
 for (let index = path.length - 1; index >= 0; index -= 1) {
  if (typeof path[index] === "number" && typeof path[index - 1] === "string") {
   return {
    key: String(path[index - 1]),
    index: Number(path[index]) + 1,
    position: index,
   };
  }
 }
 return null;
}

export function nestedFieldLabel(path: NestedPath) {
 const last = path.at(-1);
 if (typeof last !== "string") return "Giá trị";
 return fieldLabels[last] ?? last.replaceAll("_", " ");
}

export function nestedFieldGroup(path: NestedPath) {
 const collection = nearestCollection(path);
 if (!collection) return "Thông tin chung";

 const parentCollection = nearestCollection(path.slice(0, collection.position - 1));
 const current = `${collectionLabels[collection.key] ?? collection.key} ${collection.index}`;
 if (!parentCollection) return current;

 return `${collectionLabels[parentCollection.key] ?? parentCollection.key} ${
  parentCollection.index
 } · ${current}`;
}

export function nestedFieldKind(path: NestedPath, value: unknown, inferredKind: string) {
 const last = path.at(-1);
 if (
  inferredKind === "text" &&
  typeof value === "string" &&
  (["zh", "vi", "text", "prompt", "answer", "explanation_vi", "summary_vi"].includes(
   String(last),
  ) ||
   value.length > 80)
 ) {
  return "textarea" as const;
 }
 return inferredKind as "text" | "textarea" | "string-list" | "number" | "boolean" | "json";
}

export function nestedFieldRequired(path: NestedPath, value: unknown) {
 const last = path.at(-1);
 return (
  typeof value === "string" &&
  value.length > 0 &&
  ["answer", "correct_sentence", "prompt", "text", "title", "wrong_sentence", "zh"].includes(
   String(last),
  )
 );
}

export function nestedFieldDefaultVisible(path: NestedPath) {
 const last = path.at(-1);
 return typeof last !== "string" || !defaultHiddenFieldNames.has(last);
}
