"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LearningStatus, VocabViewModel } from "@/features/hanzihome/types";

type VocabListProps = {
 words: VocabViewModel[];
 selectedWordId: string | null;
 progress: Record<string, { status: LearningStatus }>;
 onSelectWord: (wordId: string) => void;
};

export function VocabList({
 words,
 selectedWordId,
 progress,
 onSelectWord,
}: VocabListProps) {
 const groups = words.reduce<Array<[string, VocabViewModel[]]>>((result, word) => {
  const group = result.find(([category]) => category === word.category);
  if (group) {
   group[1].push(word);
  } else {
   result.push([word.category, [word]]);
  }
  return result;
 }, []);

 return (
  <div className="grid gap-4">
   {groups.map(([category, items]) => (
    <Card key={category} padding="md" className="rounded-2xl">
     <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
       <h2 className="text-lg font-black text-text-primary">{category}</h2>
       <Badge>{items.length} từ</Badge>
      </div>
      <div className="grid gap-2">
       {items.map((word) => {
        const active = word.id === selectedWordId;
        const status = progress[word.id]?.status || "new";
        return (
         <Button
          key={word.id}
          variant={active ? "default" : "outline"}
          className="h-auto min-w-0 justify-start rounded-2xl py-3 text-left"
          onClick={() => onSelectWord(word.id)}
         >
          <span className="min-w-0 flex-1">
           <span className="block truncate text-lg font-black">{word.word}</span>
           <span className="block truncate text-xs font-semibold opacity-80">
            {word.pinyin} · {word.meaning}
           </span>
          </span>
          <span className="text-xs uppercase">{status}</span>
         </Button>
        );
       })}
      </div>
     </div>
    </Card>
   ))}
  </div>
 );
}
