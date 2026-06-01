"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BookOpen, GraduationCap, ListChecks, MessageSquareText, NotebookText, PenLine, ScrollText, Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import type {
 CharacterWritingItem,
 Exercise,
 GrammarBlock,
 GrammarPoint,
 HanyuLesson,
 NoteItem,
 ReadingItem,
 Section,
 TextBlock,
 VocabularyItem,
} from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import type {
 HanziHomeLesson,
 HanziHomeModule,
 UserLearningState,
} from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";

type LessonOverviewProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onOpenModule: (module: HanziHomeModule) => void;
};

type BookSection = {
 id: string;
 title: string;
 subtitle?: string;
 type: Section["type"];
 order: number;
 section: Section;
};

const sectionIcons: Partial<Record<Section["type"], typeof BookOpen>> = {
 text: BookOpen,
 vocabulary: Tags,
 proper_nouns: Tags,
 notes: NotebookText,
 grammar: GraduationCap,
 exercises: ListChecks,
 communication: MessageSquareText,
 reading: ScrollText,
 character_writing: PenLine,
};

function sectionTitle(section: Section) {
 return section.title_vi || section.title;
}

function sectionSubtitle(section: Section) {
 if (section.type === "text") return `${section.blocks.length} phần bài khóa`;
 if (section.type === "vocabulary") return `${section.items.length} từ trong sách`;
 if (section.type === "proper_nouns") return `${section.items.length} tên riêng`;
 if (section.type === "notes") return `${section.items.length} chú thích`;
 if (section.type === "grammar") return `${section.items.length} điểm ngữ pháp`;
 if (section.type === "exercises") return `${section.items.length} nhóm bài tập`;
 if (section.type === "communication") return `${section.items.length} hội thoại`;
 if (section.type === "reading") return `${section.items.length} bài đọc`;
 if (section.type === "character_writing") return `${section.items.length} chữ luyện viết`;
 return undefined;
}

function getBookSections(sourceLesson: HanyuLesson | undefined): BookSection[] {
 return (sourceLesson?.lesson.sections ?? [])
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((section) => ({
   id: section.id,
   title: sectionTitle(section),
   subtitle: sectionSubtitle(section),
   type: section.type,
   order: section.order,
   section,
  }));
}

function TextLineCard({
 speaker,
 zh,
 pinyin,
 vi,
}: {
 speaker?: string;
 zh: string;
 pinyin?: string;
 vi?: string;
}) {
 return (
  <div className="grid gap-1 rounded-xl border border-border-default bg-bg-primary p-3">
   {speaker && <p className="text-xs font-black uppercase tracking-wide text-accent-text">{speaker}</p>}
   <p className="text-lg font-black leading-relaxed text-text-primary" lang="zh-CN">
    {zh}
   </p>
   {pinyin && <p className="text-sm font-bold italic text-text-muted">{pinyin}</p>}
   {vi && <p className="text-sm font-semibold leading-relaxed text-text-secondary">{vi}</p>}
  </div>
 );
}

function TextBlockView({ block }: { block: TextBlock }) {
 const lines = block.lines;

 return (
  <section className="grid gap-3 rounded-2xl border border-border-default bg-bg-subtle p-4">
   <div>
    <h4 className="text-lg font-black text-text-primary">{block.title_vi || block.title}</h4>
    <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{block.title}</p>
   </div>

   {lines.length > 0 && (
    <div className="grid gap-2">
     {lines.map((line) => (
      <TextLineCard key={line.id} speaker={line.speaker} zh={line.zh} pinyin={line.pinyin} vi={line.vi} />
     ))}
    </div>
   )}

   {block.type === "text_dialogue" &&
    block.scenes.map((scene) => (
     <div key={scene.id} className="grid gap-2">
      {scene.summary_vi && <p className="text-sm font-bold text-text-muted">{scene.summary_vi}</p>}
      {scene.lines.map((line) => (
       <TextLineCard key={line.id} speaker={line.speaker} zh={line.zh} pinyin={line.pinyin} vi={line.vi} />
      ))}
     </div>
    ))}

   {block.type === "text_narrative" &&
    block.paragraphs.map((paragraph) => (
     <TextLineCard key={paragraph.id} zh={paragraph.zh} pinyin={paragraph.pinyin} vi={paragraph.vi} />
    ))}
  </section>
 );
}

