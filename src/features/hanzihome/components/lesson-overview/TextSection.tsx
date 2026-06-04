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
 const directLines = block.lines;
 const narrativeParagraphs =
  block.type === "text_narrative" ? block.paragraphs : [];
 const dialogueScenes = block.type === "text_dialogue" ? block.scenes : [];
 const shouldRenderDirectLines =
  directLines.length > 0 &&
  (block.type !== "text_narrative" || narrativeParagraphs.length === 0);

 return (
  <section className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-2.5 sm:gap-4 sm:rounded-2xl sm:p-4">
   <div>
    <h4 className="text-base font-black text-text-primary sm:text-lg">
     {block.title_vi || block.title}
    </h4>
    <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
     {block.title}
    </p>
   </div>

   {shouldRenderDirectLines && (
    <div className="rounded-lg border border-border-default bg-bg-primary px-3 sm:rounded-xl sm:px-4">
     {directLines.map((line) => (
      <TextLineCard
       key={line.id}
       speaker={line.speaker}
       zh={line.zh}
       pinyin={line.pinyin}
       vi={line.vi}
       displayMode={displayMode}
       variant="reader"
      />
     ))}
    </div>
   )}

   {dialogueScenes.map((scene) => (
     <div
      key={scene.id}
      className="grid gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3"
     >
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
        variant="reader"
       />
      ))}
     </div>
    ))}

   {narrativeParagraphs.length > 0 && (
     <div className="rounded-lg border border-border-default bg-bg-primary px-3 sm:rounded-xl sm:px-4">
      {narrativeParagraphs.map((paragraph) => (
       <TextLineCard
        key={paragraph.id}
        zh={paragraph.zh}
        pinyin={paragraph.pinyin}
        vi={paragraph.vi}
        displayMode={displayMode}
        variant="reader"
       />
      ))}
     </div>
    )}
  </section>
 );
}
