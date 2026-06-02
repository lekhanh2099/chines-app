import type { CharacterWritingItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import type { LessonDisplayMode } from "./types";

export function WritingCard({
 item,
 displayMode,
}: {
 item: CharacterWritingItem;
 displayMode: LessonDisplayMode;
}) {
 return (
  <div className="rounded-xl border border-border-default bg-bg-primary p-3">
   <p className="text-4xl font-black text-text-primary" lang="zh-CN">
    {item.hanzi}
   </p>
   {displayMode.showPinyin && item.pinyin && (
    <p className="font-bold text-accent-text">{item.pinyin}</p>
   )}
   {item.radical && (
    <p className="text-sm font-semibold text-text-muted">Bộ: {item.radical}</p>
   )}
  </div>
 );
}
