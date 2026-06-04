import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import {
 AnswerKeyList,
 EmptySectionState,
 ExercisePill,
 ExerciseQuestionCard,
 LooseItemGrid,
} from "./CommonCards";
import { PassageCard } from "./PassageCard";
import { TextLineCard } from "./TextLineCard";
import type { LessonDisplayMode } from "./types";
import {
 answerToString,
 arrayValue,
 asRecord,
 getClozeAnswerValues,
 getPassageLikeValue,
 nonEmptyStrings,
 stringValue,
} from "./utils";

function promptToString(value: unknown): string {
 if (typeof value === "string") return value.trim();
 if (Array.isArray(value)) return nonEmptyStrings(value).join(" / ");

 const record = asRecord(value);

 return (
  stringValue(record, "zh") ||
  stringValue(record, "vi") ||
  stringValue(record, "text") ||
  stringValue(record, "prompt") ||
  stringValue(record, "question")
 );
}

function objectText(value: unknown, keys: string[]) {
 const record = asRecord(value);

 for (const key of keys) {
  const text = stringValue(record, key);
  if (text) return text;
 }

 return "";
}

function formatAnswer(value: unknown): string {
 if (typeof value === "boolean") return value ? "Đúng" : "Sai";
 return answerToString(value);
}

function modelLines(record: Record<string, unknown>): string[] {
 return [
  stringValue(record, "model"),
  stringValue(record, "model_a"),
  stringValue(record, "model_b"),
  stringValue(record, "prompt_a"),
  stringValue(record, "prompt_b"),
 ].filter(Boolean);
}

function ModelBlock({
 title = "Mẫu",
 values,
 displayMode,
}: {
 title?: string;
 values: unknown[];
 displayMode: LessonDisplayMode;
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
   <p className="text-xs font-black uppercase tracking-wide text-accent-text">
    {title}
   </p>
   <div className="mt-2 grid gap-2">
    {visibleValues.map((value, index) => {
     const record = asRecord(value);
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
      return (
       <p
        key={`${zh}-${index}`}
        className="text-base font-black text-accent-text"
        lang="zh-CN"
       >
        {zh}
       </p>
      );
     }

     return (
      <TextLineCard
       key={stringValue(record, "id") || `${zh}-${index}`}
       zh={zh}
       pinyin={pinyin}
       vi={vi}
       displayMode={displayMode}
      />
     );
    })}
   </div>
  </div>
 );
}

function WordBank({ values }: { values: unknown[] }) {
 const words = values.map(answerToString).filter(Boolean);

 if (words.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Từ cho sẵn
   </p>
   <div className="flex flex-wrap gap-2">
    {words.map((word) => (
     <ExercisePill key={word}>{word}</ExercisePill>
    ))}
   </div>
  </div>
 );
}

function SupplementaryPills({
 itemId,
 values,
 displayMode,
}: {
 itemId: string;
 values: unknown[];
 displayMode: LessonDisplayMode;
}) {
 if (values.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    Từ bổ sung
   </p>
   <div className="flex flex-wrap gap-2">
    {values.map((wordValue, index) => {
     const word = asRecord(wordValue);
     const hanzi =
      stringValue(word, "hanzi") ||
      stringValue(word, "text") ||
      stringValue(word, "zh") ||
      answerToString(wordValue);
     const pinyin = stringValue(word, "pinyin");
     const meaning = stringValue(word, "meaning_vi");
     const pos = stringValue(word, "pos");

     if (!hanzi) return null;

     return (
      <ExercisePill key={stringValue(word, "id") || `${itemId}-word-${index}`}>
       {hanzi}
       {displayMode.showPinyin && pinyin && ` · ${pinyin}`}
       {displayMode.showMeaning && meaning && ` · ${meaning}`}
       {pos && ` · ${pos}`}
      </ExercisePill>
     );
    })}
   </div>
  </div>
 );
}

