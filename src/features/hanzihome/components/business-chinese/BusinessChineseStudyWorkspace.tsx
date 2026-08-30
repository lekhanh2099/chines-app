"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { BookOpen, Eye, EyeOff, LibraryBig } from "lucide-react";
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
 HanziInlineText,
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { MandarinTtsProvider } from "@/features/hanzihome/listening/MandarinTtsProvider";
import {
 analyzeContextualPronunciation,
 type ContextualPronunciationAnalysis,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { ContextualReaderText } from "@/features/hanzihome/reader/ContextualReaderText";
import type {
 BusinessChineseBookSummary,
 BusinessChineseLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { useRouter as useLocalizedRouter } from "@/i18n/navigation";
import { focusModeStore } from "@/stores/focus-mode-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";

const headerOwnerId = "business-chinese-study";
const chineseGraphemeSegmenter = new Intl.Segmenter("zh-CN", { granularity: "grapheme" });
const chineseSpeechSegmentPattern = /[\p{Script=Han}，。！？；：、“”‘’（）《》〈〉…—\s]+/gu;
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

function getChineseSpeechSegments(value: string) {
 return (value.match(chineseSpeechSegmentPattern) ?? [])
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
 text,
 showPinyin,
 sourcePinyin,
 variant = "bodySmall",
 weight,
}: {
 text: string;
 showPinyin: boolean;
 sourcePinyin?: string;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
}) {
 const analysis = useMemo(
  () =>
   containsHanziText(text)
    ? analyzeContextualPronunciation({ text, sourcePinyin: sourcePinyin ?? null })
    : null,
  [sourcePinyin, text],
 );
 const displayMode = useMemo(() => ({ ...businessChineseDisplayMode, showPinyin }), [showPinyin]);

 if (analysis === null) {
  return (
   <Typography as="div" variant={variant} weight={weight} wrapping="preWrap">
    {text}
   </Typography>
  );
 }

 if (isChineseOnlyText(text)) {
  return (
   <ContextualReaderText
    analysis={analysis}
    displayMode={displayMode}
    showPinyin={showPinyin}
    pinyinPresentation="ruby"
    sourcePinyin={sourcePinyin}
   />
  );
 }

 return (
  <BusinessChineseMixedText
   analysis={analysis}
   showPinyin={showPinyin}
   variant={variant}
   weight={weight}
  />
 );
}

function BusinessChineseMixedText({
 analysis,
 showPinyin,
 variant,
 weight,
}: {
 analysis: ContextualPronunciationAnalysis;
 showPinyin: boolean;
 variant: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
}) {
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

    if (!showPinyin || glyph.spokenPinyin === null) {
     return (
      <HanziText key={`${grapheme.index}:${grapheme.segment}`} size="large">
       {grapheme.segment}
      </HanziText>
     );
    }

    return (
     <ruby key={`${grapheme.index}:${grapheme.segment}`}>
      <HanziText size="large">{grapheme.segment}</HanziText>
      <rt>
       <PinyinText as="span" tone="accent" weight="semibold">
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
 text,
 showPinyin,
 sourcePinyin,
 variant,
 weight,
}: {
 text: string;
 showPinyin: boolean;
 sourcePinyin?: string;
 variant?: TypographyProps<"div">["variant"];
 weight?: TypographyProps<"div">["weight"];
}) {
 const speechSegments = getChineseSpeechSegments(text);

 return (
  <div className="flex min-w-0 items-start gap-2">
   <div className="min-w-0 flex-1">
    <BusinessChineseText
     text={text}
     showPinyin={showPinyin}
     sourcePinyin={sourcePinyin}
     variant={variant}
     weight={weight}
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
 showPinyin,
}: {
 block: BusinessChineseLesson["sections"][number]["blocks"][number];
 showPinyin: boolean;
}) {
 const headers = block.rows[0] ?? [];
 const pinyinColumnIndex = headers.findIndex((header) => /pinyin/iu.test(header));
 const hanziColumnIndex = headers.findIndex((header) =>
  /tiếng trung|giản thể|hán tự|từ vựng/iu.test(header),
 );

 return (
  <div className="max-w-full overflow-x-auto rounded-xl border border-border-default">
   <table className="w-full min-w-max border-collapse text-left">
    <thead className="bg-surface-muted">
     <tr>
      {headers.map((header, cellIndex) => (
       <th
        key={`${block.id}-header-${cellIndex}`}
        scope="col"
        className="border-b border-border-default px-3 py-2 align-top"
       >
        <BusinessChineseText text={header} showPinyin={showPinyin} variant="label" />
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
       {row.map((cell, cellIndex) => (
        <td key={`${block.id}-row-${rowIndex}-cell-${cellIndex}`} className="px-3 py-2 align-top">
         {cellIndex === pinyinColumnIndex ? (
          <PinyinText as="span" tone="secondary" weight="semibold" wrapping="preWrap">
           {cell}
          </PinyinText>
         ) : (
          <SpeakableBusinessChineseText
           text={cell}
           showPinyin={showPinyin}
           sourcePinyin={
            cellIndex === hanziColumnIndex && pinyinColumnIndex >= 0
             ? row[pinyinColumnIndex]
             : undefined
           }
           variant="bodySmall"
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
 showPinyin,
}: {
 block: BusinessChineseLesson["sections"][number]["blocks"][number];
 showPinyin: boolean;
}) {
 const t = useTranslations("BusinessChinese");
 const [revealed, setRevealed] = useState(false);
 const separatorIndex = block.text.indexOf("→");
 const prompt = block.text.slice(0, separatorIndex).trim();
 const answer = block.text.slice(separatorIndex + 1).trim();

 return (
  <Card variant="subtle" padding="sm">
   <div className="grid min-w-0 gap-2">
    <SpeakableBusinessChineseText text={prompt} showPinyin={showPinyin} />
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
    {revealed ? (
     <div className="border-t border-border-default pt-2">
      <SpeakableBusinessChineseText text={answer} showPinyin={showPinyin} />
     </div>
    ) : null}
   </div>
  </Card>
 );
}

function BusinessChineseSection({
 section,
 showPinyin,
}: {
 section: BusinessChineseLesson["sections"][number];
 showPinyin: boolean;
}) {
 return (
  <Card id={section.id} variant="section" padding="md" className="min-w-0 scroll-mt-3">
   <div className="grid min-w-0 gap-3">
    <SpeakableBusinessChineseText
     text={stripLeadingEmoji(section.title)}
     showPinyin={showPinyin}
     variant="sectionTitle"
     weight="black"
    />
    {section.blocks.map((block) => {
     if (block.type === "table") {
      return <BusinessChineseTable key={block.id} block={block} showPinyin={showPinyin} />;
     }
     if (block.type === "subheading") {
      return (
       <SpeakableBusinessChineseText
        key={block.id}
        text={block.text}
        showPinyin={showPinyin}
        variant="cardTitle"
        weight="black"
       />
      );
     }
     if (section.category === "practice" && block.text.includes("→")) {
      return <BusinessChineseExercise key={block.id} block={block} showPinyin={showPinyin} />;
     }
     return (
      <SpeakableBusinessChineseText key={block.id} text={block.text} showPinyin={showPinyin} />
     );
    })}
   </div>
  </Card>
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
      router.push(buildBusinessChineseHref(book.key, 1), { scroll: false });
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
       router.push(buildBusinessChineseHref(item.bookKey, item.number), { scroll: false });
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
  <Card variant="section" padding="sm" className="2xl:hidden">
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
  </Card>
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
 const t = useTranslations("BusinessChinese");
 const [activeView, setActiveView] = useState("all");
 const [showPinyin, setShowPinyin] = useState(true);
 const [sidebarOpen, setSidebarOpen] = useState(true);
 const visibleSections = useMemo(
  () =>
   lesson.sections.filter(
    (section) =>
     section.blocks.length > 0 && (activeView === "all" || section.category === activeView),
   ),
  [activeView, lesson.sections],
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
 const pinyinAction = (
  <Button
   type="button"
   variant={showPinyin ? "active" : "outline"}
   size="toolbar"
   aria-pressed={showPinyin}
   onClick={() => setShowPinyin((current) => !current)}
  >
   {showPinyin ? <Eye data-icon="inline-start" /> : <EyeOff data-icon="inline-start" />}
   {showPinyin ? t("actions.hidePinyin") : t("actions.showPinyin")}
  </Button>
 );
 const selectSection = (sectionId: string) => {
  scrollAppContentToElement(document.getElementById(sectionId), {
   behavior: "smooth",
   block: "start",
  });
 };

 return (
  <MandarinTtsProvider>
   <BusinessChineseHeaderContextBridge books={books} lesson={lesson} />
   <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
    <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col gap-2.5">
     <LessonModuleFrame
      title={lesson.title}
      subtitle={intro || lesson.bookLabel}
      sidebarLabel={t("sidebarLabel")}
      sidebarSummary={t("sectionCount", { count: visibleSections.length })}
      sidebarOpen={sidebarOpen}
      onSidebarOpenChange={setSidebarOpen}
      sidebar={<BusinessChineseSidebar books={books} lesson={lesson} />}
      sidebarRail={<LibraryBig />}
      sidebarSelectionKey={lesson.id}
      actions={pinyinAction}
     >
      <div className="grid min-w-0 gap-3">
       <Card variant="section" padding="md">
        <div className="grid min-w-0 gap-2">
         <Typography variant="overline" tone="muted">
          {lesson.bookLabel} · {t("lessonPosition", { lesson: lesson.number })}
         </Typography>
         <BusinessChineseText
          text={lessonDisplayTitle(lesson.title)}
          showPinyin={showPinyin}
          variant="pageTitle"
          weight="black"
         />
         {intro ? (
          <Typography variant="bodySmall" tone="secondary">
           {intro}
          </Typography>
         ) : null}
         <Typography variant="caption" tone="muted">
          {t("lessonMeta", { sections: lesson.sections.length, vocab: lesson.vocab.length })}
         </Typography>
        </div>
       </Card>

       <Tabs
        value={activeView}
        items={tabs}
        onValueChange={setActiveView}
        aria-label={t("tabsLabel")}
       >
        <TabsContent value={activeView} className="grid min-w-0 gap-3 pt-3">
         <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="grid min-w-0 gap-3">
           <MobileSectionNavigation sections={visibleSections} onSelect={selectSection} />
           {visibleSections.map((section) => (
            <BusinessChineseSection key={section.id} section={section} showPinyin={showPinyin} />
           ))}
          </div>
          <DesktopSectionNavigation sections={visibleSections} onSelect={selectSection} />
         </div>
        </TabsContent>
       </Tabs>
      </div>
     </LessonModuleFrame>
    </div>
   </div>
  </MandarinTtsProvider>
 );
}
