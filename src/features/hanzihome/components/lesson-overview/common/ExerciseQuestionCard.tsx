import type { ReactNode } from "react";

import { AnswerReveal } from "./AnswerReveal";

export function ExerciseQuestionCard({
 index,
 title,
 answer,
 note,
 children,
 meaning,
}: {
 index: number;
 title: string;
 answer?: string;
 note?: string;
 children?: ReactNode;
 meaning?: string;
}) {
 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-primary/75 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.45)] sm:p-4">
   <div className="flex items-start gap-3">
    <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-accent-subtle px-2 text-xs font-black text-accent-text">
     {index}
    </span>
    <p className="min-w-0 pt-0.5 font-black leading-6 text-text-primary">{title}</p>
   </div>
   {answer && (
    <AnswerReveal>
     <p className=" font-bold text-accent-text">{answer}</p>
     {note && <p className="text-xs font-semibold leading-relaxed text-text-muted">{note}</p>}
     {meaning && <p className="text-xs font-semibold leading-relaxed text-text-muted">{meaning}</p>}
    </AnswerReveal>
   )}
   {children ? <div className="pl-0 sm:pl-10">{children}</div> : null}
   {note && !answer && (
    <p className="text-xs font-semibold leading-relaxed text-text-muted">{note}</p>
   )}
  </div>
 );
}
