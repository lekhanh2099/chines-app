import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { matchingItemText } from "./exercise-utils";

export function MatchingOptionCard({
 label,
 value,
 displayMode,
}: {
 label: string;
 value: unknown;
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
  <div className="grid gap-1 rounded-lg border border-border-default bg-bg-primary px-3 py-2">
   <div className="flex items-start gap-2">
    <span className="mt-0.5 shrink-0 rounded-md bg-accent-subtle px-2 py-0.5 text-xs font-black text-accent-text">
     {label}
    </span>
    <p className="min-w-0 font-black text-text-primary" lang="zh-CN">
     {text}
    </p>
   </div>

   {displayMode.showPinyin && pinyin && (
    <p className="pl-9 text-xs font-bold italic text-text-muted">{pinyin}</p>
   )}

   {displayMode.showMeaning && vi && (
    <p className="pl-9 text-xs font-semibold text-text-secondary">{vi}</p>
   )}
  </div>
 );
}
