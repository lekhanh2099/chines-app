import { ExerciseQuestionCard } from "../CommonCards";
import { arrayValue, asRecord, nonEmptyStrings, stringValue } from "../utils";

export function GrammarMicroPractice({ questions }: { questions: unknown[] }) {
 if (questions.length === 0) return null;

 return (
  <div className="grid gap-2">
   {questions.map((questionValue, index) => {
    const question = asRecord(questionValue);
    const answer =
     stringValue(question, "answer") ||
     stringValue(question, "sample_answer") ||
     nonEmptyStrings(arrayValue(question, "acceptable_answers")).join(" / ");
    const title =
     stringValue(question, "prompt") ||
     stringValue(question, "question") ||
     stringValue(question, "text") ||
     `Câu ${index + 1}`;

    return (
     <ExerciseQuestionCard
      key={stringValue(question, "id") || `${title}-${index}`}
      index={index + 1}
      title={title}
      answer={answer}
      note={stringValue(question, "explanation_vi")}
     />
    );
   })}
  </div>
 );
}
