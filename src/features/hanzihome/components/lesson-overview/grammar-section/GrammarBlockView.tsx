import type { GrammarBlock } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, stringValue } from "../utils";
import { GrammarBlockItemView } from "./GrammarBlockItemView";
import { GrammarMicroPractice } from "./GrammarMicroPractice";
import {
 AdaptiveStudyText,
 containsHanziText,
 ReaderHanziText,
 StudyInstructionText,
} from "../hanzi-typography";

export function GrammarBlockView({
 lessonId,
 block,
 displayMode,
}: {
 lessonId?: string;
 block: GrammarBlock;
 displayMode: LessonDisplayMode;
}) {
 const blockRecord = asRecord(block);
 const contentText = stringValue(blockRecord, "content_vi");
 const pattern = stringValue(blockRecord, "pattern");
 const meaning = stringValue(blockRecord, "meaning_vi");
 const formulas = arrayValue(blockRecord, "formulas").map(asRecord);
 const notes = arrayValue(blockRecord, "notes_vi").filter(
  (note): note is string => typeof note === "string" && Boolean(note.trim()),
 );
 const examples = arrayValue(blockRecord, "examples")
  .map(asRecord)
  .filter((example) => stringValue(example, "zh"));
 const items = arrayValue(blockRecord, "items").map(asRecord);
 const practiceQuestions = arrayValue(blockRecord, "questions");

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-card p-3">
   {containsHanziText(block.title) ? (
    <ReaderHanziText as="h5" displayMode={displayMode} size="md" weight="black" leading="tight">
     {block.title}
    </ReaderHanziText>
   ) : (
    <StudyInstructionText as="h5" variant="cardTitle">
     {block.title}
    </StudyInstructionText>
   )}
   {contentText && (
    <StudyInstructionText tone="secondary" weight="semibold">
     {contentText}
    </StudyInstructionText>
   )}
   {pattern && (
    <AdaptiveStudyText
     text={pattern}
     displayMode={displayMode}
     tone="accent"
     weight="black"
     leading="learner"
     className="rounded-lg bg-accent-subtle px-3 py-2"
    />
   )}
   {displayMode.showMeaning && meaning && (
    <StudyInstructionText tone="secondary" weight="semibold">
     {meaning}
    </StudyInstructionText>
   )}
   {formulas.length > 0 && (
    <div className="grid gap-2">
     {formulas.map((formula, index) => (
      <ReaderHanziText
       key={`${block.id}-formula-${index}`}
       displayMode={displayMode}
       size="md"
       tone="info"
       weight="black"
       leading="learner"
       className="rounded-lg border border-info/30 bg-info-subtle px-3 py-2"
      >
       {stringValue(formula, "label") ? `${stringValue(formula, "label")}: ` : ""}
       {stringValue(formula, "pattern")}
      </ReaderHanziText>
     ))}
    </div>
   )}
   {items.length > 0 && (
    <div className="grid gap-2">
     {items.map((item, index) => (
      <GrammarBlockItemView key={`${block.id}-item-${index}`} item={item} />
     ))}
    </div>
   )}
   {block.type === "grammar_micro_practice" && (
    <GrammarMicroPractice displayMode={displayMode} questions={practiceQuestions} />
   )}
   {examples.length > 0 && (
    <div className="grid gap-2">
     {examples.map((example, index) => {
      const exampleId = stringValue(example, "id") || `${block.id}-${index}`;
      return (
       <TextLineCard
        key={exampleId}
        zh={stringValue(example, "zh")}
        pinyin={stringValue(example, "pinyin")}
        vi={stringValue(example, "vi")}
        displayMode={displayMode}
        annotationTarget={
         lessonId
          ? {
             lessonId,
             nodeType: "grammar_example",
             nodeId: exampleId,
            }
          : undefined
        }
       />
      );
     })}
    </div>
   )}
   {notes.length > 0 && (
    <div className="grid gap-1">
     {notes.map((note, index) => (
      <StudyInstructionText key={`${block.id}-note-${index}`} tone="secondary" weight="semibold">
       {note}
      </StudyInstructionText>
     ))}
    </div>
   )}
  </div>
 );
}
