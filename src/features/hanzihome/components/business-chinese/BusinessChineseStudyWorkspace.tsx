"use client";

import {
 createContext,
 Fragment,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useRef,
 useState,
 type KeyboardEvent,
 type MouseEvent,
 type ReactNode,
 type ComponentProps,
 type SyntheticEvent,
} from "react";
import { useSelector } from "@tanstack/react-store";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";

type BusinessChineseAnnotationsContextValue = {
 readerAnnotations: readonly ReaderAnnotationRow[];
 onOpenReaderAnnotation: (annotation: ReaderAnnotationRow, rect: DOMRect) => void;
};

const BusinessChineseAnnotationsContext =
 createContext<BusinessChineseAnnotationsContextValue | null>(null);

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/header/app-header-breadcrumb";
import { scrollAppContentToElement } from "@/components/layout/scroll/app-scroll";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { Card } from "@/components/ui/layout/card";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { Separator } from "@/components/ui/layout/separator";
import { Bookmark, CloudCheck, Tags } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import type { SegmentedControlItem } from "@/components/ui/forms/segmented-control";
import { Typography, type TypographyProps } from "@/components/ui/display/typography";
import { HanziHomeWorkspaceLoading } from "@/features/hanzihome/components/layout/HanziHomeWorkspaceLoading";
import { defaultTextbookDisplaySettings } from "@/features/hanzihome/utils/learning-state";
import { WorkspaceToolbar } from "@/features/hanzihome/components/layout/WorkspaceToolbar";
import { BusinessChineseWorkspaceNavMenu } from "./BusinessChineseWorkspaceNavMenu";
import { BusinessChineseLessonSelector } from "./BusinessChineseLessonSelector";
import {
 DesktopSectionNavigation,
 MobileSectionNavigation,
} from "./BusinessChineseSectionNavigation";
import {
 containsHanziText,
 HanziAwareText,
 PinyinText,
 ReaderHanziText,
 StudyInstructionText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { LessonPreviewCard } from "@/features/hanzihome/components/lesson-overview/overview/LessonPreviewCard";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { getActiveCharacterIndex } from "@/features/hanzihome/components/lesson-overview/progressive-study-text-utils";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { MandarinTtsProvider } from "@/features/speech/MandarinTtsProvider";
import {
 analyzeContextualPronunciation,
 type ContextualPronunciationAnalysis,
 type ContextualPronunciationGlyph,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { ContextualReaderText } from "@/features/hanzihome/components/reading/ContextualReaderText";
import {
 buildBusinessChineseReaderDocument,
 buildTextbookHref,
 stripLeadingEmoji,
 lessonDisplayTitle,
 splitTrailingTranslation,
 splitDialogueTurn,
 getChineseSpeechSegments,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import { parseReaderSourceTarget } from "@/features/reading/model/reading-source-target";
import { useReaderSelectionActions } from "@/features/reading/hooks/useReaderSelectionActions";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { useIsLessonCached } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import { Reader } from "@/features/reader/components/Reader";
import {
 nextAvailableRevealStage,
 type RevealStage,
} from "@/features/reader/model/progressive-reveal";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import { useLessonReader } from "@/features/hanzihome/reader-adapters/useLessonReader";
import type { ReaderSurfacePronunciationTarget } from "@/features/reading/model/reading-interactions";
import {
 ReaderPronunciationReviewPopover,
 type ReaderPronunciationSaveInput,
} from "@/features/reading/components/ReaderPronunciationReviewPopover";
import type {
 ReaderDocumentModel,
 ReaderSegment,
} from "@/features/reader/model/reader-document.types";
import {
 ReaderPronunciationSessionProvider,
 useReaderPronunciationSessionActions,
 useReaderPronunciationSessionOverrides,
} from "@/features/hanzihome/reader-adapters/reader-pronunciation-session";
import {
 ReaderServicesContext,
 useReaderServices,
 useReaderCommands,
 useReaderStore,
 useReaderSelector,
} from "@/features/reader/runtime/reader-context";
import {
 getTextbookCatalogForBookKeys,
 getTextbookLesson,
 type TextbookBookSummary,
 type TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { TextbookNoteAccessCard } from "./TextbookNoteAccessCard";
import { LessonTranslationWorkspace } from "@/features/hanzihome/practice/LessonTranslationWorkspace";
import { LessonDictationWorkspace } from "@/features/hanzihome/practice/LessonDictationWorkspace";
import {
 dictationSourcesFromTextbook,
 translationSegmentsFromTextbook,
} from "@/features/hanzihome/practice/translation-practice";
import { usePathname, useRouter as useLocalizedRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { focusModeStore } from "@/stores/shell/focus-mode-store";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";

import {
 businessChineseTableColumns,
 businessChineseContentSections,
 businessChineseSourceSections,
 businessChineseTabAvailable,
 businessChineseVocabularyTableIds,
 businessChineseVisibleBlocks,
 businessChineseVisibleSections,
 businessChineseReaderVocabulary,
 businessChinesePronunciationAnalyses,
 businessChineseSectionDocuments,
 businessChineseReaderAnnotations,
 businessChineseDictationCount,
 isChineseOnlyText,
 pairedTextbookTranslations,
 splitBusinessChineseExercise,
 splitBusinessChineseGrammarExample,
 splitPipePhraseDrill,
 pairPracticeBlankAnswers,
 parsePracticeExerciseItem,
 evaluatePracticeAnswer,
 type PracticeAnswerEvaluation,
} from "./business-chinese-study-utils";

import { useBusinessChineseReaderAnnotations } from "./useBusinessChineseReaderAnnotations";

const headerOwnerId = "business-chinese-study";
const chineseGraphemeSegmenter = new Intl.Segmenter("zh-CN", {
 granularity: "grapheme",
});
function BusinessChineseHeaderContextBridge({
 books,
 lesson,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const selectedBook = books.find((book) => book.key === lesson.bookKey);

 const content = useMemo(
  () => (
   <AppHeaderBreadcrumb
    aria-label={t("lessonSelectLabel")}
    className="min-w-0 max-w-[min(12rem,48vw)] justify-self-start md:max-w-[min(42rem,70vw)]"
   >
    <AppHeaderBreadcrumbItem className="hidden md:flex">
     <AppHeaderBreadcrumbLink
      href={buildTextbookHref(lesson.bookKey, 1)}
      disabled={focusModeEnabled}
      className="max-w-36"
      title="HanziHome"
     >
      HanziHome
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden md:flex" />
    <AppHeaderBreadcrumbItem className="hidden 2xl:flex">
     <AppHeaderBreadcrumbPage title={selectedBook?.label ?? lesson.bookLabel}>
      {selectedBook?.label ?? lesson.bookLabel}
     </AppHeaderBreadcrumbPage>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden 2xl:flex" />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <BusinessChineseLessonSelector
      books={books}
      lesson={lesson}
      focusModeEnabled={focusModeEnabled}
     />
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  ),
  [books, focusModeEnabled, lesson, selectedBook, t],
 );

 useEffect(() => {
  headerToolbarStore.actions.setOwnedContent(headerOwnerId, content);
 }, [content]);

 useEffect(
  () => () => {
   headerToolbarStore.actions.clearOwnedContent(headerOwnerId);
  },
  [],
 );

 return null;
}

function BusinessChineseText({
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
       onGlyphClick && "cursor-pointer rounded-sm select-text",
       onGlyphClick && focusRingClassName,
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
        className={cn(
         "cursor-pointer rounded-sm",
         focusRingClassName,
         needsPronunciationReview && "text-warning",
        )}
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

function SpeakableBusinessChineseText({
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

function BusinessChineseTable({
 block,
 displayMode,
 vocabularyCards = false,
 learnerContent = false,
}: {
 block: TextbookLesson["sections"][number]["blocks"][number];
 displayMode: LessonDisplayMode;
 vocabularyCards?: boolean;
 learnerContent?: boolean;
}) {
 const t = useTranslations("BusinessChinese");
 const [revealed, setRevealed] = useState(false);
 const [rowChoices, setRowChoices] = useState<Map<number, string>>(() => new Map());
 const answerVisible = displayMode.showAnswers || revealed;
 const { headers, pinyinColumnIndex, hanziColumnIndex, isVocabularyTable, visibleColumnIndexes } =
  businessChineseTableColumns(block, displayMode, answerVisible);
 const trueFalseColumnIndex = headers.findIndex(
  (header, index) => /^đ\/s$/iu.test(header.trim()) && block.answerColumnIndexes?.includes(index),
 );
 const hanvietColumnIndex = headers.findIndex((header) => /^hán việt$/iu.test(header));
 const posColumnIndex = headers.findIndex((header) => /^từ loại$/iu.test(header));
 const meaningColumnIndex = headers.findIndex((header) =>
  /^(dịch )?nghĩa( tiếng việt)?$/iu.test(header),
 );
 const metadataColumnIndexes = visibleColumnIndexes.filter(
  (index) =>
   index !== hanziColumnIndex &&
   index !== pinyinColumnIndex &&
   index !== hanvietColumnIndex &&
   index !== posColumnIndex &&
   index !== meaningColumnIndex &&
   headers[index] !== "STT",
 );

 return (
  <div className="grid min-w-0 gap-2">
   {block.text ? (
    <SpeakableBusinessChineseText
     pronunciationId={`${block.id}:prompt`}
     text={block.text}
     displayMode={displayMode}
     compactHanzi
     learnerContent={learnerContent}
     variant={learnerContent ? "body" : undefined}
    />
   ) : null}
   {block.answerColumnIndexes?.length && !displayMode.showAnswers ? (
    <Button
     type="button"
     variant="outline"
     size="compact"
     className="justify-self-start"
     aria-expanded={revealed}
     onClick={() => setRevealed((current) => !current)}
    >
     {revealed ? t("actions.hideAnswer") : t("actions.showAnswer")}
    </Button>
   ) : null}
   {visibleColumnIndexes.length > 0 ? (
    vocabularyCards && isVocabularyTable ? (
     <div className="grid min-w-0 gap-2 sm:grid-cols-2">
      {block.rows.slice(1).map((row, rowIndex) => (
       <VocabPreviewRow
        key={`${block.id}-row-${rowIndex}`}
        hanzi={row[hanziColumnIndex] ?? ""}
        pinyin={row[pinyinColumnIndex] ?? ""}
        hanviet={
         visibleColumnIndexes.includes(hanvietColumnIndex) ? (row[hanvietColumnIndex] ?? "") : ""
        }
        category={visibleColumnIndexes.includes(posColumnIndex) ? (row[posColumnIndex] ?? "") : ""}
        meaning={
         visibleColumnIndexes.includes(meaningColumnIndex) ? (row[meaningColumnIndex] ?? "") : ""
        }
        header={
         <SpeakableBusinessChineseText
          pronunciationId={`${block.id}:row:${rowIndex}:cell:${hanziColumnIndex}`}
          text={row[hanziColumnIndex] ?? ""}
          sourcePinyin={row[pinyinColumnIndex]}
          displayMode={displayMode}
          variant="body"
         />
        }
       >
        {metadataColumnIndexes.length > 0 ? (
         <div className="grid min-w-0 gap-1">
          {metadataColumnIndexes.map((cellIndex) => (
           <div
            key={`${block.id}-row-${rowIndex}-cell-${cellIndex}`}
            className="grid min-w-0 gap-1"
           >
            <StudyInstructionText variant="caption" tone="muted" weight="bold">
             {headers[cellIndex]}
            </StudyInstructionText>
            <SpeakableBusinessChineseText
             pronunciationId={`${block.id}:row:${rowIndex}:cell:${cellIndex}`}
             text={row[cellIndex] ?? ""}
             displayMode={displayMode}
             variant="bodySmall"
             compactHanzi
            />
           </div>
          ))}
         </div>
        ) : null}
       </VocabPreviewRow>
      ))}
     </div>
    ) : (
     <div className="max-w-full overflow-x-auto rounded-xl border border-border-default">
      <table className="w-full min-w-2xl border-collapse text-left">
       <thead className="bg-surface-muted">
        <tr>
         {visibleColumnIndexes.map((cellIndex) => (
          <th
           key={`${block.id}-header-${cellIndex}`}
           scope="col"
           className={cn(
            "border-b border-border-default align-top",
            isVocabularyTable ? "px-4 py-3" : "px-3 py-2",
           )}
          >
           <BusinessChineseText
            pronunciationId={`${block.id}:header:${cellIndex}`}
            text={headers[cellIndex] ?? ""}
            displayMode={displayMode}
            variant={isVocabularyTable || learnerContent ? "body" : "label"}
            weight={isVocabularyTable ? "black" : undefined}
            compactHanzi
            learnerContent={learnerContent}
           />
          </th>
         ))}
        </tr>
       </thead>
       <tbody>
        {block.rows.slice(1).map((row, rowIndex) => (
         <tr
          key={`${block.id}-row-${rowIndex}`}
          className="border-b border-border-default last:border-b-0"
         >
          {visibleColumnIndexes.map((cellIndex) => (
           <td
            key={`${block.id}-row-${rowIndex}-cell-${cellIndex}`}
            className={cn("align-top", isVocabularyTable ? "px-4 py-3" : "px-3 py-2")}
           >
            {cellIndex === pinyinColumnIndex ? (
             <PinyinText
              as="span"
              variant={isVocabularyTable || learnerContent ? "body" : "bodySmall"}
              tone="secondary"
              weight="semibold"
              wrapping="preWrap"
             >
              {row[cellIndex] ?? ""}
             </PinyinText>
            ) : (
             <SpeakableBusinessChineseText
              pronunciationId={`${block.id}:row:${rowIndex}:cell:${cellIndex}`}
              text={row[cellIndex] ?? ""}
              displayMode={displayMode}
              sourcePinyin={
               cellIndex === hanziColumnIndex && pinyinColumnIndex >= 0
                ? row[pinyinColumnIndex]
                : undefined
              }
              variant={isVocabularyTable || learnerContent ? "body" : "bodySmall"}
              compactHanzi={!isVocabularyTable && headers.length !== 2}
              learnerContent={learnerContent}
             />
            )}
            {trueFalseColumnIndex >= 0 && cellIndex === 1 ? (
             <div className="flex flex-wrap gap-2">
              {[
               { value: "Đ", label: t("practice.trueChoice") },
               { value: "S", label: t("practice.falseChoice") },
              ].map((choice) => (
               <Button
                key={choice.value}
                type="button"
                size="compact"
                variant={
                 rowChoices.get(rowIndex) === choice.value
                  ? choice.value === row[trueFalseColumnIndex].match(/^[ĐS](?=\s|$)/u)?.[0]
                   ? "success"
                   : "warning"
                  : "outline"
                }
                aria-pressed={rowChoices.get(rowIndex) === choice.value}
                onClick={() =>
                 setRowChoices((current) => new Map(current).set(rowIndex, choice.value))
                }
               >
                {choice.label}
               </Button>
              ))}
             </div>
            ) : null}
           </td>
          ))}
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    )
   ) : null}
  </div>
 );
}

function TextbookVocabularyPreview({
 vocabulary,
 onOpenVocabulary,
 displayMode,
}: {
 vocabulary: TextbookLesson["vocab"];
 onOpenVocabulary?: () => void;
 displayMode: LessonDisplayMode;
}) {
 const t = useTranslations("BusinessChinese");

 return (
  <LessonPreviewCard
   icon={Tags}
   eyebrow={t("vocabularyPreview.eyebrow")}
   title={t("vocabularyPreview.title", { count: vocabulary.length })}
   actionLabel={onOpenVocabulary ? t("vocabularyPreview.open") : undefined}
   onAction={onOpenVocabulary}
  >
   <div
    className={cn(
     "grid gap-2 sm:grid-cols-2",
     onOpenVocabulary && "max-h-80 overflow-y-auto pr-1 scrollbar-soft",
    )}
   >
    {vocabulary.map((word) => (
     <VocabPreviewRow
      key={word.id}
      hanzi={word.hanzi}
      pinyin={word.pinyin}
      hanviet={displayMode.showMeaning ? word.hanviet : ""}
      category={word.pos}
      meaning={displayMode.showMeaning ? word.meaning : ""}
      header={
       <SpeakableBusinessChineseText
        pronunciationId={word.id}
        text={word.hanzi}
        sourcePinyin={word.pinyin}
        displayMode={displayMode}
        variant="body"
       />
      }
     />
    ))}
   </div>
  </LessonPreviewCard>
 );
}

function BusinessChineseExercise({
 block,
 displayMode,
 pairedAnswer = "",
}: {
 block: TextbookLesson["sections"][number]["blocks"][number];
 displayMode: LessonDisplayMode;
 pairedAnswer?: string;
}) {
 const t = useTranslations("BusinessChinese");
 const [revealed, setRevealed] = useState(false);
 const { prompt, answer } = pairedAnswer
  ? { prompt: block.text, answer: pairedAnswer }
  : splitBusinessChineseExercise(block.text);
 const parsed = parsePracticeExerciseItem(prompt, answer);
 const [draft, setDraft] = useState("");
 const [selectedTokenIndexes, setSelectedTokenIndexes] = useState<readonly number[]>([]);
 const [selectedChoice, setSelectedChoice] = useState("");
 const [evaluation, setEvaluation] = useState<PracticeAnswerEvaluation>(() =>
  evaluatePracticeAnswer("", parsed),
 );
 const answerVisible = displayMode.showAnswers || revealed;
 const handleCheck = () => setEvaluation(evaluatePracticeAnswer(draft, parsed));
 const handleReset = () => {
  setDraft("");
  setSelectedTokenIndexes([]);
  setEvaluation(evaluatePracticeAnswer("", parsed));
 };
 const toggleToken = (index: number) => {
  const nextTokenIndexes = selectedTokenIndexes.includes(index)
   ? selectedTokenIndexes.filter((selectedIndex) => selectedIndex !== index)
   : [...selectedTokenIndexes, index];
  setSelectedTokenIndexes(nextTokenIndexes);
  setDraft(nextTokenIndexes.map((selectedIndex) => parsed.reorderTokens[selectedIndex]).join(""));
  setEvaluation(evaluatePracticeAnswer("", parsed));
 };

 return (
  <Card
   id={block.id}
   data-textbook-block={block.id}
   variant="default"
   padding="md"
   className="h-full scroll-mt-24"
  >
   <div className="grid min-w-0 gap-4">
    <SpeakableBusinessChineseText
     pronunciationId={`${block.id}:prompt`}
     text={parsed.displayPrompt}
     displayMode={displayMode}
     compactHanzi
     learnerContent
     variant="body"
    />
    {parsed.keywordHint ? (
     <Badge variant="accent" size="md" casing="natural">
      {t("practice.keywordHint", { keyword: parsed.keywordHint })}
     </Badge>
    ) : null}
    {parsed.choices.length > 0 ? (
     <div className="grid min-w-0 gap-2">
      {parsed.choices.map((choice) => (
       <div
        key={choice.key}
        className="flex min-w-0 items-start gap-2 rounded-lg border border-border-default bg-surface-muted/40 p-2"
       >
        <Button
         type="button"
         size="compact"
         variant={
          selectedChoice === choice.key
           ? choice.key === parsed.correctChoice
            ? "success"
            : "destructive"
           : "outline"
         }
         aria-pressed={selectedChoice === choice.key}
         onClick={() => setSelectedChoice(choice.key)}
        >{`${choice.key}.`}</Button>
        <div className="min-w-0 flex-1">
         <BusinessChineseText
          pronunciationId={`${block.id}:choice:${choice.key}`}
          text={choice.text}
          displayMode={displayMode}
          learnerContent
          variant="body"
         />
        </div>
       </div>
      ))}
      {selectedChoice ? (
       <Badge
        variant={selectedChoice === parsed.correctChoice ? "success" : "warning"}
        size="md"
        casing="natural"
        role="status"
       >
        {t(
         selectedChoice === parsed.correctChoice
          ? "practice.feedback.correct"
          : "practice.feedback.incorrect",
        )}
       </Badge>
      ) : null}
     </div>
    ) : parsed.hasBlank || parsed.reorderTokens.length > 0 || Boolean(parsed.keywordHint) ? (
     <div className="grid min-w-0 gap-2">
      {parsed.reorderTokens.length > 0 ? (
       <div className="flex flex-wrap gap-2">
        {parsed.reorderTokens.map((token, index) => (
         <Button
          key={`${index}:${token}`}
          type="button"
          size="compact"
          variant={selectedTokenIndexes.includes(index) ? "secondary" : "outline"}
          aria-pressed={selectedTokenIndexes.includes(index)}
          onClick={() => toggleToken(index)}
         >
          {token}
         </Button>
        ))}
       </div>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
       <Input
        density="compact"
        surface="card"
        className="min-w-0 flex-1"
        value={draft}
        onChange={(event) => {
         setDraft(event.target.value);
         if (!event.target.value) setSelectedTokenIndexes([]);
         setEvaluation(evaluatePracticeAnswer("", parsed));
        }}
        onKeyDown={(event) => {
         if (event.key === "Enter" && !event.nativeEvent.isComposing && draft.trim()) {
          event.preventDefault();
          handleCheck();
         }
        }}
        placeholder={t("practice.inputPlaceholder")}
        aria-label={t("practice.inputPlaceholder")}
       />
       <Button
        type="button"
        size="compact"
        variant="secondary"
        disabled={!draft.trim()}
        onClick={handleCheck}
       >
        {t("practice.checkAnswer")}
       </Button>
       {draft || evaluation.isAnswered ? (
        <Button type="button" size="compact" variant="ghost" onClick={handleReset}>
         {t("practice.resetAnswer")}
        </Button>
       ) : null}
      </div>
      {evaluation.isAnswered ? (
       <Badge
        variant={
         evaluation.isExactMatch ? "success" : evaluation.isKeywordMatch ? "info" : "warning"
        }
        size="md"
        casing="natural"
        role="status"
       >
        {t(
         evaluation.isExactMatch
          ? "practice.feedback.correct"
          : evaluation.isKeywordMatch
            ? "practice.feedback.keywordMatch"
            : "practice.feedback.incorrect",
        )}
       </Badge>
      ) : null}
     </div>
    ) : null}
    {!displayMode.showAnswers ? (
     <Button
      type="button"
      variant="outline"
      size="compact"
      className="justify-self-start"
      aria-expanded={revealed}
      onClick={() => setRevealed((current) => !current)}
     >
      {revealed ? t("actions.hideAnswer") : t("actions.showAnswer")}
     </Button>
    ) : null}
    {answerVisible ? (
     <div className="border-t border-border-default pt-2">
      <SpeakableBusinessChineseText
       pronunciationId={`${block.id}:answer`}
       text={answer}
       displayMode={displayMode}
       compactHanzi
       learnerContent
       variant="body"
      />
     </div>
    ) : null}
   </div>
  </Card>
 );
}

function BusinessChineseTextBlock({
 pronunciationId,
 text,
 translation,
 displayMode: propDisplayMode,
 compactHanzi = false,
 variant,
 weight,
 grammar = false,
 practice = false,
 speakable = true,
}: {
 pronunciationId: string;
 text: string;
 translation?: string;
 displayMode?: LessonDisplayMode;
 compactHanzi?: boolean;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
 grammar?: boolean;
 practice?: boolean;
 speakable?: boolean;
}) {
 const displayMode = useMemo(
  () => ({
   ...defaultTextbookDisplaySettings,
   ...propDisplayMode,
  }),
  [propDisplayMode],
 );
 const t = useTranslations("BusinessChinese");
 const [revealStage, setRevealStage] = useState<RevealStage>(0);
 const grammarFormula = grammar && /^(?:\d+[.．]\s*)?(?:Cấu trúc|Công thức):/u.test(text.trim());
 // Optional formula operands are source text, not parenthesized translations.
 const inlineText = grammarFormula
  ? { source: text.trim(), translation: "" }
  : splitTrailingTranslation(text);
 const grammarExample = grammar
  ? splitBusinessChineseGrammarExample(inlineText.source)
  : inlineText;
 const sourceTurn =
  grammar && grammarExample.translation
   ? { speaker: "", content: grammarExample.source }
   : splitDialogueTurn(grammarExample.source);
 const resolvedTranslation =
  translation?.trim() || grammarExample.translation || inlineText.translation;
 const grammarNote = grammar && grammarExample.translation ? inlineText.translation : "";
 const translationTurn = grammar
  ? { speaker: "", content: resolvedTranslation }
  : splitDialogueTurn(resolvedTranslation);
 const progressiveReveal =
  displayMode.revealMode === "tap" &&
  containsHanziText(sourceTurn.content) &&
  (!compactHanzi ||
   ((grammar || practice) && variant === "body" && isChineseOnlyText(sourceTurn.content)));
 const speechSegments = speakable ? getChineseSpeechSegments(sourceTurn.content) : [];
 const hasRevealPinyin = displayMode.autoDetectPinyin;
 const hasRevealMeaning = Boolean(translationTurn.content);
 const visibleRevealStage =
  (revealStage === 1 && !hasRevealPinyin) || (revealStage === 2 && !hasRevealMeaning)
   ? 0
   : revealStage;
 const revealDisplayMode: LessonDisplayMode = useMemo(
  () => ({ ...displayMode, showPinyin: hasRevealPinyin && visibleRevealStage === 1 }),
  [displayMode, hasRevealPinyin, visibleRevealStage],
 );
 const nextRevealStage = nextAvailableRevealStage(visibleRevealStage, {
  hasPinyin: hasRevealPinyin,
  hasMeaning: hasRevealMeaning,
 });
 const revealLabel =
  nextRevealStage === 0
   ? t("actions.revealHanzi")
   : nextRevealStage === 1
     ? t("actions.revealPinyin")
     : t("actions.revealMeaning");
 const inlineGrammarLabel =
  grammar &&
  !grammarFormula &&
  /^(?:Cách dùng|Ý nghĩa(?: \d+)?|Lưu ý(?: khác| về vị trí)?|Các cụm(?: từ)? thường gặp)$/u.test(
   sourceTurn.speaker,
  );

 return (
  <div
   id={progressiveReveal ? pronunciationId : undefined}
   data-textbook-block={pronunciationId}
   className={cn(
    "grid min-w-0 scroll-mt-24 gap-1.5",
    inlineGrammarLabel && "sm:grid-cols-[auto_minmax(0,1fr)] sm:items-baseline sm:gap-x-3",
   )}
  >
   {sourceTurn.speaker ? (
    <HanziAwareText
     as="span"
     text={grammar ? `${sourceTurn.speaker}:` : sourceTurn.speaker}
     variant={grammar ? "body" : "overline"}
     tone={grammar ? "default" : "muted"}
     weight={grammar ? "semibold" : "black"}
     tracking={grammar ? "normal" : "wide"}
     transform={grammar ? "none" : "uppercase"}
    />
   ) : null}
   <div
    data-textbook-formula={grammarFormula && variant === "body" ? "true" : undefined}
    className={cn(
     "min-w-0",
     grammarFormula && variant === "body" && "rounded-lg bg-surface-muted/50 px-3 py-2",
    )}
   >
    {progressiveReveal ? (
     <div className="grid min-w-0 gap-1.5">
      <div className="flex min-w-0 items-start gap-2">
       <div className="min-w-0 flex-1">
        {visibleRevealStage === 2 && hasRevealMeaning ? (
         <TranslationText
          weight={grammar ? "normal" : "medium"}
          leading="relaxed"
          wrapping="preWrap"
         >
          {translationTurn.content}
         </TranslationText>
        ) : (
         <BusinessChineseText
          pronunciationId={pronunciationId}
          text={sourceTurn.content}
          displayMode={revealDisplayMode}
          compactHanzi={compactHanzi}
          learnerContent={grammar || practice}
          variant={variant}
          weight={weight}
         />
        )}
       </div>
       {speechSegments.length > 0 ? (
        <MandarinSpeakButton
         text={speechSegments.join(" ")}
         segments={speechSegments}
         touchTarget
        />
       ) : null}
      </div>
      {nextRevealStage !== visibleRevealStage ? (
       <Button
        type="button"
        variant="ghost"
        size="compact"
        align="start"
        className="justify-self-start"
        onClick={() => setRevealStage(nextRevealStage)}
       >
        {revealLabel}
       </Button>
      ) : null}
     </div>
    ) : (
     <SpeakableBusinessChineseText
      pronunciationId={pronunciationId}
      text={sourceTurn.content}
      displayMode={displayMode}
      compactHanzi={compactHanzi}
      variant={variant}
      weight={weight}
      learnerContent={grammar || practice}
      speakable={speakable}
     />
    )}
   </div>
   {!progressiveReveal && translationTurn.content && displayMode.showMeaning ? (
    <TranslationText
     variant={variant === "body" ? "body" : "bodySmall"}
     tone={grammar ? "secondary" : "muted"}
     weight={grammar ? "normal" : "medium"}
     leading="relaxed"
     wrapping="preWrap"
     className={inlineGrammarLabel ? "sm:col-span-2" : undefined}
    >
     {translationTurn.content}
    </TranslationText>
   ) : null}
   {grammarNote && (progressiveReveal ? visibleRevealStage === 2 : displayMode.showMeaning) ? (
    <TranslationText
     tone="muted"
     weight="normal"
     leading="relaxed"
     wrapping="preWrap"
     className={inlineGrammarLabel ? "sm:col-span-2" : undefined}
    >
     {grammarNote}
    </TranslationText>
   ) : null}
  </div>
 );
}

function BusinessChineseSection({
 section,
 displayMode,
 translations,
 canonicalVocabularyTableIds,
 vocabularyPreview,
}: {
 section: TextbookLesson["sections"][number];
 displayMode: LessonDisplayMode;
 translations: ReadonlyMap<string, string>;
 canonicalVocabularyTableIds: readonly string[];
 vocabularyPreview?: ReactNode;
}) {
 const t = useTranslations("BusinessChinese");
 const visibleBlocks = businessChineseVisibleBlocks(section, canonicalVocabularyTableIds);
 const sectionDisplayMode: LessonDisplayMode =
  section.category === "vocab" ? { ...displayMode, revealMode: "always" } : displayMode;
 const learnerContent = section.category === "grammar" || section.category === "practice";
 const practiceSubheadings =
  section.category === "practice"
   ? visibleBlocks.filter((block) => block.type === "subheading")
   : [];
 const { pairedAnswers, consumedAnswerBlockIds } = pairPracticeBlankAnswers(
  section.category === "practice" ? visibleBlocks : [],
 );
 const numberedPracticeItem = /^(?:[（(]\d+[）)]|[①-⑳]|\d+[.．、])/u;
 const blockGroups: TextbookLesson["sections"][number]["blocks"][] = [];
 for (const block of visibleBlocks) {
  if (consumedAnswerBlockIds.has(block.id)) continue;
  const current = blockGroups.at(-1);
  const first = current?.[0];
  if (
   section.category === "practice" &&
   current &&
   first?.type === "paragraph" &&
   numberedPracticeItem.test(first.text.trim()) &&
   !first.text.includes("→") &&
   block.type === "paragraph" &&
   !block.image &&
   !block.text.includes("→") &&
   !numberedPracticeItem.test(block.text.trim())
  ) {
   current.push(block);
  } else {
   blockGroups.push([block]);
  }
 }

 return (
  <section id={section.id} className="grid min-w-0 scroll-mt-3 gap-4">
   {visibleBlocks.length > 0 &&
   !(section.category === "grammar" && visibleBlocks[0]?.type === "subheading") ? (
    <header>
     <SpeakableBusinessChineseText
      pronunciationId={`${section.id}:title`}
      text={stripLeadingEmoji(section.title)}
      displayMode={displayMode}
      variant="sectionTitle"
      weight="black"
      compactHanzi
      learnerContent={learnerContent}
      speakable={section.category !== "practice"}
     />
    </header>
   ) : null}
   {practiceSubheadings.length > 1 ? (
    <div className="flex min-w-0 flex-wrap gap-2">
     {practiceSubheadings.map((sub) => (
      <Button
       key={sub.id}
       type="button"
       size="compact"
       variant="outline"
       wrap="normal"
       onClick={() =>
        scrollAppContentToElement(document.getElementById(sub.id), {
         behavior: "smooth",
         block: "start",
        })
       }
      >
       {sub.text}
      </Button>
     ))}
    </div>
   ) : null}
   <div className="grid min-w-0 gap-4">
    {vocabularyPreview}
    {blockGroups.map((blocks, groupIndex) => {
     const first = blocks[0];
     if (!first) return null;
     const previous = blockGroups[groupIndex - 1]?.[0];
     const grammarExample =
      section.category === "grammar" &&
      first.type === "paragraph" &&
      Boolean(
       splitBusinessChineseGrammarExample(splitTrailingTranslation(first.text).source).translation,
      );
     const previousGrammarExample =
      previous?.type === "paragraph" &&
      Boolean(
       splitBusinessChineseGrammarExample(splitTrailingTranslation(previous.text).source)
        .translation,
      );
     const content = blocks.map((block) => {
      if (block.image) {
       return (
        <figure key={block.id} id={block.id} className="grid min-w-0 gap-2">
         <Image
          src={block.image.src}
          alt={block.image.alt}
          width={block.image.width}
          height={block.image.height}
          unoptimized
          className="h-auto max-w-full"
         />
         {block.text ? (
          <Typography as="figcaption" variant="bodySmall" tone="muted">
           {block.text}
          </Typography>
         ) : null}
        </figure>
       );
      }
      if (block.type === "table") {
       return (
        <BusinessChineseTable
         key={block.id}
         block={block}
         displayMode={displayMode}
         vocabularyCards={section.category === "vocab"}
         learnerContent={learnerContent}
        />
       );
      }
      if (block.type === "subheading") {
       return (
        <BusinessChineseTextBlock
         key={block.id}
         pronunciationId={block.id}
         text={block.text}
         translation={block.translation ?? translations.get(block.id)}
         displayMode={sectionDisplayMode}
         compactHanzi={section.category !== "text" && section.category !== "vocab"}
         variant={
          section.category === "vocab" || section.category === "grammar"
           ? "sectionTitle"
           : "cardTitle"
         }
         weight="black"
         grammar={section.category === "grammar"}
         practice={section.category === "practice"}
         speakable={section.category !== "practice"}
        />
       );
      }
      if (
       section.category === "practice" &&
       (block.text.includes("→") || pairedAnswers.has(block.id))
      ) {
       return (
        <BusinessChineseExercise
         key={block.id}
         block={block}
         displayMode={displayMode}
         pairedAnswer={pairedAnswers.get(block.id)}
        />
       );
      }
      const phrases = section.category === "practice" ? splitPipePhraseDrill(block.text) : [];
      if (phrases.length > 0) {
       return (
        <div
         key={block.id}
         id={block.id}
         data-textbook-block={block.id}
         className="grid min-w-0 scroll-mt-24 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
         {phrases.map((phrase, index) => (
          <div
           key={`${index}:${phrase}`}
           className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border-default bg-surface-muted/40 px-3 py-2"
          >
           <BusinessChineseText
            pronunciationId={`${block.id}:phrase:${index}`}
            text={phrase}
            displayMode={displayMode}
            learnerContent
            variant="body"
           />
           <MandarinSpeakButton text={phrase} segments={[phrase]} touchTarget />
          </div>
         ))}
        </div>
       );
      }
      return (
       <BusinessChineseTextBlock
        key={learnerContent ? `${block.id}:${sectionDisplayMode.revealMode}` : block.id}
        pronunciationId={block.id}
        text={block.text}
        translation={block.translation ?? translations.get(block.id)}
        displayMode={sectionDisplayMode}
        compactHanzi={section.category !== "text" && section.category !== "vocab"}
        variant={section.category === "vocab" || learnerContent ? "body" : "bodySmall"}
        weight={section.category === "grammar" ? "normal" : undefined}
        grammar={section.category === "grammar"}
        practice={section.category === "practice"}
       />
      );
     });
     return (
      <div key={first.id} className="grid min-w-0 gap-3">
       {section.category === "grammar" && first.text.trim().startsWith("Cách dùng:") ? (
        <Typography as="h3" variant="cardTitle" weight="semibold">
         {t("content.explanation")}
        </Typography>
       ) : null}
       {grammarExample && !previousGrammarExample && !previous?.text.trim().startsWith("Ví dụ") ? (
        <Typography as="h3" variant="cardTitle" weight="semibold">
         {t("content.examples")}
        </Typography>
       ) : null}
       {content}
       {grammarExample && groupIndex < blockGroups.length - 1 ? <Separator /> : null}
      </div>
     );
    })}
   </div>
  </section>
 );
}
export function BusinessChineseStudyWorkspace({
 books: initialBooks,
 lesson: initialLesson,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const searchParams = useSearchParams();
 const sourceTarget = parseReaderSourceTarget(new URLSearchParams(searchParams.toString()));
 const router = useLocalizedRouter();
 const learning = useLearningState();
 const learningState = learning.state;
 const { toggleBookmark } = learning;

 const currentPath = usePathname();
 const detectedBookKey: TextbookLesson["bookKey"] = currentPath.includes("/khau-ngu-tc1")
  ? "khau-ngu"
  : currentPath.includes("/doc-hieu")
    ? "doc-hieu"
    : currentPath.includes("/han-thuong-mai")
      ? "tm3"
      : currentPath.includes("/nhip-cau")
        ? "nhip-cau"
        : initialLesson.bookKey;

 const requestedLessonNumber =
  typeof searchParams.get("lesson") === "string" ? Number(searchParams.get("lesson")) : null;

 const lesson = useMemo(() => {
  const targetNumber =
   requestedLessonNumber && Number.isInteger(requestedLessonNumber)
    ? requestedLessonNumber
    : detectedBookKey !== initialLesson.bookKey
      ? 1
      : initialLesson.number;

  if (detectedBookKey !== initialLesson.bookKey || targetNumber !== initialLesson.number) {
   const resolved = getTextbookLesson(detectedBookKey, targetNumber);
   if (resolved) return resolved;
  }
  return initialLesson;
 }, [detectedBookKey, initialLesson, requestedLessonNumber]);

 const books = useMemo(() => {
  if (initialBooks.some((b) => b.key === lesson.bookKey)) return initialBooks;
  return getTextbookCatalogForBookKeys([lesson.bookKey]);
 }, [initialBooks, lesson.bookKey]);

 const book = books.find((item) => item.key === lesson.bookKey);
 const bookKey = `static:${book?.id ?? lesson.bookKey}`;
 const resume = learningState.settings.bookResume?.[bookKey];
 const resumeLesson = book?.lessons.find((item) => item.id === resume?.lessonId);
 const shouldRestoreLesson =
  !searchParams.has("lesson") &&
  !learning.isLoading &&
  Boolean(resumeLesson && resumeLesson.id !== lesson.id);
 const displayMode: LessonDisplayMode = useMemo(
  () => ({
   ...defaultTextbookDisplaySettings,
   ...(learningState.settings.bookDisplayModes?.[bookKey] ?? {}),
  }),
  [bookKey, learningState.settings.bookDisplayModes],
 );
 const isLessonBookmarked = (learningState.bookmarks.lessons ?? []).includes(lesson.id);
 const lastBookmarkClickRef = useRef(0);
 const handleToggleCurrentLessonBookmark = useCallback(() => {
  const now = Date.now();
  if (now - lastBookmarkClickRef.current < 400) return;
  lastBookmarkClickRef.current = now;
  toggleBookmark("lessons", lesson.id);
 }, [lesson.id, toggleBookmark]);

 const contentSections = useMemo(
  () => businessChineseContentSections(lesson.sections),
  [lesson.sections],
 );

 const dictationSources = useMemo(() => dictationSourcesFromTextbook(lesson), [lesson]);

 const tabs = useMemo<SegmentedControlItem<string>[]>(
  () =>
   [
    { key: "all", label: t("tabs.all") },
    { key: "overview", label: t("tabs.overview") },
    { key: "core", label: t("tabs.core") },
    { key: "text", label: t("tabs.text") },
    { key: "notes", label: t("tabs.notes") },
    { key: "translation", label: t("tabs.translation") },
    { key: "dictation", label: t("tabs.dictation") },
    { key: "vocab", label: t("tabs.vocab") },
    { key: "grammar", label: t("tabs.grammar") },
    { key: "practice", label: t("tabs.practice") },
   ].filter((tab) =>
    businessChineseTabAvailable(
     tab.key,
     contentSections,
     dictationSources.length,
     lesson.vocab.length,
    ),
   ),
  [contentSections, dictationSources.length, lesson.vocab.length, t],
 );

 const [optimisticTab, setOptimisticTab] = useState<string | null>(null);
 const activeTabParam = optimisticTab ?? searchParams.get("tab");
 const requestedView =
  activeTabParam ??
  (sourceTarget?.documentId === `${lesson.id}:text`
   ? "text"
   : !searchParams.has("lesson") && resume?.lessonId === lesson.id
     ? resume.module
     : "all");
 const activeView = tabs.find((item) => item.key === requestedView)?.key ?? "all";
 const readerDocument = useMemo(
  () => buildBusinessChineseReaderDocument(lesson, activeView),
  [activeView, lesson],
 );
 const setActiveView = (value: string) => {
  setOptimisticTab(value);
  const params = new URLSearchParams(searchParams.toString());
  params.set("lesson", String(lesson.number));
  params.set("tab", value);
  if (currentPath.endsWith("/offline")) {
   window.history.pushState(null, "", `?${params.toString()}`);
   return;
  }
  router.push(`${buildTextbookHref(lesson.bookKey, lesson.number).split("?")[0]}?${params}`, {
   scroll: false,
  });
 };
 useEffect(() => {
  if (learning.isLoading) return;
  if (shouldRestoreLesson && resumeLesson) {
   if (currentPath.endsWith("/offline")) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lesson", String(resumeLesson.number));
    params.set("tab", searchParams.get("tab") ?? resume?.module ?? "all");
    window.history.replaceState(null, "", `?${params.toString()}`);
    return;
   }
   router.replace(
    `${buildTextbookHref(lesson.bookKey, resumeLesson.number)}&tab=${encodeURIComponent(searchParams.get("tab") ?? resume?.module ?? "all")}`,
   );
   return;
  }
  if (resume?.lessonId !== lesson.id || resume.module !== activeView) {
   learning.updateSettings({
    bookResume: { [bookKey]: { lessonId: lesson.id, module: activeView } },
   });
  }
 }, [
  learning,
  shouldRestoreLesson,
  resumeLesson,
  resume,
  router,
  lesson,
  activeView,
  bookKey,
  searchParams,
  currentPath,
 ]);

 const navMenu = (
  <BusinessChineseWorkspaceNavMenu
   tabs={tabs}
   activeView={activeView}
   onActiveViewChange={setActiveView}
   isLessonBookmarked={isLessonBookmarked}
   onToggleLessonBookmark={handleToggleCurrentLessonBookmark}
   bookmarkLabel={t("bookmarkLesson")}
   bookmarkedLabel={t("bookmarked")}
   offlineReadyLabel={t("offlineReady")}
   offlineDescription={t("offlineDescription")}
   menuLabel={t("tabsLabel")}
  />
 );

 if (shouldRestoreLesson) return <HanziHomeWorkspaceLoading />;

 return (
  <MandarinTtsProvider>
   <ReaderPronunciationSessionProvider key={lesson.id}>
    <BusinessChineseReader
     key={readerDocument.id}
     document={readerDocument}
     bookKey={bookKey}
     services={{
      toolbar: {
       actions: navMenu,
      },
      renderReader: ({ content }) => (
       <BusinessChineseStudyWorkspaceContent
        books={books}
        lesson={lesson}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        tabs={tabs}
        isLessonBookmarked={isLessonBookmarked}
        onToggleLessonBookmark={handleToggleCurrentLessonBookmark}
        navMenu={navMenu}
        readerContent={content}
        bookKey={bookKey}
        displayMode={displayMode}
       />
      ),
     }}
    />
   </ReaderPronunciationSessionProvider>
  </MandarinTtsProvider>
 );
}

function BusinessChineseReader({
 document,
 bookKey,
 services,
}: {
 document: ReaderDocumentModel;
 bookKey: string;
 services?: ReaderServices;
}) {
 const integration = useLessonReader({
  document,
  displayMode: defaultTextbookDisplaySettings,
  bookKey,
 });
 return (
  <Reader
   data={integration.data}
   display={integration.display}
   services={{
    ...integration.services,
    ...services,
    toolbar: {
     stickyOffset: "page",
     ...integration.services.toolbar,
     ...services?.toolbar,
    },
    renderReader: ({ content }) => {
     const workspace = services?.renderReader ? services.renderReader({ content }) : content;
     return integration.services.renderReader
      ? integration.services.renderReader({ content: workspace })
      : workspace;
    },
   }}
  />
 );
}

function BusinessChineseStudyWorkspaceContent({
 books,
 lesson,
 activeView,
 onActiveViewChange,
 tabs,
 isLessonBookmarked,
 onToggleLessonBookmark,
 navMenu,
 readerContent,
 bookKey,
 displayMode,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
 activeView: string;
 onActiveViewChange: (value: string) => void;
 tabs: SegmentedControlItem<string>[];
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 navMenu: ReactNode;
 readerContent: ReactNode;
 bookKey: string;
 displayMode: LessonDisplayMode;
}) {
 const t = useTranslations("BusinessChinese");
 const isLessonOfflineReady = useIsLessonCached(lesson.id);
 const textReaderDocument = useMemo(
  () => buildBusinessChineseReaderDocument(lesson, "text"),
  [lesson],
 );
 const [annotationError, setAnnotationError] = useState("");
 const annotationsQuery = useBusinessChineseReaderAnnotations(textReaderDocument.id);
 const readerVocabulary = useMemo(
  () => businessChineseReaderVocabulary(lesson.vocab),
  [lesson.vocab],
 );
 const analysisBySegmentId = useMemo(
  () => businessChinesePronunciationAnalyses(textReaderDocument),
  [textReaderDocument],
 );
 const readerCommands = useReaderCommands();
 const { actions: readerActions } = useReaderStore();
 const parentServices = useReaderServices();
 const {
  handleOpenAnnotation,
  handleSelection,
  popover: selectionPopover,
 } = useReaderSelectionActions({
  selectSegment: readerActions.selectSegment,
  stop: readerCommands.stop,
  playFromCharacter: readerCommands.playFromCharacter,
  document: textReaderDocument,
  vocabulary: readerVocabulary,
  stateOwner: "personal",
  analysisBySegmentId,
  setSaveError: setAnnotationError,
 });
 const focusMode = useReaderSelector((state) => state.ui.focusMode);

 const sectionDocuments = useMemo(
  () => businessChineseSectionDocuments(textReaderDocument),
  [textReaderDocument],
 );

 const renderReaderSection = useCallback(
  ({ section: readerSection, content }: { section: { id: string }; content: ReactNode }) => (
   <div id={readerSection.id}>{content}</div>
  ),
  [],
 );

 const annotationServices: ReaderServices = useMemo(
  () => ({
   annotations: {
    items: businessChineseReaderAnnotations(annotationsQuery.data ?? []),
    onOpen: (annotation, rect) => {
     const source = annotationsQuery.data?.find((item) => item.id === annotation.id);
     if (source) handleOpenAnnotation(source, rect);
    },
    onSelection: (target) => {
     const index = textReaderDocument.segments.findIndex(
      (segment) => segment.id === target.segmentId,
     );
     const segment = textReaderDocument.segments[index];
     if (segment) handleSelection({ ...target, segment, index });
    },
   },
  }),
  [annotationsQuery.data, handleOpenAnnotation, handleSelection, textReaderDocument],
 );

 const firstSectionServices = useMemo<ReaderServices>(
  () => ({
   ...annotationServices,
   toolbar: { actions: navMenu },
   renderSection: renderReaderSection,
  }),
  [annotationServices, navMenu, renderReaderSection],
 );

 const otherSectionServices = useMemo<ReaderServices>(
  () => ({
   ...annotationServices,
   renderSection: renderReaderSection,
  }),
  [annotationServices, renderReaderSection],
 );
 const annotationsContextValue = useMemo<BusinessChineseAnnotationsContextValue>(
  () => ({
   readerAnnotations: annotationsQuery.data ?? [],
   onOpenReaderAnnotation: handleOpenAnnotation,
  }),
  [annotationsQuery.data, handleOpenAnnotation],
 );
 const readerServicesValue = useMemo<ReaderServices>(
  () => ({ ...parentServices, ...annotationServices }),
  [parentServices, annotationServices],
 );

 const pairedTranslations = useMemo(
  () => pairedTextbookTranslations(lesson.sections),
  [lesson.sections],
 );
 const sourceSections = useMemo(
  () => businessChineseSourceSections(lesson.sections),
  [lesson.sections],
 );
 const contentSections = useMemo(
  () => businessChineseContentSections(sourceSections),
  [sourceSections],
 );
 const canonicalVocabularyTableIds = useMemo(
  () => businessChineseVocabularyTableIds(contentSections, lesson.vocab),
  [contentSections, lesson.vocab],
 );
 const visibleSections = useMemo(
  () => businessChineseVisibleSections(contentSections, activeView),
  [activeView, contentSections],
 );
 const translationSegments = useMemo(() => translationSegmentsFromTextbook(lesson), [lesson]);
 const dictationSources = useMemo(() => dictationSourcesFromTextbook(lesson), [lesson]);
 const intro = lesson.intro.join(" ");
 const lessonTitle = splitTrailingTranslation(lessonDisplayTitle(lesson.title));
 const book = books.find((item) => item.key === lesson.bookKey);
 const sequentialLessons = book?.lessons.every((item, index) => item.number === index + 1);
 const selectSection = (sectionId: string) => {
  scrollAppContentToElement(document.getElementById(sectionId), {
   behavior: "smooth",
   block: "start",
  });
 };

 const desktopTabActions = (
  <>
   <Button
    variant="ghost"
    size="sm"
    className="gap-1.5 shrink-0"
    onClick={onToggleLessonBookmark}
    title={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
    aria-label={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
   >
    <Bookmark
     className={cn(
      "size-3.5",
      isLessonBookmarked ? "fill-warning text-warning" : "text-muted-foreground",
     )}
    />
    <span className={cn(isLessonBookmarked && "font-semibold text-warning-text")}>
     {isLessonBookmarked ? t("bookmarked") : t("bookmarkLesson")}
    </span>
   </Button>
   {isLessonOfflineReady ? (
    <Badge
     variant="success"
     size="sm"
     casing="natural"
     className="cursor-default gap-1 shrink-0"
     title={t("offlineDescription")}
    >
     <CloudCheck data-icon="inline-start" />
     <span>{t("offlineReady")}</span>
    </Badge>
   ) : null}
  </>
 );

 return (
  <BusinessChineseAnnotationsContext.Provider value={annotationsContextValue}>
   <ReaderServicesContext.Provider value={readerServicesValue}>
    <BusinessChineseHeaderContextBridge books={books} lesson={lesson} />
    <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
     <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col gap-2.5">
      <Typography as="h1" variant="pageTitle" className="sr-only">
       {lesson.bookLabel} ·{" "}
       {sequentialLessons ? (
        <>
         {t("lessonPosition", { lesson: lesson.number, count: book?.lessons.length ?? 0 })}
         {" · "}
        </>
       ) : null}
       {lesson.title}
      </Typography>
      {activeView !== "text" && activeView !== "all" ? (
       <div className="shrink-0 xl:hidden">
        <WorkspaceToolbar>
         <div className="flex min-w-0 flex-1 items-center gap-2">
          <Typography variant="bodySmall" weight="bold" clamp="one">
           {tabs.find((tab) => tab.key === activeView)?.label ?? t("tabsLabel")}
          </Typography>
         </div>
         <div className="flex shrink-0 items-center gap-1.5">
          <Button
           variant={isLessonBookmarked ? "warning" : "ghost"}
           size="icon-toolbar"
           onClick={onToggleLessonBookmark}
           title={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
           aria-label={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
          >
           <Bookmark
            className={cn(
             "size-4",
             isLessonBookmarked ? "fill-current text-warning" : "text-muted-foreground",
            )}
           />
          </Button>
          {navMenu}
         </div>
        </WorkspaceToolbar>
       </div>
      ) : null}
      <Tabs
       value={activeView}
       items={tabs}
       onValueChange={onActiveViewChange}
       actions={desktopTabActions}
       aria-label={t("tabsLabel")}
       className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] gap-2 overflow-hidden xl:grid-rows-[auto_minmax(0,1fr)]"
       listClassName="hanzihome-liquid-toolbar hidden xl:flex"
      >
       <TabsContent value={activeView} className="min-h-0 overflow-hidden">
        <div className="relative h-full min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pr-1 scrollbar-soft">
         <div className="grid min-w-0 gap-3 pb-4">
          {annotationError || annotationsQuery.error ? (
           <Typography variant="bodySmall" tone="danger" role="alert">
            {annotationError || annotationsQuery.error?.message}
           </Typography>
          ) : null}
          {activeView === "overview" ? (
           <Card variant="section" padding="md">
            <div className="grid min-w-0 gap-2">
             <BusinessChineseText
              pronunciationId={`${lesson.id}:title`}
              text={lessonTitle.source}
              displayMode={displayMode}
              variant="pageTitle"
              weight="black"
             />
             {lessonTitle.translation && displayMode.showMeaning ? (
              <TranslationText variant="sectionTitle" tone="secondary" weight="black">
               {lessonTitle.translation}
              </TranslationText>
             ) : null}
             {intro ? (
              <Typography variant="bodySmall" tone="secondary">
               {intro}
              </Typography>
             ) : null}
             <Typography variant="caption" tone="muted">
              {t("lessonMeta", {
               sections: contentSections.length,
               vocab: lesson.vocab.length,
              })}
             </Typography>
            </div>
           </Card>
          ) : null}

          {activeView === "text" ? (
           <Card variant="section" padding="lg" data-textbook-document className="min-w-0">
            {readerContent}
           </Card>
          ) : null}

          {activeView === "notes" ? <TextbookNoteAccessCard lesson={lesson} /> : null}

          {activeView === "translation" ? (
           <LessonTranslationWorkspace segments={translationSegments} displayMode={displayMode} />
          ) : null}

          {activeView === "dictation" ? (
           <LessonDictationWorkspace
            sources={dictationSources}
            titleVi={lesson.title}
            titleZh={lesson.bookLabel}
           />
          ) : null}

          {activeView !== "text" &&
          activeView !== "notes" &&
          activeView !== "translation" &&
          activeView !== "dictation" ? (
           <div
            className={cn(
             "grid min-w-0 gap-3",
             !focusMode && "2xl:grid-cols-[15rem_minmax(0,1fr)]",
            )}
           >
            {!focusMode ? (
             <DesktopSectionNavigation sections={visibleSections} onSelect={selectSection} />
            ) : null}
            <div className="grid min-w-0 gap-3">
             {!focusMode ? (
              <MobileSectionNavigation sections={visibleSections} onSelect={selectSection} />
             ) : null}
             <Card
              variant="section"
              padding="lg"
              data-textbook-document
              className="grid min-w-0 gap-6"
             >
              {lesson.vocab.length > 0 &&
              canonicalVocabularyTableIds.length === 0 &&
              (activeView === "all" || activeView === "vocab") ? (
               <TextbookVocabularyPreview
                vocabulary={lesson.vocab}
                displayMode={displayMode}
                onOpenVocabulary={
                 activeView === "all" ? () => onActiveViewChange("vocab") : undefined
                }
               />
              ) : null}
              {activeView === "practice" &&
              (translationSegments.length > 0 || dictationSources.length > 0) ? (
               <Card
                variant="subtle"
                padding="sm"
                className="flex min-w-0 flex-wrap items-center gap-2"
               >
                {translationSegments.length > 0 ? (
                 <Button
                  type="button"
                  size="compact"
                  variant="outline"
                  title={t("practice.translation.description")}
                  onClick={() => onActiveViewChange("translation")}
                 >
                  {t("practice.translation.open", { count: translationSegments.length })}
                 </Button>
                ) : null}
                {dictationSources.length > 0 ? (
                 <Button
                  type="button"
                  size="compact"
                  variant="outline"
                  title={t("practice.dictation.description")}
                  onClick={() => onActiveViewChange("dictation")}
                 >
                  {t("practice.dictation.open", {
                   count: businessChineseDictationCount(dictationSources),
                  })}
                 </Button>
                ) : null}
               </Card>
              ) : null}
              {visibleSections.map((section, index) => {
               const content = (
                <BusinessChineseSection
                 section={section}
                 displayMode={displayMode}
                 translations={pairedTranslations}
                 canonicalVocabularyTableIds={canonicalVocabularyTableIds}
                 vocabularyPreview={
                  section.blocks.some((block) => block.id === canonicalVocabularyTableIds[0]) ? (
                   <TextbookVocabularyPreview
                    vocabulary={lesson.vocab}
                    displayMode={displayMode}
                    onOpenVocabulary={
                     activeView === "all" ? () => onActiveViewChange("vocab") : undefined
                    }
                   />
                  ) : undefined
                 }
                />
               );
               return (
                <Fragment key={section.id}>
                 {section.category === "text" ? (
                  <BusinessChineseReader
                   bookKey={bookKey}
                   document={sectionDocuments.get(section.id) ?? textReaderDocument}
                   services={index === 0 ? firstSectionServices : otherSectionServices}
                  />
                 ) : (
                  content
                 )}
                 {index < visibleSections.length - 1 ? <Separator /> : null}
                </Fragment>
               );
              })}
             </Card>
            </div>
           </div>
          ) : null}
         </div>
        </div>
       </TabsContent>
      </Tabs>
      {selectionPopover}
     </div>
    </div>
   </ReaderServicesContext.Provider>
  </BusinessChineseAnnotationsContext.Provider>
 );
}
