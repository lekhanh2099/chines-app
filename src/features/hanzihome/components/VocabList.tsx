"use client";

import { Button } from "@/components/ui/button";
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
        <Button
         key={word.id}
         type="button"
         onClick={() => onSelectWord(word.id)}
         variant={active ? "default" : "outline"}
        >
         <span
          className="font-hanzi-display block font-black leading-tight"
          lang="zh-CN"
         >
          {word.word}
         </span>
        </Button>
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
