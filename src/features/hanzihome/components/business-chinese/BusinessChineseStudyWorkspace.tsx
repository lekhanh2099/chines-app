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
} from "react";
import { useSelector } from "@tanstack/react-store";
import { useSearchParams } from "next/navigation";
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
import { useRouter as useLocalizedRouter } from "@/i18n/navigation";
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
}: {
 pronunciationId: string;
 text: string;
 displayMode?: LessonDisplayMode;
 sourcePinyin?: string;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
 compactHanzi?: boolean;
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
 const readerSegmentIndex = useReaderSelector((state) =>
  state.content.segmentIds.indexOf(pronunciationId),
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
  () => (compactHanzi ? { ...displayMode, hanziSize: "md" } : displayMode),
  [compactHanzi, displayMode],
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
   <Typography as="div" variant={variant} weight={weight} wrapping="preWrap">
    {text}
   </Typography>
  );
 }

 const content = isChineseOnlyText(text) ? (
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
    readerSegmentIndex >= 0
     ? (start) => readerCommands.playFromCharacter(pronunciationId, start)
     : undefined
   }
   onGlyphInspect={inspectPronunciation}
  />
 ) : (
  <BusinessChineseMixedText
   analysis={analysis}
   displayMode={displayMode}
   showPinyin={canShowPinyin}
   variant={variant}
   weight={weight}
   onGlyphInspect={inspectPronunciation}
  />
 );

 return (
  <>
   {content}
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
}: {
 analysis: ContextualPronunciationAnalysis;
 displayMode: LessonDisplayMode;
 showPinyin: boolean;
 variant: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
 onGlyphInspect: (glyph: ContextualPronunciationGlyph, rect: DOMRect) => void;
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

 return (
  <Typography as="div" variant={variant} weight={weight} wrapping="preWrap">
   {graphemes.map((grapheme) => {
    const glyph = glyphByStart.get(grapheme.index);
    if (glyph === undefined) {
     return <span key={`${grapheme.index}:${grapheme.segment}`}>{grapheme.segment}</span>;
    }
    const needsPronunciationReview =
     glyph.isPolyphonic && !glyph.evidence.includes("manual-override");

    if (!showPinyin || glyph.spokenPinyin === null) {
     return (
      <ReaderHanziText
       key={`${grapheme.index}:${grapheme.segment}`}
       displayMode={displayMode}
       size="inherit"
      >
       {grapheme.segment}
      </ReaderHanziText>
     );
    }

    return (
     <ruby key={`${grapheme.index}:${grapheme.segment}`}>
      <ReaderHanziText displayMode={displayMode} size="inherit">
       {grapheme.segment}
      </ReaderHanziText>
      <rt className="select-none">
       <PinyinText
        as="span"
        tone="accent"
        weight="semibold"
        scale="cloze"
        className={cn(
         "cursor-pointer rounded-sm",
         focusRingClassName,
         needsPronunciationReview && "text-warning underline decoration-dotted underline-offset-2",
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
}: {
 pronunciationId: string;
 text: string;
 displayMode: LessonDisplayMode;
 sourcePinyin?: string;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
 compactHanzi?: boolean;
}) {
 const speechSegments = getChineseSpeechSegments(text);

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
}: {
 block: TextbookLesson["sections"][number]["blocks"][number];
 displayMode: LessonDisplayMode;
}) {
 const t = useTranslations("BusinessChinese");
 const [revealed, setRevealed] = useState(false);
 const answerVisible = displayMode.showAnswers || revealed;
 const { headers, pinyinColumnIndex, hanziColumnIndex, isVocabularyTable, visibleColumnIndexes } =
  businessChineseTableColumns(block, displayMode, answerVisible);

 return (
  <div className="grid min-w-0 gap-2">
   {block.text ? (
    <SpeakableBusinessChineseText
     pronunciationId={`${block.id}:prompt`}
     text={block.text}
     displayMode={displayMode}
     compactHanzi
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
           variant={isVocabularyTable ? "body" : "label"}
           weight={isVocabularyTable ? "black" : undefined}
           compactHanzi
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
             variant={isVocabularyTable ? "body" : "bodySmall"}
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
             variant={isVocabularyTable ? "body" : "bodySmall"}
             compactHanzi={!isVocabularyTable && headers.length !== 2}
            />
           )}
          </td>
         ))}
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   ) : null}
  </div>
 );
}

function TextbookVocabularyPreview({
 vocabulary,
 onOpenVocabulary,
}: {
 vocabulary: TextbookLesson["vocab"];
 onOpenVocabulary?: () => void;
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
      hanviet={word.hanviet}
      category={word.pos}
      meaning={word.meaning}
     />
    ))}
   </div>
  </LessonPreviewCard>
 );
}

