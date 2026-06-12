import { ExerciseQuestionCard } from "../CommonCards";
import { asRecord, stringValue } from "../utils";

export function GeneratedQuestions({ itemId, values }: { itemId: string; values: unknown[] }) {
 if (values.length === 0) return null;

 return (
  <div className="grid gap-2">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Câu hỏi đọc hiểu</p>
   {values.map((questionValue, index) => {
    const question = asRecord(questionValue);
    const title =
     stringValue(question, "question") ||
     stringValue(question, "prompt") ||
     stringValue(question, "zh") ||
     "Câu hỏi";
    const answer =
     stringValue(question, "answer") ||
     stringValue(question, "answer_zh") ||
     stringValue(question, "sample_answer");

    return (
     <ExerciseQuestionCard
      key={stringValue(question, "id") || `${itemId}-generated-question-${index}`}
      index={index + 1}
      title={title}
      answer={answer}
      note={stringValue(question, "explanation_vi") || stringValue(question, "note_vi")}
     />
    );
   })}
  </div>
 );
}
