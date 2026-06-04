import { TextLineCard } from "./TextLineCard";
import { getHanziTypographyStyle } from "./hanzi-typography";
import type { LessonDisplayMode } from "./types";
import { answerToString, arrayValue, asRecord, stringValue } from "./utils";

type PassageLine = {
 id: string;
 zh: string;
 pinyin?: string;
 vi?: string;
};

function passageLinesFromParagraphs(paragraphs: unknown[], itemId: string) {
 return paragraphs
  .map((paragraphValue, index): PassageLine | null => {
   if (typeof paragraphValue === "string") {
    const text = paragraphValue.trim();
    return text
     ? { id: `${itemId}-passage-paragraph-${index}`, zh: text }
     : null;
   }

   const paragraph = asRecord(paragraphValue);
   const zh =
    stringValue(paragraph, "zh") ||
    stringValue(paragraph, "text") ||
    stringValue(paragraph, "text_with_blanks") ||
    stringValue(paragraph, "completed_text");

   if (!zh) return null;

   return {
    id:
     stringValue(paragraph, "id") || `${itemId}-passage-paragraph-${index}`,
    zh,
    pinyin: stringValue(paragraph, "pinyin"),
    vi: stringValue(paragraph, "vi"),
   };
  })
  .filter((line): line is PassageLine => Boolean(line));
}

function clozeTextFromSegments(segments: unknown[]) {
 return segments
  .map((segmentValue, index) => {
   const segment = asRecord(segmentValue);
   if (stringValue(segment, "type") === "blank") {
    return ` ____(${stringValue(segment, "blank_id") || index + 1})____ `;
   }
   return (
    stringValue(segment, "text") ||
    stringValue(segment, "zh") ||
    answerToString(segmentValue)
   );
  })
  .join("");
}

export function PassageCard({
 itemId,
 passage,
 displayMode,
}: {
 itemId: string;
 passage: unknown;
 displayMode: LessonDisplayMode;
}) {
 const passageRecord = asRecord(passage);
 const segments =
  arrayValue(passageRecord, "segments").length > 0
   ? arrayValue(passageRecord, "segments")
   : [];
 const passageTitle =
  stringValue(passageRecord, "title_vi") || stringValue(passageRecord, "title");
 const passageLines = passageLinesFromParagraphs(
  arrayValue(passageRecord, "paragraphs"),
  itemId,
 );
 const passageText =
  typeof passage === "string"
   ? passage
   : stringValue(passageRecord, "text_with_blanks") ||
     stringValue(passageRecord, "text") ||
     stringValue(passageRecord, "zh");
 const completedPassageText = stringValue(passageRecord, "completed_text");
 const passagePinyin = stringValue(passageRecord, "pinyin");
 const passageMeaning = stringValue(passageRecord, "vi");
 const clozeText = segments.length > 0 ? clozeTextFromSegments(segments) : "";

 if (
  !passageTitle &&
  passageLines.length === 0 &&
  !passageText &&
  !completedPassageText &&
  !clozeText
 ) {
  return null;
 }

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 sm:p-4">
   {passageTitle && (
    <h5 className="font-black text-text-primary">{passageTitle}</h5>
   )}

   {passageLines.length > 0 && (
    <div className="grid gap-2">
     {passageLines.map((line) => (
      <TextLineCard
       key={line.id}
       zh={line.zh}
       pinyin={line.pinyin}
       vi={line.vi}
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {(passageText || clozeText) && passageLines.length === 0 && (
    <TextLineCard
     zh={passageText || clozeText}
     pinyin={passagePinyin}
     vi={passageMeaning}
     displayMode={displayMode}
    />
   )}

   {completedPassageText && completedPassageText !== passageText && (
    <div className="rounded-lg border border-accent/30 bg-accent-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-accent-text">
      Bản hoàn chỉnh
     </p>
     <p
      className="mt-2 whitespace-pre-wrap leading-8 text-accent-text"
      lang="zh-CN"
      style={getHanziTypographyStyle(displayMode, { size: "lg" })}
     >
      {completedPassageText}
     </p>
    </div>
   )}
  </div>
 );
}
