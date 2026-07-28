import type { JsonFieldValue } from "@/types/json";
import { PassageCard } from "../PassageCard";
import { TextLineCard } from "../TextLineCard";
import { containsHanziText, getHanziTypographyStyle } from "../hanzi-typography";
import type { LessonDisplayMode } from "../types";
import {
 answerToString,
 arrayValue,
 asRecord,
 getClozeAnswerValues,
 getPassageLikeValue,
 stringValue,
} from "../utils";
import { ExerciseQuestionCard } from "./ExerciseQuestionCard";
import { FieldValueBlock } from "./FieldValueBlock";
import { getRenderableFields } from "./generic-field-utils";
import { RawDataDetails } from "./RawDataDetails";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";

export function GenericItemCard({
 value,
 displayMode,
 debugMode = false,
}: {
 value: JsonFieldValue;
 displayMode: LessonDisplayMode;
 debugMode?: boolean;
}) {
 const item = asRecord(value);
 const title =
  stringValue(item, "title_vi") ||
  stringValue(item, "title") ||
  stringValue(item, "hanzi") ||
  stringValue(item, "zh") ||
  stringValue(item, "text") ||
  stringValue(item, "id") ||
  "Mục";

 const hanzi = stringValue(item, "hanzi");
 const zh = stringValue(item, "zh");
 const pinyin = stringValue(item, "pinyin");
 const meaning = stringValue(item, "meaning_vi") || stringValue(item, "vi");
 const functionVi = stringValue(item, "function_vi");

 const lineItems = Array.isArray(item.lines)
  ? item.lines
  : Array.isArray(item.dialogue)
    ? item.dialogue
    : [];

 const practiceTasks = Array.isArray(item.practice_tasks) ? item.practice_tasks : [];

 const examples = arrayValue(item, "examples");
 const passage = getPassageLikeValue(item);
 const clozeAnswers = getClozeAnswerValues(item);
 const extraFields = getRenderableFields(item, {
  hasPassage: Boolean(passage),
 });

 return (
  <article className="study-content-surface grid gap-2 rounded-xl border p-3">
   <h4
    className="font-black leading-tight text-text-primary"
    lang={containsHanziText(title) ? "zh-CN" : undefined}
    style={
     containsHanziText(title) ? getHanziTypographyStyle(displayMode, { size: "md" }) : undefined
    }
   >
    {title}
   </h4>

   {hanzi && hanzi !== title && (
    <div className="flex items-center gap-1.5">
     <p lang="zh-CN" style={getHanziTypographyStyle(displayMode)}>
      {hanzi}
     </p>
     <NativeMandarinSpeakButton text={hanzi} />
    </div>
   )}

   {zh && zh !== title && (
    <TextLineCard zh={zh} pinyin={pinyin} vi={meaning} displayMode={displayMode} />
   )}

   {displayMode.showPinyin && pinyin && (
    <p className=" font-bold italic text-text-muted">{pinyin}</p>
   )}

   {displayMode.showMeaning && meaning && (
    <p className=" font-semibold text-text-secondary">{meaning}</p>
   )}

   {functionVi && <p className=" font-semibold text-text-secondary">{functionVi}</p>}

   <PassageCard
    itemId={stringValue(item, "id") || title}
    passage={passage}
    answers={clozeAnswers}
    displayMode={displayMode}
   />

   {extraFields.length > 0 && (
    <div className="grid gap-2">
     {extraFields.map((field) => (
      <FieldValueBlock key={field.key} field={field} displayMode={displayMode} />
     ))}
    </div>
   )}

   {lineItems.map((lineValue, index) => {
    const line = asRecord(lineValue);
    const lineZh =
     stringValue(line, "zh") || stringValue(line, "text") || answerToString(lineValue);

    if (!lineZh) return null;

    return (
     <TextLineCard
      key={stringValue(line, "id") || `${lineZh}-${index}`}
      speaker={stringValue(line, "speaker")}
      zh={lineZh}
      pinyin={stringValue(line, "pinyin")}
      vi={stringValue(line, "vi")}
      displayMode={displayMode}
     />
    );
   })}

   {examples.length > 0 && (
    <div className="grid gap-2">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">Ví dụ</p>
     {examples.map((exampleValue, index) => {
      const example = asRecord(exampleValue);
      const exampleZh =
       stringValue(example, "zh") || stringValue(example, "text") || answerToString(exampleValue);

      if (!exampleZh) return null;

      return (
       <TextLineCard
        key={stringValue(example, "id") || `${title}-example-${index}`}
        zh={exampleZh}
        pinyin={stringValue(example, "pinyin")}
        vi={stringValue(example, "vi") || stringValue(example, "meaning_vi")}
        displayMode={displayMode}
       />
      );
     })}
    </div>
   )}

   {practiceTasks.length > 0 && (
    <div className="grid gap-2">
     {practiceTasks.map((taskValue, index) => {
      const task = asRecord(taskValue);
      const instruction =
       stringValue(task, "instruction_vi") ||
       stringValue(task, "prompt_vi") ||
       stringValue(task, "prompt") ||
       "Luyện tập";
      const sampleAnswer = Array.isArray(task.sample_answer)
       ? task.sample_answer
          .filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
          .join(" / ")
       : stringValue(task, "sample_answer");

      return (
       <ExerciseQuestionCard
        key={stringValue(task, "id") || `${title}-${index}`}
        index={index + 1}
        title={instruction}
        answer={sampleAnswer}
        showAnswer={displayMode.showAnswers}
        note={stringValue(task, "explanation_vi")}
        displayMode={displayMode}
       />
      );
     })}
    </div>
   )}

   {debugMode && <RawDataDetails value={value} />}
  </article>
 );
}
