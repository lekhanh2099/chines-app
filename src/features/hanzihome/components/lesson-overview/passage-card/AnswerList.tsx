import type { ClozeAnswer } from "./types";

export function AnswerList({ answers }: { answers: ClozeAnswer[] }) {
 if (answers.length === 0) return null;

 return (
  <details className="rounded-lg border border-accent/25 bg-bg-primary">
   <summary className="cursor-pointer list-none px-3 py-2 text-xs font-black uppercase tracking-wide text-accent-text marker:hidden">
    Xem đáp án ({answers.length})
   </summary>
   <div className="grid gap-1 border-t border-accent/20 bg-accent-subtle/55 px-3 py-2">
    {answers.map((answer) => (
     <p key={answer.key} className=" font-bold text-accent-text">
      {answer.label}: {answer.answer}
      {answer.pinyin && ` · ${answer.pinyin}`}
      {answer.note && ` — ${answer.note}`}
     </p>
    ))}
   </div>
  </details>
 );
}
