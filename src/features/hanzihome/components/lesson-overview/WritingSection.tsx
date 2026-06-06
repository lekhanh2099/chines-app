import type { CharacterWritingItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import {
 EditableNodeWrapper,
 type DraftPatchPath,
} from "@/features/hanzihome/editing";

import type { LessonDisplayMode } from "./types";

export function WritingCard({
 lessonId,
 parentSectionId,
 path,
 item,
 displayMode,
}: {
 lessonId?: string;
 parentSectionId?: string;
 path?: DraftPatchPath;
 item: CharacterWritingItem;
 displayMode: LessonDisplayMode;
}) {
 const content = (
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
