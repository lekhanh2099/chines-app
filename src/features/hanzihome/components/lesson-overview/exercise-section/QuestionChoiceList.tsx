import type { JsonValue } from "@/types/json";
import { answerToString, asRecord, stringValue } from "../utils";
import { containsHanziText, getHanziTypographyStyle } from "../hanzi-typography";
import type { LessonDisplayMode } from "../types";

export function QuestionChoiceList({
 values,
 displayMode,
}: {
 values: JsonValue[];
 displayMode: LessonDisplayMode;
}) {
 if (values.length === 0) return null;

 const choices = values
  .map((choiceValue, index) => {
   const choice = asRecord(choiceValue);
   const label = stringValue(choice, "label") || String.fromCharCode(65 + index);
   const text =
    stringValue(choice, "text") ||
    stringValue(choice, "zh") ||
    stringValue(choice, "value") ||
    answerToString(choiceValue);

   return text ? { label, text } : null;
  })
  .filter((choice): choice is { label: string; text: string } => Boolean(choice));

 if (choices.length === 0) return null;

 return (
  <div className="rounded-lg border border-border-default bg-bg-primary px-3 py-2 grid gap-2">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Lựa chọn</p>
   <div className="grid gap-1">
    {choices.map((choice, index) => (
     <p
      key={`${choice.label}-${index}`}
      className="font-semibold leading-[1.7] text-text-primary"
      lang={containsHanziText(choice.text) ? "zh-CN" : undefined}
      style={containsHanziText(choice.text) ? getHanziTypographyStyle(displayMode) : undefined}
     >
      <span className="font-black text-accent-text">{choice.label}.</span> {choice.text}
     </p>
    ))}
   </div>
  </div>
 );
}
