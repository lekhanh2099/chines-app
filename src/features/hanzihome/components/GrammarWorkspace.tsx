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

 return (
  <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
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
    onBookmark={() => selectedPoint && onBookmark(selectedPoint.id)}
    onMarkStatus={(status) => selectedPoint && onMarkStatus(selectedPoint.id, status)}
   />
  </div>
 );
}
