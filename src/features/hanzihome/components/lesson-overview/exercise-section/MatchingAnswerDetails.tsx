import { Fragment } from "react";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonValue } from "@/types/json";

import { AnswerReveal } from "../CommonCards";
import { asRecord, stringValue } from "../utils";
import { matchingAnswerText } from "./matching-answer-utils";

export function MatchingAnswerDetails({
 itemId,
 answers,
 leftItems,
 rightItems,
 showAnswers = false,
}: {
 itemId: string;
 answers: JsonValue[];
 leftItems: JsonValue[];
 rightItems: JsonValue[];
 showAnswers?: boolean;
}) {
 if (answers.length === 0) return null;

 return (
  <AnswerReveal defaultOpen={showAnswers} label="Đáp án nối câu">
   <div className="grid gap-2">
    {answers.map((answerValue, index) => {
     const answer = matchingAnswerText({
      answerValue,
      index,
      leftItems,
      rightItems,
     });
     const answerRecord = asRecord(answerValue);
     const answerId = stringValue(answerRecord, "id") || answer.id;
     const content = (
      <div className="rounded-lg bg-bg-primary px-3 py-2 grid gap-1">
       <StudyInstructionText tone="accent" weight="black">
        {answer.leftLabel} → {answer.rightLabel}
       </StudyInstructionText>

       {(answer.leftText || answer.rightText) && (
        <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed">
         {answer.leftText}
         {answer.leftText && answer.rightText && " → "}
         {answer.rightText}
        </StudyInstructionText>
       )}

       {answer.explanation && (
        <StudyInstructionText variant="caption" tone="muted" weight="semibold">
         {answer.explanation}
        </StudyInstructionText>
       )}
      </div>
     );

     return <Fragment key={`${itemId}-matching-answer-${answerId}-${index}`}>{content}</Fragment>;
    })}
   </div>
  </AnswerReveal>
 );
}
