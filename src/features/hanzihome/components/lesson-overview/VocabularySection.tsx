import { Badge } from "@/components/ui/badge";
import type { VocabularyItem } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import type { LessonDisplayMode } from "./types";
import { asRecord, stringValue } from "./utils";

function vocabMeaning(item: VocabularyItem) {
 const record = asRecord(item);

 return (
  item.meaning_vi ||
  stringValue(record, "meaning") ||
  stringValue(record, "vi") ||
  stringValue(record, "gloss_vi") ||
  stringValue(record, "definition_vi") ||
  stringValue(record, "translation_vi")
 );
}

export function VocabMiniGrid({
 lessonId,
 parentSectionId,
 itemsPath,
 items,
 displayMode,
}: {
 lessonId?: string;
 parentSectionId?: string;
 itemsPath?: EditableNodePath;
 items: VocabularyItem[];
 displayMode: LessonDisplayMode;
}) {
 return (
  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
   {items.map((item, index) => {
    const meaning = vocabMeaning(item);
    const card = (
     <div className="rounded-xl border border-border-default bg-bg-primary p-3">
      <div className="flex flex-wrap items-end gap-2">
       <p className="text-2xl font-black text-text-primary" lang="zh-CN">
        {item.hanzi}
       </p>
       {displayMode.showPinyin && item.pinyin && (
        <p className="font-bold text-accent-text">{item.pinyin}</p>
       )}
      </div>
      {meaning && (
       <p className=" font-semibold leading-relaxed text-text-secondary">{meaning}</p>
      )}
      {item.pos !== "unknown" && <Badge>{item.pos}</Badge>}
     </div>
    );

    if (!lessonId || !itemsPath) {
     return <div key={item.id}>{card}</div>;
    }

    return (
     <EditableNodeWrapper
      key={item.id}
      lessonId={lessonId}
      entityType="vocab_item"
      entityId={item.id}
      parentEntityType="section"
      parentEntityId={parentSectionId}
      path={[...itemsPath, index]}
      value={item}
      label={item.hanzi}
      editLabel="Sửa từ"
     >
      {card}
     </EditableNodeWrapper>
    );
   })}
  </div>
 );
}
