"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
import { hanzihomeCourses } from "@/features/hanzihome/courses/course-catalog";
import { getHanziHomeCourseLessonSummaries } from "@/features/hanzihome/static-data";

export function Header({ user }: { user?: User | null }) {
 const { theme, toggleTheme } = useTheme();
 const { openInspector } = useVocabInspector();
 const [searchValue, setSearchValue] = useState("");
 const inputRef = useRef<HTMLInputElement>(null);
 const pathname = usePathname();
 const router = useRouter();
 const searchParams = useSearchParams();
 const lookupEnabled = useDictionaryLookupStore((s) => s.isEnabled(pathname));
 const toggleLookup = useDictionaryLookupStore((s) => s.toggle);
 const hanzihomeBreadcrumb = useMemo(() => {
  if (pathname !== "/hanzihome") return null;

  const courses = hanzihomeCourses
   .map((course) => ({
    id: course.id,
    title: course.title,
    lessons: getHanziHomeCourseLessonSummaries(course.id),
   }))
   .filter((course) => course.lessons.length > 0);
  const selectedCourseId =
   searchParams.get("courseId") || courses[0]?.id || "";
  const selectedCourse =
   courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const lessons = selectedCourse?.lessons ?? [];
  const lessonIdFromUrl = searchParams.get("lessonId");
  const selectedLesson =
   lessons.find((lesson) => lesson.id === lessonIdFromUrl) ?? lessons[0];

  if (!selectedCourse || !selectedLesson) return null;

  return {
   courses,
   selectedCourse,
   selectedLesson,
   lessons,
  };
 }, [pathname, searchParams]);

 useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
   if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    inputRef.current?.focus();
   }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
 }, []);

 const handleSearch = (event: FormEvent) => {
  event.preventDefault();
  const trimmed = searchValue.trim();
  if (!trimmed) return;
  if (containsChinese(trimmed)) {
   openInspector(trimmed);
   setSearchValue("");
   inputRef.current?.blur();
  }
 };

 const navigateHanziHome = (courseId: string, lessonId: string) => {
  const nextParams = new URLSearchParams(searchParams.toString());
  const currentModule = nextParams.get("module");

  nextParams.set("courseId", courseId);
  nextParams.set("lessonId", lessonId);
  if (currentModule) nextParams.set("module", currentModule);

  router.push(`/hanzihome?${nextParams.toString()}`);
 };

 return (
  <header className="z-10 flex h-16 w-full max-w-full min-w-0 shrink-0 items-center justify-between gap-2 overflow-x-hidden scrollbar-soft border-b border-border-default bg-bg-card px-3 sm:gap-4 sm:px-5 md:h-[76px] lg:px-8">
   {hanzihomeBreadcrumb && (
    <nav
     aria-label="Chuyển nhanh bài HanziHome"
     className="hidden min-w-0 max-w-xl shrink-0 items-center gap-1 text-sm font-bold text-text-secondary lg:flex"
    >
     <span className="rounded-lg px-2 py-1 text-text-primary">HanziHome</span>
     <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
     <Select
     value={hanzihomeBreadcrumb.selectedCourse.id}
     onValueChange={(courseId) => {
       const course = hanzihomeBreadcrumb.courses.find(
        (item) => item.id === courseId,
       );
       const lessonId = course?.lessons[0]?.id;

       if (course && lessonId) navigateHanziHome(course.id, lessonId);
      }}
     >
      <SelectTrigger
       size="sm"
       className="max-w-52 border-border-default bg-bg-input text-text-primary"
      >
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
       {hanzihomeBreadcrumb.courses.map((course) => (
        <SelectItem key={course.id} value={course.id}>
         {course.title}
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
     <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
     <Select
      value={hanzihomeBreadcrumb.selectedLesson.id}
      onValueChange={(lessonId) => {
       navigateHanziHome(hanzihomeBreadcrumb.selectedCourse.id, lessonId);
      }}
     >
      <SelectTrigger
       size="sm"
       className="max-w-64 border-border-default bg-bg-input text-text-primary"
      >
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
       {hanzihomeBreadcrumb.lessons.map((lesson) => (
        <SelectItem key={lesson.id} value={lesson.id}>
         {`Bài ${lesson.lessonNumber}: ${lesson.titleZh || lesson.title}`}
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </nav>
   )}

   <form onSubmit={handleSearch} className="relative min-w-0 max-w-md flex-1">
    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
    <input
     ref={inputRef}
     value={searchValue}
     onChange={(event) => setSearchValue(event.target.value)}
     placeholder="Từ điển"
     className="h-11 w-full rounded-xl border border-border-default bg-bg-input pl-11 pr-3 text-sm font-bold text-text-primary outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20 sm:h-12 sm:pl-12 sm:pr-4 sm:text-base"
    />
   </form>

   <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
    <Button
     type="button"
     onClick={() => toggleLookup(pathname)}
     variant={lookupEnabled ? "default" : "outline"}
     title="Bật/Tắt tra từ tự động"
    >
     <BookOpenCheck className="h-5 w-5" />
     {lookupEnabled ? "Tra từ bật" : "Tra từ tắt"}
    </Button>

    <Button type="button" onClick={toggleTheme} aria-label="Toggle theme">
     {theme === "light" ? (
      <Moon className="h-5 w-5" />
     ) : (
      <Sun className="h-5 w-5" />
     )}
    </Button>

    <div className="hidden h-11 items-center gap-2 rounded-xl px-3 text-sm font-black text-text-secondary lg:flex">
     <span className="text-lg">🇻🇳</span>
     Tiếng Việt
    </div>

    <div className="hidden min-w-0 items-center gap-2 pl-1 xl:flex">
     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle text-sm font-black text-accent-text">
      {(user?.user_metadata?.display_name || user?.email || "B")
       .slice(0, 1)
       .toUpperCase()}
     </div>
    </div>
   </div>
  </header>
 );
}
