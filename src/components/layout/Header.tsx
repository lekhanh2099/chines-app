"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, ChevronRight, Moon, Search, Sun } from "lucide-react";
import { type User } from "@supabase/supabase-js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useVocabInspector } from "@/components/vocabulary/VocabInspectorProvider";
import { containsChinese } from "@/lib/chinese-utils";
import { useDictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { Button } from "@/components/ui/button";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCourseLessons } from "@/features/hanzihome/hooks/useHanziHomeCourseLessons";
import {
 findLessonByRouteParam,
 getLessonRouteValue,
} from "@/features/hanzihome/utils/lesson-route";
import { GlobalSearchDialog } from "@/features/hanzihome/search/GlobalSearchDialog";
import {
 clearHanziHomeSearchNavigationIntent,
 setHanziHomeSearchNavigationIntent,
} from "@/features/hanzihome/search/searchNavigationStore";
import type { HanziHomeSearchIndexItem } from "@/features/hanzihome/search/types";
import { cn } from "@/lib/utils";

export function Header({ user }: { user?: User | null }) {
 const { theme, toggleTheme } = useTheme();
 const { openInspector } = useVocabInspector();
 const [searchValue, setSearchValue] = useState("");
 const [searchOpen, setSearchOpen] = useState(false);
 const pathname = usePathname();
 const router = useRouter();
 const searchParams = useSearchParams();
 const lookupEnabled = useDictionaryLookupStore((s) => s.isEnabled(pathname));
 const toggleLookup = useDictionaryLookupStore((s) => s.toggle);
 const hydrateLookupSettings = useDictionaryLookupStore((s) => s.hydrate);
 const isHanziHomeRoute = pathname === "/hanzihome";
 const isHanziHomeWorkspaceRoute =
  isHanziHomeRoute &&
  (searchParams.has("courseId") ||
   searchParams.has("lesson") ||
   searchParams.has("lessonId") ||
   searchParams.has("module"));
 const catalogData = useHanziHomeCatalogData({ enabled: isHanziHomeWorkspaceRoute });
 const selectedCourseId =
  isHanziHomeWorkspaceRoute && catalogData.courses.length > 0
   ? searchParams.get("courseId") || catalogData.courses[0]?.id || ""
   : "";
 const courseLessonsQuery = useHanziHomeCourseLessons(selectedCourseId, {
  enabled: isHanziHomeWorkspaceRoute && Boolean(selectedCourseId),
 });
 const hanzihomeBreadcrumb = useMemo(() => {
  if (!isHanziHomeWorkspaceRoute) return null;

  const courses = catalogData.courses;
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const lessons = courseLessonsQuery.lessons;
  const lessonFromUrl = searchParams.get("lesson");
  const legacyLessonIdFromUrl = searchParams.get("lessonId");
  const selectedLesson =
   findLessonByRouteParam(lessons, lessonFromUrl, legacyLessonIdFromUrl) ?? lessons[0];

  if (!selectedCourse || !selectedLesson) return null;

  return {
   courses,
   selectedCourse,
   selectedLesson,
   lessons,
  };
 }, [
  catalogData.courses,
  courseLessonsQuery.lessons,
  isHanziHomeWorkspaceRoute,
  searchParams,
  selectedCourseId,
 ]);

 useEffect(() => {
  hydrateLookupSettings();
 }, [hydrateLookupSettings]);

 useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
   if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    setSearchOpen(true);
   }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
 }, []);

 const handleSearch = (event: FormEvent) => {
  event.preventDefault();
  setSearchOpen(true);
 };

 const handleDirectLookup = (query: string) => {
  const trimmed = query.trim();
  if (!containsChinese(trimmed)) return;

  openInspector(trimmed);
  setSearchOpen(false);
  setSearchValue("");
 };

 const handleOpenSearchResult = (item: HanziHomeSearchIndexItem) => {
  clearHanziHomeSearchNavigationIntent();
  if (item.module || item.targetId) {
   setHanziHomeSearchNavigationIntent({
    courseId: item.courseId,
    lessonId: item.lessonId,
    lessonNumber: item.lessonNumber,
    module: item.module,
    targetId: item.targetId,
   });
  }

  if (item.href) router.push(item.href);
  setSearchOpen(false);
  setSearchValue("");
 };

 const navigateHanziHome = (courseId: string, lessonNumber: number) => {
  const nextParams = new URLSearchParams(searchParams.toString());
  const currentModule = nextParams.get("module");

  nextParams.set("courseId", courseId);
  nextParams.set("lesson", getLessonRouteValue(lessonNumber));
  nextParams.delete("lessonId");
  if (currentModule) nextParams.set("module", currentModule);

  router.push(`/hanzihome?${nextParams.toString()}`);
 };

 return (
  <header
   className={cn(
    "nova-shell-header sticky top-0 z-50 flex h-14 w-full max-w-full min-w-0 shrink-0 items-center justify-between gap-2 overflow-x-hidden border-b border-border-default px-3 sm:gap-3 sm:px-5 lg:px-7",
    isHanziHomeRoute && "hanzihome-liquid-header",
   )}
  >
   <div className="flex h-14 w-full min-w-0 items-center justify-between gap-2 sm:gap-3">
    {hanzihomeBreadcrumb && (
     <nav
      aria-label="Chuyển nhanh bài HanziHome"
      className="hidden min-w-0 max-w-[38rem] shrink-0 items-center gap-1 font-semibold text-text-secondary lg:flex"
     >
      <Select
       value={hanzihomeBreadcrumb.selectedCourse.id}
       onValueChange={(courseId) => {
        const course = hanzihomeBreadcrumb.courses.find((item) => item.id === courseId);

        if (course) {
         navigateHanziHome(course.id, 1);
        }
       }}
      >
       <SelectTrigger
        aria-label="Chọn giáo trình HanziHome"
        className="max-w-60 border-border-default bg-bg-card px-3 font-semibold text-text-primary shadow-theme-sm"
       >
        <SelectValue />
       </SelectTrigger>
       <SelectContent align="start" className="min-w-[min(28rem,calc(100vw-2rem))]">
        {hanzihomeBreadcrumb.courses.map((course, index) => (
         <SelectItem key={course.id + index} value={course.id}>
          {course.title}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      <Select
       value={getLessonRouteValue(hanzihomeBreadcrumb.selectedLesson.lessonNumber)}
       onValueChange={(lessonNumber) => {
        navigateHanziHome(hanzihomeBreadcrumb.selectedCourse.id, Number(lessonNumber));
       }}
      >
       <SelectTrigger
        aria-label="Chọn bài học HanziHome"
        className="max-w-60 border-border-default bg-bg-card px-3 font-semibold text-text-primary shadow-theme-sm"
       >
        <SelectValue />
       </SelectTrigger>
       <SelectContent align="start" className="min-w-[min(28rem,calc(100vw-2rem))]">
        {hanzihomeBreadcrumb.lessons.map((lesson) => (
         <SelectItem key={lesson.id} value={getLessonRouteValue(lesson.lessonNumber)}>
          {`Bài ${lesson.lessonNumber}: ${lesson.titleZh || lesson.title}`}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </nav>
    )}

    <form onSubmit={handleSearch} className="relative min-w-0 flex-1 lg:max-w-[34rem]">
     <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
     <input
      value={searchValue}
      onFocus={() => setSearchOpen(true)}
      onClick={() => setSearchOpen(true)}
      onChange={(event) => {
       setSearchValue(event.target.value);
       setSearchOpen(true);
      }}
      placeholder="Tìm toàn bộ HanziHome"
      aria-label="Tìm toàn bộ HanziHome"
      className="h-11 w-full rounded-xl border border-border-default bg-bg-card/80 pl-10 pr-3 font-medium text-text-primary shadow-theme-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20 sm:pr-4"
     />
    </form>

    <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
     <Button
      type="button"
      onClick={() => toggleLookup(pathname)}
      variant={lookupEnabled ? "default" : "outline"}
      size="lg"
      className="h-11 min-w-11 px-3"
      aria-label={lookupEnabled ? "Tắt tra từ tự động" : "Bật tra từ tự động"}
      title="Bật/Tắt tra từ tự động"
     >
      <BookOpenCheck className="h-5 w-5" />
      <span className="hidden sm:inline">{lookupEnabled ? "Tra từ bật" : "Tra từ tắt"}</span>
     </Button>

     <Button
      type="button"
      onClick={toggleTheme}
      aria-label="Đổi giao diện sáng tối"
      size="icon-lg"
      className="h-11 w-11"
     >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
     </Button>

     <div className="hidden h-9 items-center gap-2 rounded-lg px-2.5  font-bold text-text-secondary lg:flex">
      <span className="text-lg">🇻🇳</span>
      Tiếng Việt
     </div>

     <div className="hidden min-w-0 items-center gap-2 pl-1 xl:flex">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle  font-bold text-accent-text">
       {(user?.user_metadata?.display_name || user?.email || "B").slice(0, 1).toUpperCase()}
      </div>
     </div>
    </div>
   </div>
   <GlobalSearchDialog
    open={searchOpen}
    query={searchValue}
    courseId={hanzihomeBreadcrumb?.selectedCourse.id}
    lessonId={hanzihomeBreadcrumb?.selectedLesson.id}
    onOpenChange={setSearchOpen}
    onQueryChange={setSearchValue}
    onOpenResult={handleOpenSearchResult}
    onDirectLookup={handleDirectLookup}
   />
  </header>
 );
}
