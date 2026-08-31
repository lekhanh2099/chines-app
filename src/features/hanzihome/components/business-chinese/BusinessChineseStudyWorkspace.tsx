"use client";

import {
 Fragment,
 useCallback,
 useEffect,
 useMemo,
 useState,
 type KeyboardEvent,
 type MouseEvent,
} from "react";
import { useSelector } from "@tanstack/react-store";
import { BookOpen, LibraryBig } from "lucide-react";
import { useTranslations } from "next-intl";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/app-header-breadcrumb";
import { scrollAppContentToElement } from "@/components/layout/app-scroll";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { Separator } from "@/components/ui/separator";
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
import { LessonModuleFrame } from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import {
 containsHanziText,
 HanziAwareText,
 HanziInlineText,
 PinyinText,
 ReaderHanziText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { HanziHomeReadOnlyReadingSettingsTrigger } from "@/features/hanzihome/components/layout/HanziHomeReadOnlyReadingSettingsTrigger";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { MandarinTtsProvider } from "@/features/hanzihome/listening/MandarinTtsProvider";
import {
 analyzeContextualPronunciation,
 type ContextualPronunciationAnalysis,
 type ContextualPronunciationGlyph,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { ContextualReaderText } from "@/features/hanzihome/reader/ContextualReaderText";
import type { ReaderSurfacePronunciationTarget } from "@/features/hanzihome/reader/components/ReaderDocumentContent";
import {
 ReaderPronunciationReviewPopover,
 type ReaderPronunciationSaveInput,
} from "@/features/hanzihome/reader/components/ReaderPronunciationReviewPopover";
import type { ReaderSegment } from "@/features/hanzihome/reader/model/reader-document.types";
import {
 ReaderPronunciationSessionProvider,
 useReaderPronunciationSessionActions,
 useReaderPronunciationSessionOverrides,
} from "@/features/hanzihome/reader/runtime/reader-pronunciation-session";
import type {
 BusinessChineseBookSummary,
 BusinessChineseLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { useRouter as useLocalizedRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { focusModeStore } from "@/stores/focus-mode-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";

const headerOwnerId = "business-chinese-study";
const chineseGraphemeSegmenter = new Intl.Segmenter("zh-CN", {
 granularity: "grapheme",
});
const chineseSpeechSegmentPattern =
 /[\p{Script=Han}\p{Number}%％，。！？；：、“”‘’（）《》〈〉…—\s]+/gu;
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

function buildBusinessChineseHref(book: string, lessonNumber: number) {
 return `/hsk/han-thuong-mai?book=${book}&lesson=${lessonNumber}`;
}

function stripLeadingEmoji(value: string) {
 return value.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, "").trim();
}

function lessonDisplayTitle(value: string) {
 return value.replace(/^BÀI\s+\d+\s*:\s*/iu, "").trim();
}

function splitTrailingTranslation(value: string) {
 const separatorIndex = value.lastIndexOf(" (");
 if (separatorIndex < 0 || !value.endsWith(")")) {
  return { source: value.trim(), translation: "" };
 }

 const source = value.slice(0, separatorIndex).trim();
 const translation = value.slice(separatorIndex + 2, -1).trim();
 if (
  !containsHanziText(source) ||
  containsHanziText(translation) ||
  !/[A-Za-zÀ-ỹ]/u.test(translation)
 ) {
  return { source: value.trim(), translation: "" };
 }

 return { source, translation };
}

function splitDialogueTurn(value: string) {
 const fullWidthColonIndex = value.indexOf("：");
 const asciiColonIndex = value.indexOf(":");
 const separatorIndex =
  fullWidthColonIndex >= 0 && asciiColonIndex >= 0
   ? Math.min(fullWidthColonIndex, asciiColonIndex)
   : Math.max(fullWidthColonIndex, asciiColonIndex);
 if (separatorIndex <= 0 || separatorIndex > 24) {
  return { speaker: "", content: value.trim() };
 }

 const speaker = value.slice(0, separatorIndex).trim();
 const content = value.slice(separatorIndex + 1).trim();
 if (!content || /[。！？；]/u.test(speaker)) {
  return { speaker: "", content: value.trim() };
 }

 return { speaker, content };
}

function getChineseSpeechSegments(value: string) {
 const { source } = splitTrailingTranslation(value);
 return (source.match(chineseSpeechSegmentPattern) ?? [])
  .map((segment) => segment.trim())
  .filter((segment) => containsHanziText(segment));
}

function isChineseOnlyText(value: string) {
 return value.replace(nonChineseTextPattern, "").trim().length === value.trim().length;
}

function BusinessChineseHeaderContextBridge({
 books,
 lesson,
}: {
 books: BusinessChineseBookSummary[];
 lesson: BusinessChineseLesson;
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
      href="/hsk/han-thuong-mai"
      disabled={focusModeEnabled}
      className="max-w-[9rem]"
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
       router.push(buildBusinessChineseHref(selectedLesson.bookKey, selectedLesson.number), {
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
  [books, focusModeEnabled, lesson.bookLabel, lesson.id, router, selectedBook, t],
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
 const pronunciationSessionActions = useReaderPronunciationSessionActions();
 const pronunciationOverrides = useReaderPronunciationSessionOverrides(pronunciationId);
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
       sourcePinyin: displayMode.autoDetectPinyin ? null : (sourcePinyin ?? null),
       overrides: pronunciationOverrides,
      })
    : null,
  [displayMode.autoDetectPinyin, pronunciationOverrides, sourcePinyin, text],
 );
 const contextualDisplayMode: LessonDisplayMode = useMemo(
  () => (compactHanzi ? { ...displayMode, hanziSize: "md" } : displayMode),
  [compactHanzi, displayMode],
 );
 const canShowPinyin =
  displayMode.showPinyin && (displayMode.autoDetectPinyin || Boolean(sourcePinyin?.trim()));
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
     glyph.isPolyphonic &&
     !glyph.evidence.includes("manual-override") &&
     !glyph.evidence.includes("source-pinyin") &&
     !glyph.evidence.includes("dictionary-exact");

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
      <rt>
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
          ? t("inspectUnconfirmedPinyin", { character: grapheme.segment })
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
  <div className="flex min-w-0 items-start gap-2">
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
 block: BusinessChineseLesson["sections"][number]["blocks"][number];
 displayMode: LessonDisplayMode;
}) {
 const headers = block.rows[0] ?? [];
 const pinyinColumnIndex = headers.findIndex((header) => /pinyin/iu.test(header));
 const hanziColumnIndex = headers.findIndex((header) =>
  /tiếng trung|giản thể|hán tự|từ vựng/iu.test(header),
 );
 const visibleColumnIndexes = headers
  .map((header, index) => ({ header, index }))
  .filter(
   ({ header }) => displayMode.showMeaning || !/tiếng việt|dịch nghĩa|hán việt/iu.test(header),
  )
  .map(({ index }) => index);

 return (
  <div className="max-w-full overflow-x-auto rounded-xl border border-border-default">
   <table className="w-full min-w-[42rem] border-collapse text-left">
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
 );
}

function BusinessChineseExercise({
 block,
 displayMode,
}: {
 block: BusinessChineseLesson["sections"][number]["blocks"][number];
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
  <div className="grid min-w-0 gap-1.5">
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
 section: BusinessChineseLesson["sections"][number];
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
        translation={translations.get(block.id)}
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
       translation={translations.get(block.id)}
       displayMode={displayMode}
       compactHanzi={section.category !== "text"}
      />
     );
    })}
   </div>
  </section>
 );
}

