import type { NoteItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";

export function NoteCard({
 item,
 displayMode,
}: {
 item: NoteItem;
 displayMode: LessonDisplayMode;
}) {
 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div className="grid gap-1">
    <h4 className="text-lg font-black text-text-primary">{item.title}</h4>
    {item.structure && (
     <p className="rounded-lg bg-accent-subtle px-3 py-2 font-black text-accent-text">
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
      />
     ))}
    </div>
   )}
  </article>
 );
}
