"use client";

import {
 BookOpenText,
 ChevronLeft,
 ChevronRight,
 Languages,
 ListChecks,
 MessageSquareText,
 ScanText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { HanziAwareText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Link } from "@/i18n/navigation";

import type {
 BusinessChineseBookKey,
 BusinessChineseBookSummary,
 BusinessChineseLesson,
 BusinessChineseLessonSection,
} from "../_lib/business-chinese-data";
import { SourceBlock, SourceSection } from "./source-section";
import { VocabularyPractice } from "./vocabulary-practice";

type WorkspaceTab = "lesson" | "vocabulary" | "grammar" | "practice";

function lessonHref(bookKey: BusinessChineseBookKey, lessonNumber: number) {
 return `/han-thuong-mai?book=${bookKey}&lesson=${lessonNumber}`;
}

function sectionsForTab(
 sections: BusinessChineseLessonSection[],
 tab: WorkspaceTab,
): BusinessChineseLessonSection[] {
 if (tab === "lesson") {
  return sections.filter((section) =>
   ["overview", "core", "text"].includes(section.category),
  );
 }
 if (tab === "vocabulary") return sections.filter((section) => section.category === "vocab");
 if (tab === "grammar") return sections.filter((section) => section.category === "grammar");
 return sections.filter((section) => section.category === "practice");
}

function BookLessonNavigation({
 books,
 currentBookKey,
 currentLessonNumber,
 compact,
}: {
 books: BusinessChineseBookSummary[];
 currentBookKey: BusinessChineseBookKey;
 currentLessonNumber: number;
 compact: boolean;
}) {
 const t = useTranslations("BusinessChinese");
 const currentBook = books.find((book) => book.key === currentBookKey);

 if (compact) {
  return (
   <Card variant="section" padding="sm" className="grid gap-2 lg:hidden">
    <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto">
     {books.map((book) => (
      <Button
       key={book.key}
       asChild
       variant={book.key === currentBookKey ? "active" : "navigation"}
       size="toolbar"
      >
       <Link href={lessonHref(book.key, 1)}>{book.label}</Link>
      </Button>
     ))}
    </div>
    <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto" aria-label={t("navigation.lessonList")}>
     {currentBook?.lessons.map((lesson) => (
      <Button
       key={lesson.number}
       asChild
       variant={lesson.number === currentLessonNumber ? "active" : "navigation"}
       size="toolbar"
       aria-current={lesson.number === currentLessonNumber ? "page" : undefined}
      >
       <Link href={lessonHref(currentBookKey, lesson.number)}>
        {t("navigation.lessonShort", { number: lesson.number })}
       </Link>
      </Button>
     ))}
    </div>
   </Card>
  );
 }

 return (
  <aside className="hidden min-w-0 lg:block">
   <Card variant="section" padding="md" className="sticky top-4 grid gap-4">
    <div className="grid gap-1">
     <Typography variant="overline" tone="muted">
      {t("navigation.books")}
     </Typography>
     {books.map((book) => (
      <Button
       key={book.key}
       asChild
       variant={book.key === currentBookKey ? "active" : "navigation"}
       size="toolbar"
       align="start"
      >
       <Link href={lessonHref(book.key, 1)}>
        <BookOpenText data-icon="inline-start" aria-hidden="true" />
        {book.label}
       </Link>
      </Button>
     ))}
    </div>

    <div className="grid gap-1">
     <Typography variant="overline" tone="muted">
      {t("navigation.lessonList")}
     </Typography>
     {currentBook?.lessons.map((lesson) => (
      <Button
       key={lesson.number}
       asChild
       variant={lesson.number === currentLessonNumber ? "active" : "navigation"}
       size="toolbar"
       align="start"
       wrap="normal"
       aria-current={lesson.number === currentLessonNumber ? "page" : undefined}
      >
       <Link href={lessonHref(currentBookKey, lesson.number)}>
        <span className="w-7 shrink-0 text-center tabular-nums">{lesson.number}</span>
        <span className="min-w-0 truncate">{lesson.title.replace(/^BÀI\s+\d+:\s*/iu, "")}</span>
       </Link>
      </Button>
     ))}
    </div>
   </Card>
  </aside>
 );
}

export function BusinessChineseWorkspace({
 books,
 bookKey,
 lesson,
}: {
 books: BusinessChineseBookSummary[];
 bookKey: BusinessChineseBookKey;
 lesson: BusinessChineseLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const [activeTab, setActiveTab] = useState<WorkspaceTab>("lesson");
 const [showPinyin, setShowPinyin] = useState(true);
 const [showMeaning, setShowMeaning] = useState(true);
 const currentBook = books.find((book) => book.key === bookKey);
 const previousLesson = currentBook?.lessons.find(
  (candidate) => candidate.number === lesson.number - 1,
 );
 const nextLesson = currentBook?.lessons.find((candidate) => candidate.number === lesson.number + 1);

 const tabItems = [
  { key: "lesson" as const, label: t("tabs.lesson"), icon: ScanText },
  { key: "vocabulary" as const, label: t("tabs.vocabulary"), icon: Languages },
  { key: "grammar" as const, label: t("tabs.grammar"), icon: MessageSquareText },
  { key: "practice" as const, label: t("tabs.practice"), icon: ListChecks },
 ];

 return (
  <div className="hanzihome-static-page min-w-0 p-3 sm:p-5 lg:p-6">
   <div className="grid min-w-0 gap-4">
    <BookLessonNavigation
     books={books}
     currentBookKey={bookKey}
     currentLessonNumber={lesson.number}
     compact
    />

    <div className="grid min-w-0 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
     <BookLessonNavigation
      books={books}
      currentBookKey={bookKey}
      currentLessonNumber={lesson.number}
      compact={false}
     />

     <main className="grid min-w-0 gap-4">
      <header className="grid gap-4 border-b border-border-default pb-4">
       <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
         <Typography variant="overline" tone="accent">
          {lesson.bookLabel} · {t("navigation.lessonShort", { number: lesson.number })}
         </Typography>
         <HanziAwareText text={lesson.title} as="h1" variant="pageTitle" />
         <Typography variant="bodySmall" tone="secondary">
          {t("lessonMeta", { vocabulary: lesson.vocab.length, sections: lesson.sections.length })}
         </Typography>
        </div>

        <div className="flex flex-wrap items-center gap-2">
         <Button
          variant={showPinyin ? "active" : "outline"}
          size="toolbar"
          aria-pressed={showPinyin}
          onClick={() => setShowPinyin((value) => !value)}
         >
          {t("controls.pinyin")}
         </Button>
         <Button
          variant={showMeaning ? "active" : "outline"}
          size="toolbar"
          aria-pressed={showMeaning}
          onClick={() => setShowMeaning((value) => !value)}
         >
          {t("controls.meaning")}
         </Button>
        </div>
       </div>

       {lesson.intro.length > 0 ? (
        <div className="grid gap-2">
         {lesson.intro.map((block, index) => (
          <SourceBlock
           key={`intro-${index}`}
           block={block}
           showPinyin={showPinyin}
           showMeaning={showMeaning}
          />
         ))}
        </div>
       ) : null}

       <div className="flex items-center justify-between gap-2">
        {previousLesson !== undefined ? (
         <Button asChild variant="outline" size="toolbar">
          <Link href={lessonHref(bookKey, previousLesson.number)}>
           <ChevronLeft data-icon="inline-start" aria-hidden="true" />
           {t("navigation.previous")}
          </Link>
         </Button>
        ) : (
         <Button variant="outline" size="toolbar" disabled>
          <ChevronLeft data-icon="inline-start" aria-hidden="true" />
          {t("navigation.previous")}
         </Button>
        )}
        {nextLesson !== undefined ? (
         <Button asChild variant="outline" size="toolbar">
          <Link href={lessonHref(bookKey, nextLesson.number)}>
           {t("navigation.next")}
           <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Link>
         </Button>
        ) : (
         <Button variant="outline" size="toolbar" disabled>
          {t("navigation.next")}
          <ChevronRight data-icon="inline-end" aria-hidden="true" />
         </Button>
        )}
       </div>
      </header>

      <Tabs
       value={activeTab}
       items={tabItems}
       onValueChange={setActiveTab}
       aria-label={t("tabs.label")}
      >
       <TabsContent value="lesson" className="pt-4">
        <Card variant="section" padding="lg">
         <div className="grid gap-6">
          {sectionsForTab(lesson.sections, "lesson").map((section) => (
           <SourceSection
            key={section.title}
            section={section}
            showPinyin={showPinyin}
            showMeaning={showMeaning}
           />
          ))}
         </div>
        </Card>
       </TabsContent>

       <TabsContent value="vocabulary" className="pt-4">
        <div className="grid gap-6">
         <VocabularyPractice
          key={lesson.key}
          bookKey={bookKey}
          lessonNumber={lesson.number}
          vocabulary={lesson.vocab}
         />
         <Card variant="section" padding="lg">
          <div className="grid gap-6">
           {sectionsForTab(lesson.sections, "vocabulary").map((section) => (
            <SourceSection
             key={section.title}
             section={section}
             showPinyin={showPinyin}
             showMeaning={showMeaning}
            />
           ))}
          </div>
         </Card>
        </div>
       </TabsContent>

       <TabsContent value="grammar" className="pt-4">
        <Card variant="section" padding="lg">
         <div className="grid gap-6">
          {sectionsForTab(lesson.sections, "grammar").map((section) => (
           <SourceSection
            key={section.title}
            section={section}
            showPinyin={showPinyin}
            showMeaning={showMeaning}
           />
          ))}
         </div>
        </Card>
       </TabsContent>

       <TabsContent value="practice" className="pt-4">
        <Card variant="section" padding="lg">
         <div className="grid gap-6">
          {sectionsForTab(lesson.sections, "practice").map((section) => (
           <SourceSection
            key={section.title}
            section={section}
            showPinyin={showPinyin}
            showMeaning={showMeaning}
           />
          ))}
         </div>
        </Card>
       </TabsContent>
      </Tabs>
     </main>
    </div>
   </div>
  </div>
 );
}
