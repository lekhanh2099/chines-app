import type { ReactNode } from "react";

import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";
import {
 answerToString,
 arrayValue,
 asRecord,
 stringValue,
} from "./utils";

export function EmptySectionState({ reason }: { reason?: string }) {
 return (
  <div className="rounded-xl border border-dashed border-border-default bg-bg-primary p-4">
   <p className="text-sm font-black text-text-primary">
    Không có dữ liệu cho phần này.
   </p>
   {reason && (
    <p className="mt-1 text-sm font-semibold text-text-muted">{reason}</p>
   )}
  </div>
 );
}

export function ExercisePill({ children }: { children: ReactNode }) {
 return (
  <span className="rounded-lg border border-border-default bg-bg-subtle px-3 py-2 text-sm font-bold text-text-primary">
   {children}
  </span>
 );
}

export function ExerciseQuestionCard({
 index,
 title,
 answer,
 note,
 children,
}: {
 index: number;
 title: string;
 answer?: string;
 note?: string;
 children?: ReactNode;
}) {
 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-sm font-black text-text-primary">
    {index}. {title}
   </p>
   {answer && (
    <p className="rounded-lg bg-accent-subtle px-3 py-2 text-sm font-bold text-accent-text">
     {answer}
    </p>
   )}
   {children}
   {note && (
    <p className="text-xs font-semibold leading-relaxed text-text-muted">
     {note}
    </p>
   )}
  </div>
 );
}

export function AnswerKeyList({
 itemId,
 values,
}: {
 itemId: string;
 values: unknown[];
}) {
 const answers = values
  .map((answerValue, index) => {
   const answer = asRecord(answerValue);
   const label =
    stringValue(answer, "blank_id") ||
    stringValue(answer, "question_id") ||
    stringValue(answer, "label") ||
    `${index + 1}`;
   const value =
    answerToString(answer.answer) || stringValue(answer, "sample_answer");
   const note = stringValue(answer, "explanation_vi");
   return value
    ? { id: `${itemId}-answer-${index}`, label, value, note }
    : null;
  })
  .filter(
   (
    answer,
   ): answer is { id: string; label: string; value: string; note: string } =>
    Boolean(answer),
  );

 if (answers.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-accent/30 bg-accent-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-accent-text">
    Đáp án
   </p>
   {answers.map((answer) => (
    <p key={answer.id} className="text-sm font-bold text-accent-text">
     {answer.label}: {answer.value}
     {answer.note && ` — ${answer.note}`}
    </p>
   ))}
  </div>
 );
}

