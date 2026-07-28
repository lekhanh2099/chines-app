import type { JsonFieldValue } from "@/types/json";
import { RawDataDetails } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { properNounBackText, properNounFrontText, stringList } from "./proper-noun-utils";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";

export function ProperNounCard({
 item,
 displayMode,
 debugMode,
}: {
 item: JsonFieldValue;
 displayMode: LessonDisplayMode;
 debugMode: boolean;
}) {
 const record = asRecord(item);
 const flashcard = asRecord(record.flashcard);

 const hanzi = properNounFrontText(record);
 const pinyin = stringValue(record, "pinyin");
 const meaning = properNounBackText(record);
 const pos = stringValue(record, "pos");
 const posDetail = asRecord(record.pos_detail);
 const posDetailVi = stringValue(posDetail, "vi");
 const tags = stringList(record.tags);
 const modes = stringList(flashcard.modes);

 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div className="grid gap-1">
    {hanzi && (
     <div className="flex items-center gap-1.5">
      <h4 className="text-2xl font-black leading-none text-text-primary" lang="zh-CN">
       {hanzi}
      </h4>
      <NativeMandarinSpeakButton text={hanzi} />
     </div>
    )}

    {displayMode.showPinyin && pinyin && <p className=" font-black text-primary">{pinyin}</p>}

    {displayMode.showMeaning && meaning && (
     <p className=" font-semibold leading-relaxed text-text-secondary">{meaning}</p>
    )}
   </div>

   {(pos || posDetailVi) && (
    <div className="flex flex-wrap gap-2">
     {pos && (
      <span className="rounded-full border border-border-default bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
       {pos}
      </span>
     )}

     {posDetailVi && posDetailVi !== pos && (
      <span className="rounded-full border border-border-default bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
       {posDetailVi}
      </span>
     )}
    </div>
   )}

   {tags.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {tags.map((tag) => (
      <span
       key={tag}
       className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-black text-accent-text"
      >
       {tag.replaceAll("_", " ")}
      </span>
     ))}
    </div>
   )}

   {modes.length > 0 && (
    <details className="rounded-lg border border-border-default bg-bg-subtle p-3 grid gap-2">
     <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
      Flashcard modes
     </summary>
     <div className="flex flex-wrap gap-2">
      {modes.map((mode) => (
       <span
        key={mode}
        className="rounded-full border border-border-default bg-bg-primary px-3 py-1 text-xs font-black text-text-muted"
       >
        {mode.replaceAll("_", " → ")}
       </span>
      ))}
     </div>
    </details>
   )}

   {debugMode && <RawDataDetails value={item} />}
  </article>
 );
}
