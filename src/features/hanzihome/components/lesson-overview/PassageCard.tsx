"use client";

import { Typography } from "@/components/ui/typography";
import type { JsonFieldValue, JsonValue } from "@/types/json";
import { useState } from "react";
import { NativeMandarinSpeakButton } from "@/features/hanzihome/listening/NativeMandarinSpeakButton";

import { TextLineCard } from "./TextLineCard";
import { StudyInstructionText, ReaderHanziText } from "./hanzi-typography";
import { AnswerList } from "./passage-card/AnswerList";
import { ClozeText } from "./passage-card/ClozeText";
import { PassageLineBlock } from "./passage-card/PassageLineBlock";
import { SupplementaryVocabulary } from "./passage-card/SupplementaryVocabulary";
import { WordBank } from "./passage-card/WordBank";
import {
 clozeAnswersFromSources,
 clozeTextFromSegments,
 completedTextFromPassageLines,
 fillClozeBlanksWithAnswers,
 passageLinesFromParagraphs,
 shouldRenderAsCloze,
 withMissingBlankNumbers,
} from "./passage-card/passage-utils";
import type { LessonDisplayMode } from "./types";
import { arrayValue, asRecord, stringValue } from "./utils";

export function PassageCard({
 itemId,
 passage,
 answers = [],
 displayMode,
 lessonId,
}: {
 itemId: string;
 passage: JsonFieldValue;
 answers?: JsonValue[];
 displayMode: LessonDisplayMode;
 lessonId?: string;
}) {
 const [manualAnswerListOpen, setManualAnswerListOpen] = useState(false);
 const passageRecord = asRecord(passage);
 const rendering = asRecord(passageRecord.rendering);
 const rendererId = stringValue(rendering, "renderer");
 const instruction = asRecord(passageRecord.instruction);
 const instructionText = stringValue(instruction, "vi") || stringValue(instruction, "zh");

 const { answerMap, answerList } = clozeAnswersFromSources(passageRecord, answers);
 const answerListOpen = displayMode.showAnswers || manualAnswerListOpen;
 const showInlineAnswers = displayMode.showAnswers || manualAnswerListOpen;
 const clozeDisplayMode = { ...displayMode, showAnswers: showInlineAnswers };

 const segments = arrayValue(passageRecord, "segments");
 const passageTitle = stringValue(passageRecord, "title_vi") || stringValue(passageRecord, "title");

 const supplementaryVocabulary = [
  ...arrayValue(passageRecord, "supplementary_vocabulary"),
  ...arrayValue(passageRecord, "supplementary_words"),
  ...arrayValue(passageRecord, "supplementary_vocab"),
  ...arrayValue(passageRecord, "supplement_vocab"),
  ...arrayValue(passageRecord, "supplemental_vocab"),
 ];

 const wordBank = arrayValue(passageRecord, "word_bank");

 const passageLines = passageLinesFromParagraphs(
  arrayValue(passageRecord, "paragraphs"),
  itemId,
  answerMap,
 );

 let plainBlankIndex = 0;
 const nextBlankNumber = () => {
  plainBlankIndex += 1;
  return plainBlankIndex;
 };

 const passageText =
  typeof passage === "string"
   ? withMissingBlankNumbers(passage, answerMap, nextBlankNumber)
   : withMissingBlankNumbers(
      stringValue(passageRecord, "text_with_blanks") ||
       stringValue(passageRecord, "passage_with_blanks") ||
       stringValue(passageRecord, "passage_blanked") ||
       stringValue(passageRecord, "cloze_text") ||
       stringValue(passageRecord, "passage_text") ||
       stringValue(passageRecord, "text") ||
       stringValue(passageRecord, "zh"),
      answerMap,
      nextBlankNumber,
     );

 const explicitCompletedPassageText =
  stringValue(passageRecord, "completed_text") ||
  stringValue(passageRecord, "completed_text_zh") ||
  stringValue(passageRecord, "completed_passage") ||
  stringValue(passageRecord, "passage_complete");

 const passagePinyin = stringValue(passageRecord, "pinyin");
 const passageMeaning =
  stringValue(passageRecord, "translation_vi") || stringValue(passageRecord, "vi");

 const clozeText =
  segments.length > 0
   ? withMissingBlankNumbers(clozeTextFromSegments(segments), answerMap, nextBlankNumber)
   : "";

 const inlinePassageSource = passageText || clozeText;
 const completedInlinePassageText = inlinePassageSource
  ? fillClozeBlanksWithAnswers(inlinePassageSource, answerMap, rendererId)
  : "";
 const completedPassageTextFromFields = explicitCompletedPassageText
  ? fillClozeBlanksWithAnswers(explicitCompletedPassageText, answerMap, rendererId)
  : "";
 const completedPassageText =
  completedPassageTextFromFields ||
  completedTextFromPassageLines(passageLines, answerMap, rendererId) ||
  (completedInlinePassageText !== inlinePassageSource ? completedInlinePassageText : "");

 const hasMainPayload =
  Boolean(passageTitle) ||
  Boolean(instructionText) ||
  passageLines.length > 0 ||
  Boolean(passageText) ||
  Boolean(completedPassageText) ||
  Boolean(clozeText) ||
  supplementaryVocabulary.length > 0 ||
  wordBank.length > 0 ||
  answerList.length > 0;

 if (!hasMainPayload) return null;

 return (
  <div className="exercise-card-surface grid gap-3 rounded-xl border p-3 sm:p-4">
   {(passageTitle || instructionText) && (
    <div className="grid gap-1">
     {passageTitle && (
      <Typography as="h5" variant="cardTitle" tone="default" weight="black">
       {passageTitle}
      </Typography>
     )}
     {instructionText && (
      <StudyInstructionText tone="muted" weight="semibold">
       {instructionText}
      </StudyInstructionText>
     )}
    </div>
   )}

   <SupplementaryVocabulary values={supplementaryVocabulary} displayMode={displayMode} />

   <WordBank words={wordBank} />

   {passageLines.length > 0 && (
    <div className="grid gap-2">
     {passageLines.map((line) => (
      <PassageLineBlock
       key={line.id}
       line={line}
       answerMap={answerMap}
       rendererId={rendererId}
       displayMode={clozeDisplayMode}
       lessonId={lessonId}
      />
     ))}
    </div>
   )}

   {(passageText || clozeText) && passageLines.length === 0 && (
    <div className="rounded-xl border border-border-default bg-bg-primary p-3">
     {shouldRenderAsCloze(passageText || clozeText, answerMap, rendererId) ? (
      <div className="grid gap-2">
       <div className="flex min-w-0 items-start gap-1.5">
        <div className="min-w-0 flex-1">
         <ClozeText
          text={passageText || clozeText}
          answerMap={answerMap}
          displayMode={clozeDisplayMode}
         />
        </div>
        <NativeMandarinSpeakButton text={completedPassageText || passageText || clozeText} />
       </div>
       {displayMode.showPinyin && passagePinyin && (
        <StudyInstructionText variant="caption" tone="muted" weight="bold" emphasis="italic">
         {passagePinyin}
        </StudyInstructionText>
       )}
       {displayMode.showMeaning && passageMeaning && (
        <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed">
         {passageMeaning}
        </StudyInstructionText>
       )}
      </div>
     ) : (
      <TextLineCard
       zh={passageText || clozeText}
       pinyin={passagePinyin}
       vi={passageMeaning}
       displayMode={displayMode}
       variant="reader"
       annotationTarget={lessonId ? { lessonId, nodeType: "passage", nodeId: itemId } : undefined}
      />
     )}
    </div>
   )}

   {displayMode.showAnswers && completedPassageText && completedPassageText !== passageText && (
    <div className="exercise-answer-surface grid gap-1 rounded-lg border p-3">
     <StudyInstructionText
      variant="overline"
      tone="accent"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      Bản hoàn chỉnh
     </StudyInstructionText>
     <ReaderHanziText
      displayMode={displayMode}
      size="lg"
      tone="default"
      leading="spacious"
      wrapping="preWrap"
     >
      {completedPassageText}
     </ReaderHanziText>
    </div>
   )}

   <AnswerList answers={answerList} open={answerListOpen} onOpenChange={setManualAnswerListOpen} />
  </div>
 );
}
