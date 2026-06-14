import { EditableNodeWrapper, type DraftPatchPath } from "@/features/hanzihome/editing";

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
}: {
 lessonId?: string;
 itemPath?: DraftPatchPath;
 itemId: string;
 answers: unknown[];
 sourceKey: string;
 leftItems: unknown[];
 rightItems: unknown[];
}) {
 if (answers.length === 0) return null;

 return (
  <details className="rounded-xl border border-accent/30 bg-accent-subtle p-3">
   <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-accent-text">
    Đáp án nối câu
   </summary>

   <div className="mt-3 grid gap-2">
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
      <div className="rounded-lg bg-bg-primary px-3 py-2">
       <p className=" font-black text-accent-text">
        {answer.leftLabel} → {answer.rightLabel}
       </p>

       {(answer.leftText || answer.rightText) && (
        <p className="mt-1  font-semibold leading-relaxed text-text-secondary">
         {answer.leftText}
         {answer.leftText && answer.rightText && " → "}
         {answer.rightText}
        </p>
       )}

       {answer.explanation && (
        <p className="mt-1 text-xs font-semibold text-text-muted">{answer.explanation}</p>
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
  </details>
 );
}