function QuestionCard({
 itemId,
 questionValue,
 index,
}: {
 itemId: string;
 questionValue: unknown;
 index: number;
}) {
 const question = asRecord(questionValue);
 const nestedQuestion = asRecord(question.question);
 const statement = asRecord(question.statement);
 const answerRecord = asRecord(question.answer);

 const choices = arrayValue(question, "choices")
  .map((choiceValue) => {
   const choice = asRecord(choiceValue);
   return (
    stringValue(choice, "text") ||
    stringValue(choice, "zh") ||
    stringValue(choice, "label") ||
    answerToString(choiceValue)
   );
  })
  .filter(Boolean);

 const title =
  promptToString(question.prompt) ||
  stringValue(question, "prompt") ||
  stringValue(question, "wrong") ||
  stringValue(question, "wrong_sentence") ||
  stringValue(question, "response_prompt") ||
  stringValue(question, "question") ||
  stringValue(nestedQuestion, "zh") ||
  stringValue(nestedQuestion, "vi") ||
  stringValue(statement, "zh") ||
  stringValue(statement, "vi") ||
  stringValue(question, "text") ||
  "Câu hỏi";

 const answer =
  stringValue(question, "sample_answer") ||
  stringValue(question, "correct") ||
  stringValue(question, "correct_sentence") ||
  formatAnswer(question.answer) ||
  stringValue(answerRecord, "zh") ||
  stringValue(answerRecord, "vi") ||
  stringValue(question, "correct_answer_label");

 const note =
  stringValue(question, "explanation_vi") ||
  stringValue(question, "note_vi") ||
  objectText(question.evidence, ["quote"]);

 return (
  <ExerciseQuestionCard
   key={stringValue(question, "id") || `${itemId}-${index}`}
   index={index + 1}
   title={choices.length > 0 ? `${title} (${choices.join(" / ")})` : title}
   answer={answer}
   note={note}
  />
 );
}

function PhoneticsExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const parts = arrayValue(record, "parts");
 const fallbackItems = [
  ...arrayValue(record, "items"),
  ...arrayValue(record, "chunks"),
  ...arrayValue(record, "questions"),
 ];

 if (parts.length === 0) {
  return (
   <LooseItemGrid
    items={fallbackItems}
    displayMode={displayMode}
    emptyReason={stringValue(record, "empty_reason_vi")}
   />
  );
 }

 return (
  <div className="grid gap-3">
   {parts.map((partValue, partIndex) => {
    const part = asRecord(partValue);
    const title =
     stringValue(part, "title_vi") ||
     stringValue(part, "title") ||
     `Phần ${partIndex + 1}`;
    const instruction = stringValue(part, "instruction_vi");
    const items = arrayValue(part, "items");
    const type = stringValue(part, "type");

    return (
     <div
      key={stringValue(part, "id") || `${item.id}-part-${partIndex}`}
      className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
     >
      <div>
       <h5 className="font-black text-text-primary">{title}</h5>
       {instruction && (
        <p className="text-sm font-semibold text-text-muted">{instruction}</p>
       )}
      </div>

      <LooseItemGrid
       items={items.map((entryValue) => {
        const entry = asRecord(entryValue);

        if (
         type.includes("pair") ||
         stringValue(entry, "left") ||
         stringValue(entry, "right")
        ) {
         return {
          id: stringValue(entry, "id"),
          text: `${stringValue(entry, "left")} / ${stringValue(entry, "right")}`,
         };
        }

        return entryValue;
       })}
       displayMode={displayMode}
      />
     </div>
    );
   })}
  </div>
 );
}

function SubstitutionExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const model = arrayValue(record, "model");
 const models = arrayValue(record, "models");
 const patternGroups = arrayValue(record, "patterns");
 const partGroups = arrayValue(record, "parts");
 const items = [
  ...arrayValue(record, "items"),
  ...arrayValue(record, "questions"),
 ];
 const answerKey = arrayValue(record, "answer_key");
 const supplementaryWords = [
  ...arrayValue(record, "supplementary_words"),
  ...arrayValue(record, "supplementary_vocab"),
  ...arrayValue(record, "supplementary_vocabulary"),
  ...arrayValue(record, "supplement_vocab"),
  ...arrayValue(record, "supplemental_vocab"),
 ];

 return (
  <div className="grid gap-3">
   <SupplementaryPills
    itemId={item.id}
    values={supplementaryWords}
    displayMode={displayMode}
   />

   <ModelBlock values={[...model, ...models]} displayMode={displayMode} />

   {partGroups.length > 0 && (
    <div className="grid gap-3">
     {partGroups.map((partValue, partIndex) => {
      const part = asRecord(partValue);
      const partModels = modelLines(part);
      const partItems = arrayValue(part, "items");
      const partTitle =
       stringValue(part, "title_vi") ||
       stringValue(part, "title") ||
       `Mẫu ${partIndex + 1}`;

      return (
       <div
        key={stringValue(part, "id") || `${item.id}-part-${partIndex}`}
        className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
       >
        <h5 className="font-black text-text-primary">{partTitle}</h5>

        <ModelBlock
         title="Mẫu trong phần"
         values={partModels}
         displayMode={displayMode}
        />

        <LooseItemGrid items={partItems} displayMode={displayMode} />
       </div>
      );
     })}
    </div>
   )}

   {patternGroups.length > 0 && (
    <div className="grid gap-3">
     {patternGroups.map((groupValue, groupIndex) => {
      const group = asRecord(groupValue);
      const groupModels = modelLines(group);
      const groupItems = arrayValue(group, "items");

      return (
       <div
        key={stringValue(group, "id") || `${item.id}-pattern-${groupIndex}`}
        className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
       >
        <ModelBlock
         title="Mẫu luyện"
         values={groupModels}
         displayMode={displayMode}
        />

        {groupItems.length > 0 ? (
         <div className="grid gap-2 md:grid-cols-2">
          {groupItems.map((entryValue, index) => {
           const entry = asRecord(entryValue);
           const title =
            promptToString(entry.prompt) ||
            stringValue(entry, "prompt") ||
            stringValue(entry, "substitution") ||
            stringValue(entry, "text") ||
            "Câu";
           const answer =
            stringValue(entry, "sample_answer") ||
            answerToString(entry.answer) ||
            nonEmptyStrings(arrayValue(entry, "expected_dialogue")).join(" / ");

           return (
            <ExerciseQuestionCard
             key={
              stringValue(entry, "id") || `${item.id}-${groupIndex}-${index}`
             }
             index={index + 1}
             title={title}
             answer={answer}
             note={stringValue(entry, "explanation_vi")}
            />
           );
          })}
         </div>
        ) : (
         <EmptySectionState reason="Nhóm mẫu này chưa có câu luyện." />
        )}
       </div>
      );
     })}
    </div>
   )}

   {items.length > 0 ? (
    <div className="grid gap-2 md:grid-cols-2">
     {items.map((entryValue, index) => {
      const entry = asRecord(entryValue);
      const expected = arrayValue(entry, "expected_dialogue")
       .filter(
        (line): line is string =>
         typeof line === "string" && Boolean(line.trim()),
       )
       .join(" / ");
      const answer =
       expected ||
       stringValue(entry, "sample_answer") ||
       answerToString(entry.answer);

      return (
       <ExerciseQuestionCard
        key={stringValue(entry, "id") || `${item.id}-${index}`}
        index={index + 1}
        title={
         promptToString(entry.prompt) ||
         stringValue(entry, "substitution") ||
         stringValue(entry, "prompt") ||
         stringValue(entry, "text") ||
         answer ||
         "Câu"
        }
        answer={answer}
        note={stringValue(entry, "explanation_vi")}
       />
      );
     })}
    </div>
   ) : (
    patternGroups.length === 0 &&
    partGroups.length === 0 && (
     <EmptySectionState reason={stringValue(record, "empty_reason_vi")} />
    )
   )}

   <AnswerKeyList itemId={item.id} values={answerKey} />
  </div>
 );
}

function QuestionExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const questions = arrayValue(record, "questions");
 const items = arrayValue(record, "items");
 const groups = arrayValue(record, "groups");
 const leftItems = arrayValue(record, "left_items");
 const rightItems = arrayValue(record, "right_items");
 const answerKey =
  arrayValue(record, "blanks").length > 0
   ? arrayValue(record, "blanks")
   : arrayValue(record, "answer_key");
 const clozeAnswers = getClozeAnswerValues(record);
 const wordBank = arrayValue(record, "word_bank");
 const supplementaryWords = [
  ...arrayValue(record, "supplementary_words"),
  ...arrayValue(record, "supplementary_vocab"),
  ...arrayValue(record, "supplementary_vocabulary"),
  ...arrayValue(record, "supplement_vocab"),
  ...arrayValue(record, "supplemental_vocab"),
 ];
 const pattern = stringValue(record, "pattern");
 const model = asRecord(record.model);
 const passage = getPassageLikeValue(record, { includeText: true });

 return (
  <div className="grid gap-3">
   <SupplementaryPills
    itemId={item.id}
    values={supplementaryWords}
    displayMode={displayMode}
   />

   <WordBank values={wordBank} />

   {pattern && (
    <p className="rounded-xl border border-accent/30 bg-accent-subtle p-3 font-black text-accent-text">
     {pattern}
    </p>
   )}

   {(stringValue(model, "prompt") || stringValue(model, "answer")) && (
    <ExerciseQuestionCard
     index={0}
     title={stringValue(model, "prompt") || "Mẫu"}
     answer={stringValue(model, "answer")}
    />
   )}

   <PassageCard
    itemId={item.id}
    passage={passage}
    answers={clozeAnswers}
    displayMode={displayMode}
   />

   {items.length > 0 && (
    <LooseItemGrid items={items} displayMode={displayMode} />
   )}

   {(leftItems.length > 0 || rightItems.length > 0) && (
    <div className="grid gap-2 md:grid-cols-2">
     <div className="rounded-xl border border-border-default bg-bg-subtle p-3">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Cột A
      </p>
      <LooseItemGrid items={leftItems} displayMode={displayMode} />
     </div>
     <div className="rounded-xl border border-border-default bg-bg-subtle p-3">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Cột B
      </p>
      <LooseItemGrid items={rightItems} displayMode={displayMode} />
     </div>
    </div>
   )}

   {groups.length > 0 && (
    <div className="grid gap-2">
     {groups.map((groupValue, index) => {
      const group = asRecord(groupValue);
      const sentences = arrayValue(group, "sentences");
      const parts = Object.entries(asRecord(group.parts)).map(
       ([label, text]) => ({
        id: label,
        text: `${label}. ${answerToString(text)}`,
       }),
      );
      const answer =
       nonEmptyStrings(arrayValue(group, "answer_order")).join(" → ") ||
       stringValue(group, "sample_text") ||
       stringValue(group, "answer");

      return (
       <ExerciseQuestionCard
        key={stringValue(group, "id") || `${item.id}-group-${index}`}
        index={index + 1}
        title={stringValue(group, "title") || "Nhóm câu"}
        answer={answer}
        note={stringValue(group, "explanation_vi")}
       >
        <LooseItemGrid
         items={sentences.length > 0 ? sentences : parts}
         displayMode={displayMode}
        />
       </ExerciseQuestionCard>
      );
     })}
    </div>
   )}

   {questions.length > 0 ? (
    <div className="grid gap-2">
     {questions.map((questionValue, index) => (
      <QuestionCard
       key={stringValue(asRecord(questionValue), "id") || `${item.id}-${index}`}
       itemId={item.id}
       questionValue={questionValue}
       index={index}
      />
     ))}
    </div>
   ) : items.length === 0 &&
     groups.length === 0 &&
     leftItems.length === 0 &&
     rightItems.length === 0 &&
     !passage ? (
    <EmptySectionState reason={stringValue(record, "empty_reason_vi")} />
   ) : null}

   <AnswerKeyList itemId={item.id} values={answerKey} />
  </div>
 );
}

function CompleteDialogueExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const dialogues = arrayValue(record, "dialogues");
 const fallbackItems = [
  ...arrayValue(record, "items"),
  ...arrayValue(record, "questions"),
 ];

 return (
  <div className="grid gap-3">
   {dialogues.map((dialogueValue, index) => {
    const dialogue = asRecord(dialogueValue);
    const lines = arrayValue(dialogue, "lines");
    const answers = arrayValue(dialogue, "sample_answers");

    return (
     <div
      key={stringValue(dialogue, "id") || `${item.id}-${index}`}
      className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
     >
      {lines.map((lineValue, lineIndex) => {
       const line = asRecord(lineValue);

       return (
        <TextLineCard
         key={stringValue(line, "id") || `${item.id}-line-${lineIndex}`}
         speaker={stringValue(line, "speaker")}
         zh={stringValue(line, "zh") || stringValue(line, "text")}
         pinyin={stringValue(line, "pinyin")}
         vi={stringValue(line, "vi")}
         displayMode={displayMode}
        />
       );
      })}

      <AnswerKeyList itemId={`${item.id}-dialogue-${index}`} values={answers} />
     </div>
    );
   })}

   {dialogues.length === 0 && (
    <LooseItemGrid
     items={fallbackItems}
     displayMode={displayMode}
     emptyReason={stringValue(record, "empty_reason_vi")}
    />
   )}

   <AnswerKeyList itemId={item.id} values={arrayValue(record, "answer_key")} />
  </div>
 );
}

function CommunicationExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const dialogueValue = record.dialogue;
 const dialogue = Array.isArray(dialogueValue)
  ? dialogueValue
  : arrayValue(asRecord(dialogueValue), "lines");
 const questions = arrayValue(record, "questions");
 const tasks = arrayValue(record, "practice_tasks");

 return (
  <div className="grid gap-3">
   {dialogue.length > 0 && (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
     {dialogue.map((lineValue, index) => {
      const line = asRecord(lineValue);

      return (
       <TextLineCard
        key={
         stringValue(line, "id") || `${stringValue(line, "speaker")}-${index}`
        }
        speaker={stringValue(line, "speaker")}
        zh={stringValue(line, "zh") || stringValue(line, "text")}
        pinyin={stringValue(line, "pinyin")}
        vi={stringValue(line, "vi")}
        displayMode={displayMode}
       />
      );
     })}
    </div>
   )}

   {tasks.map((taskValue, index) => {
    const task = asRecord(taskValue);
    const sample =
     nonEmptyStrings(arrayValue(task, "sample_answer")).join(" / ") ||
     stringValue(task, "sample_answer_zh") ||
     stringValue(task, "sample_answer_vi") ||
     stringValue(task, "sample_answer");

    return (
     <ExerciseQuestionCard
      key={stringValue(task, "id") || `${item.id}-${index}`}
      index={index + 1}
      title={
       stringValue(task, "instruction_vi") ||
       stringValue(task, "prompt_vi") ||
       stringValue(task, "prompt") ||
       "Luyện tập"
      }
      answer={sample}
      note={stringValue(task, "explanation_vi")}
     />
    );
   })}

   {dialogue.length === 0 && questions.length > 0 && (
    <QuestionExerciseBody item={item} displayMode={displayMode} />
   )}
  </div>
 );
}

function RawDataDetails({ value }: { value: unknown }) {
 return (
  <details className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
    Dữ liệu gốc của exercise item
   </summary>
   <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-primary p-3 text-xs leading-relaxed text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </details>
 );
}

function ExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 if (item.type === "phonetics" || item.type === "read_aloud") {
  return <PhoneticsExerciseBody item={item} displayMode={displayMode} />;
 }

 if (item.type === "substitution" || item.type === "substitution_drill") {
  return <SubstitutionExerciseBody item={item} displayMode={displayMode} />;
 }

 if (item.type === "complete_dialogue") {
  return <CompleteDialogueExerciseBody item={item} displayMode={displayMode} />;
 }

 if (item.type === "communication_dialogue") {
  return <CommunicationExerciseBody item={item} displayMode={displayMode} />;
 }

 return <QuestionExerciseBody item={item} displayMode={displayMode} />;
}

export function ExerciseCard({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const instruction = asRecord(record.instruction);
 const instructionText =
  stringValue(instruction, "vi") || stringValue(instruction, "zh");

 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <h4 className="font-black text-text-primary">
     {item.title_vi || item.title}
    </h4>
    {instructionText && (
     <p className="text-sm font-semibold text-text-secondary">
      {instructionText}
     </p>
    )}
   </div>

   <ExerciseBody item={item} displayMode={displayMode} />

   <RawDataDetails value={item} />
  </article>
 );
}
