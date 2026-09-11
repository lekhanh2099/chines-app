"use client";

import {
 createContext,
 Fragment,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useState,
 type KeyboardEvent,
 type MouseEvent,
 type ReactNode,
} from "react";
import { useSelector } from "@tanstack/react-store";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useClientSession } from "@/components/providers/QueryProvider";
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
} from "@/components/layout/app-header-breadcrumb";
import { scrollAppContentToElement } from "@/components/layout/app-scroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { Separator } from "@/components/ui/separator";
import { CloudCheck } from "lucide-react";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectLabel,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography, type TypographyProps } from "@/components/ui/typography";
import { WorkspaceToolbar } from "@/features/hanzihome/components/layout/WorkspaceToolbar";
import {
 containsHanziText,
 HanziAwareText,
 HanziInlineText,
 PinyinText,
 ReaderHanziText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { getActiveCharacterIndex } from "@/features/hanzihome/components/lesson-overview/ProgressiveStudyText";
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
import { fetchReaderAnnotations } from "@/features/reading/services/reading-annotation-api";
import { parseReaderSourceTarget } from "@/features/reading/model/reading-source-target";
import { useReaderSelectionActions } from "@/features/reading/hooks/useReaderSelectionActions";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
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
import type {
 TextbookBookSummary,
 TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { TextbookNoteAccessCard } from "./TextbookNoteAccessCard";
import { LessonTranslationWorkspace } from "@/features/hanzihome/practice/LessonTranslationWorkspace";
import { translationSegmentsFromTextbook } from "@/features/hanzihome/practice/translation-practice";
import { useRouter as useLocalizedRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { focusModeStore } from "@/stores/focus-mode-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";

const headerOwnerId = "business-chinese-study";
const chineseGraphemeSegmenter = new Intl.Segmenter("zh-CN", {
 granularity: "grapheme",
});
const nonChineseTextPattern = /[^\p{Script=Han}\p{Number}\p{Punctuation}\p{Separator}\p{Symbol}]/gu;

const businessChineseDisplayMode: LessonDisplayMode = {
 showPinyin: true,
 autoDetectPinyin: true,
 showMeaning: true,
 showAnswers: false,
 hanziFont: "kaiti",
 hanziSize: "xl",
 revealMode: "always",
};

function isChineseOnlyText(value: string) {
 return value.replace(nonChineseTextPattern, "").trim().length === value.trim().length;
}

function BusinessChineseHeaderContextBridge({
 books,
 lesson,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const router = useLocalizedRouter();
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
     <Select
      value={lesson.id}
      disabled={focusModeEnabled}
      onValueChange={(lessonId) => {
       if (focusModeEnabled) return;
       const selectedLesson = books
        .flatMap((book) => book.lessons)
        .find((item) => item.id === lessonId);
       if (!selectedLesson) return;
       router.push(buildTextbookHref(selectedLesson.bookKey, selectedLesson.number), {
        scroll: false,
       });
      }}
     >
      <SelectTrigger
       aria-label={t("lessonSelectLabel")}
       variant="breadcrumb"
       className="w-[min(11rem,44vw)] md:w-[min(16rem,44vw)] lg:w-[min(18rem,30vw)] xl:w-72"
      >
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[min(28rem,calc(100vw-2rem))]">
       {books.map((book) => (
        <SelectGroup key={book.id}>
         <SelectLabel>{book.label}</SelectLabel>
         {book.lessons.map((item) => (
          <SelectItem key={item.id} value={item.id}>
           {item.title}
          </SelectItem>
         ))}
        </SelectGroup>
       ))}
      </SelectContent>
     </Select>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  ),
  [books, focusModeEnabled, lesson.bookKey, lesson.bookLabel, lesson.id, router, selectedBook, t],
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
 displayMode,
 sourcePinyin,
 variant = "bodySmall",
 weight,
 compactHanzi = false,
}: {
 pronunciationId: string;
 text: string;
 displayMode: LessonDisplayMode;
 sourcePinyin?: string;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
 compactHanzi?: boolean;
}) {
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
  displayMode.showPinyin && (displayMode.autoDetectPinyin || Boolean(sourcePinyin?.trim()));
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
 const headers = block.rows[0] ?? [];
 const pinyinColumnIndex = headers.findIndex((header) => /pinyin/iu.test(header));
 const hanziColumnIndex = headers.findIndex((header) =>
  /tiếng trung|giản thể|hán tự|từ vựng|^từ$/iu.test(header),
 );
 const visibleColumnIndexes = headers
  .map((header, index) => ({ header, index }))
  .filter(({ header }) => displayMode.showMeaning || !/tiếng việt|nghĩa|hán việt/iu.test(header))
  .filter(({ index }) => answerVisible || !block.answerColumnIndexes?.includes(index))
  .map(({ index }) => index);

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
          className="border-b border-border-default px-3 py-2 align-top"
         >
          <BusinessChineseText
           pronunciationId={`${block.id}:header:${cellIndex}`}
           text={headers[cellIndex] ?? ""}
           displayMode={displayMode}
           variant="label"
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
          <td key={`${block.id}-row-${rowIndex}-cell-${cellIndex}`} className="px-3 py-2 align-top">
           {cellIndex === pinyinColumnIndex ? (
            <PinyinText as="span" tone="secondary" weight="semibold" wrapping="preWrap">
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
             variant="bodySmall"
             compactHanzi={headers.length !== 2}
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

function BusinessChineseExercise({
 block,
 displayMode,
}: {
 block: TextbookLesson["sections"][number]["blocks"][number];
 displayMode: LessonDisplayMode;
}) {
 const t = useTranslations("BusinessChinese");
 const [revealed, setRevealed] = useState(false);
 const separatorIndex = block.text.indexOf("→");
 const prompt = block.text.slice(0, separatorIndex).trim();
 const answer = block.text.slice(separatorIndex + 1).trim();
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
 displayMode,
 compactHanzi = false,
 variant,
 weight,
}: {
 pronunciationId: string;
 text: string;
 translation?: string;
 displayMode: LessonDisplayMode;
 compactHanzi?: boolean;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
}) {
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
    <TranslationText tone="muted" weight="medium" leading="relaxed" wrapping="preWrap">
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
}: {
 section: TextbookLesson["sections"][number];
 displayMode: LessonDisplayMode;
 translations: ReadonlyMap<string, string>;
}) {
 return (
  <section id={section.id} className="grid min-w-0 scroll-mt-3 gap-4">
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
   <div className="grid min-w-0 gap-4">
    {section.blocks.map((block) => {
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
        displayMode={displayMode}
        compactHanzi={section.category !== "text"}
        variant="cardTitle"
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
       displayMode={displayMode}
       compactHanzi={section.category !== "text"}
      />
     );
    })}
   </div>
  </section>
 );
}

function MobileSectionNavigation({
 sections,
 onSelect,
}: {
 sections: TextbookLesson["sections"];
 onSelect: (sectionId: string) => void;
}) {
 const t = useTranslations("BusinessChinese");

 return (
  <div className="2xl:hidden">
   <Select onValueChange={onSelect}>
    <SelectTrigger aria-label={t("tocLabel")} width="full">
     <SelectValue placeholder={t("tocLabel")} />
    </SelectTrigger>
    <SelectContent>
     {sections.map((section) => (
      <SelectItem key={section.id} value={section.id}>
       {stripLeadingEmoji(section.title)}
      </SelectItem>
     ))}
    </SelectContent>
   </Select>
  </div>
 );
}

function DesktopSectionNavigation({
 sections,
 onSelect,
}: {
 sections: TextbookLesson["sections"];
 onSelect: (sectionId: string) => void;
}) {
 const t = useTranslations("BusinessChinese");

 return (
  <Card
   variant="section"
   padding="sm"
   className="hidden min-w-0 self-start 2xl:sticky 2xl:top-0 2xl:block"
  >
   <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
    <Typography variant="overline" tone="muted">
     {t("tocLabel")}
    </Typography>
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
     {sections.map((section) => (
      <Button
       key={section.id}
       type="button"
       variant="navigation"
       size="menu"
       align="start"
       className="min-w-0 w-full"
       title={stripLeadingEmoji(section.title)}
       onClick={() => onSelect(section.id)}
      >
       <span className="min-w-0 truncate">
        <HanziInlineText text={stripLeadingEmoji(section.title)} />
       </span>
      </Button>
     ))}
    </div>
   </div>
  </Card>
 );
}

export function BusinessChineseStudyWorkspace({
 books,
 lesson,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
}) {
 const searchParams = useSearchParams();
 const sourceTarget = parseReaderSourceTarget(new URLSearchParams(searchParams.toString()));
 const tabParam = searchParams.get("tab");
 const initialView =
  tabParam === "notes" || tabParam === "translation"
   ? tabParam
   : sourceTarget?.documentId === `${lesson.id}:text`
     ? "text"
     : "all";
 const [activeView, setActiveView] = useState(initialView);
 const readerDocument = useMemo(
  () => buildBusinessChineseReaderDocument(lesson, activeView),
  [activeView, lesson],
 );

 return (
  <MandarinTtsProvider>
   <ReaderPronunciationSessionProvider key={lesson.id}>
    <BusinessChineseReader
     key={readerDocument.id}
     document={readerDocument}
     services={{
      renderReader: ({ content }) => (
       <BusinessChineseStudyWorkspaceContent
        books={books}
        lesson={lesson}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        readerContent={content}
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
 services,
}: {
 document: ReaderDocumentModel;
 services?: ReaderServices;
}) {
 const integration = useLessonReader({
  document,
  displayMode: businessChineseDisplayMode,
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
 readerContent,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
 activeView: string;
 onActiveViewChange: (value: string) => void;
 readerContent: ReactNode;
}) {
 const t = useTranslations("BusinessChinese");
 const displayMode = businessChineseDisplayMode;
 const textReaderDocument = useMemo(
  () => buildBusinessChineseReaderDocument(lesson, "text"),
  [lesson],
 );
 const { userId, isResolved } = useClientSession();
 const [annotationError, setAnnotationError] = useState("");
 const annotationsQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerAnnotations(userId, textReaderDocument.id),
  queryFn: () => fetchReaderAnnotations(textReaderDocument.id),
  enabled: isResolved,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const readerVocabulary = useMemo(
  () =>
   lesson.vocab.map((item) => ({
    id: item.id,
    word: item.hanzi,
    pinyin: item.pinyin,
    meaning: item.meaning,
   })),
  [lesson.vocab],
 );
 const analysisBySegmentId = useMemo(
  () =>
   new Map(
    textReaderDocument.segments.map((segment) => [
     segment.id,
     analyzeContextualPronunciation({
      text: segment.zh,
      sourcePinyin: segment.pinyin ?? null,
     }),
    ]),
   ),
  [textReaderDocument],
 );
 const readerCommands = useReaderCommands();
 const { actions: readerActions } = useReaderStore();
 const parentServices = useReaderServices();
 const selection = useReaderSelectionActions({
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
 const annotationServices: ReaderServices = {
  annotations: {
   items: (annotationsQuery.data ?? []).flatMap((annotation) =>
    annotation.paragraph_id !== null &&
    annotation.start_offset !== null &&
    annotation.end_offset !== null &&
    annotation.end_offset > annotation.start_offset &&
    annotation.selected_text.length > 0
     ? [
        {
         id: annotation.id,
         segmentId: annotation.paragraph_id,
         text: annotation.selected_text,
         start: annotation.start_offset,
         end: annotation.end_offset,
        },
       ]
     : [],
   ),
   onOpen: (annotation, rect) => {
    const source = annotationsQuery.data?.find((item) => item.id === annotation.id);
    if (source) selection.handleOpenAnnotation(source, rect);
   },
   onSelection: (target) => {
    const index = textReaderDocument.segments.findIndex(
     (segment) => segment.id === target.segmentId,
    );
    const segment = textReaderDocument.segments[index];
    if (segment) selection.handleSelection({ ...target, segment, index });
   },
  },
 };
 const pairedTranslations = useMemo(() => {
  const translations = new Map<string, string>();
  const translationIndex = lesson.sections.findIndex((section) =>
   section.title.includes("DỊCH BÀI KHÓA"),
  );
  const sourceSection = translationIndex > 0 ? lesson.sections[translationIndex - 1] : undefined;
  const translationSection = translationIndex >= 0 ? lesson.sections[translationIndex] : undefined;
  if (!sourceSection || !translationSection) return translations;

  sourceSection.blocks.forEach((block, index) => {
   const translation = translationSection.blocks[index];
   if (translation?.text) translations.set(block.id, translation.text);
  });
  return translations;
 }, [lesson.sections]);
 const sourceSections = useMemo(
  () => lesson.sections.filter((section) => !section.title.includes("DỊCH BÀI KHÓA")),
  [lesson.sections],
 );
 const contentSections = useMemo(
  () => sourceSections.filter((section) => section.blocks.length > 0),
  [sourceSections],
 );
 const visibleSections = useMemo(
  () =>
   contentSections.filter((section) => activeView === "all" || section.category === activeView),
  [activeView, contentSections],
 );
 const translationSegments = useMemo(() => translationSegmentsFromTextbook(lesson), [lesson]);
 const tabs = useMemo(
  () =>
   [
    { key: "all", label: t("tabs.all") },
    { key: "overview", label: t("tabs.overview") },
    { key: "core", label: t("tabs.core") },
    { key: "text", label: t("tabs.text") },
    { key: "notes", label: t("tabs.notes") },
    { key: "translation", label: t("tabs.translation") },
    { key: "vocab", label: t("tabs.vocab") },
    { key: "grammar", label: t("tabs.grammar") },
    { key: "practice", label: t("tabs.practice") },
   ].filter(
    (tab) =>
     tab.key === "all" ||
     tab.key === "notes" ||
     tab.key === "translation" ||
     contentSections.some((section) => section.category === tab.key),
   ),
  [contentSections, t],
 );
 const intro = lesson.intro.join(" ");
 const lessonTitle = splitTrailingTranslation(lessonDisplayTitle(lesson.title));
 const selectSection = (sectionId: string) => {
  scrollAppContentToElement(document.getElementById(sectionId), {
   behavior: "smooth",
   block: "start",
  });
 };
 const viewSelector = (
  <Select value={activeView} onValueChange={onActiveViewChange}>
   <SelectTrigger aria-label={t("tabsLabel")} width="full" size="sm">
    <SelectValue />
   </SelectTrigger>
   <SelectContent>
    {tabs.map((tab) => (
     <SelectItem key={tab.key} value={tab.key}>
      {tab.label}
     </SelectItem>
    ))}
   </SelectContent>
  </Select>
 );

 return (
  <BusinessChineseAnnotationsContext.Provider
   value={{
    readerAnnotations: annotationsQuery.data ?? [],
    onOpenReaderAnnotation: selection.handleOpenAnnotation,
   }}
  >
   <ReaderServicesContext.Provider value={{ ...parentServices, ...annotationServices }}>
    <BusinessChineseHeaderContextBridge books={books} lesson={lesson} />
    <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
     <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col gap-2.5">
      <div className="shrink-0 xl:hidden">
       <WorkspaceToolbar>
        <div className="min-w-0 flex-1">{viewSelector}</div>
        <Badge
         variant="success"
         size="sm"
         className="cursor-default gap-1 shrink-0"
         title={t("offlineDescription")}
        >
         <CloudCheck data-icon="inline-start" />
         <span className="hidden sm:inline">{t("offlineReady")}</span>
        </Badge>
       </WorkspaceToolbar>
      </div>
      <Tabs
       value={activeView}
       items={tabs}
       onValueChange={onActiveViewChange}
       aria-label={t("tabsLabel")}
       className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] gap-2 overflow-hidden xl:grid-rows-[auto_minmax(0,1fr)]"
       listClassName="hanzihome-liquid-toolbar hidden xl:flex"
      >
       <TabsContent value={activeView} className="min-h-0 overflow-hidden">
        <div className="relative h-full min-h-0 min-w-0 overflow-y-auto pr-1 scrollbar-soft">
         <div className="grid min-w-0 gap-3 pb-4">
          {annotationError || annotationsQuery.error ? (
           <Typography variant="bodySmall" tone="danger" role="alert">
            {annotationError || annotationsQuery.error?.message}
           </Typography>
          ) : null}
          <Card
           variant="section"
           padding="md"
           className={activeView === "text" ? "hidden sm:block" : undefined}
          >
           <div className="grid min-w-0 gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
             <Typography variant="overline" tone="muted">
              {lesson.bookLabel} ·{" "}
              {t("lessonPosition", {
               lesson: lesson.number,
               count: books.find((book) => book.key === lesson.bookKey)?.lessons.length ?? 0,
              })}
             </Typography>
             <Badge
              variant="success"
              size="sm"
              className="cursor-default gap-1 shrink-0"
              title={t("offlineDescription")}
             >
              <CloudCheck data-icon="inline-start" />
              <span>{t("offlineReady")}</span>
             </Badge>
            </div>
            {activeView !== "text" && activeView !== "all" ? (
             <BusinessChineseText
              pronunciationId={`${lesson.id}:title`}
              text={lessonTitle.source}
              displayMode={displayMode}
              variant="pageTitle"
              weight="black"
             />
            ) : null}
            {activeView !== "text" &&
            activeView !== "all" &&
            lessonTitle.translation &&
            displayMode.showMeaning ? (
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

          {activeView === "text" ? readerContent : null}

          {activeView === "notes" ? <TextbookNoteAccessCard lesson={lesson} /> : null}

          {activeView === "translation" ? (
           <LessonTranslationWorkspace segments={translationSegments} displayMode={displayMode} />
          ) : null}

          {activeView !== "text" && activeView !== "notes" && activeView !== "translation" ? (
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
              {visibleSections.map((section, index) => (
               <Fragment key={section.id}>
                {section.category === "text" ? (
                 <BusinessChineseReader
                  document={{
                   ...textReaderDocument,
                   id: `${textReaderDocument.id}:${section.id}`,
                   title:
                    section.id === textReaderDocument.sections[0]?.id
                     ? textReaderDocument.title
                     : undefined,
                   titleVi:
                    section.id === textReaderDocument.sections[0]?.id
                     ? textReaderDocument.titleVi
                     : undefined,
                   sections: textReaderDocument.sections.filter(
                    (readerSection) => readerSection.id === section.id,
                   ),
                   segments: textReaderDocument.segments.filter(
                    (segment) => segment.sectionId === section.id,
                   ),
                  }}
                  services={{
                   ...annotationServices,
                   renderSection: ({ section: readerSection, content }) => (
                    <div id={readerSection.id}>{content}</div>
                   ),
                  }}
                 />
                ) : (
                 <Card variant="section" padding="md">
                  <BusinessChineseSection
                   section={section}
                   displayMode={displayMode}
                   translations={pairedTranslations}
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
      {selection.popover}
     </div>
    </div>
   </ReaderServicesContext.Provider>
  </BusinessChineseAnnotationsContext.Provider>
 );
}
