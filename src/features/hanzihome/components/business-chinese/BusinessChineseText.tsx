"use client";

import {
 useCallback,
 useContext,
 useMemo,
 useState,
 type ComponentProps,
 type KeyboardEvent,
 type MouseEvent,
 type SyntheticEvent,
} from "react";
import { useTranslations } from "next-intl";
import { glyphActionClassName } from "@/components/ui/focus-ring";
import { Typography, type TypographyProps } from "@/components/ui/display/typography";
import {
 containsHanziText,
 PinyinText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { getActiveCharacterIndex } from "@/features/hanzihome/components/lesson-overview/progressive-study-text-utils";
import { ContextualReaderText } from "@/features/hanzihome/components/reading/ContextualReaderText";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import {
 analyzeContextualPronunciation,
 type ContextualPronunciationAnalysis,
 type ContextualPronunciationGlyph,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { getChineseSpeechSegments } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import {
 useReaderPronunciationSessionActions,
 useReaderPronunciationSessionOverrides,
} from "@/features/hanzihome/reader-adapters/reader-pronunciation-session";
import { defaultTextbookDisplaySettings } from "@/features/hanzihome/utils/learning-state";
import type { ReaderSegment } from "@/features/reader/model/reader-document.types";
import { useReaderCommands, useReaderSelector } from "@/features/reader/runtime/reader-context";
import {
 ReaderPronunciationReviewPopover,
 type ReaderPronunciationSaveInput,
} from "@/features/reading/components/ReaderPronunciationReviewPopover";
import type { ReaderSurfacePronunciationTarget } from "@/features/reading/model/reading-interactions";
import { cn } from "@/lib/utils";
import { BusinessChineseAnnotationsContext } from "./business-chinese-annotations-context";
import { isChineseOnlyText } from "./business-chinese-study-utils";

const chineseGraphemeSegmenter = new Intl.Segmenter("zh-CN", {
 granularity: "grapheme",
});

export function BusinessChineseText({
 pronunciationId,
 text,
 displayMode: propDisplayMode,
 sourcePinyin,
 variant = "bodySmall",
 weight,
 compactHanzi = false,
 learnerContent = false,
}: {
 pronunciationId: string;
 text: string;
 displayMode?: LessonDisplayMode;
 sourcePinyin?: string;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
 compactHanzi?: boolean;
 learnerContent?: boolean;
}) {
 const displayMode = useMemo(
  () => ({
   ...defaultTextbookDisplaySettings,
   ...propDisplayMode,
  }),
  [propDisplayMode],
 );
 const annotationsContext = useContext(BusinessChineseAnnotationsContext);
 const pronunciationSessionActions = useReaderPronunciationSessionActions();
 const pronunciationOverrides = useReaderPronunciationSessionOverrides(pronunciationId);
 const readerCommands = useReaderCommands();
 const canPlayFromCharacter = useReaderSelector(
  (state) =>
   state.content.segmentIds.includes(pronunciationId) &&
   (!learnerContent || state.content.segmentsById[pronunciationId]?.zh === text),
 );
 const playbackProgress = useReaderSelector((state) =>
  state.playback.segmentId === pronunciationId && state.playback.status !== "idle"
   ? state.playback.progress
   : -1,
 );
 const playbackStartOffset = useReaderSelector((state) =>
  state.playback.segmentId === pronunciationId && state.playback.status !== "idle"
   ? state.playback.startOffset
   : 0,
 );
 const [pronunciationPreview, setPronunciationPreview] =
  useState<ReaderSurfacePronunciationTarget | null>(null);
 const segment = useMemo<ReaderSegment>(
  () => ({
   id: pronunciationId,
   kind: "sentence",
   zh: text,
   pinyin: sourcePinyin,
  }),
  [pronunciationId, sourcePinyin, text],
 );
 const analysis = useMemo(
  () =>
   containsHanziText(text)
    ? analyzeContextualPronunciation({
       text,
       sourcePinyin: sourcePinyin ?? null,
       overrides: pronunciationOverrides,
      })
    : null,
  [pronunciationOverrides, sourcePinyin, text],
 );
 const contextualDisplayMode: LessonDisplayMode = useMemo(
  () =>
   variant === "pageTitle" || variant === "sectionTitle" || variant === "cardTitle"
    ? { ...displayMode, hanziSize: "lg" }
    : compactHanzi && !learnerContent
      ? { ...displayMode, hanziSize: "md" }
      : displayMode,
  [compactHanzi, displayMode, learnerContent, variant],
 );
 const canShowPinyin =
  Boolean(displayMode?.showPinyin) &&
  (Boolean(displayMode?.autoDetectPinyin) || Boolean(sourcePinyin?.trim()));
 const playbackStartCharacterIndex = Array.from(text.slice(0, playbackStartOffset)).length;
 const activeCharacterIndex =
  playbackProgress >= 0
   ? getActiveCharacterIndex(
      Array.from(text).length,
      playbackStartCharacterIndex,
      Math.max(0, Array.from(text).length - playbackStartCharacterIndex),
      playbackProgress,
     )
   : -1;
 const inspectPronunciation = useCallback(
  (glyph: ContextualPronunciationGlyph, rect: DOMRect) => {
   if (analysis === null) return;
   setPronunciationPreview({
    segment,
    index: 0,
    analysis,
    glyph,
    rect,
   });
  },
  [analysis, segment],
 );
 const savePronunciation = useCallback(
  (input: ReaderPronunciationSaveInput) => {
   pronunciationSessionActions.upsert(pronunciationId, text, input);
   setPronunciationPreview(null);
  },
  [pronunciationId, pronunciationSessionActions, text],
 );
 const resetPronunciation = useCallback(() => {
  if (pronunciationPreview === null) return;
  const token = pronunciationPreview.analysis.tokens.find(
   (item) =>
    item.type === "hanzi" &&
    item.start <= pronunciationPreview.glyph.start &&
    item.end >= pronunciationPreview.glyph.end,
  );
  pronunciationSessionActions.remove(
   pronunciationId,
   token?.start ?? pronunciationPreview.glyph.start,
   token?.end ?? pronunciationPreview.glyph.end,
  );
  setPronunciationPreview(null);
 }, [pronunciationId, pronunciationPreview, pronunciationSessionActions]);
 const pronunciationConfirmed =
  pronunciationPreview?.glyph.evidence.includes("manual-override") ?? false;

 if (analysis === null) {
  return (
   <Typography
    as={learnerContent ? undefined : "div"}
    variant={variant}
    weight={weight}
    wrapping="preWrap"
   >
    {learnerContent
     ? text.split(/([_＿]{3,})/u).map((part, index) =>
        /[_＿]{3,}/u.test(part) ? (
         <span
          key={`${index}:blank`}
          data-practice-blank="true"
          className="inline-block min-w-14 rounded-md border border-dashed border-border-default bg-surface-muted px-2 py-0.5 text-center text-text-muted align-baseline"
         >
          ___
         </span>
        ) : (
         part
        ),
       )
     : text}
   </Typography>
  );
 }

 const chineseOnly = isChineseOnlyText(text);
 const content =
  chineseOnly && !(learnerContent && /[_＿]{3,}/u.test(text)) ? (
   <ContextualReaderText
    analysis={analysis}
    displayMode={contextualDisplayMode}
    showPinyin={canShowPinyin}
    pinyinPresentation="ruby"
    sourcePinyin={sourcePinyin}
    activeCharacterIndex={activeCharacterIndex}
    paragraphId={pronunciationId}
    readerAnnotations={annotationsContext?.readerAnnotations}
    onOpenReaderAnnotation={annotationsContext?.onOpenReaderAnnotation}
    onGlyphClick={
     canPlayFromCharacter
      ? (start) => readerCommands.playFromCharacter(pronunciationId, start)
      : undefined
    }
    onGlyphInspect={inspectPronunciation}
   />
  ) : (
   <BusinessChineseMixedText
    analysis={analysis}
    displayMode={contextualDisplayMode}
    showPinyin={canShowPinyin}
    variant={variant}
    weight={weight}
    learnerContent={learnerContent}
    onGlyphInspect={inspectPronunciation}
    activeCharacterIndex={chineseOnly ? activeCharacterIndex : -1}
    onGlyphClick={
     chineseOnly && canPlayFromCharacter
      ? (start) => readerCommands.playFromCharacter(pronunciationId, start)
      : undefined
    }
   />
  );

 return (
  <>
   {learnerContent && chineseOnly && (variant === "sectionTitle" || variant === "cardTitle") ? (
    <div role="heading" aria-level={variant === "cardTitle" ? 3 : 2} aria-label={text}>
     {content}
    </div>
   ) : (
    content
   )}
   {pronunciationPreview ? (
    <ReaderPronunciationReviewPopover
     target={pronunciationPreview}
     confirmed={pronunciationConfirmed}
     saveScope="session"
     onClose={() => setPronunciationPreview(null)}
     onSave={savePronunciation}
     onReset={pronunciationConfirmed ? resetPronunciation : undefined}
    />
   ) : null}
  </>
 );
}

function BusinessChineseMixedText({
 analysis,
 displayMode,
 showPinyin,
 variant,
 weight,
 onGlyphInspect,
 learnerContent,
 activeCharacterIndex = -1,
 onGlyphClick,
}: {
 analysis: ContextualPronunciationAnalysis;
 displayMode: LessonDisplayMode;
 showPinyin: boolean;
 variant: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
 onGlyphInspect: (glyph: ContextualPronunciationGlyph, rect: DOMRect) => void;
 learnerContent: boolean;
 activeCharacterIndex?: number;
 onGlyphClick?: ComponentProps<typeof ContextualReaderText>["onGlyphClick"];
}) {
 const t = useTranslations("Reader.document.text");
 const glyphByStart = useMemo(
  () => new Map(analysis.glyphs.map((glyph) => [glyph.start, glyph])),
  [analysis.glyphs],
 );
 const graphemes = useMemo(
  () => [...chineseGraphemeSegmenter.segment(analysis.normalizedText)],
  [analysis.normalizedText],
 );
 const blanks = useMemo(
  () => (learnerContent ? [...analysis.normalizedText.matchAll(/[_＿]{3,}/gu)] : []),
  [analysis.normalizedText, learnerContent],
 );

 return (
  <Typography
   as={learnerContent ? undefined : "div"}
   variant={variant}
   weight={weight}
   wrapping="preWrap"
   aria-label={
    learnerContent && (variant === "sectionTitle" || variant === "cardTitle")
     ? analysis.normalizedText
     : undefined
   }
  >
   {graphemes.map((grapheme, index) => {
    // Keep original offsets so pinyin after a collapsed blank still belongs to its glyph.
    const blank = blanks.find(
     (match) => grapheme.index >= match.index && grapheme.index < match.index + match[0].length,
    );
    if (blank) {
     return grapheme.index === blank.index ? (
      <span
       key={`${grapheme.index}:blank`}
       data-practice-blank="true"
       className="inline-block min-w-14 rounded-md border border-dashed border-border-default bg-surface-muted px-2 py-0.5 text-center text-text-muted align-baseline"
      >
       ___
      </span>
     ) : null;
    }
    const glyph = glyphByStart.get(grapheme.index);
    if (glyph === undefined) {
     return (
      <span
       key={`${grapheme.index}:${grapheme.segment}`}
       className={cn(index === activeCharacterIndex && "reading-progress-highlight")}
       aria-current={index === activeCharacterIndex ? "true" : undefined}
      >
       {grapheme.segment}
      </span>
     );
    }
    const needsPronunciationReview =
     glyph.isPolyphonic && !glyph.evidence.includes("manual-override");
    const active = index === activeCharacterIndex;
    const activateHanzi = (event: SyntheticEvent<HTMLElement>) => {
     event.stopPropagation();
     if (window.getSelection()?.isCollapsed === false) return;
     onGlyphClick?.(glyph.start, glyph.end);
    };
    const hanzi = (
     <ReaderHanziText
      key={`${grapheme.index}:${grapheme.segment}`}
      displayMode={displayMode}
      size={learnerContent ? undefined : "inherit"}
      className={cn(
       onGlyphClick && glyphActionClassName,
       onGlyphClick && "select-text",
       active && "reading-progress-highlight",
      )}
      onClick={onGlyphClick ? activateHanzi : undefined}
      onKeyDown={
       onGlyphClick
        ? (event: KeyboardEvent<HTMLElement>) => {
           if (event.key !== "Enter" && event.key !== " ") return;
           event.preventDefault();
           activateHanzi(event);
          }
        : undefined
      }
      role={onGlyphClick ? "button" : undefined}
      tabIndex={onGlyphClick ? 0 : undefined}
      aria-label={
       onGlyphClick ? t("playFromCharacter", { character: grapheme.segment }) : undefined
      }
      aria-current={active ? "true" : undefined}
     >
      {grapheme.segment}
     </ReaderHanziText>
    );

    if (!showPinyin || glyph.spokenPinyin === null) {
     return hanzi;
    }

    return (
     <ruby key={`${grapheme.index}:${grapheme.segment}`}>
      {hanzi}
      <rt className="select-none">
       <PinyinText
        as="span"
        tone="secondary"
        weight="medium"
        scale={learnerContent ? "inherit" : "cloze"}
        className={cn(glyphActionClassName, needsPronunciationReview && "text-warning")}
        role="button"
        tabIndex={0}
        aria-label={
         needsPronunciationReview
          ? t("inspectUnconfirmedPinyin", {
             character: grapheme.segment,
            })
          : t("inspectPinyin", { character: grapheme.segment })
        }
        title={glyph.alternatives.length > 1 ? glyph.alternatives.join(", ") : undefined}
        onClick={(event: MouseEvent<HTMLElement>) => {
         event.stopPropagation();
         onGlyphInspect(glyph, event.currentTarget.getBoundingClientRect());
        }}
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
         if (event.key !== "Enter" && event.key !== " ") return;
         event.preventDefault();
         onGlyphInspect(glyph, event.currentTarget.getBoundingClientRect());
        }}
       >
        {glyph.spokenPinyin}
       </PinyinText>
      </rt>
     </ruby>
    );
   })}
  </Typography>
 );
}

export function SpeakableBusinessChineseText({
 pronunciationId,
 text,
 displayMode,
 sourcePinyin,
 variant,
 weight,
 compactHanzi,
 learnerContent,
 speakable = true,
}: {
 pronunciationId: string;
 text: string;
 displayMode: LessonDisplayMode;
 sourcePinyin?: string;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
 compactHanzi?: boolean;
 learnerContent?: boolean;
 speakable?: boolean;
}) {
 const speechSegments = speakable ? getChineseSpeechSegments(text) : [];

 return (
  <div id={pronunciationId} className="flex min-w-0 scroll-mt-24 items-start gap-2">
   <div className="min-w-0 flex-1">
    <BusinessChineseText
     pronunciationId={pronunciationId}
     text={text}
     displayMode={displayMode}
     sourcePinyin={sourcePinyin}
     variant={variant}
     weight={weight}
     compactHanzi={compactHanzi}
     learnerContent={learnerContent}
    />
   </div>
   {speechSegments.length > 0 ? (
    <MandarinSpeakButton text={speechSegments.join(" ")} segments={speechSegments} touchTarget />
   ) : null}
  </div>
 );
}