function VocabMiniGrid({ items }: { items: VocabularyItem[] }) {
 return (
  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
   {items.map((item) => (
    <div key={item.id} className="rounded-xl border border-border-default bg-bg-primary p-3">
     <div className="flex flex-wrap items-end gap-2">
      <p className="text-2xl font-black text-text-primary" lang="zh-CN">{item.hanzi}</p>
      {item.pinyin && <p className="font-bold text-accent-text">{item.pinyin}</p>}
     </div>
     <p className="text-sm font-semibold leading-relaxed text-text-secondary">{item.meaning_vi}</p>
     {item.pos !== "unknown" && <Badge>{item.pos}</Badge>}
    </div>
   ))}
  </div>
 );
}

function NoteCard({ item }: { item: NoteItem }) {
 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <h4 className="text-lg font-black text-text-primary">{item.title}</h4>
    {item.structure && <p className="mt-1 rounded-lg bg-accent-subtle px-3 py-2 font-black text-accent-text">{item.structure}</p>}
   </div>
   <p className="text-sm font-semibold leading-relaxed text-text-secondary">{item.meaning_vi}</p>
   {item.examples.length > 0 && (
    <div className="grid gap-2">
     {item.examples.map((example) => (
      <TextLineCard key={example.id} zh={example.zh} pinyin={example.pinyin} vi={example.vi} />
     ))}
    </div>
   )}
  </article>
 );
}

function GrammarBlockView({ block }: { block: GrammarBlock }) {
 const blockRecord = asRecord(block);
 const content = stringValue(blockRecord, "content_vi");
 const pattern = stringValue(blockRecord, "pattern");
 const meaning = stringValue(blockRecord, "meaning_vi");
 const examples = arrayValue(blockRecord, "examples")
  .map(asRecord)
  .filter((example) => stringValue(example, "zh"));

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <h5 className="font-black text-text-primary">{block.title}</h5>
   {content && <p className="text-sm font-semibold text-text-secondary">{content}</p>}
   {pattern && <p className="rounded-lg bg-accent-subtle px-3 py-2 font-black text-accent-text">{pattern}</p>}
   {meaning && <p className="text-sm font-semibold text-text-secondary">{meaning}</p>}
   {examples.length > 0 && (
    <div className="grid gap-2">
     {examples.map((example, index) => (
      <TextLineCard
       key={stringValue(example, "id") || `${block.id}-${index}`}
       zh={stringValue(example, "zh")}
       pinyin={stringValue(example, "pinyin")}
       vi={stringValue(example, "vi")}
      />
     ))}
    </div>
   )}
  </div>
 );
}

function GrammarCard({ item }: { item: GrammarPoint }) {
 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-4">
   <div>
    <h4 className="text-lg font-black text-text-primary">{item.title_vi || item.title}</h4>
    <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{item.title}</p>
   </div>
   <div className="grid gap-2">{item.blocks.map((block) => <GrammarBlockView key={block.id} block={block} />)}</div>
  </article>
 );
}

