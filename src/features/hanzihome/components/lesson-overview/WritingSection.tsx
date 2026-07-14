import type { CharacterWritingItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";

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
     <p className="text-4xl font-black text-text-primary" lang="zh-CN">
      {item.hanzi}
     </p>
     <NativeMandarinSpeakButton text={item.hanzi} />
    </div>
    {displayMode.showPinyin && item.pinyin && (
     <p className="font-bold text-accent-text">{item.pinyin}</p>
    )}
    {displayMode.showMeaning && meaningVi && (
     <p className="font-semibold text-text-secondary">{meaningVi}</p>
    )}
    {item.radical && <p className=" font-semibold text-text-muted">Bộ: {item.radical}</p>}
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
