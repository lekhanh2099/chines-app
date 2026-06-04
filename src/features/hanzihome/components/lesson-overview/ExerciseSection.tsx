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
  stringValue(record, "prompt")
 );
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

function PhoneticsExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 const record = asRecord(item);
 const parts = "parts" in item && Array.isArray(item.parts) ? item.parts : [];
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
   {parts.map((partValue) => {
    const part = asRecord(partValue);
    const title = stringValue(part, "title");
    const instruction = stringValue(part, "instruction_vi");
    const items = arrayValue(part, "items");
    const type = stringValue(part, "type");

    return (
     <div key={stringValue(part, "id") || title} className="grid gap-2">
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
 console.log("Rendering SubstitutionExerciseBody", { item });
 const record = asRecord(item);
 const model = "model" in item && Array.isArray(item.model) ? item.model : [];
 const models = arrayValue(record, "models");
 const patternGroups = arrayValue(record, "patterns");
 const partGroups = arrayValue(record, "parts");
 const items = [
  ...("items" in item && Array.isArray(item.items) ? item.items : []),
  ...arrayValue(record, "questions"),
 ];
 const answerKey = arrayValue(record, "answer_key");
 const supplementaryWords = arrayValue(record, "supplementary_words");

 return (
  <div className="grid gap-3">
   {supplementaryWords.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {supplementaryWords.map((wordValue, index) => {
      const word = asRecord(wordValue);
      const label =
       stringValue(word, "hanzi") ||
       stringValue(word, "text") ||
       answerToString(wordValue);
      const pinyin = stringValue(word, "pinyin");
      const meaning = stringValue(word, "meaning_vi");

      return (
       <ExercisePill
        key={stringValue(word, "id") || `${item.id}-word-${index}`}
       >
        {label}
        {displayMode.showPinyin && pinyin && ` · ${pinyin}`}
        {displayMode.showMeaning && meaning && ` · ${meaning}`}
       </ExercisePill>
      );
     })}
    </div>
   )}

   {(model.length > 0 || models.length > 0) && (
    <div className="rounded-xl border border-accent/30 bg-accent-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-accent-text">
      Mẫu
     </p>
     <div className="mt-1 grid gap-1">
      {model.map((line, index) => (
       <p
        key={`${line}-${index}`}
        className="text-base font-black text-accent-text"
        lang="zh-CN"
       >
        {line}
       </p>
      ))}
      <LooseItemGrid items={models} displayMode={displayMode} />
     </div>
    </div>
   )}

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
        <div>
         <h5 className="font-black text-text-primary">{partTitle}</h5>
         {partModels.length > 0 && (
          <div className="mt-2 rounded-lg border border-accent/30 bg-accent-subtle px-3 py-2">
           <p className="text-xs font-black uppercase tracking-wide text-accent-text">
            Mẫu
           </p>
           <div className="mt-1 grid gap-1">
            {partModels.map((line) => (
             <p
              key={line}
              className="text-sm font-black text-accent-text"
              lang="zh-CN"
             >
              {line}
             </p>
            ))}
           </div>
          </div>
         )}
        </div>
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
        {groupModels.length > 0 && (
         <div className="rounded-lg border border-accent/30 bg-accent-subtle px-3 py-2">
          <p className="text-xs font-black uppercase tracking-wide text-accent-text">
           Mẫu
          </p>
          <div className="mt-1 grid gap-1">
           {groupModels.map((line) => (
            <p
             key={line}
             className="text-sm font-black text-accent-text"
             lang="zh-CN"
            >
             {line}
            </p>
           ))}
          </div>
         </div>
        )}
        {groupItems.length > 0 ? (
         <div className="grid gap-2 md:grid-cols-2">
          {groupItems.map((entryValue, index) => {
           const entry = asRecord(entryValue);
           const title =
            promptToString(entry.prompt) ||
            stringValue(entry, "prompt") ||
            stringValue(entry, "substitution") ||
            "Câu";
           const answer =
            stringValue(entry, "sample_answer") || answerToString(entry.answer);

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
 const answerKey = arrayValue(record, "answer_key");
 const wordBank = arrayValue(record, "word_bank").filter(
  (word): word is string => typeof word === "string" && Boolean(word.trim()),
 );
 const pattern = stringValue(record, "pattern");
 const model = asRecord(record.model);

 return (
  <div className="grid gap-3">
   {wordBank.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {wordBank.map((word) => (
      <ExercisePill key={word}>{word}</ExercisePill>
     ))}
    </div>
   )}

   {pattern && (
    <p className="rounded-xl border border-accent/30 bg-accent-subtle p-3 font-black text-accent-text">
     {pattern}
    </p>
   )}

   {(stringValue(model, "prompt") || stringValue(model, "answer")) && (
    <ExerciseQuestionCard
     index={0}
     title={stringValue(model, "prompt")}
     answer={stringValue(model, "answer")}
    />
   )}

   <PassageCard
    itemId={item.id}
    passage={record.passage}
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
       stringValue(group, "sample_text");

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
     {questions.map((questionValue, index) => {
      const question = asRecord(questionValue);
      const choices = arrayValue(question, "choices")
       .map((choiceValue) => stringValue(asRecord(choiceValue), "text"))
       .filter(Boolean);
      const answerValue = question.answer;
      const title =
       promptToString(question.prompt) ||
       stringValue(question, "prompt") ||
       stringValue(question, "wrong") ||
       stringValue(question, "wrong_sentence") ||
       stringValue(question, "response_prompt") ||
       stringValue(question, "question") ||
       stringValue(asRecord(question.question), "zh") ||
       stringValue(asRecord(question.statement), "zh") ||
       "Câu hỏi";
      const answer =
       stringValue(question, "sample_answer") ||
       stringValue(question, "correct") ||
       stringValue(question, "correct_sentence") ||
       answerToString(question.answer) ||
       stringValue(asRecord(question.answer), "zh") ||
       stringValue(asRecord(question.answer), "vi") ||
       (Array.isArray(answerValue)
        ? nonEmptyStrings(answerValue).join(" / ")
        : "");
      const note = stringValue(question, "explanation_vi");

      return (
       <ExerciseQuestionCard
        key={stringValue(question, "id") || `${item.id}-${index}`}
        index={index + 1}
        title={choices.length > 0 ? `${title} (${choices.join(" / ")})` : title}
        answer={answer}
        note={note}
       />
      );
     })}
    </div>
   ) : items.length === 0 &&
     groups.length === 0 &&
     leftItems.length === 0 &&
     rightItems.length === 0 ? (
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
 const dialogues =
  "dialogues" in item && Array.isArray(item.dialogues) ? item.dialogues : [];
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
        <p
         key={`${stringValue(line, "text")}-${lineIndex}`}
         className="text-sm font-bold text-text-primary"
        >
         {stringValue(line, "speaker") && `${stringValue(line, "speaker")}: `}
         {stringValue(line, "text")}
        </p>
       );
      })}
      {answers.length > 0 && (
       <div className="rounded-lg bg-accent-subtle px-3 py-2">
        {answers.map((answerValue, answerIndex) => {
         const answer = asRecord(answerValue);
         return (
          <p
           key={`${stringValue(answer, "blank_id")}-${answerIndex}`}
           className="text-sm font-bold text-accent-text"
          >
           {stringValue(answer, "blank_id")}: {stringValue(answer, "answer")}
          </p>
         );
        })}
       </div>
      )}
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
 const tasks =
  "practice_tasks" in item && Array.isArray(item.practice_tasks)
   ? item.practice_tasks
   : [];

 return (
  <div className="grid gap-3">
   {dialogue.length > 0 && (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
     {dialogue.map((lineValue, index) => {
      const line = asRecord(lineValue);
      return (
       <TextLineCard
        key={`${stringValue(line, "speaker")}-${index}`}
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
     stringValue(task, "sample_answer_vi");

    return (
     <ExerciseQuestionCard
      key={stringValue(task, "id") || `${item.id}-${index}`}
      index={index + 1}
      title={
       stringValue(task, "instruction_vi") ||
       stringValue(task, "prompt_vi") ||
       "Luyện tập"
      }
      answer={sample}
     />
    );
   })}
   {dialogue.length === 0 && questions.length > 0 && (
    <QuestionExerciseBody item={item} displayMode={displayMode} />
   )}
  </div>
 );
}

function ExerciseBody({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 if (item.type === "phonetics")
  return <PhoneticsExerciseBody item={item} displayMode={displayMode} />;
 if (item.type === "read_aloud")
  return <PhoneticsExerciseBody item={item} displayMode={displayMode} />;
 if (item.type === "substitution" || item.type === "substitution_drill")
  return <SubstitutionExerciseBody item={item} displayMode={displayMode} />;
 if (item.type === "complete_dialogue")
  return <CompleteDialogueExerciseBody item={item} displayMode={displayMode} />;
 if (item.type === "communication_dialogue")
  return <CommunicationExerciseBody item={item} displayMode={displayMode} />;
 return <QuestionExerciseBody item={item} displayMode={displayMode} />;
}

export function ExerciseCard({
 item,
 displayMode,
}: {
 item: Exercise;
 displayMode: LessonDisplayMode;
}) {
 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <h4 className="font-black text-text-primary">
     {item.title_vi || item.title}
    </h4>
    <p className="text-sm font-semibold text-text-secondary">
     {item.instruction.vi || item.instruction.zh}
    </p>
   </div>
   <ExerciseBody item={item} displayMode={displayMode} />
  </article>
 );
}
