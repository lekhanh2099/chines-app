"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { useTranslations } from "next-intl";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/app-header-breadcrumb";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectLabel,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { ModuleSplitWorkspace } from "@/features/hanzihome/components/ModuleSplitWorkspace";
import type {
 HanziHomeCourseBook,
 HanziHomeLesson,
 UserLearningState,
} from "@/features/hanzihome/types";
import type { StudyModule } from "@/features/hanzihome/context/types";
import {
 defaultLessonTextDisplaySettings,
 emptyLearningState,
} from "@/features/hanzihome/utils/learning-state";
import { useRouter as useLocalizedRouter } from "@/i18n/navigation";
import { focusModeStore } from "@/stores/focus-mode-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";

const readOnlyLearningState: UserLearningState = {
 ...emptyLearningState,
 settings: {
  ...emptyLearningState.settings,
  lessonTextDisplayMode: {
   ...defaultLessonTextDisplaySettings,
   autoDetectPinyin: true,
   showMeaning: true,
   showAnswers: false,
  },
 },
};

const ignoreReadOnlyAction = () => undefined;
const headerOwnerId = "business-chinese-lesson";

function buildBusinessChineseHref(book: string, lessonNumber: number) {
 return `/hsk/han-thuong-mai?book=${book}&lesson=${lessonNumber}`;
}

function getBusinessChineseBookKey(book: HanziHomeCourseBook | undefined) {
 return book?.order === 2 ? "tm3" : "tm2";
}

function BusinessChineseHeaderContextBridge({
 books,
 lessons,
 lesson,
}: {
 books: ReadonlyArray<HanziHomeCourseBook>;
 lessons: ReadonlyArray<HanziHomeLesson>;
 lesson: HanziHomeLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const router = useLocalizedRouter();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const selectedBook = books.find((book) => book.id === lesson.bookId);
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
     <AppHeaderBreadcrumbPage title={selectedBook?.title ?? "Hán thương mại"}>
      {selectedBook?.shortTitle ?? selectedBook?.title ?? "Hán thương mại"}
     </AppHeaderBreadcrumbPage>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden 2xl:flex" />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <Select
      value={lesson.id}
      disabled={focusModeEnabled}
      onValueChange={(lessonId) => {
       if (focusModeEnabled) return;
       const selectedLesson = lessons.find((item) => item.id === lessonId);
       if (!selectedLesson) return;
       const book = books.find((item) => item.id === selectedLesson.bookId);
       router.push(
        buildBusinessChineseHref(getBusinessChineseBookKey(book), selectedLesson.lessonNumber),
        { scroll: false },
       );
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
         <SelectLabel>{book.shortTitle ?? book.title}</SelectLabel>
         {lessons
          .filter((item) => item.bookId === book.id)
          .map((item) => (
           <SelectItem key={item.id} value={item.id}>
            {`Bài ${item.lessonNumber}: ${item.titleZh || item.title}`}
           </SelectItem>
          ))}
        </SelectGroup>
       ))}
      </SelectContent>
     </Select>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  ),
  [books, focusModeEnabled, lesson.id, lessons, router, selectedBook, t],
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

export function BusinessChineseStudyWorkspace({
 books,
 lessons,
 lesson,
}: {
 books: ReadonlyArray<HanziHomeCourseBook>;
 lessons: ReadonlyArray<HanziHomeLesson>;
 lesson: HanziHomeLesson;
}) {
 const [learningState, setLearningState] = useState(readOnlyLearningState);
 const [activeModule, setActiveModule] = useState<StudyModule>("lessonText");

 return (
  <>
   <BusinessChineseHeaderContextBridge books={books} lessons={lessons} lesson={lesson} />
   <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
    <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col gap-2.5">
     <ModuleSplitWorkspace
      key={lesson.id}
      readOnly
      lesson={lesson}
      learningState={learningState}
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      onUpdateLearningSettings={(settings) => {
       setLearningState((state) => ({
        ...state,
        settings: { ...state.settings, ...settings },
       }));
      }}
      onBookmarkVocab={ignoreReadOnlyAction}
      onMarkVocab={ignoreReadOnlyAction}
      onBookmarkGrammar={ignoreReadOnlyAction}
      onMarkGrammar={ignoreReadOnlyAction}
      onAnswerReview={ignoreReadOnlyAction}
     />
    </div>
   </div>
  </>
 );
}
