"use client";

import { useMemo, useState } from "react";
import { GrammarPointList } from "@/features/hanzihome/components/GrammarPointList";
import { GrammarPointReader } from "@/features/hanzihome/components/GrammarPointReader";
import { GrammarPracticeMini } from "@/features/hanzihome/components/GrammarPracticeMini";
import type {
 HanziHomeLesson,
 LearningStatus,
 UserLearningState,
} from "@/features/hanzihome/types";

type GrammarWorkspaceProps = {
 lesson: HanziHomeLesson;
 state: UserLearningState;
 onBookmark: (id: string) => void;
 onMarkStatus: (id: string, status: LearningStatus) => void;
};

export function GrammarWorkspace({
 lesson,
 state,
 onBookmark,
 onMarkStatus,
}: GrammarWorkspaceProps) {
 const [selectedPointId, setSelectedPointId] = useState<string | null>(
  lesson.grammar[0]?.id || null,
 );
 const selectedPoint = useMemo(
  () =>
   lesson.grammar.find((point) => point.id === selectedPointId) ||
   lesson.grammar[0] ||
   null,
  [lesson.grammar, selectedPointId],
 );
 const progress = state.progress.grammar || {};
 const bookmarks = state.bookmarks.grammar || [];
 const relatedVocab = useMemo(() => {
  if (!selectedPoint) return [];
  const text = [
   selectedPoint.cleanTitle,
   selectedPoint.core,
   selectedPoint.structuresView.join(" "),
   selectedPoint.examplesParsed.map((example) => example.zh).join(" "),
  ].join(" ");
  return lesson.vocab.filter((word) => text.includes(word.word)).slice(0, 8);
 }, [lesson.vocab, selectedPoint]);

 return (
  <div className="grid gap-5 lg:grid-cols-[minmax(20rem,23.75rem)_minmax(0,1fr)]">
   <div className="grid content-start gap-5">
    <GrammarPointList
     points={lesson.grammar}
     selectedPointId={selectedPoint?.id || null}
     progress={progress}
     onSelectPoint={setSelectedPointId}
    />
    <GrammarPracticeMini point={selectedPoint} />
   </div>
   <GrammarPointReader
    point={selectedPoint}
    status={selectedPoint ? progress[selectedPoint.id]?.status || "new" : "new"}
    bookmarked={selectedPoint ? bookmarks.includes(selectedPoint.id) : false}
    relatedVocab={relatedVocab}
    onBookmark={() => selectedPoint && onBookmark(selectedPoint.id)}
    onMarkStatus={(status) => selectedPoint && onMarkStatus(selectedPoint.id, status)}
   />
  </div>
 );
}
