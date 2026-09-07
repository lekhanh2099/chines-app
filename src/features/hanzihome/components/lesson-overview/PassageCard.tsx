"use client";

import { Card } from "@/components/ui/card";
import type { JsonFieldValue, JsonValue } from "@/types/json";
import { useState } from "react";
import { ReaderSurface } from "@/features/hanzihome/reader/components/ReaderSurface";
import { deriveSegmentContentCapabilities } from "@/features/hanzihome/reader/model/reader-capabilities";
import type {
 ReaderDocumentModel,
 ReaderSegment,
} from "@/features/hanzihome/reader/model/reader-document.types";

import { StudyInstructionText, ReaderHanziText } from "./hanzi-typography";
import { AnswerList } from "./passage-card/AnswerList";
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
 showTitle = true,
 title,
}: {
 itemId: string;
 passage: JsonFieldValue;
 answers?: JsonValue[];
 displayMode: LessonDisplayMode;
 lessonId?: string;
 showTitle?: boolean;
 title?: string;
}) {
 const [manualAnswerListOpen, setManualAnswerListOpen] = useState(false);
 const passageRecord = asRecord(passage);
 const rendering = asRecord(passageRecord.rendering);
 const rendererId = stringValue(rendering, "renderer");
 const instruction = asRecord(passageRecord.instruction);
 const instructionText = stringValue(instruction, "vi") || stringValue(instruction, "zh");

 const { answerMap, answerList } = clozeAnswersFromSources(passageRecord, answers);
 const answerListOpen = displayMode.showAnswers || manualAnswerListOpen;

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
 const isCloze =
  passageLines.length > 0
   ? passageLines.some((line) => shouldRenderAsCloze(line.zh, answerMap, rendererId))
   : shouldRenderAsCloze(passageText || clozeText, answerMap, rendererId);
 const readerSegments: ReaderSegment[] =
  passageLines.length > 0
   ? passageLines.map((line) => ({
      ...line,
      kind: "paragraph",
      speechText: fillClozeBlanksWithAnswers(line.zh, answerMap, rendererId),
     }))
   : passageText || clozeText
     ? [
        {
         id: itemId,
         kind: "paragraph",
         zh: passageText || clozeText,
         pinyin: passagePinyin,
         vi: passageMeaning,
         speechText: completedPassageText || passageText || clozeText,
        },
       ]
     : [];
 const readerDocument: ReaderDocumentModel = {
  id: `${lessonId ?? "passage"}:${itemId}`,
  language: "zh-CN",
  source: { kind: "lesson", sourceId: lessonId },
  title: title ?? (showTitle ? passageTitle : ""),
  sections: [],
  segments: readerSegments,
  metadata: [],
  capabilities: deriveSegmentContentCapabilities(readerSegments),
 };

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
  <div className="grid min-w-0 gap-3">
   {instructionText && (
    <StudyInstructionText tone="muted" weight="semibold">
     {instructionText}
    </StudyInstructionText>
   )}

   {readerSegments.length > 0 ? (
    <ReaderSurface
     key={readerDocument.id}
     document={readerDocument}
     lessonId={lessonId}
     annotationNodeType="passage_line"
     displayMode={lessonId ? undefined : displayMode}
     renderSegment={
      isCloze
       ? ({ segment, content, displayMode: readerDisplayMode }) =>
          shouldRenderAsCloze(segment.zh, answerMap, rendererId) ? (
           <PassageLineBlock
            line={segment}
            answerMap={answerMap}
            rendererId={rendererId}
            displayMode={{
             ...readerDisplayMode,
             showAnswers: readerDisplayMode.showAnswers || manualAnswerListOpen,
            }}
            lessonId={lessonId}
           />
          ) : (
           content
          )
       : undefined
     }
    />
   ) : null}

   <SupplementaryVocabulary values={supplementaryVocabulary} displayMode={displayMode} />

   <WordBank words={wordBank} />

   {displayMode.showAnswers && completedPassageText && completedPassageText !== passageText && (
    <Card variant="subtle" padding="md" className="grid gap-1">
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
    </Card>
   )}

   <AnswerList answers={answerList} open={answerListOpen} onOpenChange={setManualAnswerListOpen} />
  </div>
 );
}
