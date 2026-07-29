"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useCallback, useEffect, useMemo } from "react";
import { VocabDetailPanel } from "@/features/hanzihome/components/VocabDetailPanel";
import { VocabList } from "@/features/hanzihome/components/VocabList";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import {
 useHanziHomeEditMode,
 useHanziHomeFeatureSelector,
} from "@/features/hanzihome/context/selectors";
import { getVocabItemKey, getVocabSearchText } from "@/features/hanzihome/utils/vocab-item";
import { EditableNodeWrapper, type NullableEditableNodePath } from "@/features/hanzihome/editing";
import { VocabBulkEditDialog } from "@/features/hanzihome/components/vocab/VocabBulkEditDialog";
import { useHanziHomeLessonVocabulary } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type VocabWorkspaceProps = {
 compact?: boolean;
};

export function VocabWorkspace({ compact = false }: VocabWorkspaceProps) {
 const runtime = useHanziHomeRuntime();
 const { lesson, learningState: state } = runtime;
 const actions = useHanziHomeFeatureActions();
 const editMode = useHanziHomeEditMode();
 const vocabularyQuery = useHanziHomeLessonVocabulary(lesson.id);
 const words = useMemo(() => vocabularyQuery.data?.items ?? [], [vocabularyQuery.data]);
 const selectedWordId = useHanziHomeFeatureSelector(
  (featureState) => featureState.vocabSelectedWordId,
 );
 const searchValue = useHanziHomeFeatureSelector((featureState) => featureState.vocabSearchValue);
 const statusFilter = useHanziHomeFeatureSelector((featureState) => featureState.vocabStatusFilter);

 const bookmarks = state.bookmarks.vocab || [];
 const progress = useMemo(() => state.progress.vocab || {}, [state.progress.vocab]);

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
   visibleWords.find((word) => getVocabItemKey(word) === selectedWordId) || visibleWords[0] || null,
  [selectedWordId, visibleWords],
 );
 const selectedWordPath = useMemo<NullableEditableNodePath>(() => {
  if (!selectedWord) return null;

  const index = words.findIndex((word) => getVocabItemKey(word) === getVocabItemKey(selectedWord));

  return index >= 0 ? ["vocab", index] : null;
 }, [selectedWord, words]);

 const selectRelativeWord = useCallback(
  (offset: number) => {
   if (visibleWords.length === 0) return;

   const currentIndex = selectedWord
    ? visibleWords.findIndex((word) => getVocabItemKey(word) === getVocabItemKey(selectedWord))
    : -1;
   const nextIndex =
    currentIndex >= 0 ? (currentIndex + offset + visibleWords.length) % visibleWords.length : 0;

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

 if (vocabularyQuery.isPending) {
  return (
   <div className="h-72 animate-pulse rounded-2xl bg-bg-subtle" aria-label="Đang tải từ vựng" />
  );
 }

 if (vocabularyQuery.isError) {
  return (
   <Card padding="lg" className="grid justify-items-start gap-3">
    <StudyInstructionText tone="default" weight="semibold">
     Không tải được dữ liệu từ vựng của bài.
    </StudyInstructionText>
    <Button type="button" variant="outline" onClick={() => vocabularyQuery.refetch()}>
     Thử lại
    </Button>
   </Card>
  );
 }

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
    actions={
     editMode && visibleWords.length > 0 ? (
      <VocabBulkEditDialog
       lessonId={lesson.id}
       items={visibleWords}
       getEntityId={getVocabItemKey}
       getItemPath={(word) => {
        const index = words.findIndex((item) => getVocabItemKey(item) === getVocabItemKey(word));
        return ["vocab", Math.max(index, 0)];
       }}
       courseId={lesson.courseId ?? ""}
       bookId={lesson.bookId ?? ""}
       label="Quản lý từ vựng"
      />
     ) : null
    }
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
     editLabel="Sửa từ"
    >
     <VocabDetailPanel
      word={selectedWord}
      wordPath={selectedWordPath}
      status={progress[getVocabItemKey(selectedWord)]?.status || "new"}
      bookmarked={bookmarks.includes(getVocabItemKey(selectedWord))}
      lessonId={lesson.id}
      compact={compact}
      onBookmark={() => runtime.bookmarkVocab(getVocabItemKey(selectedWord))}
      onMarkStatus={(status) => runtime.markVocab(getVocabItemKey(selectedWord), status)}
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
