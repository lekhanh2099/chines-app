import { PassageCard } from "../PassageCard";
import { TextLineCard } from "../TextLineCard";
import { getHanziTypographyStyle } from "../hanzi-typography";
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

export function GenericItemCard({
 value,
 displayMode,
 debugMode = false,
}: {
 value: unknown;
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
  <article className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <h4 className="text-base font-black text-text-primary">{title}</h4>

   {hanzi && hanzi !== title && (
    <p lang="zh-CN" style={getHanziTypographyStyle(displayMode)}>
     {hanzi}
    </p>
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
    <div className="mt-2 grid gap-2">
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
        note={stringValue(task, "explanation_vi")}
       />
      );
     })}
    </div>
   )}

   {debugMode && <RawDataDetails value={value} />}
  </article>
 );
}
