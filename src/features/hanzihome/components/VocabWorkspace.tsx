"use client";

import { useMemo, useState } from "react";
import { VocabDetailPanel } from "@/features/hanzihome/components/VocabDetailPanel";
import { VocabList } from "@/features/hanzihome/components/VocabList";
import type {
 HanziHomeLesson,
 LearningStatus,
 UserLearningState,
} from "@/features/hanzihome/types";

type VocabWorkspaceProps = {
 lesson: HanziHomeLesson;
 state: UserLearningState;
 onBookmark: (id: string) => void;
 onMarkStatus: (id: string, status: LearningStatus) => void;
};

export function VocabWorkspace({
 lesson,
 state,
 onBookmark,
 onMarkStatus,
}: VocabWorkspaceProps) {
 const [selectedWordId, setSelectedWordId] = useState<string | null>(
  lesson.vocab[0]?.id || null,
 );
 const selectedWord = useMemo(
  () => lesson.vocab.find((word) => word.id === selectedWordId) || lesson.vocab[0] || null,
  [lesson.vocab, selectedWordId],
 );
 const bookmarks = state.bookmarks.vocab || [];
 const progress = state.progress.vocab || {};

 return (
  <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
   <VocabList
    words={lesson.vocab}
    selectedWordId={selectedWord?.id || null}
    progress={progress}
    onSelectWord={setSelectedWordId}
   />
   <VocabDetailPanel
    word={selectedWord}
    status={selectedWord ? progress[selectedWord.id]?.status || "new" : "new"}
    bookmarked={selectedWord ? bookmarks.includes(selectedWord.id) : false}
    onBookmark={() => selectedWord && onBookmark(selectedWord.id)}
    onMarkStatus={(status) => selectedWord && onMarkStatus(selectedWord.id, status)}
   />
  </div>
 );
}
