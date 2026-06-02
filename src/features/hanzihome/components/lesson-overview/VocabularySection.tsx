import { Badge } from "@/components/ui/badge";
import type { VocabularyItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import type { LessonDisplayMode } from "./types";

export function VocabMiniGrid({
 items,
 displayMode,
}: {
 items: VocabularyItem[];
 displayMode: LessonDisplayMode;
}) {
 return (
  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
   {items.map((item) => (
    <div
     key={item.id}
     className="rounded-xl border border-border-default bg-bg-primary p-3"
    >
     <div className="flex flex-wrap items-end gap-2">
      <p className="text-2xl font-black text-text-primary" lang="zh-CN">
       {item.hanzi}
      </p>
      {displayMode.showPinyin && item.pinyin && (
       <p className="font-bold text-accent-text">{item.pinyin}</p>
      )}
     </div>
     {displayMode.showMeaning && (
      <p className="text-sm font-semibold leading-relaxed text-text-secondary">
       {item.meaning_vi}
      </p>
     )}
     {item.pos !== "unknown" && <Badge>{item.pos}</Badge>}
    </div>
   ))}
  </div>
 );
}
