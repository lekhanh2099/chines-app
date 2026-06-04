import type { ReactNode } from "react";

import { PassageCard } from "./PassageCard";
import { TextLineCard } from "./TextLineCard";
import { getHanziTypographyStyle } from "./hanzi-typography";
import type { LessonDisplayMode } from "./types";
import {
 answerToString,
 arrayValue,
 asRecord,
 getClozeAnswerValues,
 getPassageLikeValue,
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
    stringValue(answer, "id") ||
    `${index + 1}`;
   const value =
    answerToString(answer.answer) ||
    stringValue(answer, "sample_answer") ||
    stringValue(answer, "answer_zh") ||
    stringValue(answer, "value") ||
    stringValue(answer, "text") ||
    stringValue(answer, "zh") ||
    answerToString(answerValue);
   const pinyin =
    stringValue(answer, "answer_pinyin") || stringValue(answer, "pinyin");
   const note =
    stringValue(answer, "explanation_vi") ||
    stringValue(answer, "note_vi") ||
    stringValue(answer, "answer_vi") ||
    stringValue(answer, "usage_note_vi");

   return value
    ? {
       id: `${itemId}-answer-${index}`,
       label,
       value,
       pinyin,
       note,
      }
    : null;
  })
  .filter(
   (
    answer,
   ): answer is {
    id: string;
    label: string;
    value: string;
    pinyin: string;
    note: string;
   } => Boolean(answer),
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
     {answer.pinyin && ` · ${answer.pinyin}`}
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
 const meaning = stringValue(item, "meaning_vi") || stringValue(item, "vi");
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

   <PassageCard
    itemId={stringValue(item, "id") || title}
    passage={passage}
    answers={clozeAnswers}
    displayMode={displayMode}
   />

   {extraFields.length > 0 && (
    <div className="grid gap-2">
     {extraFields.map((field) => (
      <FieldValueBlock
       key={field.key}
       field={field}
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {lineItems.map((lineValue, index) => {
    const line = asRecord(lineValue);
    const lineZh =
     stringValue(line, "zh") ||
     stringValue(line, "text") ||
     answerToString(lineValue);

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
       stringValue(task, "instruction_vi") ||
       stringValue(task, "prompt_vi") ||
       stringValue(task, "prompt") ||
       "Luyện tập";
      const sampleAnswer = Array.isArray(task.sample_answer)
       ? task.sample_answer
          .filter(
           (line): line is string =>
            typeof line === "string" && Boolean(line.trim()),
          )
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

   <RawDataDetails value={value} />
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
 answer_key: "Đáp án",
 answers: "Đáp án",
 ba_sentences: "Câu chữ 把",
 blanks: "Chỗ trống",
 choices: "Lựa chọn",
 cloze_answers: "Đáp án điền khuyết",
 completed_paragraphs: "Bản hoàn chỉnh",
 completed_passage: "Bản hoàn chỉnh",
 completed_text: "Bản hoàn chỉnh",
 completed_text_zh: "Bản hoàn chỉnh",
 content: "Nội dung",
 content_vi: "Nội dung",
 correct: "Đúng",
 correct_examples: "Câu đúng",
 correct_sentence: "Câu đúng",
 culture_note: "Văn hóa / ghi chú",
 culture_note_vi: "Văn hóa / ghi chú",
 data: "Dữ liệu",
 dialogue: "Hội thoại",
 dialogues: "Hội thoại",
 explanation_vi: "Giải thích",
 full_text_answer_reference: "Đáp án toàn bài",
 generated_comprehension_questions: "Câu hỏi đọc hiểu",
 grammar_highlights: "Điểm ngữ pháp trong bài",
 instruction: "Yêu cầu",
 instruction_vi: "Yêu cầu",
 items: "Mục",
 left_items: "Cột A",
 model: "Mẫu",
 model_a: "Mẫu A",
 model_b: "Mẫu B",
 models: "Mẫu",
 notes: "Ghi chú",
 notes_vi: "Ghi chú",
 note_vi: "Ghi chú",
 parts: "Phần",
 passage: "Đoạn văn",
 passage_text: "Đoạn văn",
 passage_with_blanks: "Đoạn văn điền khuyết",
 pattern: "Cấu trúc",
 patterns: "Mẫu luyện",
 questions: "Câu hỏi",
 retell_key_points: "Ý chính kể lại",
 retell_outline: "Dàn ý kể lại",
 retell_prompts: "Gợi ý kể lại",
 right_items: "Cột B",
 prompt: "Câu hỏi",
 sample_retell: "Bài kể mẫu",
 sample_retell_generated: "Bài kể mẫu",
 sample_retelling: "Bài kể mẫu",
 sample_answer: "Đáp án mẫu",
 situations: "Tình huống",
 structure: "Cấu trúc",
 suggested_answers: "Đáp án gợi ý",
 supplement_vocab: "Từ bổ sung",
 supplemental_vocab: "Từ bổ sung",
 supplementary_vocab: "Từ bổ sung",
 supplementary_vocabulary: "Từ bổ sung",
 supplementary_words: "Từ bổ sung",
 text: "Nội dung",
 text_with_blanks: "Nội dung điền khuyết",
 translation_vi: "Dịch nghĩa",
 word_bank: "Từ cho sẵn",
 wrong: "Sai",
 wrong_examples: "Câu sai",
 wrong_sentence: "Câu sai",
};

const GENERIC_FIELD_ORDER = [
 "structure",
 "pattern",
 "content_vi",
 "content",
 "instruction",
 "instruction_vi",
 "prompt",
 "text",
 "questions",
 "word_bank",
 "choices",
 "answer",
 "answers",
 "answer_key",
 "full_text_answer_reference",
 "sample_answer",
 "suggested_answers",
 "completed_text",
 "completed_text_zh",
 "completed_passage",
 "wrong",
 "wrong_sentence",
 "correct",
 "correct_sentence",
 "explanation_vi",
 "note_vi",
 "notes_vi",
 "notes",
 "translation_vi",
 "supplementary_words",
 "supplementary_vocab",
 "supplementary_vocabulary",
 "supplement_vocab",
 "parts",
 "items",
];

const BASE_HIDDEN_GENERIC_FIELDS = new Set([
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
 "grading",
]);

const PASSAGE_HANDLED_FIELDS = new Set([
 "passage",
 "passage_text",
 "passage_with_blanks",
 "passage_blanked",
 "passage_complete",
 "text_with_blanks",
 "cloze_text",
 "paragraphs",
 "segments",
 "blanks",
 "answers",
 "answer_key",
 "cloze_answers",
 "completed_paragraphs",
 "completed_passage",
 "completed_text",
 "completed_text_zh",
 "supplementary_words",
 "supplementary_vocab",
 "supplementary_vocabulary",
 "supplement_vocab",
 "supplemental_vocab",
 "word_bank",
 "rendering",
]);

function getFieldLabel(key: string) {
 return FIELD_LABELS[key] || key.replaceAll("_", " ");
}

function getRenderableFields(
 item: Record<string, unknown>,
 options: { hasPassage?: boolean } = {},
): RenderableField[] {
 const hiddenFields = new Set(BASE_HIDDEN_GENERIC_FIELDS);

 if (options.hasPassage) {
  PASSAGE_HANDLED_FIELDS.forEach((key) => hiddenFields.add(key));
 }

 const orderedKeys = [
  ...GENERIC_FIELD_ORDER,
  ...Object.keys(item).filter((key) => !GENERIC_FIELD_ORDER.includes(key)),
 ];

 return orderedKeys
  .filter((key, index) => orderedKeys.indexOf(key) === index)
  .filter((key) => !hiddenFields.has(key))
  .map((key) => ({ key, label: getFieldLabel(key), value: item[key] }))
  .filter((field) => hasRenderableValue(field.value));
}

export function hasRenderableValue(value: unknown): boolean {
 if (typeof value === "string") return Boolean(value.trim());
 if (typeof value === "number" || typeof value === "boolean") return true;
 if (Array.isArray(value)) return value.some(hasRenderableValue);

 const record = asRecord(value);

 return (
  Object.keys(record).length > 0 &&
  Object.values(record).some(hasRenderableValue)
 );
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
 const nestedPassage = getPassageLikeValue(record);

 if (nestedPassage) {
  return (
   <PassageCard
    itemId={stringValue(record, "id") || "nested-passage"}
    passage={nestedPassage}
    answers={getClozeAnswerValues(record)}
    displayMode={displayMode}
   />
  );
 }

 const primary =
  stringValue(record, "title_vi") ||
  stringValue(record, "title") ||
  stringValue(record, "hanzi") ||
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  stringValue(record, "prompt") ||
  stringValue(record, "question") ||
  stringValue(record, "statement") ||
  stringValue(record, "answer") ||
  stringValue(record, "sample_answer") ||
  answerToString(value);

 const secondary =
  stringValue(record, "meaning_vi") ||
  stringValue(record, "vi") ||
  stringValue(record, "pinyin") ||
  stringValue(record, "explanation_vi") ||
  stringValue(record, "note_vi");

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
      <div key={key} className="grid gap-1 rounded-lg bg-bg-primary px-3 py-2">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        {getFieldLabel(key)}
       </p>
       <FieldValue value={entryValue} displayMode={displayMode} />
      </div>
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
 const nestedPassage = getPassageLikeValue(record, { includeText: true });

 if (nestedPassage && !zh) {
  return (
   <PassageCard
    itemId={stringValue(record, "id") || "field-passage"}
    passage={nestedPassage}
    answers={getClozeAnswerValues(record)}
    displayMode={displayMode}
   />
  );
 }

 if (zh) {
  return (
   <TextLineCard
    zh={zh}
    pinyin={stringValue(record, "pinyin")}
    vi={
     stringValue(record, "vi") ||
     stringValue(record, "meaning_vi") ||
     stringValue(record, "translation_vi")
    }
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

function RawDataDetails({ value }: { value: unknown }) {
 return (
  <details className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
    Dữ liệu gốc của mục này
   </summary>
   <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-primary p-3 text-xs leading-relaxed text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </details>
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
     return (
      <ExercisePill key={`${compactText}-${index}`}>{compactText}</ExercisePill>
     );
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
