"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
 HanziHomeVocabItem,
 LearningStatus,
} from "@/features/hanzihome/types";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

type VocabListProps = {
 words: HanziHomeVocabItem[];
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
 searchValue,
 onSearchChange,
 onSelectWord,
}: VocabListProps) {
 return (
  <Card
   padding="sm"
   className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
  >
   <div className="grid gap-1.5">
    <label className="relative block">
     <span className="sr-only">Tìm từ vựng trong bài</span>
     <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
     <Input
      value={searchValue}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder="Tìm từ, pinyin, Hán Việt, nghĩa..."
      className="h-10 rounded-xl bg-bg-primary pl-9 text-sm font-bold"
     />
    </label>

    {words.length > 0 ? (
     <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border-default bg-bg-subtle p-2 scrollbar-soft sm:max-h-48">
      {words.map((word) => {
       const wordId = getVocabItemKey(word);
       const active = wordId === selectedWordId;

       return (
        <Button
         key={wordId}
         type="button"
         onClick={() => onSelectWord(wordId)}
         variant={active ? "default" : "outline"}
        >
         <span
          className="font-hanzi-display block font-black leading-tight"
          lang="zh-CN"
         >
          {word.hanzi}
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
