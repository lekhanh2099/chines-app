import type { ComponentType } from "react";

import { CharacterWritingForm } from "./components/forms/CharacterWritingForm";
import { ExerciseAnswerKeyForm } from "./components/forms/ExerciseAnswerKeyForm";
import { ExerciseClozeAnswerForm } from "./components/forms/ExerciseClozeAnswerForm";
import { ExerciseClozeSegmentForm } from "./components/forms/ExerciseClozeSegmentForm";
import { ExerciseDialogueLineForm } from "./components/forms/ExerciseDialogueLineForm";
import { ExerciseMatchingItemForm } from "./components/forms/ExerciseMatchingItemForm";
import { ExerciseMetadataForm } from "./components/forms/ExerciseMetadataForm";
import { ExerciseQuestionForm } from "./components/forms/ExerciseQuestionForm";
import { ExerciseWordBankForm } from "./components/forms/ExerciseWordBankForm";
import { GrammarBlockForm } from "./components/forms/GrammarBlockForm";
import { GrammarBlockItemForm } from "./components/forms/GrammarBlockItemForm";
import { GrammarExampleForm } from "./components/forms/GrammarExampleForm";
import { GrammarFormulaForm } from "./components/forms/GrammarFormulaForm";
import { GrammarPointForm } from "./components/forms/GrammarPointForm";
import { LessonInfoForm } from "./components/forms/LessonInfoForm";
import type { NodeFormProps } from "./components/forms/createNodeForm";
import { ProperNounForm } from "./components/forms/ProperNounForm";
import { ReadingItemForm } from "./components/forms/ReadingItemForm";
import { ReadingQuestionForm } from "./components/forms/ReadingQuestionForm";
import { SectionMetadataForm } from "./components/forms/SectionMetadataForm";
import { TextBlockForm } from "./components/forms/TextBlockForm";
import { TextLineForm } from "./components/forms/TextLineForm";
import { TextParagraphForm } from "./components/forms/TextParagraphForm";
import { VocabDetailSectionForm } from "./components/forms/VocabDetailSectionForm";
import { VocabExampleForm } from "./components/forms/VocabExampleForm";
import { VocabItemForm } from "./components/forms/VocabItemForm";
import type { EditableEntityType } from "./store/types";

type EditRegistryEntry = {
 title: string;
 description: string;
 Form: ComponentType<NodeFormProps>;
};

export const editRegistry: Record<EditableEntityType, EditRegistryEntry> = {
 lesson: {
  title: "Sửa thông tin bài học",
  description: "Chỉnh metadata của bài học và lưu trực tiếp vào Supabase.",
  Form: LessonInfoForm,
 },
 section: {
  title: "Sửa đề mục",
  description: "Chỉnh metadata hiển thị của đề mục.",
  Form: SectionMetadataForm,
 },
 vocab_item: {
  title: "Sửa từ vựng",
  description: "Chỉnh nội dung của một mục từ vựng.",
  Form: VocabItemForm,
 },
 vocab_example: {
  title: "Sửa ví dụ từ vựng",
  description: "Chỉnh một ví dụ đang render trong mục từ.",
  Form: VocabExampleForm,
 },
 vocab_detail_section: {
  title: "Sửa chi tiết từ vựng",
  description: "Chỉnh một dòng chi tiết hoặc kết hợp thường gặp.",
  Form: VocabDetailSectionForm,
 },
 proper_noun: {
  title: "Sửa tên riêng",
  description: "Chỉnh tên riêng và nghĩa hiển thị.",
  Form: ProperNounForm,
 },
 character_writing_item: {
  title: "Sửa chữ luyện viết",
  description: "Chỉnh chữ Hán, pinyin và bộ thủ.",
  Form: CharacterWritingForm,
 },
 grammar_point: {
  title: "Sửa điểm ngữ pháp",
  description: "Chỉnh metadata của điểm ngữ pháp.",
  Form: GrammarPointForm,
 },
 grammar_detail_section: {
  title: "Sửa chi tiết ngữ pháp",
  description: "Chỉnh tiêu đề và các dòng nội dung của phần chi tiết.",
  Form: GrammarBlockForm,
 },
 grammar_block: {
  title: "Sửa block ngữ pháp",
  description: "Chỉnh nội dung, công thức và ghi chú của block.",
  Form: GrammarBlockForm,
 },
 grammar_formula: {
  title: "Sửa công thức",
  description: "Chỉnh nhãn và mẫu công thức.",
  Form: GrammarFormulaForm,
 },
 grammar_example: {
  title: "Sửa ví dụ ngữ pháp",
  description: "Chỉnh câu, pinyin, nghĩa và refs.",
  Form: GrammarExampleForm,
 },
 grammar_block_item: {
  title: "Sửa mục trong block",
  description: "Chỉnh nội dung so sánh hoặc lỗi sai.",
  Form: GrammarBlockItemForm,
 },
 exercise: {
  title: "Sửa metadata bài tập",
  description: "Chỉnh tiêu đề, variant và độ khó.",
  Form: ExerciseMetadataForm,
 },
 exercise_question: {
  title: "Sửa câu hỏi",
  description: "Chỉnh đề bài, đáp án và giải thích.",
  Form: ExerciseQuestionForm,
 },
 exercise_matching_item: {
  title: "Sửa mục nối cặp",
  description: "Chỉnh một item ở cột nối cặp.",
  Form: ExerciseMatchingItemForm,
 },
 exercise_answer_key: {
  title: "Sửa đáp án",
  description: "Chỉnh một mục trong answer key.",
  Form: ExerciseAnswerKeyForm,
 },
 exercise_word_bank: {
  title: "Sửa từ cho sẵn",
  description: "Mỗi dòng là một từ trong word bank.",
  Form: ExerciseWordBankForm,
 },
 exercise_dialogue_line: {
  title: "Sửa dòng hội thoại",
  description: "Chỉnh người nói và nội dung dòng.",
  Form: ExerciseDialogueLineForm,
 },
 exercise_cloze_segment: {
  title: "Sửa cloze segment",
  description: "Chỉnh đoạn văn hoặc blank id.",
  Form: ExerciseClozeSegmentForm,
 },
 exercise_cloze_answer: {
  title: "Sửa đáp án cloze",
  description: "Chỉnh đáp án cho một blank.",
  Form: ExerciseClozeAnswerForm,
 },
 reading_item: {
  title: "Sửa bài đọc",
  description: "Chỉnh metadata và nội dung bài đọc.",
  Form: ReadingItemForm,
 },
 reading_question: {
  title: "Sửa câu hỏi đọc hiểu",
  description: "Chỉnh câu hỏi, đáp án và giải thích.",
  Form: ReadingQuestionForm,
 },
 text_block: {
  title: "Sửa block bài khóa",
  description: "Chỉnh tiêu đề và toàn bộ field của block bài khóa.",
  Form: TextBlockForm,
 },
 text_line: {
  title: "Sửa dòng hội thoại",
  description: "Chỉnh người nói, câu, pinyin, nghĩa và refs.",
  Form: TextLineForm,
 },
 text_paragraph: {
  title: "Sửa đoạn bài khóa",
  description: "Chỉnh câu, pinyin, nghĩa và refs của đoạn.",
  Form: TextParagraphForm,
 },
};
