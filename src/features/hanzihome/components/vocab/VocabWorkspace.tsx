"use client";

import { useCallback, useEffect, useMemo } from "react";
import { VocabDetailPanel } from "@/features/hanzihome/components/VocabDetailPanel";
import { VocabList } from "@/features/hanzihome/components/VocabList";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";
import {
 getVocabItemKey,
 getVocabSearchText,
} from "@/features/hanzihome/utils/vocab-item";
import {
 EditableNodeWrapper,
 type DraftPatchPath,
} from "@/features/hanzihome/editing";

type VocabWorkspaceProps = {
 compact?: boolean;
};

export function VocabWorkspace({
 compact = false,
}: VocabWorkspaceProps) {
 const runtime = useHanziHomeRuntime();
 const { lesson, learningState: state } = runtime;
 const actions = useHanziHomeFeatureActions();
 const words = lesson.vocab;
 const selectedWordId = useHanziHomeFeatureSelector(
  (featureState) => featureState.vocabSelectedWordId,
 );
 const searchValue = useHanziHomeFeatureSelector(
  (featureState) => featureState.vocabSearchValue,
 );
 const statusFilter = useHanziHomeFeatureSelector(
  (featureState) => featureState.vocabStatusFilter,
 );

 const bookmarks = state.bookmarks.vocab || [];
 const progress = useMemo(
  () => state.progress.vocab || {},
  [state.progress.vocab],
 );

 const visibleWords = useMemo(() => {
  const keyword = searchValue.trim().toLowerCase();

  return words.filter((word) => {
   const wordId = getVocabItemKey(word);
   const status = progress[wordId]?.status || "new";
   const matchesStatus = statusFilter === "all" || status === statusFilter;
   const haystack = getVocabSearchText(word);

   return matchesStatus && (!keyword || haystack.includes(keyword));
  });
 }, [progress, searchValue, statusFilter, words]);

 const selectedWord = useMemo(
  () =>
   visibleWords.find((word) => getVocabItemKey(word) === selectedWordId) ||
   visibleWords[0] ||
   null,
  [selectedWordId, visibleWords],
 );
 const selectedWordPath = useMemo<DraftPatchPath | null>(() => {
  if (!selectedWord) return null;

  const index = lesson.vocab.findIndex(
   (word) => getVocabItemKey(word) === getVocabItemKey(selectedWord),
  );

  return index >= 0 ? ["vocab", index] : null;
 }, [lesson.vocab, selectedWord]);

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
   actions.selectVocabWord(nextWord ? getVocabItemKey(nextWord) : null);
  },
  [actions, selectedWord, visibleWords],
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
    onSearchChange={actions.setVocabSearchValue}
    onStatusFilterChange={actions.setVocabStatusFilter}
    onSelectWord={actions.selectVocabWord}
   />

   {selectedWord && selectedWordPath ? (
    <EditableNodeWrapper
     lessonId={lesson.id}
     entityType="vocab_item"
     entityId={getVocabItemKey(selectedWord)}
     path={selectedWordPath}
     value={selectedWord}
     label={selectedWord.hanzi}
    >
     <VocabDetailPanel
      word={selectedWord}
      wordPath={selectedWordPath}
      status={progress[getVocabItemKey(selectedWord)]?.status || "new"}
      bookmarked={bookmarks.includes(getVocabItemKey(selectedWord))}
      lessonId={lesson.id}
      compact={compact}
      onBookmark={() => runtime.bookmarkVocab(getVocabItemKey(selectedWord))}
      onMarkStatus={(status) =>
       runtime.markVocab(getVocabItemKey(selectedWord), status)
      }
     />
    </EditableNodeWrapper>
   ) : (
    <VocabDetailPanel
     word={selectedWord}
     wordPath={null}
     status="new"
     bookmarked={false}
     lessonId={lesson.id}
     compact={compact}
     onBookmark={() => undefined}
     onMarkStatus={() => undefined}
    />
   )}
  </div>
 );
}
