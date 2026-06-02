import { Bookmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveMemoryTipButton } from "@/features/hanzihome/memory-tips/SaveMemoryTipButton";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

import { WordFormationPreview } from "./VocabDetailSections";

export function VocabDetailHeader({
 word,
 bookmarked,
 lessonId,
 onBookmark,
}: {
 word: HanziHomeVocabItem;
 bookmarked: boolean;
 lessonId?: string;
 onBookmark: () => void;
}) {
 return (
  <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,46rem)]">
   <div className="min-w-0">
    <div className="flex flex-wrap items-end gap-3">
     <h2 className="text-6xl font-black leading-none tracking-normal text-text-primary">
      {word.hanzi}
     </h2>

     <p className="text-xl font-black text-accent-text">{word.pinyin}</p>
    </div>

    <div className="mt-2 flex flex-wrap items-center gap-1.5">
     {word.pos.raw_vi && <Badge variant="info">{word.pos.raw_vi}</Badge>}

     {word.level_tag !== "unknown" && (
      <Badge variant="danger">{word.level_tag}</Badge>
     )}
     <Button variant={bookmarked ? "default" : "outline"} onClick={onBookmark}>
      <Bookmark className="h-4 w-4" />
      {bookmarked ? "Đã lưu" : "Lưu"}
     </Button>

     <SaveMemoryTipButton
      payload={{
       tipType: "vocab",
       title: `${word.hanzi} · ${word.pinyin}`,
       body: `${word.meaning.hanviet} · ${getVocabDisplayMeaning(word)}`,
       exampleZh: word.examples[0]?.zh,
       examplePinyin: word.examples[0]?.pinyin,
       exampleVi: word.examples[0]?.vi,
       sourceType: "vocab",
       sourceLessonId: lessonId,
       sourceItemId: word.runtimeId,
       sourceLabel: word.hanzi,
       tags: ["vocab", word.category, ...word.tags].filter(Boolean),
       weight: 2,
      }}
     />
    </div>

    <p className="mt-2 max-w-2xl text-base font-black leading-relaxed text-text-secondary">
     {word.meaning.hanviet} · {getVocabDisplayMeaning(word)}
    </p>
   </div>

   <div className="min-w-0 overflow-x-auto rounded-xl border border-border-default bg-bg-subtle p-3">
    <div className="w-max min-w-full">
     <WordFormationPreview formation={word.word_formation} />
    </div>
   </div>
  </div>
 );
}
