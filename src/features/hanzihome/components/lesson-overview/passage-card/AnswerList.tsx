import type { ClozeAnswer } from "./types";

export function AnswerList({
 answers,
 open,
 onOpenChange,
}: {
 answers: ClozeAnswer[];
 open: boolean;
 onOpenChange: (open: boolean) => void;
}) {
 if (answers.length === 0) return null;

 return (
  <div className="exercise-answer-surface rounded-lg border">
   <button
    type="button"
    className="w-full cursor-pointer px-3 py-2 text-left text-xs font-black uppercase tracking-wide text-accent-text"
    aria-expanded={open}
    onClick={() => onOpenChange(!open)}
   >
    Xem đáp án ({answers.length})
   </button>
   {open && (
    <div className="grid gap-1 border-t border-border-default px-3 py-2">
     {answers.map((answer) => (
      <p key={answer.key} className=" font-bold text-accent-text">
       {answer.label}: {answer.answer}
       {answer.pinyin && ` · ${answer.pinyin}`}
       {answer.note && ` — ${answer.note}`}
      </p>
     ))}
    </div>
   )}
  </div>
 );
}
