"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "@tanstack/react-store";

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
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { getLessonRouteValue } from "@/features/hanzihome/utils/lesson-route";
import { focusModeStore } from "@/stores/focus-mode-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";

const HEADER_OWNER_ID = "hanzihome-lesson";

export function HanziHomeHeaderContextBridge({
 selectedCourseId,
 selectedCourseTitle,
 selectedLesson,
 lessons,
}: {
 selectedCourseId: string;
 selectedCourseTitle: string;
 selectedLesson: HanziHomeLesson;
 lessons: HanziHomeLesson[];
}) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const searchParamsString = searchParams.toString();

 const content = useMemo(
  () => (
   <AppHeaderBreadcrumb
    aria-label="Chuyển nhanh bài HanziHome"
    className="min-w-0 max-w-[min(12rem,48vw)] justify-self-start md:max-w-[min(42rem,70vw)]"
   >
    <AppHeaderBreadcrumbItem className="hidden md:flex">
     <AppHeaderBreadcrumbLink
      href="/hanzihome"
      disabled={focusModeEnabled}
      className="max-w-[9rem]"
      title="HanziHome"
     >
      HanziHome
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden md:flex" />
    <AppHeaderBreadcrumbItem className="hidden 2xl:flex">
     <AppHeaderBreadcrumbPage title={selectedCourseTitle}>
      {selectedCourseTitle}
     </AppHeaderBreadcrumbPage>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden 2xl:flex" />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <Select
      value={selectedLesson.id}
      disabled={focusModeEnabled}
      onValueChange={(lessonId) => {
       if (focusModeEnabled) return;

       const lesson = lessons.find((item) => item.id === lessonId);
       if (!lesson) return;

       const nextParams = new URLSearchParams(searchParamsString);
       const currentModule = nextParams.get("module");
       nextParams.set("courseId", selectedCourseId);
       nextParams.set("lesson", getLessonRouteValue(lesson.lessonNumber));
       if (lesson.bookId) nextParams.set("bookId", lesson.bookId);
       else nextParams.delete("bookId");
       nextParams.delete("lessonId");
       if (currentModule) nextParams.set("module", currentModule);

       router.push(`/hanzihome?${nextParams.toString()}`);
      }}
     >
      <SelectTrigger
       aria-label="Chọn bài học HanziHome"
       variant="breadcrumb"
       className="w-[min(11rem,44vw)] md:w-[min(16rem,44vw)] lg:w-[min(18rem,30vw)] xl:w-72"
      >
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[min(28rem,calc(100vw-2rem))]">
       <SelectGroup>
        {lessons.map((lesson) => (
         <SelectItem key={lesson.id} value={lesson.id}>
          {`Bài ${lesson.lessonNumber}: ${lesson.titleZh || lesson.title}`}
         </SelectItem>
        ))}
       </SelectGroup>
      </SelectContent>
     </Select>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  ),
  [
   focusModeEnabled,
   lessons,
   router,
   searchParamsString,
   selectedCourseId,
   selectedCourseTitle,
   selectedLesson.id,
  ],
 );

 useEffect(() => {
  headerToolbarStore.actions.setOwnedContent(HEADER_OWNER_ID, content);
  return () => headerToolbarStore.actions.clearOwnedContent(HEADER_OWNER_ID);
 }, [content]);

 return null;
}
