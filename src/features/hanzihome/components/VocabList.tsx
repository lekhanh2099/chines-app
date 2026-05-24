"use client";

import { Card } from "@/components/ui/card";
import type {
 LearningStatus,
 VocabViewModel,
} from "@/features/hanzihome/types";

type VocabListProps = {
 words: VocabViewModel[];
 selectedWordId: string | null;
 progress: Record<string, { status: LearningStatus }>;
 bookmarkedIds: string[];
 searchValue: string;
 statusFilter: "all" | LearningStatus;
 onSearchChange: (value: string) => void;
 onStatusFilterChange: (value: "all" | LearningStatus) => void;
 onSelectWord: (wordId: string) => void;
};

export function VocabList({
 words,
 selectedWordId,
 onSelectWord,
}: VocabListProps) {
 return (
 <Card
  padding="sm"
  className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
 >
 <div className="grid gap-1.5">
 {words.length > 0 ? (
  <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border-default bg-bg-subtle p-2 scrollbar-soft sm:max-h-48">
  {words.map((word) => {
  const active = word.id === selectedWordId;

  return (
  <button
   key={word.id}
   type="button"
   onClick={() => onSelectWord(word.id)}
   className={[
   "group rounded-lg border px-2.5 py-1.5 text-left transition-colors",
   active
   ? "border-bg-inverse bg-bg-inverse text-text-inverse shadow-theme-sm"
   : "border-transparent bg-bg-subtle text-text-secondary hover:border-border-hover hover:bg-bg-elevated hover:text-text-primary",
   ].join(" ")}
  >
   <span
   className="font-hanzi-display block font-black leading-tight"
   lang="zh-CN"
   >
   {word.word}
   </span>
  </button>
  );
  })}
  </div>
 ) : (
  <p className="rounded-xl bg-bg-subtle p-3 text-sm font-semibold text-text-muted">
  Không có từ phù hợp bộ lọc.
  </p>
 )}
 </div>
 </Card>
 );
}
