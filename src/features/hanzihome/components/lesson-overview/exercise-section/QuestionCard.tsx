import type { JsonFieldValue } from "@/types/json";
import { ExerciseQuestionCard, hasRenderableValue } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { QuestionChoiceList } from "./QuestionChoiceList";
import { QuestionDataBlock } from "./QuestionDataBlock";
import { fillQuestionBlank } from "./exercise-utils";
import { buildExerciseQuestionViewModel } from "./question-view-model";

export function QuestionCard({
 itemId,
 exerciseType,
 questionValue,
 index,
 displayMode,
 answerOverride,
}: {
 itemId: string;
 exerciseType: string;
 questionValue: JsonFieldValue;
 index: number;
 displayMode: LessonDisplayMode;
 answerOverride?: JsonFieldValue;
}) {
 const model = buildExerciseQuestionViewModel({
  exerciseType,
  value: questionValue,
  index,
  answerOverride,
 });
 const titleWhenAnswerOpen = fillQuestionBlank(model.title, model.answer);

 const hasExtra =
  hasRenderableValue(model.context) ||
  hasRenderableValue(model.cue) ||
  hasRenderableValue(model.target) ||
  hasRenderableValue(model.left) ||
  hasRenderableValue(model.right) ||
  model.dialogue.length > 0 ||
  model.givenWords.length > 0 ||
  model.choices.length > 0 ||
  hasRenderableValue(model.statement) ||
  hasRenderableValue(model.evidence);

 return (
  <ExerciseQuestionCard
   key={model.id || `${itemId}-${index}`}
   index={index + 1}
   title={model.title}
   titleWhenAnswerOpen={titleWhenAnswerOpen || undefined}
   answer={model.answer}
   showAnswer={displayMode.showAnswers}
   note={model.note}
   meaning={model.meaning || undefined}
   displayMode={displayMode}
  >
   {hasExtra && (
    <div className="grid gap-2">
     <QuestionDataBlock title="Ngữ cảnh" value={model.context} displayMode={displayMode} />

     <QuestionDataBlock title="Hội thoại" value={model.dialogue} displayMode={displayMode} />

     <QuestionDataBlock title="Từ/cụm cho sẵn" value={model.givenWords} displayMode={displayMode} />

     <QuestionDataBlock title="Câu gốc / Gợi ý" value={model.cue} displayMode={displayMode} />

     <QuestionDataBlock title="A" value={model.left} displayMode={displayMode} />

     <QuestionDataBlock title="B" value={model.right} displayMode={displayMode} />

     <QuestionDataBlock title="Câu cần hoàn thành" value={model.target} displayMode={displayMode} />

     <QuestionChoiceList values={model.choices} displayMode={displayMode} />

     <QuestionDataBlock title="Nhận định" value={model.statement} displayMode={displayMode} />

     <QuestionDataBlock title="Dẫn chứng" value={model.evidence} displayMode={displayMode} />
    </div>
   )}

   {model.requiresSourceVisual && (
    <div className="rounded-xl border border-warning/30 bg-warning-subtle px-3 py-2 text-sm font-semibold text-warning-text">
     Nội dung OCR chưa đủ tin cậy. Hãy đối chiếu trang gốc
     {model.sourcePrintedPages.length > 0 ? ` ${model.sourcePrintedPages.join(", ")}` : " của bài"}.
    </div>
   )}
  </ExerciseQuestionCard>
 );
}
