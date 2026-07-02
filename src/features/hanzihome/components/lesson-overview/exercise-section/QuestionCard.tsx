import { ExerciseQuestionCard, hasRenderableValue } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { QuestionChoiceList } from "./QuestionChoiceList";
import { QuestionDataBlock } from "./QuestionDataBlock";
import { buildExerciseQuestionViewModel } from "./question-view-model";

const BLANK_RUN_PATTERN = /[_＿]{2,}|-{3,}|—{2,}|…{2,}|\.\.\.+/;
const PUNCTUATION_PATTERN = /[。！？!?.,，；;]/;
const TRAILING_PUNCTUATION_PATTERN = /[。！？!?.,，；;]+$/;

function fillQuestionBlank(title: string, answer: string) {
 if (!title || !answer || !BLANK_RUN_PATTERN.test(title)) return "";

 return title.replace(BLANK_RUN_PATTERN, (blank, offset: number, source: string) => {
  const nextCharacter = source[offset + blank.length] ?? "";
  const inlineAnswer = PUNCTUATION_PATTERN.test(nextCharacter)
   ? answer.replace(TRAILING_PUNCTUATION_PATTERN, "")
   : answer;

  return inlineAnswer;
 });
}

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
 questionValue: unknown;
 index: number;
 displayMode: LessonDisplayMode;
 answerOverride?: unknown;
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

     <QuestionChoiceList values={model.choices} />

     <QuestionDataBlock title="Nhận định" value={model.statement} displayMode={displayMode} />

     <QuestionDataBlock title="Dẫn chứng" value={model.evidence} displayMode={displayMode} />
    </div>
   )}
  </ExerciseQuestionCard>
 );
}
