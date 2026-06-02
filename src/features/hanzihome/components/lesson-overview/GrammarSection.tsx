import type {
 GrammarBlock,
 GrammarPoint,
} from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";
import { arrayValue, asRecord, stringValue } from "./utils";

function GrammarBlockView({
 block,
 displayMode,
}: {
 block: GrammarBlock;
 displayMode: LessonDisplayMode;
}) {
 const blockRecord = asRecord(block);
 const content = stringValue(blockRecord, "content_vi");
 const pattern = stringValue(blockRecord, "pattern");
 const meaning = stringValue(blockRecord, "meaning_vi");
 const examples = arrayValue(blockRecord, "examples")
  .map(asRecord)
  .filter((example) => stringValue(example, "zh"));

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <h5 className="font-black text-text-primary">{block.title}</h5>
   {content && (
    <p className="text-sm font-semibold text-text-secondary">{content}</p>
   )}
   {pattern && (
    <p className="rounded-lg bg-accent-subtle px-3 py-2 font-black text-accent-text">
     {pattern}
    </p>
   )}
   {displayMode.showMeaning && meaning && (
    <p className="text-sm font-semibold text-text-secondary">{meaning}</p>
   )}
   {examples.length > 0 && (
    <div className="grid gap-2">
     {examples.map((example, index) => (
      <TextLineCard
       key={stringValue(example, "id") || `${block.id}-${index}`}
       zh={stringValue(example, "zh")}
       pinyin={stringValue(example, "pinyin")}
       vi={stringValue(example, "vi")}
       displayMode={displayMode}
      />
     ))}
    </div>
   )}
  </div>
 );
}

export function GrammarCard({
 item,
 displayMode,
}: {
 item: GrammarPoint;
 displayMode: LessonDisplayMode;
}) {
 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-4">
   <div>
    <h4 className="text-lg font-black text-text-primary">
     {item.title_vi || item.title}
    </h4>
    <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
     {item.title}
    </p>
   </div>
   <div className="grid gap-2">
    {item.blocks.map((block) => (
     <GrammarBlockView key={block.id} block={block} displayMode={displayMode} />
    ))}
   </div>
  </article>
 );
}
