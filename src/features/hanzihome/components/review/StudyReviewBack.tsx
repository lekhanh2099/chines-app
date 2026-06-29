"use client";

import { Lightbulb, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VocabWritingCue } from "@/features/hanzihome/components/VocabWritingCue";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

type StudyReviewBackProps = {
 item: ReviewItem;
 onOpenDetail: () => void;
 selectedWritingIndex: number;
 onSelectedWritingIndexChange: (index: number) => void;
};

export function StudyReviewBack({
 item,
 onOpenDetail,
 selectedWritingIndex,
 onSelectedWritingIndexChange,
}: StudyReviewBackProps) {
 if (item.type === "vocab") {
  const example = item.source.examples[0];

  return (
   <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 text-left sm:p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid min-w-0 gap-1">
      <p className="font-pinyin text-xl font-black text-text-primary">{item.source.pinyin}</p>

      <p className="text-base font-bold text-text-secondary">
       {item.source.meaning.hanviet} · {getVocabDisplayMeaning(item.source)}
      </p>
     </div>

     <Button
      type="button"
      variant="outline"
      className="shrink-0 rounded-lg"
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => {
       event.stopPropagation();
       onOpenDetail();
      }}
     >
      Xem chi tiết
      <kbd className="ml-2 rounded bg-bg-subtle px-1.5 py-0.5 text-[0.65rem] font-black text-text-muted">
       D
      </kbd>
     </Button>
    </div>

    <VocabWritingCue
     word={item.source}
     size={180}
     autoPlay
     selectedIndex={selectedWritingIndex}
     onSelectedIndexChange={onSelectedWritingIndexChange}
    />

    {example && (
     <div className="grid gap-1 rounded-xl border border-border-default bg-bg-card p-3 shadow-theme-sm sm:p-4">
      <p className="font-hanzi text-base font-black text-text-primary" lang="zh-CN">
       {example.zh}
      </p>

      {example.pinyin && <p className="font-pinyin font-bold text-text-muted">{example.pinyin}</p>}

      {example.vi && <p className="font-semibold text-text-secondary">{example.vi}</p>}
     </div>
    )}
   </div>
  );
 }

 const example = item.source.examplesParsed[0];

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 text-left sm:p-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid min-w-0 flex-1 gap-2">
     <div className="rounded-xl border border-primary/20 bg-primary/8 p-3 grid gap-2">
      <div className="flex items-center gap-2">
       <Lightbulb className="h-4 w-4 text-primary" />
       <p className="text-xs font-black uppercase tracking-wide text-primary">Ý nghĩa</p>
      </div>
      <p className="text-base font-bold leading-relaxed text-text-primary">
       {item.source.core || item.answer}
      </p>
     </div>
    </div>

    <Button
     type="button"
     variant="outline"
     className="shrink-0 rounded-lg"
     onMouseDown={(event) => event.stopPropagation()}
     onTouchStart={(event) => event.stopPropagation()}
     onClick={(event) => {
      event.stopPropagation();
      onOpenDetail();
     }}
    >
     Xem chi tiết
     <kbd className="ml-2 rounded bg-bg-subtle px-1.5 py-0.5 text-[0.65rem] font-black text-text-muted">
      D
     </kbd>
    </Button>
   </div>

   {item.source.structuresView[0] && (
    <div className="rounded-xl border border-info/30 bg-info-subtle p-3 grid gap-2">
     <div className="flex items-center gap-2">
      <Sigma className="h-4 w-4 text-info-text" />
      <p className="text-xs font-black uppercase tracking-wide text-info-text">Công thức</p>
     </div>
     <p className="font-mono text-base font-black text-info-text">
      {item.source.structuresView[0]}
     </p>
    </div>
   )}

   {example && (
    <div className="rounded-xl border border-border-default bg-bg-primary p-3 shadow-theme-sm sm:p-4">
     <p className="font-hanzi text-base font-black text-text-primary" lang="zh-CN">
      {example.zh}
     </p>

     {example.vi && <p className="font-semibold text-text-secondary">{example.vi}</p>}
    </div>
   )}
  </div>
 );
}
