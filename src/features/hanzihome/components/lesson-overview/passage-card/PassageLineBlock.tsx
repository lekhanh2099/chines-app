import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { ClozeText } from "./ClozeText";
import { shouldRenderAsCloze } from "./passage-utils";
import type { ClozeAnswer, PassageLine } from "./types";

export function PassageLineBlock({
 line,
 answerMap,
 rendererId,
 displayMode,
}: {
 line: PassageLine;
 answerMap: Map<string, ClozeAnswer>;
 rendererId: string;
 displayMode: LessonDisplayMode;
}) {
 const isCloze = shouldRenderAsCloze(line.zh, answerMap, rendererId);

 return (
  <div className="rounded-xl border border-border-default bg-bg-primary p-3">
   {isCloze ? (
    <div className="grid gap-2">
     <ClozeText text={line.zh} answerMap={answerMap} displayMode={displayMode} />
     {displayMode.showPinyin && line.pinyin && (
      <p className="text-xs font-bold italic text-text-muted sm:text-sm">{line.pinyin}</p>
     )}
     {displayMode.showMeaning && line.vi && (
      <p className="font-semibold leading-relaxed text-text-secondary">{line.vi}</p>
     )}
    </div>
   ) : (
    <TextLineCard
     zh={line.zh}
     pinyin={line.pinyin}
     vi={line.vi}
     displayMode={displayMode}
     variant="reader"
    />
   )}
  </div>
 );
}
