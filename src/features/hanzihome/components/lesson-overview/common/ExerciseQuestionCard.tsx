"use client";

import { useState, type ReactNode } from "react";

import { AnswerReveal } from "./AnswerReveal";

export function ExerciseQuestionCard({
 index,
 title,
 titleWhenAnswerOpen,
 answer,
 showAnswer = false,
 note,
 children,
 meaning,
}: {
 index: number;
 title: string;
 titleWhenAnswerOpen?: string;
 answer?: string;
 showAnswer?: boolean;
 note?: string;
 children?: ReactNode;
 meaning?: string;
}) {
 const [manualAnswerOpen, setManualAnswerOpen] = useState(false);
 const answerOpen = showAnswer || manualAnswerOpen;
 const visibleTitle = answerOpen && titleWhenAnswerOpen ? titleWhenAnswerOpen : title;

 return (
  <div className="exercise-question-surface grid gap-2 rounded-lg border px-3 py-3 sm:px-4 sm:py-3.5">
   <div className="flex items-start gap-3">
    <span className="study-chip-accent flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg border px-2 text-xs font-black">
     {index}
    </span>
    <p className="min-w-0 whitespace-pre-wrap pt-0.5 font-black leading-6 text-text-primary">
     {visibleTitle}
    </p>
   </div>
   {answer && (
    <AnswerReveal open={answerOpen} onOpenChange={setManualAnswerOpen}>
     <p className="whitespace-pre-wrap font-bold text-accent-text">{answer}</p>
     {note && (
      <p className="whitespace-pre-wrap text-xs font-semibold leading-relaxed text-text-muted">
       {note}
      </p>
     )}
     {meaning && (
      <p className="whitespace-pre-wrap text-xs font-semibold leading-relaxed text-text-muted">
       {meaning}
      </p>
     )}
    </AnswerReveal>
   )}
   {children ? <div className="pl-0 sm:pl-10">{children}</div> : null}
   {note && !answer && (
    <p className="whitespace-pre-wrap text-xs font-semibold leading-relaxed text-text-muted">
     {note}
    </p>
   )}
  </div>
 );
}
