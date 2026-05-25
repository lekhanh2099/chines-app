"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
 onOpenReview?: () => void;
};

export function VocabWorkspace({
 lesson,
 state,
 onBookmark,
 onMarkStatus,
 onOpenReview,
}: VocabWorkspaceProps) {
 const [selectedWordId, setSelectedWordId] = useState<string | null>(
  lesson.vocab[0]?.id || null,
 );
 const [searchValue, setSearchValue] = useState("");
 const [statusFilter, setStatusFilter] = useState<"all" | LearningStatus>("all");

 const bookmarks = state.bookmarks.vocab || [];
 const progress = useMemo(() => state.progress.vocab || {}, [state.progress.vocab]);

 const visibleWords = useMemo(() => {
  const keyword = searchValue.trim().toLowerCase();

  return lesson.vocab.filter((word) => {
   const status = progress[word.id]?.status || "new";
   const matchesStatus = statusFilter === "all" || status === statusFilter;
   const haystack = [
    word.word,
    word.pinyin,
    word.hanViet,
    word.meaning,
    word.category,
   ]
    .join(" ")
    .toLowerCase();

   return matchesStatus && (!keyword || haystack.includes(keyword));
  });
 }, [lesson.vocab, progress, searchValue, statusFilter]);

 const selectedWord = useMemo(
  () =>
   visibleWords.find((word) => word.id === selectedWordId) ||
   visibleWords[0] ||
   null,
  [selectedWordId, visibleWords],
 );

 return (
  <div className="grid gap-3">
   {onOpenReview && lesson.vocab.length > 0 && (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-default bg-bg-card p-3 shadow-theme-sm">
     <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Flashcard bài này
      </p>
      <p className="text-sm font-bold text-text-secondary">
       Ôn nhanh {lesson.vocab.length} từ vựng theo trạng thái học hiện tại.
      </p>
     </div>

     <Button
      type="button"
      onClick={onOpenReview}
      variant="outline"
     >
      Vào ôn tập
     </Button>
    </div>
   )}

   <VocabList
    words={visibleWords}
    selectedWordId={selectedWord?.id || null}
    progress={progress}
    bookmarkedIds={bookmarks}
    searchValue={searchValue}
    statusFilter={statusFilter}
    onSearchChange={setSearchValue}
    onStatusFilterChange={setStatusFilter}
    onSelectWord={setSelectedWordId}
   />

   <VocabDetailPanel
    word={selectedWord}
    status={selectedWord ? progress[selectedWord.id]?.status || "new" : "new"}
    bookmarked={selectedWord ? bookmarks.includes(selectedWord.id) : false}
    lessonId={lesson.id}
    canEditDbContent={Boolean(lesson.isDbBacked && !lesson.draftId)}
    editDraftId={lesson.draftId}
    editItemId={selectedWord?.id}
    onBookmark={() => selectedWord && onBookmark(selectedWord.id)}
    onMarkStatus={(status) => selectedWord && onMarkStatus(selectedWord.id, status)}
   />
  </div>
 );
}
