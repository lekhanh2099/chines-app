import { ReaderHanziText } from "../hanzi-typography";
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
    <ReaderHanziText
     displayMode={displayMode}
     key={`${paragraph.slice(0, 32)}-${paragraphIndex}`}
     tone="default"
     leading="relaxed"
     wrapping="preWrap"
    >
     <ClozeInlineText
      showAnswers={displayMode.showAnswers}
      text={paragraph}
      answerMap={answerMap}
     />
    </ReaderHanziText>
   ))}
  </div>
 );
}
