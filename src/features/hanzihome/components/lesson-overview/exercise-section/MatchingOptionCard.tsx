import type { JsonFieldValue } from "@/types/json";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { matchingItemText } from "./exercise-utils";
import { StudyInstructionText, ReaderHanziText } from "../hanzi-typography";

export function MatchingOptionCard({
 label,
 value,
 displayMode,
}: {
 label: string;
 value: JsonFieldValue;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(value);
 const text = matchingItemText(value);
 const pinyin = stringValue(record, "pinyin");
 const vi =
  stringValue(record, "vi") ||
  stringValue(record, "meaning_vi") ||
  stringValue(record, "translation_vi");

 if (!text) return null;

 return (
  <div className="study-content-surface grid gap-1 rounded-lg border px-3 py-2">
   <div className="flex items-start gap-2">
    <StudyInstructionText
     variant="caption"
     weight="black"
     className="study-chip-accent mt-0.5 shrink-0 rounded-md border px-2 py-0.5"
    >
     {label}
    </StudyInstructionText>
    <ReaderHanziText
     displayMode={displayMode}
     tone="default"
     weight="black"
     leading="learner"
     className="min-w-0"
    >
     {text}
    </ReaderHanziText>
   </div>

   {displayMode.showPinyin && pinyin && (
    <StudyInstructionText
     variant="caption"
     tone="muted"
     weight="bold"
     emphasis="italic"
     className="pl-9"
    >
     {pinyin}
    </StudyInstructionText>
   )}

   {displayMode.showMeaning && vi && (
    <StudyInstructionText variant="caption" tone="secondary" weight="semibold" className="pl-9">
     {vi}
    </StudyInstructionText>
   )}
  </div>
 );
}
