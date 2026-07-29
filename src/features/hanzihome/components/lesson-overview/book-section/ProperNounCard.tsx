import type { JsonFieldValue } from "@/types/json";
import { RawDataDetails } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { properNounBackText, properNounFrontText, stringList } from "./proper-noun-utils";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";
import { HanziText, PinyinText, TranslationText, StudyInstructionText } from "../hanzi-typography";

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
      <HanziText as="h4" size="card" weight="black" leading="none">
       {hanzi}
      </HanziText>
      <NativeMandarinSpeakButton text={hanzi} />
     </div>
    )}

    {displayMode.showPinyin && pinyin && (
     <PinyinText as="p" tone="accent" weight="black">
      {pinyin}
     </PinyinText>
    )}

    {displayMode.showMeaning && meaning && (
     <TranslationText as="p" weight="semibold" leading="relaxed">
      {meaning}
     </TranslationText>
    )}
   </div>

   {(pos || posDetailVi) && (
    <div className="flex flex-wrap gap-2">
     {pos && (
      <StudyInstructionText
       variant="caption"
       tone="muted"
       weight="black"
       className="rounded-full border border-border-default bg-bg-subtle px-3 py-1"
      >
       {pos}
      </StudyInstructionText>
     )}

     {posDetailVi && posDetailVi !== pos && (
      <StudyInstructionText
       variant="caption"
       tone="muted"
       weight="black"
       className="rounded-full border border-border-default bg-bg-subtle px-3 py-1"
      >
       {posDetailVi}
      </StudyInstructionText>
     )}
    </div>
   )}

   {tags.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {tags.map((tag) => (
      <StudyInstructionText
       key={tag}
       variant="caption"
       tone="accent"
       weight="black"
       className="rounded-full bg-accent-subtle px-3 py-1"
      >
       {tag.replaceAll("_", " ")}
      </StudyInstructionText>
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
       <StudyInstructionText
        key={mode}
        variant="caption"
        tone="muted"
        weight="black"
        className="rounded-full border border-border-default bg-bg-primary px-3 py-1"
       >
        {mode.replaceAll("_", " → ")}
       </StudyInstructionText>
      ))}
     </div>
    </details>
   )}

   {debugMode && <RawDataDetails value={item} />}
  </article>
 );
}
