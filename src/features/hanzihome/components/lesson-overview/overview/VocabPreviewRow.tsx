import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

export function VocabPreviewRow({ word }: { word: HanziHomeVocabItem }) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3 grid gap-1">
   <div className="flex min-w-0 items-baseline gap-2">
    <span className="truncate text-lg font-black text-text-primary" lang="zh-CN">
     {word.hanzi}
    </span>
    <span className="truncate font-bold text-primary">{word.pinyin}</span>
   </div>
   <p className="truncate text-xs font-bold uppercase tracking-wide text-text-muted">
    {word.meaning.hanviet || word.category}
   </p>
   <p className="line-clamp-2 font-semibold text-text-secondary">
    {getVocabDisplayMeaning(word)}
   </p>
  </div>
 );
}