function BusinessChineseExercise({
 block,
 displayMode,
}: {
 block: TextbookLesson["sections"][number]["blocks"][number];
 displayMode: LessonDisplayMode;
}) {
 const t = useTranslations("BusinessChinese");
 const [revealed, setRevealed] = useState(false);
 const { prompt, answer } = splitBusinessChineseExercise(block.text);
 const answerVisible = displayMode.showAnswers || revealed;

 return (
  <Card variant="subtle" padding="sm">
   <div className="grid min-w-0 gap-2">
    <SpeakableBusinessChineseText
     pronunciationId={`${block.id}:prompt`}
     text={prompt}
     displayMode={displayMode}
     compactHanzi
    />
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
}: {
 pronunciationId: string;
 text: string;
 translation?: string;
 displayMode?: LessonDisplayMode;
 compactHanzi?: boolean;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
}) {
 const displayMode = useMemo(
  () => ({
   ...defaultTextbookDisplaySettings,
   ...propDisplayMode,
  }),
  [propDisplayMode],
 );
 const t = useTranslations("BusinessChinese");
 const [revealStage, setRevealStage] = useState(0);
 const inlineText = splitTrailingTranslation(text);
 const sourceTurn = splitDialogueTurn(inlineText.source);
 const resolvedTranslation = translation?.trim() || inlineText.translation;
 const translationTurn = splitDialogueTurn(resolvedTranslation);
 const progressiveReveal =
  !compactHanzi && displayMode.revealMode === "tap" && containsHanziText(sourceTurn.content);
 const speechSegments = getChineseSpeechSegments(sourceTurn.content);
 const revealDisplayMode: LessonDisplayMode = useMemo(
  () => ({ ...displayMode, showPinyin: revealStage >= 1 }),
  [displayMode, revealStage],
 );
 const nextRevealStage = revealStage >= (translationTurn.content ? 2 : 1) ? 0 : revealStage + 1;
 const revealLabel =
  nextRevealStage === 0
   ? t("actions.revealHanzi")
   : nextRevealStage === 1
     ? t("actions.revealPinyin")
     : t("actions.revealMeaning");

 return (
  <div
   id={progressiveReveal ? pronunciationId : undefined}
   className="grid min-w-0 scroll-mt-24 gap-1.5"
  >
   {sourceTurn.speaker ? (
    <HanziAwareText
     as="span"
     text={sourceTurn.speaker}
     variant="overline"
     tone="muted"
     weight="black"
     tracking="wide"
     transform="uppercase"
    />
   ) : null}
   {progressiveReveal ? (
    <div className="grid min-w-0 gap-1.5">
     <div className="flex min-w-0 items-start gap-2">
      <div className="min-w-0 flex-1">
       {revealStage === 2 && translationTurn.content ? (
        <TranslationText weight="medium" leading="relaxed" wrapping="preWrap">
         {translationTurn.content}
        </TranslationText>
       ) : (
        <BusinessChineseText
         pronunciationId={pronunciationId}
         text={sourceTurn.content}
         displayMode={revealDisplayMode}
        />
       )}
      </div>
      {speechSegments.length > 0 ? (
       <MandarinSpeakButton text={speechSegments.join(" ")} segments={speechSegments} touchTarget />
      ) : null}
     </div>
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
    </div>
   ) : (
    <SpeakableBusinessChineseText
     pronunciationId={pronunciationId}
     text={sourceTurn.content}
     displayMode={displayMode}
     compactHanzi={compactHanzi}
     variant={variant}
     weight={weight}
    />
   )}
   {!progressiveReveal && translationTurn.content && displayMode.showMeaning ? (
    <TranslationText
     variant={variant === "body" ? "body" : "bodySmall"}
     tone="muted"
     weight="medium"
     leading="relaxed"
     wrapping="preWrap"
    >
     {translationTurn.content}
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
 const visibleBlocks = businessChineseVisibleBlocks(section, canonicalVocabularyTableIds);
 const sectionDisplayMode: LessonDisplayMode =
  section.category === "vocab" ? { ...displayMode, revealMode: "always" } : displayMode;

 return (
  <section id={section.id} className="grid min-w-0 scroll-mt-3 gap-4">
   {visibleBlocks.length > 0 ? (
    <header>
     <SpeakableBusinessChineseText
      pronunciationId={`${section.id}:title`}
      text={stripLeadingEmoji(section.title)}
      displayMode={displayMode}
      variant="sectionTitle"
      weight="black"
      compactHanzi
     />
    </header>
   ) : null}
   <div className="grid min-w-0 gap-4">
    {vocabularyPreview}
    {visibleBlocks.map((block) => {
     if (block.type === "table") {
      return <BusinessChineseTable key={block.id} block={block} displayMode={displayMode} />;
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
        variant={section.category === "vocab" ? "sectionTitle" : "cardTitle"}
        weight="black"
       />
      );
     }
     if (section.category === "practice" && block.text.includes("→")) {
      return <BusinessChineseExercise key={block.id} block={block} displayMode={displayMode} />;
     }
     return (
      <BusinessChineseTextBlock
       key={block.id}
       pronunciationId={block.id}
       text={block.text}
       translation={block.translation ?? translations.get(block.id)}
       displayMode={sectionDisplayMode}
       compactHanzi={section.category !== "text" && section.category !== "vocab"}
       variant={section.category === "vocab" ? "body" : "bodySmall"}
      />
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

 const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
 const detectedBookKey: TextbookLesson["bookKey"] = currentPath.includes("/doc-hieu")
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
  router.push(`${buildTextbookHref(lesson.bookKey, lesson.number).split("?")[0]}?${params}`, {
   scroll: false,
  });
 };
 useEffect(() => {
  if (learning.isLoading) return;
  if (shouldRestoreLesson && resumeLesson) {
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
       {t("lessonPosition", {
        lesson: lesson.number,
        count: books.find((book) => book.key === lesson.bookKey)?.lessons.length ?? 0,
       })}
       {" · "}
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

          {activeView === "text" ? readerContent : null}

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
             <div className="grid min-w-0 gap-6">
              {lesson.vocab.length > 0 &&
              canonicalVocabularyTableIds.length === 0 &&
              (activeView === "all" || activeView === "vocab") ? (
               <TextbookVocabularyPreview
                vocabulary={lesson.vocab}
                onOpenVocabulary={
                 activeView === "all" ? () => onActiveViewChange("vocab") : undefined
                }
               />
              ) : null}
              {activeView === "practice" && translationSegments.length > 0 ? (
               <Card
                variant="subtle"
                padding="sm"
                className="flex flex-wrap items-center justify-between gap-3"
               >
                <div className="flex items-center gap-2">
                 <Badge variant="accent" size="sm" casing="natural">
                  Luyện dịch
                 </Badge>
                 <Typography variant="bodySmall" tone="secondary">
                  Luyện dịch hai chiều câu và đoạn văn của bài này.
                 </Typography>
                </div>
                <Button
                 type="button"
                 size="sm"
                 variant="outline"
                 onClick={() => onActiveViewChange("translation")}
                >
                 Mở Luyện dịch ({translationSegments.length} đoạn)
                </Button>
               </Card>
              ) : null}
              {activeView === "practice" && dictationSources.length > 0 ? (
               <Card
                variant="subtle"
                padding="sm"
                className="flex flex-wrap items-center justify-between gap-3"
               >
                <div className="flex items-center gap-2">
                 <Badge variant="purple" size="sm" casing="natural">
                  Nghe chép
                 </Badge>
                 <Typography variant="bodySmall" tone="secondary">
                  Luyện nghe chép chính tả từng câu ngắn trong bài.
                 </Typography>
                </div>
                <Button
                 type="button"
                 size="sm"
                 variant="outline"
                 onClick={() => onActiveViewChange("dictation")}
                >
                 Mở Nghe chép ({businessChineseDictationCount(dictationSources)} câu)
                </Button>
               </Card>
              ) : null}
              {visibleSections.map((section, index) => (
               <Fragment key={section.id}>
                {section.category === "text" ? (
                 <BusinessChineseReader
                  bookKey={bookKey}
                  document={sectionDocuments.get(section.id) ?? textReaderDocument}
                  services={index === 0 ? firstSectionServices : otherSectionServices}
                 />
                ) : (
                 <Card variant="section" padding="md">
                  <BusinessChineseSection
                   section={section}
                   displayMode={displayMode}
                   translations={pairedTranslations}
                   canonicalVocabularyTableIds={canonicalVocabularyTableIds}
                   vocabularyPreview={
                    section.blocks.some((block) => block.id === canonicalVocabularyTableIds[0]) ? (
                     <TextbookVocabularyPreview
                      vocabulary={lesson.vocab}
                      onOpenVocabulary={
                       activeView === "all" ? () => onActiveViewChange("vocab") : undefined
                      }
                     />
                    ) : undefined
                   }
                  />
                 </Card>
                )}
                {index < visibleSections.length - 1 ? <Separator /> : null}
               </Fragment>
              ))}
             </div>
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
