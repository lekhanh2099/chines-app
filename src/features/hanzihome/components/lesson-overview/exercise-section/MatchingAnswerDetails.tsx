import type { JsonValue } from "@/types/json";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import { AnswerReveal } from "../CommonCards";
import { asRecord, stringValue } from "../utils";
import { matchingAnswerText } from "./matching-answer-utils";

export function MatchingAnswerDetails({
 lessonId,
 itemPath,
 itemId,
 answers,
 sourceKey,
 leftItems,
 rightItems,
 showAnswers = false,
}: {
 lessonId?: string;
 itemPath?: EditableNodePath;
 itemId: string;
 answers: JsonValue[];
 sourceKey: string;
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
       <p className=" font-black text-accent-text">
        {answer.leftLabel} → {answer.rightLabel}
       </p>

       {(answer.leftText || answer.rightText) && (
        <p className="font-semibold leading-relaxed text-text-secondary">
         {answer.leftText}
         {answer.leftText && answer.rightText && " → "}
         {answer.rightText}
        </p>
       )}

       {answer.explanation && (
        <p className="text-xs font-semibold text-text-muted">{answer.explanation}</p>
       )}
      </div>
     );

     return lessonId && itemPath ? (
      <EditableNodeWrapper
       key={`${itemId}-matching-answer-${answerId}-${index}`}
       lessonId={lessonId}
       entityType="exercise_answer_key"
       entityId={`${itemId}-matching-answer-${answerId}`}
       parentEntityType="exercise"
       parentEntityId={itemId}
       path={[...itemPath, sourceKey, index]}
       value={answerValue}
       label={`Đáp án nối câu ${index + 1}`}
      >
       {content}
      </EditableNodeWrapper>
     ) : (
      <div key={`${itemId}-matching-answer-${answerId}-${index}`}>{content}</div>
     );
    })}
   </div>
  </AnswerReveal>
 );
}
