"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { LockKeyhole, Search } from "lucide-react";
import { type User } from "@supabase/supabase-js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { type Theme, useTheme } from "./ThemeProvider";
import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
 appHeaderBreadcrumbSelectTriggerClassName,
} from "./app-header-breadcrumb";
import { FocusModeRouteGuard } from "./FocusModeRouteGuard";
import { ProfileSettingsMenu } from "./ProfileSettingsMenu";
import { useVocabInspector } from "@/components/vocabulary/useVocabInspector";
import { containsChinese } from "@/lib/chinese-utils";
import { useDictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { useFocusModeStore } from "@/stores/focus-mode-store";
import { useHeaderToolbarStore } from "@/stores/header-toolbar-store";
import { Button } from "@/components/ui/button";
import {
 Select,
 SelectContent,
 SelectGroup,
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

type HanziHomeHeaderBreadcrumb = {
 courses: Array<{ id: string; title: string }>;
 selectedCourse: { id: string; title: string };
 selectedLesson: {
  id: string;
  lessonNumber: number;
  title: string;
  titleZh?: string;
  bookId?: string;
 };
 lessons: Array<{
  id: string;
  lessonNumber: number;
  title: string;
  titleZh?: string;
  bookId?: string;
 }>;
};

type SimpleHeaderBreadcrumb = {
 label: string;
 parent?: {
  label: string;
  href: string;
 };
};

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
 const focusModeEnabled = useFocusModeStore((s) => s.enabled);
 const toggleFocusMode = useFocusModeStore((s) => s.toggle);
 const headerToolbarContent = useHeaderToolbarStore((s) => s.content);
 const isHanziHomeRoute = pathname === "/hanzihome";
 const isRadicalsWorkspaceRoute = pathname === "/radicals";
 const isHanziHomeLessonWorkspaceRoute =
  isHanziHomeRoute &&
  !isRadicalsWorkspaceRoute &&
  (searchParams.has("courseId") ||
   searchParams.has("lesson") ||
   searchParams.has("lessonId") ||
   searchParams.has("module"));
 const catalogData = useHanziHomeCatalogData({ enabled: isHanziHomeLessonWorkspaceRoute });
 const selectedCourseId =
  isHanziHomeLessonWorkspaceRoute && catalogData.courses.length > 0
   ? searchParams.get("courseId") || catalogData.courses[0]?.id || ""
   : "";
 const courseLessonsQuery = useHanziHomeCourseLessons(selectedCourseId, {
  enabled: isHanziHomeLessonWorkspaceRoute && Boolean(selectedCourseId),
 });
 const hanzihomeBreadcrumb = useMemo(() => {
  if (!isHanziHomeLessonWorkspaceRoute) return null;

  const courses = catalogData.courses;
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const lessons = courseLessonsQuery.lessons;
  const lessonFromUrl = searchParams.get("lesson");
  const legacyLessonIdFromUrl = searchParams.get("lessonId");
  const bookIdFromUrl = searchParams.get("bookId");
  const selectedLesson =
   findLessonByRouteParam(lessons, lessonFromUrl, legacyLessonIdFromUrl, bookIdFromUrl) ??
   lessons[0];

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
  isHanziHomeLessonWorkspaceRoute,
  searchParams,
  selectedCourseId,
 ]);
 const simpleBreadcrumb = useMemo(
  () => getSimpleHeaderBreadcrumb(pathname, isHanziHomeLessonWorkspaceRoute),
  [isHanziHomeLessonWorkspaceRoute, pathname],
 );
 const hasRouteToolbar = Boolean(headerToolbarContent || hanzihomeBreadcrumb || simpleBreadcrumb);

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
  if (
   focusModeEnabled &&
   item.lessonId &&
   item.lessonId !== hanzihomeBreadcrumb?.selectedLesson.id
  ) {
   toast.warning("Focus mode đang bật. Không thể chuyển sang bài khác.");
   return;
  }

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

 const navigateHanziHome = (lessonId: string) => {
  if (focusModeEnabled) return;

  const lesson = hanzihomeBreadcrumb?.lessons.find((item) => item.id === lessonId);
  if (!lesson) return;

  const nextParams = new URLSearchParams(searchParams.toString());
  const currentModule = nextParams.get("module");

  nextParams.set("courseId", selectedCourseId);
  nextParams.set("lesson", getLessonRouteValue(lesson.lessonNumber));
  if (lesson.bookId) nextParams.set("bookId", lesson.bookId);
  else nextParams.delete("bookId");
  nextParams.delete("lessonId");
  if (currentModule) nextParams.set("module", currentModule);

  router.push(`/hanzihome?${nextParams.toString()}`);
 };

 return (
  <>
   <FocusModeRouteGuard />
   <header
    className={cn(
     "nova-shell-header sticky top-0 z-50 flex h-12 w-full max-w-full min-w-0 shrink-0 items-center overflow-hidden border-b border-border-default px-3 sm:h-14 sm:px-5 lg:px-7",
     isHanziHomeRoute && "hanzihome-liquid-header",
    )}
   >
    <div
     className={cn(
      "grid h-12 w-full min-w-0 items-center gap-2 sm:h-14 sm:gap-3",
      hasRouteToolbar
       ? "grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)_auto]"
       : "grid-cols-[minmax(0,1fr)_auto]",
     )}
    >
     {hasRouteToolbar ? (
      <HeaderContextArea
       toolbarContent={headerToolbarContent}
       breadcrumb={hanzihomeBreadcrumb}
       simpleBreadcrumb={simpleBreadcrumb}
       focusModeEnabled={focusModeEnabled}
       onNavigateHanziHome={navigateHanziHome}
      />
     ) : null}

     <HeaderSearchForm
      value={searchValue}
      routeToolbarActive={hasRouteToolbar}
      onSubmit={handleSearch}
      onOpen={() => setSearchOpen(true)}
      onChange={(value) => {
       setSearchValue(value);
       setSearchOpen(true);
      }}
     />

     <HeaderUtilityArea
      routeToolbarActive={hasRouteToolbar}
      focusModeEnabled={focusModeEnabled}
      user={user}
      theme={theme}
      lookupEnabled={lookupEnabled}
      onOpenSearch={() => setSearchOpen(true)}
      onToggleTheme={toggleTheme}
      onToggleLookup={() => toggleLookup(pathname)}
      onToggleFocusMode={toggleFocusMode}
     />
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
  </>
 );
}

function HeaderContextArea({
 toolbarContent,
 breadcrumb,
 simpleBreadcrumb,
 focusModeEnabled,
 onNavigateHanziHome,
}: {
 toolbarContent: ReactNode;
 breadcrumb: HanziHomeHeaderBreadcrumb | null;
 simpleBreadcrumb: SimpleHeaderBreadcrumb | null;
 focusModeEnabled: boolean;
 onNavigateHanziHome: (lessonId: string) => void;
}) {
 if (toolbarContent) {
  return <div className="flex min-w-0 items-center gap-2 overflow-hidden">{toolbarContent}</div>;
 }

 if (breadcrumb) {
  return (
   <HanziHomeBreadcrumbNav
    breadcrumb={breadcrumb}
    focusModeEnabled={focusModeEnabled}
    onNavigate={onNavigateHanziHome}
   />
  );
 }

 if (simpleBreadcrumb) {
  return <SimpleRouteBreadcrumb breadcrumb={simpleBreadcrumb} />;
 }

 return <div className="min-w-0" />;
}

function HanziHomeBreadcrumbNav({
 breadcrumb,
 focusModeEnabled,
 onNavigate,
}: {
 breadcrumb: HanziHomeHeaderBreadcrumb;
 focusModeEnabled: boolean;
 onNavigate: (lessonId: string) => void;
}) {
 return (
  <AppHeaderBreadcrumb
   aria-label="Chuyển nhanh bài HanziHome"
   className="min-w-0 max-w-[min(12rem,48vw)] justify-self-start md:max-w-[min(34rem,56vw)]"
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
    <AppHeaderBreadcrumbPage className="max-w-48" title={breadcrumb.selectedCourse.title}>
     {breadcrumb.selectedCourse.title}
    </AppHeaderBreadcrumbPage>
   </AppHeaderBreadcrumbItem>
   <AppHeaderBreadcrumbSeparator className="hidden 2xl:flex" />
   <AppHeaderBreadcrumbItem className="min-w-0">
    <Select
     value={breadcrumb.selectedLesson.id}
     disabled={focusModeEnabled}
     onValueChange={(lessonId) => {
      onNavigate(lessonId);
     }}
    >
     <SelectTrigger
      aria-label="Chọn bài học HanziHome"
      className={cn(
       appHeaderBreadcrumbSelectTriggerClassName,
       "w-[min(11rem,44vw)] text-sm md:w-[min(16rem,44vw)] lg:w-[min(18rem,30vw)] xl:w-72",
      )}
     >
      <SelectValue />
     </SelectTrigger>
     <SelectContent align="start" className="min-w-[min(28rem,calc(100vw-2rem))]">
      <SelectGroup>
       {breadcrumb.lessons.map((lesson) => (
        <SelectItem key={lesson.id} value={lesson.id}>
         {`Bài ${lesson.lessonNumber}: ${lesson.titleZh || lesson.title}`}
        </SelectItem>
       ))}
      </SelectGroup>
     </SelectContent>
    </Select>
   </AppHeaderBreadcrumbItem>
  </AppHeaderBreadcrumb>
 );
}

function SimpleRouteBreadcrumb({ breadcrumb }: { breadcrumb: SimpleHeaderBreadcrumb }) {
 return (
  <AppHeaderBreadcrumb className="hidden min-w-0 md:inline-flex">
   {breadcrumb.parent ? (
    <>
     <AppHeaderBreadcrumbItem>
      <AppHeaderBreadcrumbLink href={breadcrumb.parent.href} title={breadcrumb.parent.label}>
       {breadcrumb.parent.label}
      </AppHeaderBreadcrumbLink>
     </AppHeaderBreadcrumbItem>
     <AppHeaderBreadcrumbSeparator />
    </>
   ) : null}
   <AppHeaderBreadcrumbItem className="min-w-0">
    <AppHeaderBreadcrumbPage title={breadcrumb.label}>{breadcrumb.label}</AppHeaderBreadcrumbPage>
   </AppHeaderBreadcrumbItem>
  </AppHeaderBreadcrumb>
 );
}

function getSimpleHeaderBreadcrumb(
 pathname: string,
 isHanziHomeLessonWorkspaceRoute: boolean,
): SimpleHeaderBreadcrumb | null {
 if (pathname === "/notebook") return { label: "Sổ tay" };
 if (pathname === "/dictionary" || pathname.startsWith("/dictionary/")) return { label: "SRS từ" };
 if (pathname === "/settings") return { label: "Cài đặt" };
 if (pathname === "/radicals") {
  return { label: "Bộ thủ" };
 }
 if (pathname === "/hanzihome" && !isHanziHomeLessonWorkspaceRoute) return { label: "HanziHome" };
 if (pathname === "/vocab/review") {
  return { parent: { label: "Tổng hợp từ", href: "/vocab" }, label: "Ôn từ vựng" };
 }
 if (pathname === "/vocab") return { label: "Tổng hợp từ" };
 if (pathname === "/grammar") return { label: "Tổng hợp ngữ pháp" };
 if (pathname === "/memory-tips") return { label: "Nhắc nhanh" };
 if (pathname === "/html-artifacts") return { label: "Tệp HTML" };
 if (pathname.startsWith("/note/")) {
  return { parent: { label: "Ghi chú", href: "/notes" }, label: "Chia sẻ" };
 }

 return null;
}

function HeaderSearchForm({
 value,
 routeToolbarActive,
 onSubmit,
 onOpen,
 onChange,
}: {
 value: string;
 routeToolbarActive: boolean;
 onSubmit: (event: FormEvent) => void;
 onOpen: () => void;
 onChange: (value: string) => void;
}) {
 return (
  <form
   onSubmit={onSubmit}
   className={cn(
    "relative min-w-0",
    routeToolbarActive ? "hidden xl:col-start-2 xl:row-start-1 xl:block" : "block",
    routeToolbarActive && "xl:justify-self-center",
   )}
  >
   <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
   <input
    value={value}
    onFocus={onOpen}
    onClick={onOpen}
    onChange={(event) => onChange(event.target.value)}
    placeholder="Tìm toàn bộ HanziHome"
    aria-label="Tìm toàn bộ HanziHome"
    className={cn(
     "h-10 w-full rounded-xl border border-border-default bg-bg-card/80 pl-10 pr-3 font-medium text-text-primary shadow-theme-sm outline-none transition focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20 sm:pr-4 xl:h-11",
     routeToolbarActive && "xl:w-[min(34rem,34vw)]",
    )}
   />
  </form>
 );
}

function HeaderUtilityArea({
 routeToolbarActive,
 focusModeEnabled,
 user,
 theme,
 lookupEnabled,
 onOpenSearch,
 onToggleTheme,
 onToggleLookup,
 onToggleFocusMode,
}: {
 routeToolbarActive: boolean;
 focusModeEnabled: boolean;
 user?: User | null;
 theme: Theme;
 lookupEnabled: boolean;
 onOpenSearch: () => void;
 onToggleTheme: () => void;
 onToggleLookup: () => void;
 onToggleFocusMode: () => void;
}) {
 return (
  <div
   className={cn(
    "relative z-10 flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-2",
    routeToolbarActive && "col-start-2 row-start-1 xl:col-start-3",
   )}
  >
   {routeToolbarActive ? (
    <Button
     type="button"
     variant="outline"
     onClick={onOpenSearch}
     aria-label="Mở tìm kiếm HanziHome"
     title="Tìm toàn bộ HanziHome"
     className="h-10 min-h-10 w-10 px-0 xl:hidden"
    >
     <Search className="h-5 w-5" />
    </Button>
   ) : null}

   {focusModeEnabled ? <FocusModePill /> : null}

   <ProfileSettingsMenu
    user={user}
    theme={theme}
    lookupEnabled={lookupEnabled}
    focusModeEnabled={focusModeEnabled}
    onToggleTheme={onToggleTheme}
    onToggleLookup={onToggleLookup}
    onToggleFocusMode={onToggleFocusMode}
   />
  </div>
 );
}

function FocusModePill() {
 return (
  <span
   className="hidden size-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-warning/30 bg-warning-subtle p-0 text-xs font-black text-warning-text shadow-theme-sm sm:inline-flex 2xl:h-9 2xl:w-auto 2xl:px-2.5"
   title="Focus mode đang bật"
  >
   <LockKeyhole className="h-3.5 w-3.5" />
   <span className="hidden 2xl:inline">Focus</span>
  </span>
 );
}
