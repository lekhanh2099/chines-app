import { TextLineCard } from "./TextLineCard";
import { getHanziTypographyStyle } from "./hanzi-typography";
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
}: {
 itemId: string;
 passage: unknown;
 answers?: unknown[];
 displayMode: LessonDisplayMode;
}) {
 const passageRecord = asRecord(passage);
 const rendering = asRecord(passageRecord.rendering);
 const rendererId = stringValue(rendering, "renderer");
 const instruction = asRecord(passageRecord.instruction);
 const instructionText = stringValue(instruction, "vi") || stringValue(instruction, "zh");

 const { answerMap, answerList } = clozeAnswersFromSources(passageRecord, answers);

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
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 sm:p-4">
   {(passageTitle || instructionText) && (
    <div className="grid gap-1">
     {passageTitle && <h5 className="font-black text-text-primary">{passageTitle}</h5>}
     {instructionText && <p className=" font-semibold text-text-muted">{instructionText}</p>}
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
       displayMode={displayMode}
      />
     ))}
    </div>
   )}

   {(passageText || clozeText) && passageLines.length === 0 && (
    <div className="rounded-xl border border-border-default bg-bg-primary p-3">
     {shouldRenderAsCloze(passageText || clozeText, answerMap, rendererId) ? (
      <>
       <ClozeText text={passageText || clozeText} answerMap={answerMap} displayMode={displayMode} />
       {displayMode.showPinyin && passagePinyin && (
        <p className="mt-2 text-xs font-bold italic text-text-muted sm:text-sm">{passagePinyin}</p>
       )}
       {displayMode.showMeaning && passageMeaning && (
        <p className="mt-2  font-semibold leading-relaxed text-text-secondary">{passageMeaning}</p>
       )}
      </>
     ) : (
      <TextLineCard
       zh={passageText || clozeText}
       pinyin={passagePinyin}
       vi={passageMeaning}
       displayMode={displayMode}
       variant="reader"
      />
     )}
    </div>
   )}

   {completedPassageText && completedPassageText !== passageText && (
    <div className="rounded-lg border border-accent/30 bg-accent-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-accent-text">Bản hoàn chỉnh</p>
     <p
      className="mt-2 whitespace-pre-wrap leading-8 text-accent-text"
      lang="zh-CN"
      style={getHanziTypographyStyle(displayMode, { size: "lg" })}
     >
      {completedPassageText}
     </p>
    </div>
   )}

   <AnswerList answers={answerList} />
  </div>
 );
}
