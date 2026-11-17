import { Fragment } from "react";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/display/typography";
import type { JsonFieldValue } from "@/types/json";

import { AnswerKeyList, LooseItemGrid } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { answerToString, arrayValue, asRecord, nonEmptyStrings, stringValue } from "../utils";
import { QuestionCard } from "./QuestionCard";
import { WordBank } from "./WordBank";

export function QuestionGroupCard({
 itemId,
 exerciseType,
 groupValue,
 index,
 fallbackTitle,
 displayMode,
}: {
 itemId: string;
 exerciseType: string;
 groupValue: JsonFieldValue;
 index: number;
 fallbackTitle: string;
 displayMode: LessonDisplayMode;
}) {
 const group = asRecord(groupValue);
 const title =
  stringValue(group, "title_vi") ||
  stringValue(group, "title") ||
  stringValue(group, "label") ||
  fallbackTitle;
 const wordBank = arrayValue(group, "word_bank");
 const questions = arrayValue(group, "questions");
 const answerSourceKey = arrayValue(group, "answers").length > 0 ? "answers" : "answer_key";
 const answers = arrayValue(group, answerSourceKey);
 const sentences = arrayValue(group, "sentences");
 const partEntries = Object.entries(asRecord(group.parts)).map(([label, text]) => ({
  id: label,
  text: `${label}. ${answerToString(text)}`,
 }));
 const orderedAnswer =
  nonEmptyStrings(arrayValue(group, "answer_order")).join(" → ") ||
  stringValue(group, "sample_text") ||
  stringValue(group, "answer");
 const note = stringValue(group, "explanation_vi") || stringValue(group, "note_vi");

 return (
  <div className="exercise-card-surface grid gap-3 rounded-xl border p-3">
   <div>
    <Typography as="h5" variant="cardTitle" tone="default" weight="black">
     {index + 1}. {title}
    </Typography>
    {note && (
     <StudyInstructionText tone="muted" weight="semibold">
      {note}
     </StudyInstructionText>
    )}
   </div>

   <WordBank values={wordBank} displayMode={displayMode} />

   {questions.length > 0 && (
    <div className="grid gap-2">
     {questions.map((questionValue, questionIndex) => {
      const questionId =
       stringValue(asRecord(questionValue), "id") || `${itemId}-question-${questionIndex}`;
      const content = (
       <QuestionCard
        itemId={itemId}
        exerciseType={exerciseType}
        questionValue={questionValue}
        index={questionIndex}
        displayMode={displayMode}
        answerOverride={answers[questionIndex]}
       />
      );

      return <Fragment key={questionId}>{content}</Fragment>;
     })}
    </div>
   )}

   {sentences.length > 0 && <LooseItemGrid items={sentences} displayMode={displayMode} />}

   {partEntries.length > 0 && <LooseItemGrid items={partEntries} displayMode={displayMode} />}

   {orderedAnswer && (
    <AnswerKeyList
     defaultOpen={displayMode.showAnswers}
     itemId={`${itemId}-ordered-answer`}
     values={[orderedAnswer]}
    />
   )}

   {questions.length === 0 && answers.length > 0 && !orderedAnswer && (
    <AnswerKeyList
     defaultOpen={displayMode.showAnswers}
     itemId={`${itemId}-answers`}
     values={answers}
    />
   )}
  </div>
 );
}
