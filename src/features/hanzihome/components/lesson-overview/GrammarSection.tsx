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
 const formulas = arrayValue(blockRecord, "formulas").map(asRecord);
 const notes = arrayValue(blockRecord, "notes_vi").filter(
  (note): note is string => typeof note === "string" && Boolean(note.trim()),
 );
 const examples = arrayValue(blockRecord, "examples")
  .map(asRecord)
  .filter((example) => stringValue(example, "zh"));
 const items = arrayValue(blockRecord, "items").map(asRecord);

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
   {formulas.length > 0 && (
    <div className="grid gap-2">
     {formulas.map((formula, index) => (
      <p
       key={`${block.id}-formula-${index}`}
       className="rounded-lg border border-info/30 bg-info-subtle px-3 py-2 text-sm font-black text-info-text"
      >
       {stringValue(formula, "label")
        ? `${stringValue(formula, "label")}: `
        : ""}
       {stringValue(formula, "pattern")}
      </p>
     ))}
    </div>
   )}
   {items.length > 0 && (
    <div className="grid gap-2">
     {items.map((item, index) => (
      <GrammarBlockItemView key={`${block.id}-item-${index}`} item={item} />
     ))}
    </div>
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
   {notes.length > 0 && (
    <div className="grid gap-1">
     {notes.map((note) => (
      <p key={note} className="text-sm font-semibold text-text-secondary">
       {note}
      </p>
     ))}
    </div>
   )}
  </div>
 );
}

function GrammarBlockItemView({ item }: { item: Record<string, unknown> }) {
 const left = asRecord(item.left);
 const right = asRecord(item.right);
 const aspect = stringValue(item, "aspect");
 const wrong = stringValue(item, "wrong");
 const correct = stringValue(item, "correct");
 const explanation = stringValue(item, "explanation_vi");

 if (stringValue(left, "label") || stringValue(right, "label")) {
  return (
   <div className="grid gap-2 rounded-lg border border-border-default bg-bg-subtle p-3">
    {aspect && (
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      {aspect}
     </p>
    )}
    <div className="grid gap-2 sm:grid-cols-2">
     {[left, right].map((side, index) => (
      <div
       key={`${stringValue(side, "label")}-${index}`}
       className="rounded-lg bg-bg-primary p-3"
      >
       <p className="font-black text-text-primary">
        {stringValue(side, "label")}
       </p>
       <p className="text-sm font-semibold leading-relaxed text-text-secondary">
        {stringValue(side, "value")}
       </p>
      </div>
     ))}
    </div>
   </div>
  );
 }

 if (wrong || correct) {
  return (
   <div className="grid gap-2 rounded-lg border border-danger/20 bg-danger-subtle/40 p-3">
    {wrong && (
     <p className="text-sm font-semibold text-danger-text">
      Sai: <span className="font-black">{wrong}</span>
     </p>
    )}
    {correct && (
     <p className="text-sm font-semibold text-success-text">
      Đúng: <span className="font-black">{correct}</span>
     </p>
    )}
    {explanation && (
     <p className="text-sm font-semibold leading-relaxed text-text-secondary">
      {explanation}
     </p>
    )}
   </div>
  );
 }

 return null;
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
