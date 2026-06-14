import type { ReactNode } from "react";

import type { ClozeAnswer } from "./types";
import { BLANK_MARKER_SOURCE, blankLabelToNumber, getBlankMarkerFromMatch } from "./passage-utils";

export function ClozeInlineText({
 text,
 answerMap,
}: {
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
   <span
    key={`${label}-${matchIndex}`}
    className="mx-1 inline-flex translate-y-[-0.08em] items-center gap-1 rounded-lg border border-accent/35 bg-accent-subtle px-2 py-0.5 text-[0.62em] font-black leading-none text-accent-text shadow-sm"
    title={answer?.note}
   >
    <span className="text-[0.78em] opacity-75">{marker}</span>
    <span>{answer?.answer || matchText}</span>
   </span>,
  );

  lastIndex = matchIndex + matchText.length;
 }

 if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

 return <>{nodes}</>;
}
