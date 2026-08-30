"use client";

import { memo, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
import {
 PinyinText,
 ReaderHanziText,
 StudyInstructionText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";
import {
 ProgressiveStudyText,
 getActiveCharacterIndex,
} from "@/features/hanzihome/components/lesson-overview/ProgressiveStudyText";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 analyzeContextualPronunciation,
 formatContextualSpokenPinyin,
 type ContextualPronunciationGlyph,
 type PronunciationDictionaryEntry,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";

import { ContextualReaderText } from "../ContextualReaderText";
import type {
 ReaderDocumentModel,
 ReaderSection,
 ReaderSegment,
} from "../model/reader-document.types";
import { useReaderPronunciationSessionOverrides } from "../runtime/reader-pronunciation-session";
import {
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "../runtime/ReaderRuntimeProvider";

export type ReaderPronunciationAnalysis = ReturnType<typeof analyzeContextualPronunciation>;

export type ReaderSurfaceSelection = {
 segment: ReaderSegment;
 index: number;
 text: string;
 start: number | null;
 end: number | null;
 rect: DOMRect;
};

export type ReaderSurfacePronunciationTarget = {
 segment: ReaderSegment;
 index: number;
 analysis: ReaderPronunciationAnalysis;
 glyph: ContextualPronunciationGlyph;
 rect: DOMRect;
};

export type ReaderSurfaceRenderSegment = (input: {
 segment: ReaderSegment;
 index: number;
 content: ReactNode;
}) => ReactNode;

export type ReaderSurfaceRenderSection = (input: {
 section: ReaderSection;
 content: ReactNode;
}) => ReactNode;

type ReaderDocumentContentProps = {
 document: ReaderDocumentModel;
 lessonId?: string;
 renderSegment?: ReaderSurfaceRenderSegment;
 renderSection?: ReaderSurfaceRenderSection;
 analysisBySegmentId?: ReadonlyMap<string, ReaderPronunciationAnalysis>;
 onSelection?: (selection: ReaderSurfaceSelection) => void;
 onPronunciationInspect?: (target: ReaderSurfacePronunciationTarget) => void;
 setSegmentElement: (segmentId: string, element: HTMLElement | null) => void;
 displayMode?: LessonDisplayMode;
};

export const ReaderDocumentContent = memo(function ReaderDocumentContent(
 props: ReaderDocumentContentProps,
) {
 if (props.displayMode) {
  return <ReaderDocumentContentView {...props} displayMode={props.displayMode} />;
 }
 return <ConnectedReaderDocumentContent {...props} />;
});

function ConnectedReaderDocumentContent(props: ReaderDocumentContentProps) {
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 return <ReaderDocumentContentView {...props} displayMode={displayMode} />;
}

const ReaderDocumentContentView = memo(function ReaderDocumentContentView({
 document,
 lessonId,
 renderSegment,
 renderSection,
 analysisBySegmentId,
 onSelection,
 onPronunciationInspect,
 setSegmentElement,
 displayMode,
}: ReaderDocumentContentProps & { displayMode: LessonDisplayMode }) {
 const segmentById = useMemo(
  () => new Map(document.segments.map((segment) => [segment.id, segment])),
  [document.segments],
 );
 const indexById = useMemo(
  () => new Map(document.segments.map((segment, index) => [segment.id, index])),
  [document.segments],
 );
 const sectionSegmentIds = useMemo(
  () => new Set(document.sections.flatMap((section) => [...section.segmentIds])),
  [document.sections],
 );
 const unsectioned = useMemo(
  () => document.segments.filter((segment) => !sectionSegmentIds.has(segment.id)),
  [document.segments, sectionSegmentIds],
 );

 return (
  <Card variant="section" padding="lg">
   <div className="grid min-w-0 gap-5">
    {document.sections.map((section, sectionIndex) => {
     const segments = section.segmentIds
      .map((segmentId) => segmentById.get(segmentId))
      .filter((segment): segment is ReaderSegment => segment !== undefined);
     if (segments.length === 0) return null;
     const content = (
      <section className="grid min-w-0 gap-4">
       <div className="grid gap-1">
        <StudyInstructionText
         variant="overline"
         tone="muted"
         weight="black"
         tracking="wide"
         transform="uppercase"
        >
         Phần {sectionIndex + 1}
        </StudyInstructionText>
        <Typography as="h3" variant="cardTitle" weight="black">
         {section.title}
        </Typography>
       </div>
       <div className="grid min-w-0 gap-5">
        {segments.map((segment, localIndex) => (
         <ReaderSegmentRow
          key={segment.id}
          segment={segment}
          index={indexById.get(segment.id) ?? localIndex}
          lessonId={lessonId}
          displayMode={displayMode}
          renderSegment={renderSegment}
          analysis={analysisBySegmentId?.get(segment.id)}
          onSelection={onSelection}
          onPronunciationInspect={onPronunciationInspect}
          setSegmentElement={setSegmentElement}
          showSeparator={localIndex > 0}
         />
        ))}
       </div>
      </section>
     );
     return (
      <div key={section.id} className="grid gap-5">
       {sectionIndex > 0 ? <Separator /> : null}
       {renderSection ? renderSection({ section, content }) : content}
      </div>
     );
    })}

    {unsectioned.length > 0 ? (
     <div className="grid min-w-0 gap-5">
      {unsectioned.map((segment, localIndex) => (
       <ReaderSegmentRow
        key={segment.id}
        segment={segment}
        index={indexById.get(segment.id) ?? localIndex}
        lessonId={lessonId}
        displayMode={displayMode}
        renderSegment={renderSegment}
        analysis={analysisBySegmentId?.get(segment.id)}
        onSelection={onSelection}
        onPronunciationInspect={onPronunciationInspect}
        setSegmentElement={setSegmentElement}
        showSeparator={document.sections.length > 0 || localIndex > 0}
       />
      ))}
     </div>
    ) : null}
   </div>
  </Card>
 );
});

const ReaderSegmentRow = memo(function ReaderSegmentRow({
 segment,
 index,
 lessonId,
 displayMode,
 renderSegment,
 analysis,
 onSelection,
 onPronunciationInspect,
 setSegmentElement,
 showSeparator,
}: {
 segment: ReaderSegment;
 index: number;
 lessonId?: string;
 displayMode: LessonDisplayMode;
 renderSegment?: ReaderSurfaceRenderSegment;
 analysis?: ReaderPronunciationAnalysis;
 onSelection?: (selection: ReaderSurfaceSelection) => void;
 onPronunciationInspect?: (target: ReaderSurfacePronunciationTarget) => void;
 setSegmentElement: (segmentId: string, element: HTMLElement | null) => void;
 showSeparator: boolean;
}) {
 const active = useReaderRuntimeSelector((state) => state.activeSegmentId === segment.id);
 const { openInspector } = useVocabInspector();
 const content = (
  <ReaderSegmentText
   segment={segment}
   index={index}
   active={active}
   displayMode={displayMode}
   analysis={analysis}
   onPronunciationInspect={onPronunciationInspect}
  />
 );
 const rendered = renderSegment ? renderSegment({ segment, index, content }) : content;

 const captureSelection = (element: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
  const selectedText = selection.toString().trim();
  if (!selectedText) return;
  const range = selection.getRangeAt(0);
  const hanziContainer = element.querySelector<HTMLElement>("[data-reader-hanzi-content]");
  if (!hanziContainer || !hanziContainer.contains(range.commonAncestorContainer)) return;

  const beforeStart = document.createRange();
  beforeStart.selectNodeContents(hanziContainer);
  beforeStart.setEnd(range.startContainer, range.startOffset);
  const beforeEnd = document.createRange();
  beforeEnd.selectNodeContents(hanziContainer);
  beforeEnd.setEnd(range.endContainer, range.endOffset);
  let start = Math.min(beforeStart.toString().length, beforeEnd.toString().length);
  let end = Math.max(beforeStart.toString().length, beforeEnd.toString().length);
  if (segment.zh.slice(start, end).trim() !== selectedText) {
   const first = segment.zh.indexOf(selectedText);
   const second = first < 0 ? -1 : segment.zh.indexOf(selectedText, first + selectedText.length);
   if (first >= 0 && second < 0) {
    start = first;
    end = first + selectedText.length;
   } else {
    start = -1;
    end = -1;
   }
  }

  const rect = range.getBoundingClientRect();
  if (onSelection) {
   onSelection({
    segment,
    index,
    text: selectedText,
    start: start >= 0 ? start : null,
    end: end >= 0 ? end : null,
    rect,
   });
   return;
  }
  void openInspector(selectedText, { lessonId, anchorRect: rect });
 };

 return (
  <div
   ref={(element) => setSegmentElement(segment.id, element)}
   data-reader-segment-id={segment.id}
   data-no-inspector="true"
   className="grid min-w-0 gap-5"
   onMouseUp={(event) => captureSelection(event.currentTarget)}
   onTouchEnd={(event) => captureSelection(event.currentTarget)}
  >
   {showSeparator ? <Separator /> : null}
   {rendered}
  </div>
 );
});

const ReaderSegmentText = memo(function ReaderSegmentText({
 segment,
 index,
 active,
 displayMode,
 analysis: providedAnalysis,
 onPronunciationInspect,
}: {
 segment: ReaderSegment;
 index: number;
 active: boolean;
 displayMode: LessonDisplayMode;
 analysis?: ReaderPronunciationAnalysis;
 onPronunciationInspect?: (target: ReaderSurfacePronunciationTarget) => void;
}) {
 const t = useTranslations("Reader.study.chrome.segment");
 const commands = useReaderRuntimeCommands();
 const localPronunciationOverrides = useReaderPronunciationSessionOverrides(segment.id);
 const playbackProgress = useReaderRuntimeSelector((state) =>
  state.playbackSegmentId === segment.id && state.playbackStatus !== "idle" ? state.progress : -1,
 );
 const playbackStartOffset = useReaderRuntimeSelector((state) =>
  state.playbackSegmentId === segment.id && state.playbackStatus !== "idle"
   ? state.playbackStartOffset
   : 0,
 );
 const pronunciationDictionary = useMemo<PronunciationDictionaryEntry[]>(
  () =>
   providedAnalysis?.tokens
    .filter((token) => token.source === "dictionary-exact")
    .map((token, index) => ({
     id: token.id,
     text: token.text,
     pinyin: token.pinyin,
     priority: providedAnalysis.tokens.length - index,
    })) ?? [],
  [providedAnalysis],
 );
 const computedAnalysis = useMemo(() => {
  if (segment.zh.length > 2_000) return null;
  const sourcePinyin = segment.pinyin && segment.pinyin.length <= 8_000 ? segment.pinyin : null;
  if (providedAnalysis && localPronunciationOverrides.length === 0) return providedAnalysis;
  if (
   !displayMode.autoDetectPinyin &&
   sourcePinyin === null &&
   localPronunciationOverrides.length === 0
  )
   return null;
  return analyzeContextualPronunciation(
   {
    text: segment.zh,
    sourcePinyin: displayMode.autoDetectPinyin ? null : sourcePinyin,
    overrides: localPronunciationOverrides,
   },
   pronunciationDictionary,
  );
 }, [
  localPronunciationOverrides,
  pronunciationDictionary,
  providedAnalysis,
  displayMode.autoDetectPinyin,
  segment.pinyin,
  segment.zh,
 ]);
 const characterCount = Array.from(segment.zh).length;
 const playbackStartCharacterIndex = Array.from(segment.zh.slice(0, playbackStartOffset)).length;
 const activeCharacterCount = Math.max(0, characterCount - playbackStartCharacterIndex);
 const activeCharacterIndex =
  playbackProgress >= 0
   ? getActiveCharacterIndex(
      characterCount,
      playbackStartCharacterIndex,
      activeCharacterCount,
      playbackProgress,
     )
   : -1;
 const contextualPinyin = useMemo(() => {
  if (!computedAnalysis) return segment.pinyin;
  const hasManualOverride = computedAnalysis.glyphs.some((glyph) =>
   glyph.evidence.includes("manual-override"),
  );
  return displayMode.autoDetectPinyin || hasManualOverride
   ? formatContextualSpokenPinyin(computedAnalysis)
   : segment.pinyin;
 }, [computedAnalysis, displayMode.autoDetectPinyin, segment.pinyin]);

 return (
  <article className="grid min-w-0 gap-2">
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    <StudyInstructionText
     variant="overline"
     tone={active ? "accent" : "muted"}
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     {segment.kind === "dialogue-turn"
      ? t("dialogue", {
         speaker: segment.speaker?.label ?? t("dialogueFallback"),
        })
      : t("reading")}
    </StudyInstructionText>
    {segment.role ? (
     <StudyInstructionText variant="caption" tone="muted" weight="semibold">
      {segment.role}
     </StudyInstructionText>
    ) : null}
   </div>

   <div data-reader-hanzi-content={segment.id}>
    {displayMode.revealMode === "tap" ? (
     <ProgressiveStudyText
      zh={segment.zh}
      pinyin={contextualPinyin}
      vi={segment.vi}
      displayMode={displayMode}
     />
    ) : computedAnalysis ? (
     <div className="grid min-w-0 gap-1.5">
      <ContextualReaderText
       analysis={computedAnalysis}
       displayMode={displayMode}
       activeCharacterIndex={activeCharacterIndex}
       showPinyin={displayMode.showPinyin}
       pinyinPresentation="ruby"
       sourcePinyin={segment.pinyin}
       onGlyphClick={(start) => commands.playFromCharacter(index, start)}
       onGlyphInspect={
        onPronunciationInspect
         ? (glyph, rect) =>
            onPronunciationInspect({
             segment,
             index,
             analysis: computedAnalysis,
             glyph,
             rect,
            })
         : undefined
       }
      />
      {segment.vi && displayMode.showMeaning ? (
       <TranslationText tone="muted" weight="medium" leading="relaxed" wrapping="preWrap">
        {segment.vi}
       </TranslationText>
      ) : null}
     </div>
    ) : (
     <div className="grid min-w-0 gap-1.5">
      <ReaderHanziText
       displayMode={displayMode}
       tone="default"
       leading="learner"
       wrapping="preWrap"
       className="min-w-0"
      >
       {segment.zh}
      </ReaderHanziText>
      {segment.pinyin && displayMode.showPinyin ? (
       <PinyinText tone="accent" weight="semibold" leading="relaxed" wrapping="preWrap">
        {segment.pinyin}
       </PinyinText>
      ) : null}
      {segment.vi && displayMode.showMeaning ? (
       <TranslationText tone="muted" weight="medium" leading="relaxed" wrapping="preWrap">
        {segment.vi}
       </TranslationText>
      ) : null}
     </div>
    )}
   </div>
  </article>
 );
});
