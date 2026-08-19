import type { JsonFieldValue } from "@/types/json";
import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { answerToString, asRecord, stringValue } from "../utils";
import { hasRenderableValue } from "../CommonCards";
import { lineTextFromValue } from "./exercise-utils";
import { AdaptiveStudyText, StudyInstructionText, ReaderHanziText } from "../hanzi-typography";

export function QuestionDataBlock({
 title,
 value,
 displayMode,
}: {
 title: string;
 value: JsonFieldValue;
 displayMode: LessonDisplayMode;
}) {
 if (!hasRenderableValue(value)) return null;

 if (typeof value === "string" || typeof value === "number") {
  const text = answerToString(value);

  if (!text) return null;

  return (
   <div className="study-content-surface grid gap-1 rounded-lg border px-3 py-2">
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     {title}
    </StudyInstructionText>
    <AdaptiveStudyText
     text={text}
     displayMode={displayMode}
     tone="default"
     weight="semibold"
     leading="learner"
     wrapping="preWrap"
    />
   </div>
  );
 }

 if (Array.isArray(value)) {
  const visibleLines = value.map(lineTextFromValue).filter(Boolean);

  if (visibleLines.length === 0) return null;

  return (
   <div className="study-content-surface grid gap-2 rounded-lg border px-3 py-2">
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     {title}
    </StudyInstructionText>
    <div className="grid gap-1">
     {visibleLines.map((line, index) => (
      <ReaderHanziText
       displayMode={displayMode}
       key={`${title}-${index}`}
       tone="default"
       weight="semibold"
       leading="relaxed"
       wrapping="preWrap"
      >
       {line}
      </ReaderHanziText>
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
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     {title}
    </StudyInstructionText>
    <TextLineCard zh={zh} pinyin={pinyin} vi={vi} displayMode={displayMode} variant="reader" />
   </div>
  );
 }

 return null;
}
