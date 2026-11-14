import type { JsonValue } from "@/types/json";
import { answerToString, asRecord, stringValue } from "../utils";
import { AdaptiveStudyText, StudyInstructionText } from "../hanzi-typography";
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
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    Lựa chọn
   </StudyInstructionText>
   <div className="grid gap-1">
    {choices.map((choice, index) => (
     <AdaptiveStudyText
      key={`${choice.label}-${index}`}
      text={`${choice.label}. ${choice.text}`}
      displayMode={displayMode}
      tone="default"
      weight="semibold"
      leading="learner"
     />
    ))}
   </div>
  </div>
 );
}