function BusinessChineseSidebar({
 books,
 lesson,
}: {
 books: BusinessChineseBookSummary[];
 lesson: BusinessChineseLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const router = useLocalizedRouter();
 const selectedBook = books.find((book) => book.key === lesson.bookKey);

 return (
  <div className="grid min-w-0 gap-3">
   <div className="grid gap-1.5">
    <Typography variant="overline" tone="muted">
     {t("bookLabel")}
    </Typography>
    <Select
     value={lesson.bookKey}
     onValueChange={(bookKey) => {
      const book = books.find((item) => item.key === bookKey);
      if (!book) return;
      router.push(buildBusinessChineseHref(book.key, 1), {
       scroll: false,
      });
     }}
    >
     <SelectTrigger aria-label={t("bookSelectLabel")} width="full">
      <SelectValue />
     </SelectTrigger>
     <SelectContent>
      {books.map((book) => (
       <SelectItem key={book.id} value={book.key}>
        {book.label}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>
   </div>
   <div className="grid gap-1">
    {selectedBook?.lessons.map((item) => (
     <LessonModuleSidebarItem
      key={item.id}
      selected={item.id === lesson.id}
      title={`${item.number}. ${lessonDisplayTitle(item.title)}`}
      marker={t("vocabCount", { count: item.vocabCount })}
      icon={<BookOpen />}
      onClick={() => {
       router.push(buildBusinessChineseHref(item.bookKey, item.number), {
        scroll: false,
       });
      }}
     />
    ))}
   </div>
  </div>
 );
}

function MobileSectionNavigation({
 sections,
 onSelect,
}: {
 sections: BusinessChineseLesson["sections"];
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
 sections: BusinessChineseLesson["sections"];
 onSelect: (sectionId: string) => void;
}) {
 const t = useTranslations("BusinessChinese");

 return (
  <Card variant="section" padding="sm" className="hidden self-start 2xl:sticky 2xl:top-0 2xl:block">
   <div className="grid gap-2">
    <Typography variant="overline" tone="muted">
     {t("tocLabel")}
    </Typography>
    <div className="grid gap-1">
     {sections.map((section) => (
      <Button
       key={section.id}
       type="button"
       variant="navigation"
       size="menu"
       align="start"
       wrap="normal"
       className="w-full"
       onClick={() => onSelect(section.id)}
      >
       <HanziInlineText text={stripLeadingEmoji(section.title)} />
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
 books: BusinessChineseBookSummary[];
 lesson: BusinessChineseLesson;
}) {
 return (
  <MandarinTtsProvider>
   <ReaderPronunciationSessionProvider key={lesson.id}>
    <BusinessChineseStudyWorkspaceContent books={books} lesson={lesson} />
   </ReaderPronunciationSessionProvider>
  </MandarinTtsProvider>
 );
}

function BusinessChineseStudyWorkspaceContent({
 books,
 lesson,
}: {
 books: BusinessChineseBookSummary[];
 lesson: BusinessChineseLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const [activeView, setActiveView] = useState("all");
 const [displayMode, setDisplayMode] = useState(businessChineseDisplayMode);
 const [sidebarOpen, setSidebarOpen] = useState(true);
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
 const tabs = useMemo(
  () => [
   { key: "all", label: t("tabs.all") },
   { key: "overview", label: t("tabs.overview") },
   { key: "core", label: t("tabs.core") },
   { key: "text", label: t("tabs.text") },
   { key: "vocab", label: t("tabs.vocab") },
   { key: "grammar", label: t("tabs.grammar") },
   { key: "practice", label: t("tabs.practice") },
  ],
  [t],
 );
 const intro = lesson.intro.join(" ");
 const lessonTitle = splitTrailingTranslation(lessonDisplayTitle(lesson.title));
 const readingSettings = (
  <HanziHomeReadOnlyReadingSettingsTrigger
   displayMode={displayMode}
   onDisplayModeChange={(updates: Partial<LessonDisplayMode>) => {
    setDisplayMode((current) => ({ ...current, ...updates }));
   }}
  />
 );
 const selectSection = (sectionId: string) => {
  scrollAppContentToElement(document.getElementById(sectionId), {
   behavior: "smooth",
   block: "start",
  });
 };

 return (
  <>
   <BusinessChineseHeaderContextBridge books={books} lesson={lesson} />
   <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
    <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col gap-2.5">
     <Tabs
      value={activeView}
      items={tabs}
      onValueChange={setActiveView}
      aria-label={t("tabsLabel")}
      className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden"
      listClassName="hanzihome-liquid-toolbar flex-wrap overflow-x-visible md:flex-nowrap md:overflow-x-auto"
     >
      <TabsContent value={activeView} className="min-h-0 overflow-hidden">
       <LessonModuleFrame
        title={lesson.title}
        subtitle={intro || lesson.bookLabel}
        sidebarLabel={t("sidebarLabel")}
        sidebarSummary={t("sectionCount", {
         count: visibleSections.length,
        })}
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        sidebar={<BusinessChineseSidebar books={books} lesson={lesson} />}
        sidebarRail={<LibraryBig />}
        sidebarSelectionKey={lesson.id}
        actions={readingSettings}
       >
        <div className="grid min-w-0 gap-3 pb-4">
         <Card variant="section" padding="md">
          <div className="grid min-w-0 gap-2">
           <Typography variant="overline" tone="muted">
            {lesson.bookLabel} · {t("lessonPosition", { lesson: lesson.number })}
           </Typography>
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

         <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="grid min-w-0 gap-3">
           <MobileSectionNavigation sections={visibleSections} onSelect={selectSection} />
           <Card variant="section" padding="md" className="min-w-0">
            <div className="grid min-w-0 gap-6">
             {visibleSections.map((section, index) => (
              <Fragment key={section.id}>
               <BusinessChineseSection
                section={section}
                displayMode={displayMode}
                translations={pairedTranslations}
               />
               {index < visibleSections.length - 1 ? <Separator /> : null}
              </Fragment>
             ))}
            </div>
           </Card>
          </div>
          <DesktopSectionNavigation sections={visibleSections} onSelect={selectSection} />
         </div>
        </div>
       </LessonModuleFrame>
      </TabsContent>
     </Tabs>
    </div>
   </div>
  </>
 );
}
