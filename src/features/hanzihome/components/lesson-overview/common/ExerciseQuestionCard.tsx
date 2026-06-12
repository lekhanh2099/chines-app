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
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="font-black text-text-primary">
    {index}. {title}
   </p>
   {answer && (
    <AnswerReveal>
     <p className=" font-bold text-accent-text">{answer}</p>
     {note && <p className="text-xs font-semibold leading-relaxed text-text-muted">{note}</p>}
     {meaning && <p className="text-xs font-semibold leading-relaxed text-text-muted">{meaning}</p>}
    </AnswerReveal>
   )}
   {children}
   {note && !answer && (
    <p className="text-xs font-semibold leading-relaxed text-text-muted">{note}</p>
   )}
  </div>
 );
}
