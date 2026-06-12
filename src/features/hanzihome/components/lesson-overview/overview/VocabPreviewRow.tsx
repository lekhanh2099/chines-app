import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

export function VocabPreviewRow({ word }: { word: HanziHomeVocabItem }) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3">
   <div className="flex min-w-0 items-baseline gap-2">
    <span className="truncate text-lg font-black text-text-primary" lang="zh-CN">
     {word.hanzi}
    </span>
    <span className="truncate text-sm font-bold text-primary">
     {word.pinyin}
    </span>
   </div>
   <p className="mt-1 truncate text-xs font-bold uppercase tracking-wide text-text-muted">
    {word.meaning.hanviet || word.category}
   </p>
   <p className="mt-1 line-clamp-2 text-sm font-semibold text-text-secondary">
    {getVocabDisplayMeaning(word)}
   </p>
  </div>
 );
}
