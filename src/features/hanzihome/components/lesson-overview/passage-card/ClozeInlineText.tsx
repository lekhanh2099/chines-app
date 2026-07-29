import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { ReactNode } from "react";

import type { ClozeAnswer } from "./types";
import { BLANK_MARKER_SOURCE, blankLabelToNumber, getBlankMarkerFromMatch } from "./passage-utils";

export function ClozeInlineText({
 showAnswers = false,
 text,
 answerMap,
}: {
 showAnswers?: boolean;
 text: string;
 answerMap: Map<string, ClozeAnswer>;
}) {
 const nodes: ReactNode[] = [];
 let lastIndex = 0;

 for (const match of text.matchAll(new RegExp(BLANK_MARKER_SOURCE, "g"))) {
  const marker = getBlankMarkerFromMatch(match);
  const matchText = match[0];
  const matchIndex = match.index ?? 0;
  const blankNumber = blankLabelToNumber(marker);
  const label = blankNumber ? `${blankNumber}` : marker;
  const answer = answerMap.get(label);

  if (matchIndex > lastIndex) {
   nodes.push(text.slice(lastIndex, matchIndex));
  }

  nodes.push(
   <StudyInstructionText
    key={`${label}-${matchIndex}`}
    tone="accent"
    weight="black"
    leading="none"
    scale="cloze"
    className="exercise-answer-surface mx-1 inline-flex translate-y-[-0.08em] items-center gap-1 rounded-lg border px-2 py-0.5 shadow-sm"
    title={answer?.note}
   >
    <StudyInstructionText as="span" variant="caption" className="opacity-75">
     {marker}
    </StudyInstructionText>
    <span>{showAnswers ? answer?.answer || matchText : "____"}</span>
   </StudyInstructionText>,
  );

  lastIndex = matchIndex + matchText.length;
 }

 if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

 return <>{nodes}</>;
}
