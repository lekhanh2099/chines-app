import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { answerToString, asRecord, stringValue } from "../utils";
import { hasRenderableValue } from "../CommonCards";
import { lineTextFromValue } from "./exercise-utils";
import { containsHanziText, getHanziTypographyStyle } from "../hanzi-typography";

export function QuestionDataBlock({
 title,
 value,
 displayMode,
}: {
 title: string;
 value: unknown;
 displayMode: LessonDisplayMode;
}) {
 if (!hasRenderableValue(value)) return null;

 if (typeof value === "string" || typeof value === "number") {
  const text = answerToString(value);

  if (!text) return null;

  return (
   <div className="study-content-surface grid gap-1 rounded-lg border px-3 py-2">
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">{title}</p>
    <p
     className="whitespace-pre-wrap font-semibold leading-[1.7] text-text-primary"
     lang={containsHanziText(text) ? "zh-CN" : undefined}
     style={containsHanziText(text) ? getHanziTypographyStyle(displayMode) : undefined}
    >
     {text}
    </p>
   </div>
  );
 }

 if (Array.isArray(value)) {
  const visibleLines = value.map(lineTextFromValue).filter(Boolean);

  if (visibleLines.length === 0) return null;

  return (
   <div className="study-content-surface grid gap-2 rounded-lg border px-3 py-2">
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">{title}</p>
    <div className="grid gap-1">
     {visibleLines.map((line, index) => (
      <p
       key={`${title}-${index}`}
       className="whitespace-pre-wrap font-semibold leading-relaxed text-text-primary"
       lang="zh-CN"
       style={getHanziTypographyStyle(displayMode)}
      >
       {line}
      </p>
     ))}
    </div>
   </div>
  );
 }

 const record = asRecord(value);
 const zh =
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  stringValue(record, "sentence") ||
  stringValue(record, "prompt") ||
  stringValue(record, "question");
 const pinyin = stringValue(record, "pinyin");
 const vi =
  stringValue(record, "vi") ||
  stringValue(record, "meaning_vi") ||
  stringValue(record, "translation_vi");

 if (zh) {
  return (
   <div className="study-content-surface grid gap-1 rounded-lg border px-3 py-2">
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">{title}</p>
    <TextLineCard zh={zh} pinyin={pinyin} vi={vi} displayMode={displayMode} variant="reader" />
   </div>
  );
 }

 return null;
}
