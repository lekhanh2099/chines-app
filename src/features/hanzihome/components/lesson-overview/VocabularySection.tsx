"use client";

import { Badge } from "@/components/ui/badge";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import type { VocabularyItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import { VocabBulkEditDialog } from "@/features/hanzihome/components/vocab/VocabBulkEditDialog";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";

import type { LessonDisplayMode } from "./types";
import { getHanziTypographyStyle } from "./hanzi-typography";
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
 const editMode = useHanziHomeEditMode();
 const canBulkEdit = Boolean(editMode && lessonId && itemsPath && items.length > 0);

 return (
  <div className="grid gap-2">
   {canBulkEdit ? (
    <div className="flex items-center justify-end">
     <VocabBulkEditDialog
      lessonId={lessonId as string}
      parentSectionId={parentSectionId}
      items={items}
      getEntityId={(item) => item.id}
      getItemPath={(_, index) => [...(itemsPath as EditableNodePath), index]}
     />
    </div>
   ) : null}
   <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => {
     const meaning = vocabMeaning(item);
     const hanviet = stringValue(asRecord(item), "hanviet");
     return (
      <div key={item.id} className="study-content-surface rounded-xl border p-3">
       <div className="flex flex-wrap items-center gap-2">
        <p
         className="font-black leading-[1.5] text-text-primary"
         lang="zh-CN"
         style={getHanziTypographyStyle(displayMode)}
        >
         {item.hanzi}
        </p>
        <NativeMandarinSpeakButton text={item.hanzi} />
        {displayMode.showPinyin && item.pinyin && (
         <p className="font-bold text-accent-text">{item.pinyin}</p>
        )}
       </div>
       {hanviet && <p className="text-sm font-bold text-text-muted">{hanviet}</p>}
       {meaning && <p className=" font-semibold leading-relaxed text-text-secondary">{meaning}</p>}
       {item.pos !== "unknown" && <Badge>{item.pos}</Badge>}
      </div>
     );
    })}
   </div>
  </div>
 );
}
