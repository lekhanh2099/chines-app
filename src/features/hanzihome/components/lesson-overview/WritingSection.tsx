import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { CharacterWritingItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";

import type { LessonDisplayMode } from "./types";
import { asRecord, stringValue } from "./utils";

export function WritingCard({
 item,
 displayMode,
}: {
 item: CharacterWritingItem;
 displayMode: LessonDisplayMode;
}) {
 const meaningVi = stringValue(asRecord(item), "meaning_vi");
 return (
  <div className="rounded-xl border border-border-default bg-bg-primary p-3 grid gap-2">
   <div className="grid gap-1">
    <div className="flex items-center gap-1.5">
     <StudyInstructionText variant="display" tone="default" weight="black" lang="zh-CN">
      {item.hanzi}
     </StudyInstructionText>
     <MandarinSpeakButton text={item.hanzi} />
    </div>
    {displayMode.showPinyin && item.pinyin && (
     <StudyInstructionText tone="accent" weight="bold">
      {item.pinyin}
     </StudyInstructionText>
    )}
    {displayMode.showMeaning && meaningVi && (
     <StudyInstructionText tone="secondary" weight="semibold">
      {meaningVi}
     </StudyInstructionText>
    )}
    {item.radical && (
     <StudyInstructionText tone="muted" weight="semibold">
      Bộ: {item.radical}
     </StudyInstructionText>
    )}
   </div>
   <div className="flex flex-wrap gap-1.5 text-xs font-bold text-text-muted">
    {item.stroke_count && (
     <span className="rounded-lg bg-bg-subtle px-2 py-1">{item.stroke_count} nét</span>
    )}
    <span className="rounded-lg bg-bg-subtle px-2 py-1">Ô {item.practice.grid_type}</span>
    <span className="rounded-lg bg-bg-subtle px-2 py-1">Lặp {item.practice.repeat_count} lần</span>
   </div>
  </div>
 );
}
