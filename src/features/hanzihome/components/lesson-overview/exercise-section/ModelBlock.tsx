import type { ReactNode } from "react";

import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { answerToString, asRecord, stringValue } from "../utils";

export function ModelBlock({
 title = "Mẫu",
 values,
 displayMode,
 renderValue,
}: {
 title?: string;
 values: unknown[];
 displayMode: LessonDisplayMode;
 renderValue?: (value: unknown, index: number, content: ReactNode) => ReactNode;
}) {
 const visibleValues = values.filter((value) => {
  if (answerToString(value)) return true;

  const record = asRecord(value);
  return Boolean(
   stringValue(record, "zh") ||
    stringValue(record, "text") ||
    stringValue(record, "prompt") ||
    stringValue(record, "answer"),
  );
 });

 if (visibleValues.length === 0) return null;

 return (
  <div className="rounded-xl border border-accent/30 bg-accent-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-accent-text">{title}</p>
   <div className="mt-2 grid gap-2">
    {visibleValues.map((value, index) => {
     const record = asRecord(value);
     const key = stringValue(record, "id") || `${title}-${answerToString(value) || index}-${index}`;
     const zh =
      stringValue(record, "zh") ||
      stringValue(record, "text") ||
      stringValue(record, "prompt") ||
      answerToString(value);
     const pinyin = stringValue(record, "pinyin");
     const vi =
      stringValue(record, "vi") ||
      stringValue(record, "meaning_vi") ||
      stringValue(record, "answer");

     if (!zh) return null;

     if (typeof value === "string") {
      const content = (
       <p className="text-base font-black text-accent-text" lang="zh-CN">
        {zh}
       </p>
      );

      return <div key={key}>{renderValue ? renderValue(value, index, content) : content}</div>;
     }

     const content = <TextLineCard zh={zh} pinyin={pinyin} vi={vi} displayMode={displayMode} />;

     return <div key={key}>{renderValue ? renderValue(value, index, content) : content}</div>;
    })}
   </div>
  </div>
 );
}
