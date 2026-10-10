"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Bookmark, Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuGroup,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { useRouter as useLocalizedRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { buildTextbookHref } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type {
 TextbookBookSummary,
 TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

function LessonDropdownRow({
 item,
 isCurrent,
 isBookmarked,
 onSelectLesson,
 onToggleBookmark,
 bookmarkAriaLabel,
}: {
 item: TextbookBookSummary["lessons"][number];
 isCurrent: boolean;
 isBookmarked: boolean;
 onSelectLesson: () => void;
 onToggleBookmark: () => void;
 bookmarkAriaLabel: string;
}) {
 return (
  <div
   className={cn(
    "group relative flex min-h-10 w-full items-center justify-between gap-2 rounded-lg py-1.5 pr-2 pl-2.5 transition-colors select-none",
    isCurrent ? "bg-accent/60 font-medium text-foreground" : "text-foreground hover:bg-accent/40",
   )}
  >
   <Button
    type="button"
    variant="ghost"
    className="min-w-0 flex-1 justify-start gap-2 text-left"
    onClick={onSelectLesson}
   >
    {isBookmarked ? <Bookmark className="size-3.5 shrink-0 fill-current text-primary" /> : null}
    <span className="truncate text-sm">{item.title}</span>
    {isCurrent ? <Check className="ml-auto size-4 shrink-0 text-primary" /> : null}
   </Button>
   <Button
    type="button"
    variant={isBookmarked ? "warning" : "ghost"}
    size="icon-toolbar"
    className="shrink-0 transition-opacity"
    onClick={(event) => {
     event.stopPropagation();
     event.preventDefault();
     onToggleBookmark();
    }}
    title={bookmarkAriaLabel}
    aria-label={bookmarkAriaLabel}
   >
    <Bookmark
     className={cn("size-4 transition-colors", isBookmarked ? "fill-current" : "text-current")}
    />
   </Button>
  </div>
 );
}

export function BusinessChineseLessonSelector({
 books,
 lesson,
 focusModeEnabled,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
 focusModeEnabled: boolean;
}) {
 const t = useTranslations("BusinessChinese");
 const router = useLocalizedRouter();
 const [open, setOpen] = useState(false);
 const { state: learningState, toggleBookmark } = useLearningState();
 const bookmarkedLessonIds = learningState.bookmarks.lessons;

 const allLessons = useMemo(() => books.flatMap((book) => book.lessons), [books]);
 const bookmarkedLessons = useMemo(() => {
  if (!bookmarkedLessonIds || bookmarkedLessonIds.length === 0) return [];
  return allLessons.filter((item) => bookmarkedLessonIds.includes(item.id));
 }, [allLessons, bookmarkedLessonIds]);

 const isCurrentLessonBookmarked = Boolean(bookmarkedLessonIds?.includes(lesson.id));

 const lastClickRef = useRef<Record<string, number>>({});
 const handleToggleLessonBookmark = useCallback(
  (lessonId: string) => {
   const now = Date.now();
   const last = lastClickRef.current[lessonId] ?? 0;
   if (now - last < 400) return;
   lastClickRef.current[lessonId] = now;
   toggleBookmark("lessons", lessonId);
  },
  [toggleBookmark],
 );

 const handleSelectLesson = useCallback(
  (targetLesson: TextbookBookSummary["lessons"][number]) => {
   setOpen(false);
   if (window.location.pathname.endsWith("/offline")) {
    const params = new URLSearchParams();
    params.set("book", targetLesson.bookKey);
    params.set("lesson", String(targetLesson.number));
    window.history.pushState(null, "", `?${params.toString()}`);
    return;
   }
   router.push(buildTextbookHref(targetLesson.bookKey, targetLesson.number), {
    scroll: false,
   });
  },
  [router],
 );

 return (
  <DropdownMenu open={open} onOpenChange={setOpen}>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     variant="ghost"
     disabled={focusModeEnabled}
     aria-label={t("lessonSelectLabel")}
     className={cn(
      "w-[min(11rem,44vw)] justify-between md:w-[min(16rem,44vw)] lg:w-[min(18rem,30vw)] xl:w-72",
     )}
    >
     <span className="flex min-w-0 items-center gap-1.5 truncate">
      {isCurrentLessonBookmarked ? (
       <Bookmark className="size-3.5 shrink-0 fill-current text-primary" />
      ) : null}
      <span className="truncate">{lesson.title}</span>
     </span>
     <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent
    align="start"
    className="max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] min-w-[min(28rem,calc(100vw-2rem))]"
   >
    {bookmarkedLessons.length > 0 ? (
     <>
      <DropdownMenuGroup>
       <DropdownMenuLabel className="flex items-center gap-1.5 font-semibold text-primary">
        <Bookmark className="size-3.5 fill-current" />
        <span>{t("semesterBookmarksCount", { count: bookmarkedLessons.length })}</span>
       </DropdownMenuLabel>
       {bookmarkedLessons.map((item) => (
        <LessonDropdownRow
         key={`pinned-${item.id}`}
         item={item}
         isCurrent={item.id === lesson.id}
         isBookmarked={true}
         onSelectLesson={() => handleSelectLesson(item)}
         onToggleBookmark={() => handleToggleLessonBookmark(item.id)}
         bookmarkAriaLabel={t("unbookmarkLesson")}
        />
       ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
     </>
    ) : null}
    {books.map((book) => (
     <DropdownMenuGroup key={book.id}>
      <DropdownMenuLabel>{book.label}</DropdownMenuLabel>
      {book.lessons.map((item) => {
       const isItemBookmarked = Boolean(bookmarkedLessonIds?.includes(item.id));
       return (
        <LessonDropdownRow
         key={item.id}
         item={item}
         isCurrent={item.id === lesson.id}
         isBookmarked={isItemBookmarked}
         onSelectLesson={() => handleSelectLesson(item)}
         onToggleBookmark={() => handleToggleLessonBookmark(item.id)}
         bookmarkAriaLabel={isItemBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
        />
       );
      })}
     </DropdownMenuGroup>
    ))}
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
