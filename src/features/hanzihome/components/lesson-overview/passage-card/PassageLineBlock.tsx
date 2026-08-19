import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
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
 lessonId,
}: {
 line: PassageLine;
 answerMap: Map<string, ClozeAnswer>;
 rendererId: string;
 displayMode: LessonDisplayMode;
 lessonId?: string;
}) {
 const isCloze = shouldRenderAsCloze(line.zh, answerMap, rendererId);

 return (
  <div className="study-content-surface rounded-xl border p-3">
   {isCloze ? (
    <div className="grid gap-2">
     <ClozeText text={line.zh} answerMap={answerMap} displayMode={displayMode} />
     {displayMode.showPinyin && line.pinyin && (
      <StudyInstructionText variant="caption" tone="muted" weight="bold" emphasis="italic">
       {line.pinyin}
      </StudyInstructionText>
     )}
     {displayMode.showMeaning && line.vi && (
      <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed">
       {line.vi}
      </StudyInstructionText>
     )}
    </div>
   ) : (
    <TextLineCard
     zh={line.zh}
     pinyin={line.pinyin}
     vi={line.vi}
     displayMode={displayMode}
     variant="reader"
     annotationTarget={
      lessonId ? { lessonId, nodeType: "passage_line", nodeId: line.id } : undefined
     }
    />
   )}
  </div>
 );
}
