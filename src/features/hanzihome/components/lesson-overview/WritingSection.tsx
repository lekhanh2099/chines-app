import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { CharacterWritingItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";

import type { LessonDisplayMode } from "./types";
import { asRecord, stringValue } from "./utils";

export function WritingCard({
 lessonId,
 parentSectionId,
 path,
 item,
 displayMode,
}: {
 lessonId?: string;
 parentSectionId?: string;
 path?: EditableNodePath;
 item: CharacterWritingItem;
 displayMode: LessonDisplayMode;
}) {
 const meaningVi = stringValue(asRecord(item), "meaning_vi");
 const content = (
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

 if (!lessonId || !path) return content;

 return (
  <EditableNodeWrapper
   lessonId={lessonId}
   entityType="character_writing_item"
   entityId={item.id}
   parentEntityType="section"
   parentEntityId={parentSectionId}
   path={path}
   value={item}
   label={item.hanzi}
  >
   {content}
  </EditableNodeWrapper>
 );
}