function GenericItemCard({ value }: { value: unknown }) {
 const item = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
 const title = [item.title_vi, item.title, item.hanzi, item.id].find((entry) => typeof entry === "string" && entry.trim()) as string | undefined;
 const pinyin = typeof item.pinyin === "string" ? item.pinyin : "";
 const meaning = typeof item.meaning_vi === "string" ? item.meaning_vi : "";
 const functionVi = typeof item.function_vi === "string" ? item.function_vi : "";
 const dialogue = Array.isArray(item.dialogue) ? item.dialogue : [];
 const practiceTasks = Array.isArray(item.practice_tasks) ? item.practice_tasks : [];

 return (
  <article className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <h4 className="text-base font-black text-text-primary">{title || "Mục"}</h4>
   {pinyin && <p className="text-sm font-bold italic text-text-muted">{pinyin}</p>}
   {meaning && <p className="text-sm font-semibold text-text-secondary">{meaning}</p>}
   {functionVi && <p className="text-sm font-semibold text-text-secondary">{functionVi}</p>}
   {dialogue.map((lineValue, index) => {
    const line = lineValue && typeof lineValue === "object" && !Array.isArray(lineValue) ? (lineValue as Record<string, unknown>) : {};
    const zh = typeof line.zh === "string" ? line.zh : typeof line.text === "string" ? line.text : "";
    if (!zh) return null;
    return (
     <TextLineCard
      key={`${zh}-${index}`}
      speaker={typeof line.speaker === "string" ? line.speaker : undefined}
      zh={zh}
      pinyin={typeof line.pinyin === "string" ? line.pinyin : undefined}
      vi={typeof line.vi === "string" ? line.vi : undefined}
     />
    );
   })}
   {practiceTasks.length > 0 && (
    <div className="mt-2 grid gap-2">
     {practiceTasks.map((taskValue, index) => {
      const task = taskValue && typeof taskValue === "object" && !Array.isArray(taskValue) ? (taskValue as Record<string, unknown>) : {};
      const instruction = typeof task.instruction_vi === "string" ? task.instruction_vi : "";
      const sampleAnswer = Array.isArray(task.sample_answer)
       ? task.sample_answer.filter((line): line is string => typeof line === "string" && Boolean(line.trim())).join(" / ")
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

function asRecord(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" && !Array.isArray(value)
  ? (value as Record<string, unknown>)
  : {};
}

function stringValue(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

function arrayValue(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return Array.isArray(value) ? value : [];
}

function ExercisePill({ children }: { children: ReactNode }) {
 return (
  <span className="rounded-lg border border-border-default bg-bg-subtle px-3 py-2 text-sm font-bold text-text-primary">
   {children}
  </span>
 );
}

function ExerciseQuestionCard({
 index,
 title,
 answer,
 note,
}: {
 index: number;
 title: string;
 answer?: string;
 note?: string;
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
   {note && <p className="text-xs font-semibold leading-relaxed text-text-muted">{note}</p>}
  </div>
 );
}

function PhoneticsExerciseBody({ item }: { item: Exercise }) {
 const parts = "parts" in item && Array.isArray(item.parts) ? item.parts : [];

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
       {instruction && <p className="text-sm font-semibold text-text-muted">{instruction}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
       {items.map((entryValue, index) => {
        const entry = asRecord(entryValue);
        const id = stringValue(entry, "id") || `${title}-${index}`;
        if (type === "minimal_pair") {
         return (
          <ExercisePill key={id}>
           {stringValue(entry, "left")} / {stringValue(entry, "right")}
          </ExercisePill>
         );
        }

        return (
         <ExercisePill key={id}>
          {stringValue(entry, "text")}
          {stringValue(entry, "pinyin") && ` · ${stringValue(entry, "pinyin")}`}
         </ExercisePill>
        );
       })}
      </div>
     </div>
    );
   })}
  </div>
 );
}

function SubstitutionExerciseBody({ item }: { item: Exercise }) {
 const model = "model" in item && Array.isArray(item.model) ? item.model : [];
 const items = "items" in item && Array.isArray(item.items) ? item.items : [];

 return (
  <div className="grid gap-3">
   {model.length > 0 && (
    <div className="rounded-xl border border-accent/30 bg-accent-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-accent-text">Mẫu</p>
     <div className="mt-1 grid gap-1">
      {model.map((line, index) => (
       <p key={`${line}-${index}`} className="text-base font-black text-accent-text" lang="zh-CN">
        {line}
       </p>
      ))}
     </div>
    </div>
   )}

   <div className="grid gap-2 md:grid-cols-2">
    {items.map((entryValue, index) => {
     const entry = asRecord(entryValue);
     const expected = arrayValue(entry, "expected_dialogue")
      .filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
      .join(" / ");

     return (
      <ExerciseQuestionCard
       key={stringValue(entry, "id") || `${item.id}-${index}`}
       index={index + 1}
       title={stringValue(entry, "substitution") || expected}
       answer={expected}
      />
     );
    })}
   </div>
  </div>
 );
}

function QuestionExerciseBody({ item }: { item: Exercise }) {
 const record = asRecord(item);
 const questions = arrayValue(record, "questions");
 const wordBank = arrayValue(record, "word_bank").filter(
  (word): word is string => typeof word === "string" && Boolean(word.trim()),
 );
 const pattern = stringValue(record, "pattern");
 const model = asRecord(record.model);

 return (
  <div className="grid gap-3">
   {wordBank.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {wordBank.map((word) => <ExercisePill key={word}>{word}</ExercisePill>)}
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

   <div className="grid gap-2">
    {questions.map((questionValue, index) => {
     const question = asRecord(questionValue);
     const choices = arrayValue(question, "choices")
      .map((choiceValue) => stringValue(asRecord(choiceValue), "text"))
      .filter(Boolean);
     const title =
      stringValue(question, "prompt") ||
      stringValue(question, "wrong_sentence") ||
      stringValue(question, "response_prompt") ||
      stringValue(asRecord(question.question), "zh") ||
      stringValue(asRecord(question.statement), "zh") ||
      "Câu hỏi";
     const answer =
      stringValue(question, "sample_answer") ||
      stringValue(question, "correct_sentence") ||
      stringValue(question, "answer");
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
  </div>
 );
}

function CompleteDialogueExerciseBody({ item }: { item: Exercise }) {
 const dialogues = "dialogues" in item && Array.isArray(item.dialogues)
  ? item.dialogues
  : [];

 return (
  <div className="grid gap-3">
   {dialogues.map((dialogueValue, index) => {
    const dialogue = asRecord(dialogueValue);
    const lines = arrayValue(dialogue, "lines");
    const answers = arrayValue(dialogue, "sample_answers");

    return (
     <div key={stringValue(dialogue, "id") || `${item.id}-${index}`} className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
      {lines.map((lineValue, lineIndex) => {
       const line = asRecord(lineValue);
       return (
        <p key={`${stringValue(line, "text")}-${lineIndex}`} className="text-sm font-bold text-text-primary">
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
          <p key={`${stringValue(answer, "blank_id")}-${answerIndex}`} className="text-sm font-bold text-accent-text">
           {stringValue(answer, "blank_id")}: {stringValue(answer, "answer")}
          </p>
         );
        })}
       </div>
      )}
     </div>
    );
   })}
  </div>
 );
}

function CommunicationExerciseBody({ item }: { item: Exercise }) {
 const dialogue = "dialogue" in item && Array.isArray(item.dialogue) ? item.dialogue : [];
 const tasks = "practice_tasks" in item && Array.isArray(item.practice_tasks)
  ? item.practice_tasks
  : [];

 return (
  <div className="grid gap-3">
   {dialogue.length > 0 && (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
     {dialogue.map((lineValue, index) => {
      const line = asRecord(lineValue);
      return (
       <p key={`${stringValue(line, "speaker")}-${index}`} className="text-sm font-bold text-text-primary">
        {stringValue(line, "speaker")}: {stringValue(line, "text")}
       </p>
      );
     })}
    </div>
   )}

   {tasks.map((taskValue, index) => {
    const task = asRecord(taskValue);
    const sample = arrayValue(task, "sample_answer")
     .filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
     .join(" / ");

    return (
     <ExerciseQuestionCard
      key={stringValue(task, "id") || `${item.id}-${index}`}
      index={index + 1}
      title={stringValue(task, "instruction_vi")}
      answer={sample}
     />
    );
   })}
  </div>
 );
}

function ExerciseBody({ item }: { item: Exercise }) {
 if (item.type === "phonetics") return <PhoneticsExerciseBody item={item} />;
 if (item.type === "substitution") return <SubstitutionExerciseBody item={item} />;
 if (item.type === "complete_dialogue") return <CompleteDialogueExerciseBody item={item} />;
 if (item.type === "communication_dialogue") return <CommunicationExerciseBody item={item} />;
 return <QuestionExerciseBody item={item} />;
}

function ExerciseCard({ item }: { item: Exercise }) {
 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <h4 className="font-black text-text-primary">{item.title_vi || item.title}</h4>
    <p className="text-sm font-semibold text-text-secondary">{item.instruction.vi || item.instruction.zh}</p>
   </div>
   <ExerciseBody item={item} />
  </article>
 );
}

function ReadingCard({ item }: { item: ReadingItem }) {
 const record = asRecord(item);
 const paragraphs = "paragraphs" in item && Array.isArray(item.paragraphs)
  ? item.paragraphs.filter((paragraph): paragraph is { id: string; zh: string; pinyin?: string; vi?: string } => (
    Boolean(paragraph)
    && typeof paragraph === "object"
    && "id" in paragraph
    && "zh" in paragraph
    && typeof paragraph.id === "string"
    && typeof paragraph.zh === "string"
   ))
  : [];
 const supplementaryWords = arrayValue(record, "supplementary_words");
 const questions = arrayValue(record, "questions");
 const answers = arrayValue(record, "answers");
 const passage = asRecord(record.passage);
 const segments = arrayValue(passage, "segments");
 const wordBank = arrayValue(record, "word_bank").filter(
  (word): word is string => typeof word === "string" && Boolean(word.trim()),
 );
 const instruction = asRecord(record.instruction);

 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <h4 className="font-black text-text-primary">{item.title_vi || item.title}</h4>
    {(stringValue(instruction, "vi") || stringValue(instruction, "zh")) && (
     <p className="text-sm font-semibold text-text-muted">
      {stringValue(instruction, "vi") || stringValue(instruction, "zh")}
     </p>
    )}
   </div>

   {supplementaryWords.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {supplementaryWords.map((wordValue, index) => {
      const word = asRecord(wordValue);
      const hanzi = stringValue(word, "hanzi");
      const pinyin = stringValue(word, "pinyin");
      const meaning = stringValue(word, "meaning_vi");
      return (
       <ExercisePill key={stringValue(word, "id") || `${item.id}-word-${index}`}>
        {hanzi}
        {pinyin && ` · ${pinyin}`}
        {meaning && ` · ${meaning}`}
       </ExercisePill>
      );
     })}
    </div>
   )}

   {paragraphs.length > 0 && (
    <div className="grid gap-2">
     {paragraphs.map((paragraph) => (
      <TextLineCard key={paragraph.id} zh={paragraph.zh} pinyin={paragraph.pinyin} vi={paragraph.vi} />
     ))}
    </div>
   )}

   {segments.length > 0 && (
    <div className="rounded-xl border border-border-default bg-bg-subtle p-4">
     <p className="whitespace-pre-wrap text-base font-bold leading-8 text-text-primary" lang="zh-CN">
      {segments.map((segmentValue, index) => {
       const segment = asRecord(segmentValue);
       if (stringValue(segment, "type") === "blank") {
        return ` ____(${stringValue(segment, "blank_id") || index + 1})____ `;
       }
       return stringValue(segment, "text");
      }).join("")}
     </p>
    </div>
   )}

   {wordBank.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {wordBank.map((word) => <ExercisePill key={word}>{word}</ExercisePill>)}
    </div>
   )}

   {questions.length > 0 && (
    <div className="grid gap-2">
     {questions.map((questionValue, index) => {
      const question = asRecord(questionValue);
      const choices = arrayValue(question, "choices")
       .map((choiceValue) => stringValue(asRecord(choiceValue), "text"))
       .filter(Boolean);
      const title =
       stringValue(question, "prompt") ||
       stringValue(asRecord(question.question), "zh") ||
       stringValue(asRecord(question.statement), "zh") ||
       "Câu hỏi";
      const answer =
       stringValue(question, "answer") ||
       stringValue(question, "sample_answer") ||
       (typeof question.answer === "boolean" ? (question.answer ? "Đúng" : "Sai") : "");

      return (
       <ExerciseQuestionCard
        key={stringValue(question, "id") || `${item.id}-question-${index}`}
        index={index + 1}
        title={choices.length > 0 ? `${title} (${choices.join(" / ")})` : title}
        answer={answer}
        note={stringValue(question, "explanation_vi")}
       />
      );
     })}
    </div>
   )}

   {answers.length > 0 && (
    <div className="grid gap-2 rounded-xl border border-accent/30 bg-accent-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-accent-text">Đáp án</p>
     {answers.map((answerValue, index) => {
      const answer = asRecord(answerValue);
      return (
       <p key={stringValue(answer, "blank_id") || `${item.id}-answer-${index}`} className="text-sm font-bold text-accent-text">
        {stringValue(answer, "blank_id")}: {stringValue(answer, "answer")}
        {stringValue(answer, "explanation_vi") && ` — ${stringValue(answer, "explanation_vi")}`}
       </p>
      );
     })}
    </div>
   )}
  </article>
 );
}

function WritingCard({ item }: { item: CharacterWritingItem }) {
 return (
  <div className="rounded-xl border border-border-default bg-bg-primary p-3">
   <p className="text-4xl font-black text-text-primary" lang="zh-CN">{item.hanzi}</p>
   <p className="font-bold text-accent-text">{item.pinyin}</p>
   {item.radical && <p className="text-sm font-semibold text-text-muted">Bộ: {item.radical}</p>}
  </div>
 );
}

export function BookSectionContent({ section }: { section: Section }) {
 if (section.type === "text") return <div className="grid gap-3">{section.blocks.map((block) => <TextBlockView key={block.id} block={block} />)}</div>;
 if (section.type === "vocabulary") return <VocabMiniGrid items={section.items} />;
 if (section.type === "notes") return <div className="grid gap-3">{section.items.map((item) => <NoteCard key={item.id} item={item} />)}</div>;
 if (section.type === "grammar") return <div className="grid gap-3">{section.items.map((item) => <GrammarCard key={item.id} item={item} />)}</div>;
 if (section.type === "exercises") return <div className="grid gap-2">{section.items.map((item) => <ExerciseCard key={item.id} item={item} />)}</div>;
 if (section.type === "reading") return <div className="grid gap-2">{section.items.map((item) => <ReadingCard key={item.id} item={item} />)}</div>;
 if (section.type === "character_writing") return <div className="grid gap-2 md:grid-cols-3">{section.items.map((item) => <WritingCard key={item.id} item={item} />)}</div>;
 return <div className="grid gap-2">{section.items.map((item, index) => <GenericItemCard key={index} value={item} />)}</div>;
}

function SourceLessonOverview({ lessonDocument }: { lessonDocument: HanyuLesson }) {
 const sections = useMemo(() => getBookSections(lessonDocument), [lessonDocument]);
 const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
 const [isSectionListVisible, setIsSectionListVisible] = useState(true);
 const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0] ?? null;

 if (!selectedSection) return null;
 const Icon = sectionIcons[selectedSection.type] ?? BookOpen;

 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">Bài học</p>
      <h2 className="text-xl font-black text-text-primary">{lessonDocument.lesson.title.zh}</h2>
      <p className="text-sm font-semibold text-text-muted">
       {lessonDocument.source.volume_vi} · {lessonDocument.lesson.title.pinyin || lessonDocument.source.lesson_title_pinyin}
      </p>
     </div>
     <div className="flex items-center gap-2">
      <Button
       type="button"
       variant="outline"
       size="sm"
       onClick={() => setIsSectionListVisible((value) => !value)}
      >
       {isSectionListVisible ? "Ẩn danh sách" : "Hiện danh sách"}
      </Button>
      <Badge>{sections.length} phần</Badge>
     </div>
    </div>

    <div className={cn("grid gap-3", isSectionListVisible && "lg:grid-cols-[18rem_minmax(0,1fr)]")}>
     {isSectionListVisible && (
      <div className="grid max-h-[32rem] content-start gap-2 overflow-y-auto pr-1">
       {sections.map((section, index) => {
        const SectionIcon = sectionIcons[section.type] ?? BookOpen;
        return (
         <button
          key={section.id}
          type="button"
          onClick={() => setSelectedSectionId(section.id)}
          className={cn(
           "flex gap-3 rounded-xl border p-3 text-left transition-colors",
           selectedSection.id === section.id
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border-default bg-bg-primary hover:bg-bg-subtle",
          )}
         >
          <SectionIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">
           <span className="line-clamp-2 text-sm font-black">{index + 1}. {section.title}</span>
           {section.subtitle && <span className="mt-1 block text-xs font-bold opacity-75">{section.subtitle}</span>}
          </span>
         </button>
        );
       })}
      </div>
     )}

     <section className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-4">
      <div className="mb-4 flex items-start gap-3">
       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
        <Icon className="h-5 w-5" />
       </span>
       <div>
        <h3 className="text-lg font-black text-text-primary">{selectedSection.title}</h3>
        {selectedSection.subtitle && <p className="text-sm font-semibold text-text-muted">{selectedSection.subtitle}</p>}
       </div>
      </div>
      <div className="max-h-[34rem] overflow-y-auto pr-2">
       <BookSectionContent section={selectedSection.section} />
      </div>
     </section>
    </div>
   </div>
  </Card>
 );
}

export function LessonOverview({
 lesson,
 onOpenModule,
}: LessonOverviewProps) {
 const fallbackMarkdown = lesson.notes?.overviewMarkdown?.trim();

 return (
  <div className="grid gap-3">
   <div className="flex flex-wrap justify-end gap-2">
    <Button type="button" variant="outline" size="sm" onClick={() => onOpenModule("lessonText")}>
     Mở bài khóa
    </Button>
    <Button type="button" variant="outline" size="sm" onClick={() => onOpenModule("grammar")}>
     Mở ngữ pháp
    </Button>
   </div>

   {lesson.sourceLesson ? (
    <SourceLessonOverview lessonDocument={lesson.sourceLesson} />
   ) : fallbackMarkdown ? (
    <Card padding="lg" className="rounded-xl">
     <MarkdownContent content={fallbackMarkdown} />
    </Card>
   ) : (
    <Card padding="lg" className="rounded-xl">
     <p className="text-sm font-semibold text-text-muted">Chưa có tổng quan trong JSON của bài này.</p>
    </Card>
   )}

   <LessonNoteAccessCard lesson={lesson} />
  </div>
 );
}