export function GenericItemCard({
 value,
 displayMode,
}: {
 value: unknown;
 displayMode: LessonDisplayMode;
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
 const meaning =
  stringValue(item, "meaning_vi") || stringValue(item, "vi");
 const functionVi = stringValue(item, "function_vi");
 const lineItems = Array.isArray(item.lines)
  ? item.lines
  : Array.isArray(item.dialogue)
    ? item.dialogue
    : [];
 const practiceTasks = Array.isArray(item.practice_tasks)
  ? item.practice_tasks
  : [];
 const examples = arrayValue(item, "examples");
 const extraFields = getRenderableFields(item);

 return (
  <article className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <h4 className="text-base font-black text-text-primary">{title}</h4>
   {hanzi && hanzi !== title && (
    <p lang="zh-CN" style={getInlineHanziStyle(displayMode)}>
     {hanzi}
    </p>
   )}
   {zh && zh !== title && (
    <TextLineCard
     zh={zh}
     pinyin={pinyin}
     vi={meaning}
     displayMode={displayMode}
    />
   )}
   {displayMode.showPinyin && pinyin && (
    <p className="text-sm font-bold italic text-text-muted">{pinyin}</p>
   )}
   {displayMode.showMeaning && meaning && (
    <p className="text-sm font-semibold text-text-secondary">{meaning}</p>
   )}
   {functionVi && (
    <p className="text-sm font-semibold text-text-secondary">{functionVi}</p>
   )}
   {extraFields.length > 0 && (
    <div className="grid gap-2">
     {extraFields.map((field) => (
      <FieldValueBlock key={field.key} field={field} displayMode={displayMode} />
     ))}
    </div>
   )}
   {lineItems.map((lineValue, index) => {
    const line = asRecord(lineValue);
    const zh =
     typeof line.zh === "string"
      ? line.zh
      : typeof line.text === "string"
        ? line.text
        : "";
    if (!zh) return null;
    return (
     <TextLineCard
      key={`${zh}-${index}`}
      speaker={typeof line.speaker === "string" ? line.speaker : undefined}
      zh={zh}
      pinyin={typeof line.pinyin === "string" ? line.pinyin : undefined}
      vi={typeof line.vi === "string" ? line.vi : undefined}
      displayMode={displayMode}
     />
    );
   })}
   {examples.length > 0 && (
    <div className="grid gap-2">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Ví dụ
     </p>
     {examples.map((exampleValue, index) => {
      const example = asRecord(exampleValue);
      const exampleZh =
       stringValue(example, "zh") ||
       stringValue(example, "text") ||
       answerToString(exampleValue);
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
       typeof task.instruction_vi === "string" ? task.instruction_vi : "";
      const sampleAnswer = Array.isArray(task.sample_answer)
       ? task.sample_answer
          .filter(
           (line): line is string =>
            typeof line === "string" && Boolean(line.trim()),
          )
          .join(" / ")
       : "";

      return (
       <ExerciseQuestionCard
        key={typeof task.id === "string" ? task.id : `${title}-${index}`}
        index={index + 1}
        title={instruction || "Luyện tập"}
        answer={sampleAnswer}
       />
      );
     })}
    </div>
   )}
  </article>
 );
}

type RenderableField = {
 key: string;
 label: string;
 value: unknown;
};

const FIELD_LABELS: Record<string, string> = {
 answer: "Đáp án",
 correct: "Đúng",
 correct_sentence: "Câu đúng",
 explanation_vi: "Giải thích",
 instruction_vi: "Yêu cầu",
 note_vi: "Ghi chú",
 pattern: "Cấu trúc",
 prompt: "Câu hỏi",
 sample_answer: "Đáp án mẫu",
 structure: "Cấu trúc",
 text: "Nội dung",
 wrong: "Sai",
 wrong_sentence: "Câu sai",
};

const GENERIC_FIELD_ORDER = [
 "structure",
 "pattern",
 "content_vi",
 "instruction_vi",
 "prompt",
 "text",
 "answer",
 "sample_answer",
 "wrong",
 "wrong_sentence",
 "correct",
 "correct_sentence",
 "explanation_vi",
 "note_vi",
];

const HIDDEN_GENERIC_FIELDS = new Set([
 "id",
 "type",
 "variant",
 "order",
 "title",
 "title_vi",
 "hanzi",
 "pinyin",
 "meaning_vi",
 "meaning_en",
 "vi",
 "zh",
 "function_vi",
 "lines",
 "dialogue",
 "examples",
 "practice_tasks",
 "grammar_refs",
 "vocab_refs",
 "source_refs",
 "source_origin",
 "audio_key",
 "check_needed",
 "answer_verified",
 "rendering",
 "grading",
]);

function getInlineHanziStyle(displayMode: LessonDisplayMode) {
 return {
  fontFamily:
   displayMode.hanziFont === "kai"
    ? '"Hanzi Kaiti", "Kaiti SC", serif'
    : displayMode.hanziFont === "mengshen"
      ? '"Mengshen Han Serif", "Hanzi Songti", "Songti SC", serif'
      : '"Hanzi Songti", "Songti SC", serif',
  fontSize: "1.75rem",
  fontWeight: 700,
  lineHeight: 1.25,
 };
}

function getFieldLabel(key: string) {
 return FIELD_LABELS[key] || key.replaceAll("_", " ");
}

function getRenderableFields(item: Record<string, unknown>): RenderableField[] {
 const orderedKeys = [
  ...GENERIC_FIELD_ORDER,
  ...Object.keys(item).filter((key) => !GENERIC_FIELD_ORDER.includes(key)),
 ];

 return orderedKeys
  .filter((key, index) => orderedKeys.indexOf(key) === index)
  .filter((key) => !HIDDEN_GENERIC_FIELDS.has(key))
  .map((key) => ({ key, label: getFieldLabel(key), value: item[key] }))
  .filter((field) => hasRenderableValue(field.value));
}

function hasRenderableValue(value: unknown): boolean {
 if (typeof value === "string") return Boolean(value.trim());
 if (typeof value === "number" || typeof value === "boolean") return true;
 if (Array.isArray(value)) return value.some(hasRenderableValue);
 const record = asRecord(value);
 return Object.keys(record).length > 0 && Object.values(record).some(hasRenderableValue);
}

function FieldValueBlock({
 field,
 displayMode,
}: {
 field: RenderableField;
 displayMode: LessonDisplayMode;
}) {
 const value = field.value;
 if (!hasRenderableValue(value)) return null;

 return (
  <div className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    {field.label}
   </p>
   <div className="mt-2">
    <FieldValue value={value} displayMode={displayMode} />
   </div>
  </div>
 );
}

function FieldValue({
 value,
 displayMode,
}: {
 value: unknown;
 displayMode: LessonDisplayMode;
}) {
 if (typeof value === "string" || typeof value === "number") {
  return (
   <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-text-secondary">
    {value}
   </p>
  );
 }

 if (typeof value === "boolean") {
  return (
   <p className="text-sm font-semibold text-text-secondary">
    {value ? "Có" : "Không"}
   </p>
  );
 }

 if (Array.isArray(value)) {
  return (
   <div className="grid gap-2">
    {value.map((entry, index) => (
     <FieldListItem
      key={`field-entry-${index}`}
      value={entry}
      displayMode={displayMode}
     />
    ))}
   </div>
  );
 }

 const record = asRecord(value);
 const primary =
  stringValue(record, "title_vi") ||
  stringValue(record, "title") ||
  stringValue(record, "hanzi") ||
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  stringValue(record, "prompt") ||
  stringValue(record, "answer") ||
  answerToString(value);
 const secondary =
  stringValue(record, "meaning_vi") ||
  stringValue(record, "vi") ||
  stringValue(record, "pinyin") ||
  stringValue(record, "explanation_vi");

 return (
  <div className="grid gap-1 text-sm font-semibold text-text-secondary">
   {primary && <p className="text-text-primary">{primary}</p>}
   {displayMode.showMeaning && secondary && secondary !== primary && (
    <p>{secondary}</p>
   )}
   {!primary &&
    Object.entries(record)
     .filter(([, entryValue]) => hasRenderableValue(entryValue))
     .map(([key, entryValue]) => (
      <p key={key}>
       <span className="font-black text-text-primary">{getFieldLabel(key)}:</span>{" "}
       {answerToString(entryValue) || stringValue(asRecord(entryValue), "text")}
      </p>
     ))}
  </div>
 );
}

function FieldListItem({
 value,
 displayMode,
}: {
 value: unknown;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(value);
 const zh = stringValue(record, "zh") || stringValue(record, "text");
 if (zh) {
  return (
   <TextLineCard
    zh={zh}
    pinyin={stringValue(record, "pinyin")}
    vi={stringValue(record, "vi") || stringValue(record, "meaning_vi")}
    displayMode={displayMode}
   />
  );
 }

 const text = answerToString(value);
 if (text) return <ExercisePill>{text}</ExercisePill>;

 return (
  <div className="rounded-lg bg-bg-primary px-3 py-2">
   <FieldValue value={value} displayMode={displayMode} />
  </div>
 );
}

export function LooseItemGrid({
 items,
 displayMode,
 emptyReason,
}: {
 items: unknown[];
 displayMode: LessonDisplayMode;
 emptyReason?: string;
}) {
 const visibleItems = items.filter(hasRenderableValue);

 if (visibleItems.length === 0) {
  return <EmptySectionState reason={emptyReason} />;
 }

 return (
  <div className="grid gap-2 sm:grid-cols-2">
   {visibleItems.map((item, index) => {
    const text = answerToString(item);
    if (text) {
     return <ExercisePill key={`${text}-${index}`}>{text}</ExercisePill>;
    }

    const record = asRecord(item);
    const compactText =
     stringValue(record, "text") ||
     stringValue(record, "substitution") ||
     stringValue(record, "prompt") ||
     stringValue(record, "answer");

    if (compactText && Object.keys(record).length <= 3) {
     return <ExercisePill key={`${compactText}-${index}`}>{compactText}</ExercisePill>;
    }

    return (
     <GenericItemCard
      key={stringValue(record, "id") || `${index}`}
      value={item}
      displayMode={displayMode}
     />
    );
   })}
  </div>
 );
}
