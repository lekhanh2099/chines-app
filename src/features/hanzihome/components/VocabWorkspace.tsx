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
      lesson.vocab.find((word) => word.id === selectedWordId) ||
      lesson.vocab[0] ||
      null,
    [lesson.vocab, selectedWordId],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(20rem,23.75rem)_minmax(0,1fr)]">
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
        editDraftId={lesson.draftId}
        editItemId={selectedWord?.id}
        onBookmark={() => selectedWord && onBookmark(selectedWord.id)}
        onMarkStatus={(status) => selectedWord && onMarkStatus(selectedWord.id, status)}
      />
    </div>
  );
}
