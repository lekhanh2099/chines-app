import { ExerciseQuestionCard, hasRenderableValue } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";
import { QuestionChoiceList } from "./QuestionChoiceList";
import { QuestionDataBlock } from "./QuestionDataBlock";
import {
 answerFromRecord,
 firstTextByKeys,
 formatAnswer,
 objectText,
 promptFromQuestionRecord,
} from "./exercise-utils";

export function QuestionCard({
 itemId,
 questionValue,
 index,
 displayMode,
 answerOverride,
}: {
 itemId: string;
 questionValue: unknown;
 index: number;
 displayMode: LessonDisplayMode;
 answerOverride?: unknown;
}) {
 if (
  typeof questionValue === "string" ||
  typeof questionValue === "number" ||
  typeof questionValue === "boolean"
 ) {
  return (
   <ExerciseQuestionCard
    key={`${itemId}-${index}`}
    index={index + 1}
    title={String(questionValue)}
    answer={formatAnswer(answerOverride)}
   />
  );
 }

 const question = asRecord(questionValue);

 const choices = arrayValue(question, "choices");
 const title = promptFromQuestionRecord(question);
 const answer = formatAnswer(answerOverride) || answerFromRecord(question);

 const note =
  stringValue(question, "explanation_vi") ||
  stringValue(question, "note_vi") ||
  objectText(question.evidence, ["quote"]);

 const contextText = firstTextByKeys(question, [
  "context",
  "context_zh",
  "situation",
  "situation_zh",
  "scenario",
  "scenario_zh",
 ]);

 const contextVi = firstTextByKeys(question, [
  "context_vi",
  "situation_vi",
  "scenario_vi",
  "prompt_pinyin",
  "answer_pinyin",
  "sample_answer_pinyin",
  "suggested_answer_pinyin",
 ]);

 const cueText = firstTextByKeys(question, [
  "cue",
  "cue_zh",
  "given",
  "given_zh",
  "given_sentence",
  "source",
  "source_zh",
  "source_sentence",
  "original",
  "original_zh",
  "original_sentence",
  "base_sentence",
 ]);

 const targetText = firstTextByKeys(question, [
  "target",
  "target_zh",
  "target_sentence",
  "expected",
  "expected_zh",
  "completed",
  "completed_sentence",
  "sample_answer_vi",
  "suggested_answer_vi",
 ]);

 const leftText = firstTextByKeys(question, ["a", "A", "left", "left_text"]);
 const rightText = firstTextByKeys(question, ["b", "B", "right", "right_text"]);

 const hasExtra =
  Boolean(contextText) ||
  Boolean(contextVi) ||
  Boolean(cueText) ||
  Boolean(targetText) ||
  Boolean(leftText) ||
  Boolean(rightText) ||
  choices.length > 0 ||
  hasRenderableValue(question.statement) ||
  hasRenderableValue(question.evidence);

 return (
  <ExerciseQuestionCard
   key={stringValue(question, "id") || `${itemId}-${index}`}
   index={index + 1}
   title={title}
   answer={answer}
   note={note}
   meaning={question?.answer_vi as string | undefined}
  >
   {hasExtra && (
    <div className="grid gap-2">
     <QuestionDataBlock
      title="Ngữ cảnh"
      value={contextText || contextVi}
      displayMode={displayMode}
     />

     <QuestionDataBlock title="Câu gốc / Gợi ý" value={cueText} displayMode={displayMode} />

     <QuestionDataBlock title="A" value={leftText} displayMode={displayMode} />

     <QuestionDataBlock title="B" value={rightText} displayMode={displayMode} />

     <QuestionDataBlock title="Câu cần hoàn thành" value={targetText} displayMode={displayMode} />

     <QuestionChoiceList values={choices} />

     <QuestionDataBlock title="Statement" value={question.statement} displayMode={displayMode} />

     <QuestionDataBlock title="Dẫn chứng" value={question.evidence} displayMode={displayMode} />
    </div>
   )}
  </ExerciseQuestionCard>
 );
}
