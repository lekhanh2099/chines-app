"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
 progress,
 bookmarkedIds,
 searchValue,
 onSearchChange,
 onSelectWord,
}: VocabListProps) {
 const groups = words.reduce<Array<[string, VocabViewModel[]]>>(
  (result, word) => {
   const group = result.find(([category]) => category === word.category);
   if (group) {
    group[1].push(word);
   } else {
    result.push([word.category, [word]]);
   }
   return result;
  },
  [],
 );

 return (
  <Card
   padding="md"
   className="rounded-2xllg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-soft "
  >
   <div className="grid gap-3">
    <div>
     <h2 className="text-lg font-black text-text-primary">Từ vựng trong bài</h2>
     <p className="text-sm font-semibold text-text-muted">
      Chọn từ để đọc nghĩa sâu, ví dụ và lỗi sai.
     </p>
    </div>
    <Input
     value={searchValue}
     onChange={(event) => onSearchChange(event.target.value)}
     placeholder="Tìm Hán tự, pinyin, nghĩa..."
     aria-label="Tìm từ vựng"
    />

    {groups.map(([category, items]) => (
     <div key={category} className="grid gap-3 rounded-2xlbg-bg-subtle p-3">
      <div className="flex items-center justify-between gap-3">
       <h3 className="min-w-0 truncate text-sm font-black text-text-primary">
        {category}
       </h3>
       <Badge>{items.length} từ</Badge>
      </div>
      <div className="grid gap-2">
       {items.map((word) => {
        const active = word.id === selectedWordId;
        const status = progress[word.id]?.status || "new";
        const bookmarked = bookmarkedIds.includes(word.id);
        return (
         <Button
          key={word.id}
          variant={active ? "default" : "outline"}
          className="h-auto min-w-0 justify-start rounded-2xlpy-3 text-left"
          onClick={() => onSelectWord(word.id)}
         >
          <span className="min-w-0 flex-1">
           <span className="block truncate text-lg font-black">
            {word.word}
           </span>
           <span className="block truncate text-xs font-semibold opacity-80">
            {word.pinyin} · {word.meaning}
           </span>
          </span>
          <span className="text-xs uppercase">{status}</span>
          {bookmarked && (
           <Badge variant="warning" size="sm" className="shrink-0">
            Lưu
           </Badge>
          )}
         </Button>
        );
       })}
      </div>
     </div>
    ))}
    {words.length === 0 && (
     <p className="rounded-2xlbg-bg-subtle p-4 text-sm font-semibold text-text-muted">
      Không có từ phù hợp bộ lọc.
     </p>
    )}
   </div>
  </Card>
 );
}
