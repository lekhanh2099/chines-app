"use client";

import { useState, type ReactNode } from "react";

import { AnswerReveal } from "./AnswerReveal";
import { AdaptiveStudyText, StudyInstructionText } from "../hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE, type LessonDisplayMode } from "../types";

export function ExerciseQuestionCard({
 index,
 title,
 titleWhenAnswerOpen,
 answer,
 showAnswer = false,
 note,
 children,
 meaning,
 displayMode = DEFAULT_LESSON_DISPLAY_MODE,
}: {
 index: number;
 title: string;
 titleWhenAnswerOpen?: string;
 answer?: string;
 showAnswer?: boolean;
 note?: string;
 children?: ReactNode;
 meaning?: string;
 displayMode?: LessonDisplayMode;
}) {
 const [manualAnswerOpen, setManualAnswerOpen] = useState(false);
 const answerOpen = showAnswer || manualAnswerOpen;
 const visibleTitle = answerOpen && titleWhenAnswerOpen ? titleWhenAnswerOpen : title;

 return (
  <div className="exercise-question-surface grid gap-2 rounded-lg border px-3 py-3 sm:px-4 sm:py-3.5">
   <div className="flex items-start gap-3">
    <StudyInstructionText
     variant="caption"
     weight="black"
     className="study-chip-accent flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg border px-2"
    >
     {index}
    </StudyInstructionText>
    <AdaptiveStudyText
     text={visibleTitle}
     displayMode={displayMode}
     tone="default"
     weight="black"
     leading="learner"
     wrapping="preWrap"
     className="min-w-0 pt-0.5"
    />
   </div>
   {answer && (
    <AnswerReveal open={answerOpen} onOpenChange={setManualAnswerOpen}>
     <AdaptiveStudyText
      text={answer}
      displayMode={displayMode}
      tone="accent"
      weight="bold"
      leading="learner"
      wrapping="preWrap"
     />
     {note && (
      <StudyInstructionText
       variant="caption"
       tone="muted"
       weight="semibold"
       leading="relaxed"
       wrapping="preWrap"
      >
       {note}
      </StudyInstructionText>
     )}
     {meaning && (
      <StudyInstructionText
       variant="caption"
       tone="muted"
       weight="semibold"
       leading="relaxed"
       wrapping="preWrap"
      >
       {meaning}
      </StudyInstructionText>
     )}
    </AnswerReveal>
   )}
   {children ? <div className="pl-0 sm:pl-10">{children}</div> : null}
   {note && !answer && (
    <StudyInstructionText
     variant="caption"
     tone="muted"
     weight="semibold"
     leading="relaxed"
     wrapping="preWrap"
    >
     {note}
    </StudyInstructionText>
   )}
  </div>
 );
}
