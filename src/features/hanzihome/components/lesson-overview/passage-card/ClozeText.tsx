import { getHanziTypographyStyle } from "../hanzi-typography";
import type { LessonDisplayMode } from "../types";
import { ClozeInlineText } from "./ClozeInlineText";
import type { ClozeAnswer } from "./types";

export function ClozeText({
 text,
 answerMap,
 displayMode,
}: {
 text: string;
 answerMap: Map<string, ClozeAnswer>;
 displayMode: LessonDisplayMode;
}) {
 const paragraphs = text.split(/\n{2,}/).filter((paragraph) => paragraph.trim());

 return (
  <div className="grid gap-3">
   {paragraphs.map((paragraph, paragraphIndex) => (
    <p
     key={`${paragraph.slice(0, 32)}-${paragraphIndex}`}
     className="whitespace-pre-wrap leading-relaxed text-text-primary"
     lang="zh-CN"
     style={getHanziTypographyStyle(displayMode)}
    >
     <ClozeInlineText text={paragraph} answerMap={answerMap} />
    </p>
   ))}
  </div>
 );
}
