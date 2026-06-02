import type { TextBlock } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";

export function TextBlockView({
 block,
 displayMode,
}: {
 block: TextBlock;
 displayMode: LessonDisplayMode;
}) {
 const lines = block.lines;

 return (
  <section className="grid gap-3 rounded-2xl border border-border-default bg-bg-subtle p-4">
   <div>
    <h4 className="text-lg font-black text-text-primary">
     {block.title_vi || block.title}
    </h4>
    <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
     {block.title}
    </p>
   </div>

   {lines.length > 0 && (
    <div className="grid gap-2">
     {lines.map((line) => (
      <TextLineCard
       key={line.id}
       speaker={line.speaker}
       zh={line.zh}
       pinyin={line.pinyin}
       vi={line.vi}
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {block.type === "text_dialogue" &&
    block.scenes.map((scene) => (
     <div key={scene.id} className="grid gap-2">
      {scene.summary_vi && (
       <p className="text-sm font-bold text-text-muted">{scene.summary_vi}</p>
      )}
      {scene.lines.map((line) => (
       <TextLineCard
        key={line.id}
        speaker={line.speaker}
        zh={line.zh}
        pinyin={line.pinyin}
        vi={line.vi}
        displayMode={displayMode}
       />
      ))}
     </div>
    ))}

   {block.type === "text_narrative" &&
    block.paragraphs.map((paragraph) => (
     <TextLineCard
      key={paragraph.id}
      zh={paragraph.zh}
      pinyin={paragraph.pinyin}
      vi={paragraph.vi}
      displayMode={displayMode}
     />
    ))}
  </section>
 );
}
