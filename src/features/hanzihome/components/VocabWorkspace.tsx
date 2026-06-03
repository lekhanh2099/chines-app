"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VocabDetailPanel } from "@/features/hanzihome/components/VocabDetailPanel";
import { VocabList } from "@/features/hanzihome/components/VocabList";
import type {
 HanziHomeLesson,
 LearningStatus,
 UserLearningState,
} from "@/features/hanzihome/types";
import {
 getVocabItemKey,
 getVocabSearchText,
} from "@/features/hanzihome/utils/vocab-item";

type VocabWorkspaceProps = {
 lesson: HanziHomeLesson;
 state: UserLearningState;
 compact?: boolean;
 onBookmark: (id: string) => void;
 onMarkStatus: (id: string, status: LearningStatus) => void;
 onOpenReview?: () => void;
};

export function VocabWorkspace({
 lesson,
 state,
 compact = false,
 onBookmark,
 onMarkStatus,
}: VocabWorkspaceProps) {
 const [selectedWordId, setSelectedWordId] = useState<string | null>(
  lesson.vocab[0] ? getVocabItemKey(lesson.vocab[0]) : null,
 );
 const [searchValue, setSearchValue] = useState("");
 const [statusFilter, setStatusFilter] = useState<"all" | LearningStatus>(
 "all",
 );

 const bookmarks = state.bookmarks.vocab || [];
 const progress = useMemo(
  () => state.progress.vocab || {},
  [state.progress.vocab],
 );

 const visibleWords = useMemo(() => {
  const keyword = searchValue.trim().toLowerCase();

  return lesson.vocab.filter((word) => {
   const wordId = getVocabItemKey(word);
   const status = progress[wordId]?.status || "new";
   const matchesStatus = statusFilter === "all" || status === statusFilter;
   const haystack = getVocabSearchText(word);

   return matchesStatus && (!keyword || haystack.includes(keyword));
  });
 }, [lesson.vocab, progress, searchValue, statusFilter]);

 const selectedWord = useMemo(
  () =>
   visibleWords.find((word) => getVocabItemKey(word) === selectedWordId) ||
   visibleWords[0] ||
   null,
  [selectedWordId, visibleWords],
 );

 const selectRelativeWord = useCallback(
  (offset: number) => {
   if (visibleWords.length === 0) return;

   const currentIndex = selectedWord
    ? visibleWords.findIndex(
       (word) => getVocabItemKey(word) === getVocabItemKey(selectedWord),
      )
    : -1;
   const nextIndex =
    currentIndex >= 0
     ? (currentIndex + offset + visibleWords.length) % visibleWords.length
     : 0;

   const nextWord = visibleWords[nextIndex];
   setSelectedWordId(nextWord ? getVocabItemKey(nextWord) : null);
  },
  [selectedWord, visibleWords],
 );

 useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) {
    return;
   }

   const activeElement = document.activeElement;

   if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    activeElement?.getAttribute("role") === "textbox" ||
    activeElement?.closest("[contenteditable='true'], [data-editor-root]")
   ) {
    return;
   }

   event.preventDefault();
   selectRelativeWord(event.shiftKey ? -1 : 1);
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
   window.removeEventListener("keydown", handleKeyDown);
  };
 }, [selectRelativeWord]);

 return (
  <div className="grid gap-3">
   <VocabList
    words={visibleWords}
    selectedWordId={selectedWord ? getVocabItemKey(selectedWord) : null}
    progress={progress}
    bookmarkedIds={bookmarks}
    searchValue={searchValue}
    statusFilter={statusFilter}
    compact={compact}
    onSearchChange={setSearchValue}
    onStatusFilterChange={setStatusFilter}
    onSelectWord={setSelectedWordId}
   />

   <VocabDetailPanel
    word={selectedWord}
    status={
     selectedWord
      ? progress[getVocabItemKey(selectedWord)]?.status || "new"
      : "new"
    }
    bookmarked={
     selectedWord ? bookmarks.includes(getVocabItemKey(selectedWord)) : false
    }
    lessonId={lesson.id}
    onBookmark={() => selectedWord && onBookmark(getVocabItemKey(selectedWord))}
    onMarkStatus={(status) =>
     selectedWord && onMarkStatus(getVocabItemKey(selectedWord), status)
    }
   />
  </div>
 );
}
