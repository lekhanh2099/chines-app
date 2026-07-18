import type { NoteItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";
import { containsHanziText, getHanziTypographyStyle } from "./hanzi-typography";

export function NoteCard({
 item,
 displayMode,
 lessonId,
}: {
 item: NoteItem;
 displayMode: LessonDisplayMode;
 lessonId?: string;
}) {
 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div className="grid gap-1">
    <h4
     className="font-black leading-tight text-text-primary"
     lang={containsHanziText(item.title) ? "zh-CN" : undefined}
     style={
      containsHanziText(item.title)
       ? getHanziTypographyStyle(displayMode, { size: "md" })
       : undefined
     }
    >
     {item.title}
    </h4>
    {item.structure && (
     <p
      className="rounded-lg bg-accent-subtle px-3 py-2 font-black leading-[1.7] text-accent-text"
      lang={containsHanziText(item.structure) ? "zh-CN" : undefined}
      style={containsHanziText(item.structure) ? getHanziTypographyStyle(displayMode) : undefined}
     >
      {item.structure}
     </p>
    )}
   </div>
   {displayMode.showMeaning && (
    <p className=" font-semibold leading-relaxed text-text-secondary">{item.meaning_vi}</p>
   )}
   {item.examples.length > 0 && (
    <div className="grid gap-2">
     {item.examples.map((example) => (
      <TextLineCard
       key={example.id}
       zh={example.zh}
       pinyin={example.pinyin}
       vi={example.vi}
       displayMode={displayMode}
       annotationTarget={
        lessonId ? { lessonId, nodeType: "note_example", nodeId: example.id } : undefined
       }
      />
     ))}
    </div>
   )}
  </article>
 );
}
